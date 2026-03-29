import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateQuery } from '@/schemas';
import { advancedSearchQuerySchema } from '@/schemas/product.schema';
import {
  cacheGetOrSet,
  CacheTTL,
  isRedisAvailable,
} from '@/lib/cache';

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryResult = validateQuery(advancedSearchQuerySchema, {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      rating: searchParams.get('rating') || undefined,
      inStock: searchParams.get('inStock') || undefined,
      featured: searchParams.get('featured') || undefined,
      sortBy: searchParams.get('sortBy') || 'relevance',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      hasDiscount: searchParams.get('hasDiscount') || undefined,
    });

    if (!queryResult.success) {
      return queryResult.error;
    }

    const {
      q,
      category,
      minPrice,
      maxPrice,
      rating,
      inStock,
      featured,
      sortBy,
      sortOrder,
      page,
      limit,
      hasDiscount,
    } = queryResult.data;

    // Build cache key
    const cacheKey = `products:adv-search:${JSON.stringify({
      q, category, minPrice, maxPrice, rating, inStock,
      featured, sortBy, sortOrder, page, limit, hasDiscount,
    })}`;

    const result = await cacheGetOrSet(
      cacheKey,
      async () => {
        return executeSearch({
          q, category, minPrice, maxPrice, rating, inStock,
          featured, sortBy, sortOrder, page, limit, hasDiscount,
        });
      },
      { ttl: CacheTTL.SHORT, prefix: 'api' }
    );

    const searchTime = Date.now() - startTime;

    // Track search history for non-empty queries (fire-and-forget)
    if (q && q.trim().length >= 2) {
      trackSearchHistory(q.trim(), result.pagination.totalItems).catch(() => {});
    }

    // Get trending searches (fire-and-forget, cached separately)
    const trending = await getTrendingSearches();

    const headers: HeadersInit = {};
    if (isRedisAvailable()) {
      headers['X-Cache'] = 'HIT';
    } else {
      headers['X-Cache'] = 'MEMORY';
    }

    return NextResponse.json(
      {
        products: result.products,
        pagination: result.pagination,
        filters: result.filters,
        trending,
        searchInfo: {
          query: q || null,
          resultCount: result.pagination.totalItems,
          searchTime,
        },
      },
      { headers }
    );
  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json(
      { error: 'فشل في البحث عن المنتجات' },
      { status: 500 }
    );
  }
}

// ─── Internal helpers ────────────────────────────────────────────────

interface SearchParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  featured?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
  hasDiscount?: boolean;
}

interface SearchResult {
  products: Record<string, unknown>[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters: {
    categories: { id: string; name: string; nameAr: string; slug: string }[];
    priceRange: { min: number; max: number };
  };
}

async function executeSearch(params: SearchParams): Promise<SearchResult> {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    rating,
    inStock,
    featured,
    sortBy,
    sortOrder,
    page,
    limit,
    hasDiscount,
  } = params;

  const skip = (page - 1) * limit;

  // ── Build base filter (always applied) ──
  const baseFilter: Record<string, unknown> = {
    deletedAt: null,
  };

  // Category filter
  if (category) {
    baseFilter.categoryId = category;
  }

  // Rating filter
  if (rating) {
    baseFilter.rating = { gte: rating };
  }

  // In-stock filter
  if (inStock) {
    baseFilter.stock = { gt: 0 };
  }

  // Featured filter
  if (featured) {
    baseFilter.featured = true;
  }

  // Discount filter: product has a discountPrice set
  if (hasDiscount) {
    baseFilter.discountPrice = { not: null };
  }

  // ── Search query handling ──
  let products: Record<string, unknown>[] = [];
  let total = 0;

  const trimmedQ = q?.trim();

  if (trimmedQ && trimmedQ.length > 0) {
    // ── Short query: use startsWith for suggestions-like behavior ──
    if (trimmedQ.length < 3) {
      const shortQueryWhere: Record<string, unknown> = {
        ...baseFilter,
        OR: [
          { name: { startsWith: trimmedQ, mode: 'insensitive' } },
          { nameAr: { startsWith: trimmedQ, mode: 'insensitive' } },
        ],
      };

      // Apply price range with effective price logic
      applyPriceRangeFilter(shortQueryWhere, minPrice, maxPrice);

      const [shortProducts, shortTotal] = await Promise.all([
        db.product.findMany({
          where: shortQueryWhere,
          include: { category: true },
          orderBy: { name: 'asc' },
          skip,
          take: limit,
        }),
        db.product.count({ where: shortQueryWhere }),
      ]);

      products = shortProducts as unknown as Record<string, unknown>[];
      total = shortTotal;
    } else {
      // ── Full-text search with PostgreSQL ──
      // Prisma fullTextSearchPostgres uses the `search` operator which maps to
      // PostgreSQL's @@ to_tsquery / @@ plainto_tsquery
      const fullTextWhere: Record<string, unknown> = {
        ...baseFilter,
        OR: [
          { name: { search: trimmedQ } },
          { nameAr: { search: trimmedQ } },
          { description: { search: trimmedQ } },
          { descriptionAr: { search: trimmedQ } },
        ],
      };

      // Apply price range with effective price logic
      applyPriceRangeFilter(fullTextWhere, minPrice, maxPrice);

      const orderBy = buildOrderBy(sortBy, sortOrder, trimmedQ);

      let [fullTextProducts, fullTextTotal] = await Promise.all([
        db.product.findMany({
          where: fullTextWhere,
          include: { category: true },
          orderBy,
          skip,
          take: limit,
        }),
        db.product.count({ where: fullTextWhere }),
      ]);

      // Fallback: if fullTextSearch returns nothing, try contains mode
      if (fullTextTotal === 0) {
        const fallbackWhere: Record<string, unknown> = {
          ...baseFilter,
          OR: [
            { name: { contains: trimmedQ, mode: 'insensitive' } },
            { nameAr: { contains: trimmedQ, mode: 'insensitive' } },
            { description: { contains: trimmedQ, mode: 'insensitive' } },
            { descriptionAr: { contains: trimmedQ, mode: 'insensitive' } },
          ],
        };

        applyPriceRangeFilter(fallbackWhere, minPrice, maxPrice);

        const fallbackOrderBy = buildOrderBy(sortBy, sortOrder, trimmedQ);

        const [fallbackProducts, fallbackTotal] = await Promise.all([
          db.product.findMany({
            where: fallbackWhere,
            include: { category: true },
            orderBy: fallbackOrderBy,
            skip,
            take: limit,
          }),
          db.product.count({ where: fallbackWhere }),
        ]);

        fullTextProducts = fallbackProducts;
        fullTextTotal = fallbackTotal;
      }

      // ── Relevance scoring for 'relevance' sort ──
      if (sortBy === 'relevance' && fullTextProducts.length > 0) {
        fullTextProducts = applyRelevanceScoring(fullTextProducts, trimmedQ) as unknown as typeof fullTextProducts;
      }

      products = fullTextProducts as unknown as Record<string, unknown>[];
      total = fullTextTotal;
    }
  } else {
    // ── No query: return featured products or all products ──
    const noQueryWhere: Record<string, unknown> = {
      ...baseFilter,
    };

    if (!category && !rating && !inStock && !featured && !hasDiscount && !minPrice && !maxPrice) {
      // No filters applied at all – show featured products first, then newest
      noQueryWhere.featured = true;
    }

    applyPriceRangeFilter(noQueryWhere, minPrice, maxPrice);

    const orderBy = buildOrderBy(
      sortBy === 'relevance' ? 'newest' : sortBy,
      sortOrder,
      undefined
    );

    const [noQueryProducts, noQueryTotal] = await Promise.all([
      db.product.findMany({
        where: noQueryWhere,
        include: { category: true },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where: noQueryWhere }),
    ]);

    products = noQueryProducts as unknown as Record<string, unknown>[];
    total = noQueryTotal;
  }

  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  // ── Build filter metadata ──
  const [categories, priceAgg] = await Promise.all([
    getCategoriesForFilters(),
    getPriceRange(),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      totalItems: total,
      totalPages,
      hasMore,
    },
    filters: {
      categories,
      priceRange: priceAgg,
    },
  };
}

/**
 * Apply price range filter considering effective price (discountPrice or price).
 * The effective price is: discountPrice if it exists and is less than price, otherwise price.
 * Since this involves conditional logic across two columns, we use a compound filter.
 */
function applyPriceRangeFilter(
  where: Record<string, unknown>,
  minPrice?: number,
  maxPrice?: number
): void {
  if (!minPrice && !maxPrice) return;

  if (minPrice !== undefined && maxPrice !== undefined) {
    // Both min and max: product must have an effective price within range
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          // No discount: price must be in range
          {
            AND: [
              { discountPrice: null },
              { price: { gte: minPrice, lte: maxPrice } },
            ],
          },
          // Has discount: discountPrice must be in range
          {
            AND: [
              { discountPrice: { not: null } },
              { discountPrice: { gte: minPrice, lte: maxPrice } },
            ],
          },
        ],
      },
    ];
  } else if (minPrice !== undefined) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          { discountPrice: null, price: { gte: minPrice } },
          { discountPrice: { not: null, gte: minPrice } },
        ],
      },
    ];
  } else if (maxPrice !== undefined) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          { discountPrice: null, price: { lte: maxPrice } },
          { discountPrice: { not: null, lte: maxPrice } },
        ],
      },
    ];
  }
}

/**
 * Build Prisma orderBy clause from sort options.
 */
function buildOrderBy(
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  _query?: string
): Record<string, unknown> {
  switch (sortBy) {
    case 'price_asc':
      return { price: 'asc' };
    case 'price_desc':
      return { price: 'desc' };
    case 'newest':
      return { createdAt: sortOrder };
    case 'rating':
      return { rating: sortOrder };
    case 'sales':
      return { salesCount: sortOrder };
    case 'relevance':
      // For fullTextSearch, Prisma handles relevance internally when using `search`.
      // As a secondary sort, fall back to sales count then rating.
      return [
        { salesCount: 'desc' },
        { rating: 'desc' },
      ] as unknown as Record<string, unknown>;
    default:
      return { createdAt: sortOrder };
  }
}

/**
 * Apply in-memory relevance scoring when sortBy is 'relevance'.
 * Ranks products by: exact name match > name contains > description contains.
 */
function applyRelevanceScoring(
  products: Array<{
    name: string;
    nameAr: string;
    description?: string | null;
    descriptionAr?: string | null;
    salesCount: number;
    rating: number;
    [key: string]: unknown;
  }>,
  query: string
): typeof products {
  const lowerQuery = query.toLowerCase();

  return products
    .map((product) => {
      let score = 0;

      const nameLower = product.name.toLowerCase();
      const nameArLower = product.nameAr.toLowerCase();
      const descLower = (product.description || '').toLowerCase();
      const descArLower = (product.descriptionAr || '').toLowerCase();

      // Exact name match – highest score
      if (nameLower === lowerQuery || nameArLower === lowerQuery) {
        score += 100;
      }
      // Name starts with query
      else if (nameLower.startsWith(lowerQuery) || nameArLower.startsWith(lowerQuery)) {
        score += 80;
      }
      // Name contains query
      else if (nameLower.includes(lowerQuery) || nameArLower.includes(lowerQuery)) {
        score += 60;
      }

      // Description contains query – lower score
      if (descLower.includes(lowerQuery) || descArLower.includes(lowerQuery)) {
        score += 20;
      }

      // Boost by popularity
      score += product.salesCount * 0.1;
      score += product.rating * 2;

      return { ...product, _relevanceScore: score };
    })
    .sort((a, b) => (b._relevanceScore as number) - (a._relevanceScore as number))
    .map(({ _relevanceScore, ...product }) => product);
}

/**
 * Track a search query in SearchHistory (fire-and-forget, errors swallowed).
 */
async function trackSearchHistory(query: string, results: number): Promise<void> {
  try {
    await db.searchHistory.create({
      data: { query, results },
    });
  } catch {
    // Silently ignore – search history is non-critical
  }
}

/**
 * Get trending searches from the last 7 days.
 */
async function getTrendingSearches(): Promise<string[]> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trending = await db.searchHistory.groupBy({
      by: ['query'],
      where: {
        createdAt: { gte: sevenDaysAgo },
        query: { not: '' },
      },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10,
    });

    return trending.map((t) => t.query);
  } catch {
    return [];
  }
}

/**
 * Get all active categories for filter sidebar.
 */
async function getCategoriesForFilters() {
  try {
    return await db.category.findMany({
      select: { id: true, name: true, nameAr: true, slug: true },
      orderBy: { name: 'asc' },
    });
  } catch {
    return [];
  }
}

/**
 * Get the min and max prices across all non-deleted products.
 */
async function getPriceRange(): Promise<{ min: number; max: number }> {
  try {
    const agg = await db.product.aggregate({
      where: { deletedAt: null },
      _min: { price: true },
      _max: { price: true },
    });
    return {
      min: agg._min.price ?? 0,
      max: agg._max.price ?? 0,
    };
  } catch {
    return { min: 0, max: 0 };
  }
}

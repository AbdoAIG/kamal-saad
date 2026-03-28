import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth-utils';
import type { NextRequest } from 'next/server';
import { productSchema, productQuerySchema, validateBody, validateQuery } from '@/schemas';
import {
  cacheGetOrSet,
  cacheDelPattern,
  CacheKeys,
  CacheTTL,
  isRedisAvailable,
} from '@/lib/cache';
import { RESOURCES, ACTIONS } from '@/lib/permissions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryResult = validateQuery(productQuerySchema, {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      categoryId: searchParams.get('categoryId') || undefined,
      search: searchParams.get('search') || undefined,
      featured: searchParams.get('featured') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    if (!queryResult.success) {
      return queryResult.error;
    }

    const { page, limit, categoryId, search, featured, minPrice, maxPrice, sortBy, sortOrder } = queryResult.data;

    // Build cache key based on filters
    const filtersKey = JSON.stringify({ categoryId, search, featured, minPrice, maxPrice, sortBy, sortOrder });
    const cacheKey = CacheKeys.products.list(page, limit, filtersKey);

    // Use shorter cache for search queries (results change frequently)
    const cacheTTL = search ? CacheTTL.SHORT : CacheTTL.MEDIUM;

    // Try to get from cache or fetch from database
    const result = await cacheGetOrSet(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {
          deletedAt: null, // Soft delete filter
        };

        if (categoryId) {
          where.categoryId = categoryId;
        }

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { nameAr: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { descriptionAr: { contains: search, mode: 'insensitive' } }
          ];
        }

        if (featured) {
          where.featured = true;
        }

        if (minPrice || maxPrice) {
          const priceFilter: Record<string, number> = {};
          if (minPrice) priceFilter.gte = minPrice;
          if (maxPrice) priceFilter.lte = maxPrice;
          where.price = priceFilter;
        }

        const orderBy: Record<string, unknown> = {};
        if (sortBy === 'price') {
          orderBy.price = sortOrder;
        } else if (sortBy === 'salesCount') {
          orderBy.salesCount = sortOrder;
        } else if (sortBy === 'rating') {
          orderBy.rating = sortOrder;
        } else {
          orderBy.createdAt = sortOrder;
        }

        // Get total count for pagination
        const total = await db.product.count({ where });

        // Get paginated products
        const products = await db.product.findMany({
          where,
          include: { category: true },
          orderBy,
          skip,
          take: limit,
        });

        const totalPages = Math.ceil(total / limit);
        const hasMore = page < totalPages;

        return {
          products,
          pagination: {
            page,
            limit,
            totalItems: total,
            totalPages,
            hasMore
          },
          cached: false,
        };
      },
      { ttl: cacheTTL, prefix: 'api' }
    );

    // Add cache status header
    const headers: HeadersInit = {};
    if (isRedisAvailable()) {
      headers['X-Cache'] = 'HIT';
    } else {
      headers['X-Cache'] = 'MEMORY';
    }

    return NextResponse.json(
      { ...result, cached: true },
      { headers }
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Check permission
  const authResult = await requirePermission(request, RESOURCES.PRODUCTS, ACTIONS.CREATE);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const body = await request.json();
    console.log('[Products API] Creating product with data:', body);

    // Validate input
    const validationResult = validateBody(productSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { name, nameAr, description, descriptionAr, price, discountPrice, images, stock, categoryId, featured } = validationResult.data;

    // Check if category exists
    const category = await db.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      console.error('[Products API] Category not found:', categoryId);
      return NextResponse.json({
        success: false,
        error: 'الفئة غير موجودة'
      }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        name,
        nameAr,
        description: description || '',
        descriptionAr: descriptionAr || '',
        price,
        discountPrice: discountPrice || null,
        images: JSON.stringify(images || []),
        stock: stock || 0,
        categoryId,
        featured: featured || false
      },
      include: { category: true }
    });

    // Invalidate products cache
    await cacheDelPattern('products:*', { prefix: 'api' });

    console.log('[Products API] Product created successfully:', product.id);
    return NextResponse.json({
      success: true,
      data: product
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create product'
    }, { status: 500 });
  }
}

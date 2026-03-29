import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateQuery } from '@/schemas';
import { searchSuggestionsQuerySchema } from '@/schemas/product.schema';
import {
  cacheGetOrSet,
  CacheTTL,
  isRedisAvailable,
} from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Validate query parameter
    const queryResult = validateQuery(searchSuggestionsQuerySchema, {
      q: q.trim(),
    });

    if (!queryResult.success) {
      return queryResult.error;
    }

    const trimmedQ = q.trim().slice(0, 200); // Ensure max length

    const cacheKey = `products:suggestions:${encodeURIComponent(trimmedQ)}`;

    const suggestions = await cacheGetOrSet(
      cacheKey,
      async () => fetchSuggestions(trimmedQ),
      { ttl: CacheTTL.SHORT, prefix: 'api' }
    );

    const headers: HeadersInit = {};
    if (isRedisAvailable()) {
      headers['X-Cache'] = 'HIT';
    } else {
      headers['X-Cache'] = 'MEMORY';
    }

    return NextResponse.json({ suggestions }, { headers });
  } catch (error) {
    console.error('[Search Suggestions API] Error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}

// ─── Internal helpers ────────────────────────────────────────────────

interface Suggestion {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  discountPrice: number | null;
  image: string;
}

async function fetchSuggestions(q: string): Promise<Suggestion[]> {
  const where: Record<string, unknown> = {
    deletedAt: null,
    stock: { gt: 0 }, // Only suggest products that are in stock
  };

  if (q.length < 3) {
    // Short query: use startsWith for fast prefix matching
    where.OR = [
      { name: { startsWith: q, mode: 'insensitive' } },
      { nameAr: { startsWith: q, mode: 'insensitive' } },
    ];
  } else {
    // Longer query: try full-text search first
    const fullTextWhere: Record<string, unknown> = {
      deletedAt: null,
      stock: { gt: 0 },
      OR: [
        { name: { search: q } },
        { nameAr: { search: q } },
      ],
    };

    const fullTextResults = await db.product.findMany({
      where: fullTextWhere,
      select: {
        id: true,
        name: true,
        nameAr: true,
        price: true,
        discountPrice: true,
        images: true,
      },
      orderBy: { salesCount: 'desc' },
      take: 8,
    });

    if (fullTextResults.length > 0) {
      return fullTextResults.map(parseSuggestion);
    }

    // Fallback to contains mode
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { nameAr: { contains: q, mode: 'insensitive' } },
    ];
  }

  const products = await db.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      nameAr: true,
      price: true,
      discountPrice: true,
      images: true,
    },
    orderBy: [
      { salesCount: 'desc' },
      { rating: 'desc' },
    ],
    take: 8,
  });

  return products.map(parseSuggestion);
}

/**
 * Parse a product into a suggestion object, extracting the first image from the images JSON.
 */
function parseSuggestion(product: {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  discountPrice: number | null;
  images: string;
}): Suggestion {
  let firstImage = '';
  try {
    const parsed = JSON.parse(product.images) as unknown[];
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      firstImage = parsed[0];
    }
  } catch {
    // images field might be a plain string URL
    firstImage = product.images;
  }

  return {
    id: product.id,
    name: product.name,
    nameAr: product.nameAr,
    price: product.price,
    discountPrice: product.discountPrice,
    image: firstImage,
  };
}

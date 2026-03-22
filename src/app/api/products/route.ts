import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

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

    if (featured === 'true') {
      where.featured = true;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
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

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nameAr, description, descriptionAr, price, discountPrice, images, stock, categoryId, featured } = body;

    const product = await db.product.create({
      data: {
        name,
        nameAr,
        description,
        descriptionAr,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        images: JSON.stringify(images || []),
        stock: parseInt(stock) || 0,
        categoryId,
        featured: featured || false
      }
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

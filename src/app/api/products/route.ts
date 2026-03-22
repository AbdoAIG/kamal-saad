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
    console.log('[Products API] Creating product with data:', body);
    
    const { name, nameAr, description, descriptionAr, price, discountPrice, images, stock, categoryId, featured } = body;

    // Validate required fields
    if (!name || !nameAr || !price || !categoryId) {
      console.error('[Products API] Missing required fields:', { name, nameAr, price, categoryId });
      return NextResponse.json({ 
        error: 'حقول مطلوبة: الاسم، الاسم بالعربية، السعر، الفئة' 
      }, { status: 400 });
    }

    // Check if category exists
    const category = await db.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      console.error('[Products API] Category not found:', categoryId);
      return NextResponse.json({ 
        error: 'الفئة غير موجودة' 
      }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        name,
        nameAr,
        description: description || '',
        descriptionAr: descriptionAr || '',
        price: typeof price === 'string' ? parseFloat(price) : price,
        discountPrice: discountPrice ? (typeof discountPrice === 'string' ? parseFloat(discountPrice) : discountPrice) : null,
        images: JSON.stringify(images || []),
        stock: typeof stock === 'string' ? parseInt(stock) : (stock || 0),
        categoryId,
        featured: featured || false
      },
      include: { category: true }
    });
    
    console.log('[Products API] Product created successfully:', product.id);
    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create product' 
    }, { status: 500 });
  }
}

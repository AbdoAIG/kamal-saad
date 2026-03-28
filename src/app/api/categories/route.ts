import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-utils';
import { categorySchema, validateBody } from '@/schemas';

// GET - Get all categories
export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { nameAr: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create a new category (admin only)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = validateBody(categorySchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { name, nameAr, slug, image, description } = validationResult.data;

    // Generate slug if not provided
    const categorySlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if slug already exists
    const existingCategory = await db.category.findUnique({
      where: { slug: categorySlug }
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'رابط الفئة موجود بالفعل' },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: {
        name,
        nameAr,
        slug: categorySlug,
        image: image || null,
        description: description || null
      }
    });

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// PUT - Update a category (admin only)
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const body = await request.json();
    const { id, name, nameAr, slug, image, description } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الفئة مطلوب' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'الفئة غير موجودة' },
        { status: 404 }
      );
    }

    // Generate slug if not provided
    const categorySlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if slug already exists for another category
    if (categorySlug !== existingCategory.slug) {
      const slugExists = await db.category.findFirst({
        where: { 
          slug: categorySlug,
          NOT: { id }
        }
      });

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'رابط الفئة موجود بالفعل' },
          { status: 400 }
        );
      }
    }

    const category = await db.category.update({
      where: { id },
      data: {
        name,
        nameAr,
        slug: categorySlug,
        image: image || null,
        description: description || null
      }
    });

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

// GET - Export products to CSV/Excel format
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Only admins can export products
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // csv or json
    const includeVariants = searchParams.get('variants') === 'true';
    const includeDeleted = searchParams.get('includeDeleted') === 'true'; // Include soft deleted products

    // Fetch all products with their details
    const products = await db.product.findMany({
      where: includeDeleted ? undefined : { deletedAt: null },
      include: {
        category: {
          select: { id: true, name: true, nameAr: true },
        },
        ...(includeVariants ? {
          variants: {
            include: {
              options: true,
            },
          },
          variantSKUs: {
            include: {
              values: {
                include: {
                  variant: true,
                  option: true,
                },
              },
            },
          },
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: products,
        count: products.length,
      });
    }

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Name (EN)',
      'Name (AR)',
      'Description (EN)',
      'Description (AR)',
      'Price',
      'Discount Price',
      'Stock',
      'Min Stock',
      'Category ID',
      'Category Name',
      'Category Name (AR)',
      'Featured',
      'Has Variants',
      'SKU',
      'Barcode',
      'Rating',
      'Reviews Count',
      'Sales Count',
      'Images (JSON)',
      'Deleted At',
      'Created At',
    ].join(',');

    const csvRows = products.map(product => {
      const row = [
        product.id,
        `"${(product.name || '').replace(/"/g, '""')}"`,
        `"${(product.nameAr || '').replace(/"/g, '""')}"`,
        `"${(product.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${(product.descriptionAr || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        product.price,
        product.discountPrice || '',
        product.stock,
        product.minStock,
        product.categoryId,
        `"${(product.category?.name || '').replace(/"/g, '""')}"`,
        `"${(product.category?.nameAr || '').replace(/"/g, '""')}"`,
        product.featured ? 'Yes' : 'No',
        product.hasVariants ? 'Yes' : 'No',
        product.sku || '',
        product.barcode || '',
        product.rating,
        product.reviewsCount,
        product.salesCount,
        `"${product.images || '[]'}"`,
        product.deletedAt ? product.deletedAt.toISOString() : '',
        product.createdAt.toISOString(),
      ];
      return row.join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Return CSV with proper headers
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="products-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export products' },
      { status: 500 }
    );
  }
}

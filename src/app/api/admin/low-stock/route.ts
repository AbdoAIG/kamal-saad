import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { withRateLimit, rateLimits } from '@/lib/rate-limit';

// GET - Get all products with low stock
// Products where stock <= minStock
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimits.api);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Check admin authentication
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const threshold = searchParams.get('threshold'); // Optional custom threshold

    // Get all products (excluding soft deleted)
    const allProducts = await db.product.findMany({
      where: {
        deletedAt: null,
        ...(threshold ? { stock: { lte: parseInt(threshold) } } : {})
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameAr: true,
          },
        },
      },
      orderBy: { stock: 'asc' },
    });

    // Filter products where stock <= minStock
    const filteredProducts = threshold
      ? allProducts
      : allProducts.filter(p => p.stock <= p.minStock);

    // Get out of stock products (stock = 0)
    const outOfStockProducts = filteredProducts.filter(p => p.stock === 0);

    // Get low stock products (0 < stock <= minStock)
    const lowStockOnly = filteredProducts.filter(p => p.stock > 0);

    // Check for SKU-level stock if product has variants (excluding soft deleted)
    const productsWithVariants = await db.product.findMany({
      where: { hasVariants: true, deletedAt: null },
      include: {
        variantSKUs: {
          where: { isActive: true },
          select: {
            id: true,
            sku: true,
            stock: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            nameAr: true,
          },
        },
      },
    });

    // Filter SKUs with low stock
    const lowStockSKUs = productsWithVariants
      .map(product => ({
        ...product,
        lowStockSKUs: product.variantSKUs.filter(sku => sku.stock <= product.minStock),
      }))
      .filter(product => product.lowStockSKUs.length > 0);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalLowStock: filteredProducts.length,
          outOfStock: outOfStockProducts.length,
          lowStock: lowStockOnly.length,
          variantProductsAffected: lowStockSKUs.length,
        },
        outOfStockProducts: outOfStockProducts.map(p => ({
          id: p.id,
          name: p.name,
          nameAr: p.nameAr,
          stock: p.stock,
          minStock: p.minStock,
          price: p.price,
          discountPrice: p.discountPrice,
          images: p.images ? JSON.parse(p.images) : [],
          category: p.category,
          hasVariants: p.hasVariants,
        })),
        lowStockProducts: lowStockOnly.map(p => ({
          id: p.id,
          name: p.name,
          nameAr: p.nameAr,
          stock: p.stock,
          minStock: p.minStock,
          price: p.price,
          discountPrice: p.discountPrice,
          images: p.images ? JSON.parse(p.images) : [],
          category: p.category,
          hasVariants: p.hasVariants,
        })),
        variantProductsLowStock: lowStockSKUs.map(p => ({
          id: p.id,
          name: p.name,
          nameAr: p.nameAr,
          minStock: p.minStock,
          category: p.category,
          lowStockSKUs: p.lowStockSKUs,
        })),
      },
    });
  } catch (error) {
    console.error('Low stock check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check low stock products' },
      { status: 500 }
    );
  }
}

// POST - Send low stock notification to admins
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimits.api);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Check admin authentication
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    // Get all products (excluding soft deleted)
    const products = await db.product.findMany({
      where: { stock: { gte: 0 }, deletedAt: null },
      include: {
        category: {
          select: { name: true, nameAr: true },
        },
      },
    });

    // Filter low stock products
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);

    if (lowStockProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No low stock products found',
        data: { notificationSent: false },
      });
    }

    // Get all admin users
    const admins = await db.user.findMany({
      where: {
        OR: [{ role: 'admin' }, { role: 'super_admin' }],
      },
      select: { id: true },
    });

    if (admins.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No admin users to notify',
        data: { notificationSent: false },
      });
    }

    // Create notifications for all admins
    const outOfStock = lowStockProducts.filter(p => p.stock === 0);
    const lowStockOnly = lowStockProducts.filter(p => p.stock > 0);

    const notificationPromises = admins.map((admin) =>
      db.notification.create({
        data: {
          userId: admin.id,
          type: 'stock',
          title: 'Low Stock Alert',
          titleAr: 'تنبيه نقص المخزون',
          message: `${lowStockProducts.length} products have low stock. ${outOfStock.length} out of stock, ${lowStockOnly.length} running low.`,
          messageAr: `${lowStockProducts.length} منتجات بمخزون منخفض. ${outOfStock.length} غير متوفرة، ${lowStockOnly.length} على وشك النفاد.`,
          data: JSON.stringify({
            totalLowStock: lowStockProducts.length,
            outOfStock: outOfStock.length,
            lowStock: lowStockOnly.length,
            products: lowStockProducts.slice(0, 5).map(p => ({
              id: p.id,
              name: p.name,
              stock: p.stock,
              minStock: p.minStock,
            })),
          }),
          isRead: false,
        },
      })
    );

    await Promise.all(notificationPromises);

    return NextResponse.json({
      success: true,
      message: `Low stock notifications sent to ${admins.length} admins`,
      data: {
        notificationSent: true,
        adminCount: admins.length,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStock.length,
      },
    });
  } catch (error) {
    console.error('Low stock notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send low stock notifications' },
      { status: 500 }
    );
  }
}

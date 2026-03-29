import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-utils';
import { createOrderSchema, validateBody } from '@/schemas';

// GET - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const orders = await db.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                images: true,
                price: true,
                discountPrice: true
              }
            },
            sku: {
              include: {
                values: {
                  include: {
                    option: { select: { valueAr: true } }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST - Create a new order
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const body = await request.json();
    
    // Parse shipping info - can be string (shippingAddress) or object (shippingInfo)
    let shippingInfo;
    if (body.shippingAddress && typeof body.shippingAddress === 'string') {
      try {
        shippingInfo = JSON.parse(body.shippingAddress);
      } catch {
        shippingInfo = { address: body.shippingAddress, phone: body.phone || '' };
      }
    } else if (body.shippingInfo) {
      shippingInfo = body.shippingInfo;
    } else {
      return NextResponse.json(
        { success: false, error: 'معلومات الشحن مطلوبة' },
        { status: 400 }
      );
    }

    // Validate shipping info has required fields
    if (!shippingInfo.phone) {
      shippingInfo.phone = body.phone || '';
    }

    // Validate items
    const items = body.items;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'يجب إضافة منتج واحد على الأقل' },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = ['cod', 'card', 'wallet', 'kiosk', 'fawry', 'visa', 'vodafone', 'valu'];
    const paymentMethod = body.paymentMethod;
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'طريقة الدفع غير صالحة' },
        { status: 400 }
      );
    }

    // ========== FIX N+1 QUERIES ==========
    // Get all product IDs and SKU IDs
    const productIds = [...new Set(items.map((item: any) => item.productId))];
    const skuIds = items.filter((item: any) => item.skuId).map((item: any) => item.skuId);

    // Fetch all products in ONE query
    const products = await db.product.findMany({
      where: { id: { in: productIds } }
    });
    const productsMap = new Map(products.map(p => [p.id, p]));

    // Fetch all SKUs in ONE query
    const skus = skuIds.length > 0 
      ? await db.productVariantSKU.findMany({
          where: { id: { in: skuIds } }
        })
      : [];
    const skusMap = new Map(skus.map(s => [s.id, s]));

    // Calculate totals and validate
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = productsMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `المنتج ${item.productId} غير موجود` },
          { status: 400 }
        );
      }

      // Check stock
      let itemStock = product.stock;
      let itemPrice = item.price || product.discountPrice || product.price;

      // If SKU is specified, check SKU stock and price
      if (item.skuId) {
        const sku = skusMap.get(item.skuId);
        
        if (!sku || !sku.isActive) {
          return NextResponse.json(
            { success: false, error: 'الخيار المحدد غير متوفر' },
            { status: 400 }
          );
        }

        itemStock = sku.stock;
        if (sku.price) itemPrice = item.price || sku.discountPrice || sku.price;
      }

      if (item.quantity > itemStock) {
        return NextResponse.json(
          { success: false, error: `الكمية المطلوبة غير متوفرة للمنتج ${product.nameAr || product.name}` },
          { status: 400 }
        );
      }

      subtotal += itemPrice * item.quantity;
      orderItems.push({
        productId: item.productId,
        skuId: item.skuId || null,
        quantity: item.quantity,
        price: itemPrice
      });
    }

    // Calculate shipping
    const shippingFee = subtotal >= 200 ? 0 : 30;
    const total = body.total || (subtotal + shippingFee);

    // Apply coupon discount if provided
    let discount = 0;
    if (body.couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: body.couponCode }
      });

      if (coupon && coupon.isActive && new Date() >= coupon.validFrom && new Date() <= coupon.validUntil) {
        if (coupon.minOrder && subtotal < coupon.minOrder) {
          return NextResponse.json(
            { success: false, error: `الحد الأدنى للطلب ${coupon.minOrder} ج.م` },
            { status: 400 }
          );
        }

        if (coupon.type === 'percentage') {
          discount = (subtotal * coupon.value) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = coupon.value;
        }
      }
    }

    // Determine user ID - require authentication for order placement
    const userId = body.userId || user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول لإتمام الطلب' },
        { status: 401 }
      );
    }

    // Create order
    const order = await db.order.create({
      data: {
        userId: userId,
        status: 'pending',
        total,
        discount,
        shippingAddress: JSON.stringify(shippingInfo),
        phone: shippingInfo.phone || body.phone || '',
        paymentMethod,
        notes: body.notes || shippingInfo.notes,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // ========== FIX N+1 QUERIES for stock updates ==========
    // Update stock in parallel using Promise.all
    const stockUpdatePromises = orderItems.map(item => {
      if (item.skuId) {
        return db.productVariantSKU.update({
          where: { id: item.skuId },
          data: { stock: { decrement: item.quantity } }
        });
      } else {
        return db.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }
    });

    await Promise.all(stockUpdatePromises);

    return NextResponse.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order', details: String(error) },
      { status: 500 }
    );
  }
}

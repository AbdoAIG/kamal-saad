import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-utils';

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
  let body: any;
  
  try {
    // Step 1: Parse request body FIRST (before any async auth calls that might interfere)
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[Orders API] Failed to parse request body:', parseError);
      return NextResponse.json(
        { success: false, error: 'طلب غير صالح', details: 'Failed to parse request body' },
        { status: 400 }
      );
    }

    // Step 2: Authenticate user (supports both custom session and NextAuth)
    let user = null;
    try {
      user = await getAuthUser(request);
    } catch (authError) {
      console.error('[Orders API] Auth check error:', authError);
    }

    // Step 3: Validate items
    const items = body.items;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'يجب إضافة منتج واحد على الأقل' },
        { status: 400 }
      );
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.productId) {
        return NextResponse.json(
          { success: false, error: 'بيانات المنتج غير مكتملة' },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { success: false, error: 'الكمية غير صالحة' },
          { status: 400 }
        );
      }
    }

    // Step 4: Validate payment method
    const validPaymentMethods = ['cod', 'card', 'wallet', 'kiosk', 'fawry', 'visa', 'vodafone', 'valu'];
    const paymentMethod = body.paymentMethod;
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'طريقة الدفع غير صالحة' },
        { status: 400 }
      );
    }

    // Step 5: Parse shipping info - can be string (shippingAddress) or object (shippingInfo)
    let shippingInfo: any = null;
    if (body.shippingAddress && typeof body.shippingAddress === 'string') {
      try {
        shippingInfo = JSON.parse(body.shippingAddress);
      } catch {
        shippingInfo = { address: body.shippingAddress, phone: body.phone || '' };
      }
    } else if (body.shippingInfo && typeof body.shippingInfo === 'object') {
      shippingInfo = body.shippingInfo;
    }

    if (!shippingInfo || !shippingInfo.phone) {
      shippingInfo = shippingInfo || {};
      shippingInfo.phone = body.phone || shippingInfo.phone || '';
    }

    if (!shippingInfo.address && !shippingInfo.fullName) {
      return NextResponse.json(
        { success: false, error: 'معلومات الشحن مطلوبة (العنوان واسم المستلم)' },
        { status: 400 }
      );
    }

    // Step 6: Determine user ID - allow order if either auth system or body provides userId
    const userId = body.userId || user?.id;
    
    if (!userId) {
      console.error('[Orders API] No userId found. body.userId:', body.userId, 'auth user:', user?.id);
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول لإتمام الطلب' },
        { status: 401 }
      );
    }

    // Step 7: Fetch all products and SKUs in parallel (FIX N+1)
    const productIds = [...new Set(items.map((item: any) => item.productId))];
    const skuIds = items.filter((item: any) => item.skuId).map((item: any) => item.skuId);

    const [products, skus] = await Promise.all([
      db.product.findMany({ where: { id: { in: productIds } } }),
      skuIds.length > 0
        ? db.productVariantSKU.findMany({ where: { id: { in: skuIds } } })
        : Promise.resolve([])
    ]);

    const productsMap = new Map(products.map(p => [p.id, p]));
    const skusMap = new Map(skus.map(s => [s.id, s]));

    // Step 8: Calculate totals and validate stock
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const product = productsMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `المنتج غير موجود` },
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

    // Step 9: Calculate shipping and total
    const shippingFee = subtotal >= 200 ? 0 : 30;
    const total = body.total || (subtotal + shippingFee);

    // Step 10: Apply coupon discount if provided
    let discount = 0;
    if (body.couponCode) {
      try {
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
      } catch (couponError) {
        console.error('[Orders API] Coupon validation error:', couponError);
        // Continue without coupon if there's an error
      }
    }

    // Step 11: Create order
    console.log('[Orders API] Creating order:', { userId, total, discount, itemCount: orderItems.length, paymentMethod });

    const order = await db.order.create({
      data: {
        userId: userId,
        status: 'pending',
        total,
        discount,
        shippingAddress: JSON.stringify(shippingInfo),
        phone: shippingInfo.phone || body.phone || '',
        paymentMethod,
        notes: body.notes || shippingInfo.notes || null,
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

    console.log('[Orders API] Order created successfully:', order.id);

    // Step 12: Update stock in parallel
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
    console.error('[Orders API] Error creating order:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Handle Prisma unique constraint errors
    if (errorMessage.includes('Unique constraint') || errorMessage.includes('unique')) {
      return NextResponse.json(
        { success: false, error: 'حدث تعارض في البيانات، يرجى المحاولة مرة أخرى', details: errorMessage },
        { status: 409 }
      );
    }
    
    // Handle Prisma foreign key errors
    if (errorMessage.includes('Foreign key') || errorMessage.includes('referenced')) {
      return NextResponse.json(
        { success: false, error: 'بيانات مرتبطة غير موجودة، يرجى تحديث الصفحة والمحاولة مرة أخرى', details: errorMessage },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في إنشاء الطلب، يرجى المحاولة مرة أخرى', details: errorMessage },
      { status: 500 }
    );
  }
}

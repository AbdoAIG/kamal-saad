import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Response messages in Arabic and English
const messages = {
  notFound: {
    en: 'Review not found',
    ar: 'التقييم غير موجود'
  },
  productNotFound: {
    en: 'Product not found',
    ar: 'المنتج غير موجود'
  },
  userNotFound: {
    en: 'User not found',
    ar: 'المستخدم غير موجود'
  },
  alreadyReviewed: {
    en: 'You have already reviewed this product',
    ar: 'لقد قمت بتقييم هذا المنتج بالفعل'
  },
  invalidRating: {
    en: 'Rating must be between 1 and 5',
    ar: 'التقييم يجب أن يكون بين 1 و 5'
  },
  missingFields: {
    en: 'Missing required fields',
    ar: 'حقول مطلوبة ناقصة'
  },
  createSuccess: {
    en: 'Review created successfully',
    ar: 'تم إنشاء التقييم بنجاح'
  },
  fetchError: {
    en: 'Failed to fetch reviews',
    ar: 'فشل في جلب التقييمات'
  },
  createError: {
    en: 'Failed to create review',
    ar: 'فشل في إنشاء التقييم'
  }
};

// GET - Fetch reviews with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');
    const rating = searchParams.get('rating');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Build where clause
    const where: Record<string, unknown> = { isApproved: true };

    if (productId) {
      where.productId = productId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (rating) {
      const ratingNum = parseInt(rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        where.rating = ratingNum;
      }
    }

    // Build order by
    const orderBy: Record<string, unknown> = {};
    if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else if (sortBy === 'helpful') {
      orderBy.helpful = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Build query
    const query: Record<string, unknown> = {
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            images: true
          }
        }
      },
      orderBy
    };

    if (limit) {
      query.take = parseInt(limit);
    }

    if (offset) {
      query.skip = parseInt(offset);
    }

    const reviews = await db.review.findMany(query);

    // Parse images JSON for each review
    const formattedReviews = reviews.map(review => ({
      ...review,
      images: review.images ? JSON.parse(review.images) : [],
      product: review.product ? {
        ...review.product,
        images: JSON.parse(review.product.images)
      } : null
    }));

    // Get total count for pagination
    const total = await db.review.count({ where });

    return NextResponse.json({
      success: true,
      data: formattedReviews,
      meta: {
        total,
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : null
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      {
        success: false,
        error: messages.fetchError.en,
        errorAr: messages.fetchError.ar
      },
      { status: 500 }
    );
  }
}

// POST - Create a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, rating, title, comment, images } = body;

    // Validate required fields
    if (!userId || !productId || !rating) {
      return NextResponse.json(
        {
          success: false,
          error: messages.missingFields.en,
          errorAr: messages.missingFields.ar
        },
        { status: 400 }
      );
    }

    // Validate rating range
    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        {
          success: false,
          error: messages.invalidRating.en,
          errorAr: messages.invalidRating.ar
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: messages.userNotFound.en,
          errorAr: messages.userNotFound.ar
        },
        { status: 404 }
      );
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: messages.productNotFound.en,
          errorAr: messages.productNotFound.ar
        },
        { status: 404 }
      );
    }

    // Check if user has already reviewed this product
    const existingReview = await db.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          error: messages.alreadyReviewed.en,
          errorAr: messages.alreadyReviewed.ar
        },
        { status: 400 }
      );
    }

    // Check if user has purchased this product (for verified purchase)
    const hasPurchased = await db.order.findFirst({
      where: {
        userId,
        status: 'delivered',
        items: {
          some: {
            productId
          }
        }
      }
    });

    // Create the review
    const review = await db.review.create({
      data: {
        userId,
        productId,
        rating: ratingNum,
        title: title || null,
        comment: comment || null,
        images: images ? JSON.stringify(images) : null,
        isVerified: !!hasPurchased
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            nameAr: true
          }
        }
      }
    });

    // Update product rating and reviews count
    const productReviews = await db.review.findMany({
      where: { productId },
      select: { rating: true }
    });

    const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = productReviews.length > 0 ? totalRating / productReviews.length : 0;

    await db.product.update({
      where: { id: productId },
      data: {
        rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
        reviewsCount: productReviews.length
      }
    });

    return NextResponse.json({
      success: true,
      message: messages.createSuccess.en,
      messageAr: messages.createSuccess.ar,
      data: {
        ...review,
        images: review.images ? JSON.parse(review.images) : []
      }
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      {
        success: false,
        error: messages.createError.en,
        errorAr: messages.createError.ar
      },
      { status: 500 }
    );
  }
}

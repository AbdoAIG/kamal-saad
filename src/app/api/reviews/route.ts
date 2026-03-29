import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-utils';
import { reviewSchema, validateBody } from '@/schemas';

// GET - Get reviews for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'معرف المنتج مطلوب' },
        { status: 400 }
      );
    }

    const reviews = await db.review.findMany({
      where: { 
        productId,
        isApproved: true 
      },
      include: {
        user: {
          select: { id: true, name: true, image: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST - Create a new review
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول لإضافة تقييم' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = validateBody(reviewSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { productId, rating, title, comment, images } = validationResult.data;

    // Check if user already reviewed this product
    const existingReview = await db.review.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId
        }
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'لقد قمت بتقييم هذا المنتج من قبل' },
        { status: 400 }
      );
    }

    // Check if user purchased this product
    const order = await db.order.findFirst({
      where: {
        userId: user.id,
        status: 'delivered',
        items: {
          some: { productId }
        }
      }
    });

    const review = await db.review.create({
      data: {
        userId: user.id,
        productId,
        rating,
        title: title || null,
        comment: comment || null,
        images: images ? JSON.stringify(images) : null,
        isVerified: !!order,
        isApproved: true // Auto-approve for now
      },
      include: {
        user: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    // Update product rating
    const productReviews = await db.review.findMany({
      where: { productId, isApproved: true }
    });

    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;

    await db.product.update({
      where: { id: productId },
      data: {
        rating: avgRating,
        reviewsCount: productReviews.length
      }
    });

    return NextResponse.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

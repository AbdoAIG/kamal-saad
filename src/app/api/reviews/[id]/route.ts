import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Response messages in Arabic and English
const messages = {
  notFound: {
    en: 'Review not found',
    ar: 'التقييم غير موجود'
  },
  unauthorized: {
    en: 'You are not authorized to perform this action',
    ar: 'غير مصرح لك بإجراء هذا الإجراء'
  },
  invalidRating: {
    en: 'Rating must be between 1 and 5',
    ar: 'التقييم يجب أن يكون بين 1 و 5'
  },
  updateSuccess: {
    en: 'Review updated successfully',
    ar: 'تم تحديث التقييم بنجاح'
  },
  deleteSuccess: {
    en: 'Review deleted successfully',
    ar: 'تم حذف التقييم بنجاح'
  },
  fetchError: {
    en: 'Failed to fetch review',
    ar: 'فشل في جلب التقييم'
  },
  updateError: {
    en: 'Failed to update review',
    ar: 'فشل في تحديث التقييم'
  },
  deleteError: {
    en: 'Failed to delete review',
    ar: 'فشل في حذف التقييم'
  },
  invalidId: {
    en: 'Invalid review ID',
    ar: 'معرف التقييم غير صالح'
  }
};

// Helper function to get review by ID
async function getReviewById(id: string) {
  return db.review.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true
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
    }
  });
}

// Helper function to update product rating after review changes
async function updateProductRating(productId: string) {
  const productReviews = await db.review.findMany({
    where: { productId },
    select: { rating: true }
  });

  const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = productReviews.length > 0 ? totalRating / productReviews.length : 0;

  await db.product.update({
    where: { id: productId },
    data: {
      rating: Math.round(avgRating * 10) / 10,
      reviewsCount: productReviews.length
    }
  });
}

// GET - Get single review by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: messages.invalidId.en,
          errorAr: messages.invalidId.ar
        },
        { status: 400 }
      );
    }

    const review = await getReviewById(id);

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error: messages.notFound.en,
          errorAr: messages.notFound.ar
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...review,
        images: review.images ? JSON.parse(review.images) : [],
        product: review.product ? {
          ...review.product,
          images: JSON.parse(review.product.images)
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching review:', error);
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

// PUT - Update review (only by review owner)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, rating, title, comment, images } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: messages.invalidId.en,
          errorAr: messages.invalidId.ar
        },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (rating !== undefined) {
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
    }

    // Get existing review
    const existingReview = await getReviewById(id);

    if (!existingReview) {
      return NextResponse.json(
        {
          success: false,
          error: messages.notFound.en,
          errorAr: messages.notFound.ar
        },
        { status: 404 }
      );
    }

    // Check authorization - only the review owner can update
    if (userId !== existingReview.userId) {
      return NextResponse.json(
        {
          success: false,
          error: messages.unauthorized.en,
          errorAr: messages.unauthorized.ar
        },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (rating !== undefined) {
      updateData.rating = parseInt(rating);
    }
    if (title !== undefined) {
      updateData.title = title || null;
    }
    if (comment !== undefined) {
      updateData.comment = comment || null;
    }
    if (images !== undefined) {
      updateData.images = images ? JSON.stringify(images) : null;
    }

    // Update the review
    const updatedReview = await db.review.update({
      where: { id },
      data: updateData,
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

    // Update product rating if rating changed
    if (rating !== undefined) {
      await updateProductRating(existingReview.productId);
    }

    return NextResponse.json({
      success: true,
      message: messages.updateSuccess.en,
      messageAr: messages.updateSuccess.ar,
      data: {
        ...updatedReview,
        images: updatedReview.images ? JSON.parse(updatedReview.images) : []
      }
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      {
        success: false,
        error: messages.updateError.en,
        errorAr: messages.updateError.ar
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete review (only by review owner or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: messages.invalidId.en,
          errorAr: messages.invalidId.ar
        },
        { status: 400 }
      );
    }

    // Get existing review
    const existingReview = await getReviewById(id);

    if (!existingReview) {
      return NextResponse.json(
        {
          success: false,
          error: messages.notFound.en,
          errorAr: messages.notFound.ar
        },
        { status: 404 }
      );
    }

    // Check authorization - only the review owner or admin can delete
    const isOwner = userId === existingReview.userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: messages.unauthorized.en,
          errorAr: messages.unauthorized.ar
        },
        { status: 403 }
      );
    }

    const productId = existingReview.productId;

    // Delete the review
    await db.review.delete({
      where: { id }
    });

    // Update product rating after deletion
    await updateProductRating(productId);

    return NextResponse.json({
      success: true,
      message: messages.deleteSuccess.en,
      messageAr: messages.deleteSuccess.ar
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      {
        success: false,
        error: messages.deleteError.en,
        errorAr: messages.deleteError.ar
      },
      { status: 500 }
    );
  }
}

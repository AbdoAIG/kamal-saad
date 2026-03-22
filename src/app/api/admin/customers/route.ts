import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all customers with their order stats
export async function GET() {
  try {
    // Get all users with customer role
    const customers = await db.user.findMany({
      where: {
        role: 'customer'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            total: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate stats for each customer
    const customersWithStats = customers.map(customer => {
      const ordersCount = customer.orders.length;
      const totalSpent = customer.orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + o.total, 0);

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt.toISOString(),
        ordersCount,
        totalSpent
      };
    });

    return NextResponse.json({
      success: true,
      data: customersWithStats
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

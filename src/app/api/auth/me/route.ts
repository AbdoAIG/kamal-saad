import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ user: null, success: false }, { status: 200 });
    }

    // Find session with user
    const session = await db.session.findUnique({
      where: { sessionToken: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            image: true,
            isActive: true
          }
        }
      }
    });

    if (!session || !session.user) {
      // Session not found or user not found
      try {
        await db.session.deleteMany({
          where: { sessionToken: sessionToken }
        });
      } catch (e) {
        // ignore
      }
      cookieStore.delete('session');
      return NextResponse.json({ user: null, success: false }, { status: 200 });
    }

    // Check if session expired
    if (new Date(session.expires) < new Date()) {
      try {
        await db.session.delete({
          where: { id: session.id }
        });
      } catch (e) {
        // ignore
      }
      cookieStore.delete('session');
      return NextResponse.json({ user: null, success: false }, { status: 200 });
    }

    // Return user
    const user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role || 'customer',
      phone: session.user.phone,
      image: session.user.image,
      isActive: session.user.isActive
    };

    return NextResponse.json({ user, success: true }, { status: 200 });
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json({ user: null, success: false, error: String(error) }, { status: 200 });
  }
}

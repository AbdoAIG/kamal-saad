import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { auth } from '@/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();

    // First, try the custom session cookie (credential-based login)
    const sessionToken = cookieStore.get('session')?.value;

    if (sessionToken) {
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

      if (session && session.user) {
        // Check if session expired
        if (new Date(session.expires) < new Date()) {
          try {
            await db.session.delete({ where: { id: session.id } });
          } catch (e) { /* ignore */ }
          cookieStore.delete('session');
        } else {
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
        }
      }

      // Custom session invalid - clean up
      try {
        await db.session.deleteMany({ where: { sessionToken: sessionToken } });
      } catch (e) { /* ignore */ }
      cookieStore.delete('session');
    }

    // Second, try NextAuth session (Google OAuth login)
    try {
      const nextAuthSession = await auth();
      if (nextAuthSession?.user?.email) {
        // Find the user in DB to get full data including role
        const dbUser = await db.user.findUnique({
          where: { email: nextAuthSession.user.email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            image: true,
            isActive: true
          }
        });

        if (dbUser) {
          const user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role || 'customer',
            phone: dbUser.phone,
            image: dbUser.image,
            isActive: dbUser.isActive
          };
          return NextResponse.json({ user, success: true }, { status: 200 });
        }
      }
    } catch (error) {
      // NextAuth auth() call may fail in some edge cases - continue to return null
      console.error('NextAuth session check failed:', error);
    }

    return NextResponse.json({ user: null, success: false }, { status: 200 });
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json({ user: null, success: false, error: String(error) }, { status: 200 });
  }
}

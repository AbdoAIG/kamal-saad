import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const sessionId = (await cookies()).get('session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Find session in database
    const session = await db.session.findUnique({
      where: { sessionToken: sessionId },
      include: {
        user: {
          include: { roleData: true }
        }
      }
    });

    if (!session || session.expires < new Date()) {
      // Session expired or not found
      if (session) {
        await db.session.delete({ where: { id: session.id } });
      }
      (await cookies()).delete('session');
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = session.user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

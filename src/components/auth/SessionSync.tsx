'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/store/useStore';

// This component synchronizes NextAuth session with Zustand store
export function SessionSync() {
  const { data: session, status } = useSession();
  const { setUser, setUserId, user } = useStore();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Only update if user is different or not set
      const sessionUser = session.user as any;
      if (!user || user.id !== sessionUser.id) {
        setUser({
          id: sessionUser.id,
          email: session.user.email || '',
          name: session.user.name,
          role: sessionUser.role || 'customer',
        });
        setUserId(sessionUser.id);
      }
    } else if (status === 'unauthenticated' && user) {
      // Clear user if session is unauthenticated
      setUser(null);
      setUserId(null);
    }
  }, [session, status, user, setUser, setUserId]);

  return null;
}

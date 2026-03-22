'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/store/useStore';

export function SessionSync() {
  const { data: session, status } = useSession();
  const { setUser, setUserId } = useStore();
  const lastSyncedId = useRef<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const sessionUser = session.user as any;
      const userId = sessionUser.id as string;

      if (userId && userId !== lastSyncedId.current) {
        lastSyncedId.current = userId;
        setUser({
          id: userId,
          email: session.user.email || '',
          name: session.user.name || null,
          role: sessionUser.role || 'customer',
        });
        setUserId(userId);
      }
    } else if (status === 'unauthenticated') {
      if (lastSyncedId.current) {
        lastSyncedId.current = null;
        setUser(null);
        setUserId(null);
      }
    }
  }, [session, status, setUser, setUserId]);

  return null;
}

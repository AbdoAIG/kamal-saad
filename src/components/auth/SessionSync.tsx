'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';

/**
 * SessionSync - Bridges NextAuth sessions to the Zustand store
 *
 * The app has two auth systems:
 * 1. Custom credential auth → sets Zustand store directly via AuthModal
 * 2. NextAuth (Google OAuth) → only sets next-auth.session-token cookie
 *
 * This component watches the NextAuth session and syncs it to Zustand
 * so that all UI components (Header, etc.) correctly show the logged-in user.
 */
export function SessionSync() {
  const { data: session, status } = useSession();
  const { user, setUser, setUserId, logout } = useStore();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    // Wait until NextAuth has checked for a session
    if (status === 'loading') return;

    // Case 1: NextAuth has a session but Zustand doesn't know about it
    // This happens after Google OAuth login
    if (session?.user && !user) {
      const sessionUser = session.user as any;
      const userData = {
        id: sessionUser.id || '',
        email: sessionUser.email || '',
        name: sessionUser.name || '',
        image: sessionUser.image || null,
        role: sessionUser.role || 'customer',
      };

      if (userData.id) {
        setUser(userData);
        setUserId(userData.id);
        hasSyncedRef.current = true;
        console.log('[SessionSync] Synced NextAuth session to Zustand:', userData.id);
      }
    }

    // Case 2: NextAuth session expired but Zustand still thinks user is logged in
    // (Only if we previously synced - don't clear credential-based sessions)
    if (!session && user && hasSyncedRef.current) {
      console.log('[SessionSync] NextAuth session expired, clearing Zustand user');
      logout();
      hasSyncedRef.current = false;
    }

    // Reset sync flag when user logs out via custom auth
    if (!session && !user) {
      hasSyncedRef.current = false;
    }
  }, [session, status, user, setUser, setUserId, logout]);

  return null; // This component renders nothing
}

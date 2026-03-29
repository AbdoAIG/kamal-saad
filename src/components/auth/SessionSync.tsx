'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';

/**
 * SessionSync - Bridges NextAuth sessions to the Zustand store
 *
 * The app has two auth systems:
 * 1. Custom credential auth → sets Zustand store directly
 * 2. NextAuth (Google OAuth) → only sets next-auth.session-token cookie
 *
 * This component watches the NextAuth session and syncs it to Zustand
 * so that all UI components (Header, etc.) correctly show the logged-in user.
 * 
 * After login, it also merges localStorage cart with DB cart and loads DB favorites.
 */
export function SessionSync() {
  const { data: session, status } = useSession();
  const { user, setUser, setUserId, logout, mergeCartWithDB, loadFavoritesFromDB } = useStore();
  const hasSyncedRef = useRef(false);
  const prevUserRef = useRef<string | null>(null);

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

        // Generate a new session ID on login
        useStore.setState({
          sessionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });

        // Merge local cart with DB cart and load DB favorites
        // Fire-and-forget — these are non-blocking
        mergeCartWithDB();
        loadFavoritesFromDB();
      }
    }

    // Track login events — when user first appears in store
    if (user && user.id && prevUserRef.current !== user.id) {
      if (prevUserRef.current !== null) {
        // This is a new login (not initial hydration)
        useStore.getState().trackEvent('login', {}, undefined);
      }
      prevUserRef.current = user.id;
    }

    // Case 2: NextAuth session expired but Zustand still thinks user is logged in
    // (Only if we previously synced - don't clear credential-based sessions)
    if (!session && user && hasSyncedRef.current) {
      logout();
      hasSyncedRef.current = false;
      prevUserRef.current = null;
    }

    // Reset sync flag when user logs out via custom auth
    if (!session && !user) {
      hasSyncedRef.current = false;
      prevUserRef.current = null;
    }
  }, [session, status, user, setUser, setUserId, logout, mergeCartWithDB, loadFavoritesFromDB]);

  return null; // This component renders nothing
}

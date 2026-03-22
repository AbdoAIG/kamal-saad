'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/store/useStore';

// This component synchronizes NextAuth session with Zustand store
export function SessionSync() {
  const { data: session, status, update } = useSession({
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
  const { setUser, setUserId, user } = useStore();
  const hasSyncedRef = useRef(false);

  // Sync session to store
  const syncSession = useCallback(() => {
    if (status === 'authenticated' && session?.user) {
      const sessionUser = session.user as any;
      
      // Check if we need to update (different user or data changed)
      const needsUpdate = !user || 
        user.id !== sessionUser.id ||
        user.email !== sessionUser.email ||
        user.role !== sessionUser.role;
      
      if (needsUpdate) {
        setUser({
          id: sessionUser.id,
          email: sessionUser.email || '',
          name: sessionUser.name,
          role: sessionUser.role || 'customer',
        });
        setUserId(sessionUser.id);
        hasSyncedRef.current = true;
      }
    } else if (status === 'unauthenticated' && user) {
      // Only clear user if they were previously set
      setUser(null);
      setUserId(null);
      hasSyncedRef.current = false;
    }
  }, [session, status, user, setUser, setUserId]);

  // Sync on session change
  useEffect(() => {
    syncSession();
  }, [syncSession]);

  // Handle OAuth callback - check for callback URL parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const url = new URL(window.location.href);
    const hasOAuthCode = url.searchParams.has('code');
    const hasOAuthState = url.searchParams.has('state');
    const hasError = url.searchParams.has('error');
    
    // If we just came back from OAuth, force a session update
    if (hasOAuthCode || hasOAuthState) {
      // Clean up URL parameters
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      url.searchParams.delete('callbackUrl');
      url.searchParams.delete('error');
      url.searchParams.delete('errorDescription');
      url.searchParams.delete('authCallback');
      
      const cleanUrl = url.toString();
      if (cleanUrl !== window.location.href) {
        window.history.replaceState({}, '', cleanUrl);
      }
      
      // Force session update after OAuth
      setTimeout(() => {
        update?.();
      }, 100);
    }
    
    // Show error if OAuth failed
    if (hasError) {
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('errorDescription');
      console.error('OAuth error:', error, errorDescription);
    }
  }, [update]);

  // Listen for storage events (for multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('session') || e.key?.includes('auth')) {
        // Session changed in another tab, refetch
        update?.();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [update]);

  // Handle visibility change - refetch session when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !hasSyncedRef.current) {
        update?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [update]);

  return null;
}

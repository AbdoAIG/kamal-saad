'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/store/useStore';

export function SessionSync() {
  const { data: session, status, update } = useSession();
  const { setUser, setUserId } = useStore();
  const lastSyncedId = useRef<string | null>(null);
  const isProcessingOAuth = useRef(false);

  // Check for OAuth callback on mount
  useEffect(() => {
    const checkOAuthCallback = async () => {
      // Check if this is an OAuth callback (has code parameter in URL)
      const url = new URL(window.location.href);
      const hasOAuthCode = url.searchParams.has('code') || 
                          url.searchParams.has('state') ||
                          url.searchParams.has('oauth');
      
      if (hasOAuthCode && !isProcessingOAuth.current) {
        isProcessingOAuth.current = true;
        console.log('[SessionSync] OAuth callback detected, waiting for session...');
        
        // Clean up URL parameters after OAuth
        // Remove OAuth-related params from URL
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        url.searchParams.delete('oauth');
        url.searchParams.delete('error');
        url.searchParams.delete('error_description');
        
        // Replace URL without params (don't reload page)
        if (url.searchParams.toString() === '' || 
            (url.searchParams.toString() && !url.searchParams.has('code'))) {
          window.history.replaceState({}, '', url.pathname + url.search);
        }
      }
    };
    
    checkOAuthCallback();
  }, []);

  // Handle session changes
  useEffect(() => {
    const syncSession = async () => {
      console.log('[SessionSync] Status:', status, 'Session:', session?.user?.email);
      
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
          
          console.log('[SessionSync] User logged in:', userId, session.user.email);
        }
      } else if (status === 'unauthenticated') {
        if (lastSyncedId.current) {
          lastSyncedId.current = null;
          setUser(null);
          setUserId(null);
          console.log('[SessionSync] User logged out');
        }
      }
    };
    
    syncSession();
  }, [session, status, setUser, setUserId]);

  // Force session refresh after OAuth callback
  useEffect(() => {
    if (status === 'loading') {
      // Session is being loaded, wait
      return;
    }
    
    // If we just finished loading and have a session, trigger an update
    const timer = setTimeout(() => {
      if (status === 'authenticated') {
        update();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [status, update]);

  return null;
}

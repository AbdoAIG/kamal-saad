import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/';
    
    console.log('[Google Signin] Starting OAuth flow with callback:', callbackUrl);
    
    // Call signIn with redirect: true to get the OAuth URL
    // Note: In NextAuth v5, this will throw a redirect that we catch
    try {
      const result = await signIn('google', {
        callbackUrl,
        redirect: false,
      });
      
      console.log('[Google Signin] Result:', result);
      
      if (result?.url) {
        return NextResponse.redirect(result.url);
      }
      
      if (result?.error) {
        console.error('[Google Signin] Error:', result.error);
        
        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        const baseUrl = `${protocol}://${host}`;
        
        return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(result.error)}`, baseUrl));
      }
      
      // Fallback
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = `${protocol}://${host}`;
      
      return NextResponse.redirect(new URL(callbackUrl, baseUrl));
      
    } catch (redirectError: any) {
      // NextAuth throws NEXT_REDIRECT when redirect: true
      // We handle it manually with redirect: false above
      console.error('[Google Signin] Caught error:', redirectError);
      
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = `${protocol}://${host}`;
      
      return NextResponse.redirect(new URL('/?error=unknown', baseUrl));
    }
    
  } catch (error) {
    console.error('[Google Signin] Outer error:', error);
    
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;
    
    return NextResponse.redirect(new URL('/?error=oauth_error', baseUrl));
  }
}

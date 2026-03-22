import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/';
    
    console.log('[Google Signin] Initiating Google OAuth with callback:', callbackUrl);
    
    // Use NextAuth's signIn function to get the proper OAuth URL
    const result = await signIn('google', {
      callbackUrl,
      redirect: false,
    });
    
    console.log('[Google Signin] Result:', result);
    
    if (result?.url) {
      // Redirect to the OAuth provider URL
      return NextResponse.redirect(result.url);
    }
    
    if (result?.error) {
      console.error('[Google Signin] Error from signIn:', result.error);
      
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = `${protocol}://${host}`;
      
      return NextResponse.redirect(new URL(`/?error=${result.error}`, baseUrl));
    }
    
    // Fallback - redirect to home
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;
    
    return NextResponse.redirect(new URL(callbackUrl, baseUrl));
    
  } catch (error) {
    console.error('[Google Signin] Error:', error);
    
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;
    
    return NextResponse.redirect(new URL('/?error=oauth_error', baseUrl));
  }
}

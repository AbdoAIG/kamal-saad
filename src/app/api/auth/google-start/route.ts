import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, rateLimits } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Apply rate limiting for OAuth (5 attempts per minute)
  const rateLimitResponse = await withRateLimit(request, rateLimits.auth);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/';
  
  // Get CSRF token from NextAuth
  const host = request.headers.get('host') || 'kamal-saad.vercel.app';
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;
  
  try {
    // Fetch CSRF token
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });
    
    if (!csrfResponse.ok) {
      console.error('[Google Start] Failed to get CSRF token');
      return NextResponse.redirect(new URL('/?error=csrf_failed', baseUrl));
    }
    
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;
    
    console.log('[Google Start] Got CSRF token, creating redirect page');
    
    // Create a form and POST to NextAuth signin endpoint
    // This will redirect to Google OAuth
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting to Google...</title>
          <meta charset="utf-8">
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
              background: #f5f5f5;
            }
            .loader {
              text-align: center;
            }
            .spinner {
              width: 40px;
              height: 40px;
              border: 3px solid #e0e0e0;
              border-top-color: #14b8a6;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 16px;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="loader">
            <div class="spinner"></div>
            <p>جاري التوجيه إلى Google...</p>
          </div>
          <form id="googleForm" method="POST" action="/api/auth/signin/google">
            <input type="hidden" name="csrfToken" value="${csrfToken}">
            <input type="hidden" name="callbackUrl" value="${callbackUrl}">
          </form>
          <script>
            document.getElementById('googleForm').submit();
          </script>
        </body>
      </html>
    `;
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
    
  } catch (error) {
    console.error('[Google Start] Error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_failed', baseUrl));
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that require admin role - API only
// The /admin page handles its own authentication UI
const ADMIN_API_PATHS = [
  '/api/admin',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  // Skip for auth routes - CRITICAL for NextAuth to work
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Only protect admin API routes
  // The /admin page will show login form if not authenticated
  if (pathname.startsWith('/api/admin')) {
    // Get session token from cookies
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'غير مصرح - يرجى تسجيل الدخول',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    // For API routes with session, let the route handler validate the session
    return NextResponse.next()
  }

  // Allow all other requests (including /admin page)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public|images|KMS%20LOGO%20FINAL.png).*)',
  ],
}

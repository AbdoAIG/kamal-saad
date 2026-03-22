import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit, rateLimits, getRateLimitHeaders, getClientIdentifier } from '@/lib/rate-limit'

// Simple in-memory rate limiting (for production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// Clean up old entries every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestCounts.entries()) {
    if (value.resetTime < now) {
      requestCounts.delete(key)
    }
  }
}, 60000)

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip rate limiting for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Get client identifier
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfIp = request.headers.get('cf-connecting-ip')
  const ip = cfIp || realIp || (forwarded?.split(',')[0]?.trim()) || 'unknown'
  const userAgent = request.headers.get('user-agent') || ''
  const identifier = `${ip}:${userAgent.slice(0, 50)}`

  // Determine rate limit config based on endpoint
  let config = rateLimits.public
  if (pathname.includes('/api/auth/login') || pathname.includes('/api/auth/register')) {
    config = pathname.includes('login') ? rateLimits.login : rateLimits.register
  } else if (pathname.includes('/checkout') || pathname.includes('/api/payment')) {
    config = rateLimits.checkout
  } else if (pathname.startsWith('/api/')) {
    config = rateLimits.api
  }

  const now = Date.now()
  const key = `${identifier}:${pathname}`
  let entry = requestCounts.get(key)

  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + config.interval }
    requestCounts.set(key, entry)
  }

  entry.count++

  // Check if rate limit exceeded
  if (entry.count > config.limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    
    return new NextResponse(
      JSON.stringify({
        error: config.message || 'Too many requests',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          ...getRateLimitHeaders(0, entry.resetTime, config.limit),
        },
      }
    )
  }

  // Add rate limit headers to response
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', config.limit.toString())
  response.headers.set('X-RateLimit-Remaining', (config.limit - entry.count).toString())
  response.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString())

  return response
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match checkout
    '/checkout/:path*',
    // Match auth pages
    '/((?!_next/static|_next/image|favicon.ico|public|images|logo|KMS).*)',
  ],
}

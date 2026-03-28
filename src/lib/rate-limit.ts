/**
 * Rate Limiting System for API Protection
 * Uses in-memory storage with automatic cleanup
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  limit: number;    // Max requests per interval
  message?: string; // Custom error message
}

// Default rate limits for different endpoints
export const rateLimits = {
  // Authentication endpoints - stricter limits
  auth: {
    interval: 60 * 1000, // 1 minute
    limit: 5, // 5 attempts per minute
    message: 'عدد محاولات كثيرة، يرجى المحاولة بعد دقيقة',
  },
  login: {
    interval: 15 * 60 * 1000, // 15 minutes
    limit: 10, // 10 attempts per 15 minutes
    message: 'عدد محاولات تسجيل الدخول كثيرة، يرجى المحاولة بعد 15 دقيقة',
  },
  register: {
    interval: 60 * 60 * 1000, // 1 hour
    limit: 3, // 3 registrations per hour
    message: 'تم الوصول للحد الأقصى من التسجيلات، يرجى المحاولة لاحقاً',
  },
  // API endpoints - moderate limits
  api: {
    interval: 60 * 1000, // 1 minute
    limit: 60, // 60 requests per minute
    message: 'عدد الطلبات كثيرة، يرجى التريث',
  },
  // Public endpoints - higher limits
  public: {
    interval: 60 * 1000, // 1 minute
    limit: 100, // 100 requests per minute
    message: 'عدد الطلبات كثيرة، يرجى التريث',
  },
  // Checkout - moderate limits
  checkout: {
    interval: 60 * 1000, // 1 minute
    limit: 10, // 10 requests per minute
    message: 'عدد طلبات الشراء كثيرة، يرجى المحاولة لاحقاً',
  },
};

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number; message?: string } {
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  // If no entry or expired, create new one
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.interval,
      blocked: false,
    };
    rateLimitStore.set(key, entry);
  }
  
  // Check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      message: config.message || 'Rate limit exceeded',
    };
  }
  
  // Increment count
  entry.count++;
  
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  const ip = cfIp || realIp || (forwarded?.split(',')[0]?.trim()) || 'unknown';
  
  // Also consider user agent for more unique identification
  const userAgent = request.headers.get('user-agent') || '';
  
  // Create a hash-like identifier
  return `${ip}:${userAgent.slice(0, 50)}`;
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number,
  limit: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
  };
}

/**
 * Middleware-like function to apply rate limiting
 */
export function withRateLimit(
  request: Request,
  config: RateLimitConfig
): Response | null {
  const identifier = getClientIdentifier(request);
  const result = checkRateLimit(identifier, config);
  
  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: result.message || 'Too many requests',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          ...getRateLimitHeaders(0, result.resetTime, config.limit),
        },
      }
    );
  }
  
  return null; // Request allowed
}

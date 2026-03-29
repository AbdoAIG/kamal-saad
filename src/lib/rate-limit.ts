/**
 * Rate Limiting System for API Protection
 * Supports both in-memory (development) and Redis (production) backends
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (fallback)
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
  interval: number;
  limit: number;
  message?: string;
}

// Default rate limits for different endpoints
export const rateLimits = {
  auth: {
    interval: 60 * 1000,
    limit: 5,
    message: 'عدد محاولات كثيرة، يرجى المحاولة بعد دقيقة',
  },
  login: {
    interval: 15 * 60 * 1000,
    limit: 10,
    message: 'عدد محاولات تسجيل الدخول كثيرة، يرجى المحاولة بعد 15 دقيقة',
  },
  register: {
    interval: 60 * 60 * 1000,
    limit: 3,
    message: 'تم الوصول للحد الأقصى من التسجيلات، يرجى المحاولة لاحقاً',
  },
  api: {
    interval: 60 * 1000,
    limit: 60,
    message: 'عدد الطلبات كثيرة، يرجى التريث',
  },
  public: {
    interval: 60 * 1000,
    limit: 100,
    message: 'عدد الطلبات كثيرة، يرجى التريث',
  },
  checkout: {
    interval: 60 * 1000,
    limit: 10,
    message: 'عدد طلبات الشراء كثيرة، يرجى المحاولة لاحقاً',
  },
};

/**
 * Check if Redis is available for distributed rate limiting
 */
function isRedisAvailable(): boolean {
  return !!(
    (process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL) &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Redis pipeline for atomic INCR + EXPIRE
 * Uses MULTI/EXEC for true atomicity
 */
async function redisIncr(key: string, ttlSeconds: number): Promise<{ count: number; ttl: number }> {
  const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error('Redis not configured');
  }

  // Use pipeline: MULTI, INCR, EXPIRE, EXEC
  const response = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['MULTI'],
      ['INCR', key],
      ['EXPIRE', key, ttlSeconds.toString()],
      ['EXEC'],
    ]),
  });

  if (!response.ok) {
    throw new Error(`Redis error: ${response.status}`);
  }

  const data = await response.json() as any;

  // Pipeline returns array of results; EXEC result is the last element
  if (data?.result && Array.isArray(data.result)) {
    const execResult = data.result[data.result.length - 1];
    // EXEC returns an array of individual command results
    if (Array.isArray(execResult)) {
      // execResult[0] is the INCR result (count), execResult[1] is EXPIRE result
      const count = typeof execResult[0] === 'object' && execResult[0] !== null
        ? Number((execResult[0] as { result?: number }).result || 0)
        : Number(execResult[0] || 0);

      return {
        count,
        ttl: ttlSeconds,
      };
    }
  }

  throw new Error('Invalid Redis response');
}

/**
 * Check rate limit using Redis (distributed) or in-memory (local)
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number; message?: string }> {
  const key = `ratelimit:${identifier}`;
  const ttlSeconds = Math.ceil(config.interval / 1000);

  // Try Redis first for distributed rate limiting
  if (isRedisAvailable()) {
    try {
      const result = await redisIncr(key, ttlSeconds);

      if (result.count > config.limit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + result.ttl * 1000,
          message: config.message || 'Rate limit exceeded',
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, config.limit - result.count),
        resetTime: Date.now() + result.ttl * 1000,
      };
    } catch (error) {
      // Fall back to in-memory if Redis fails
      console.warn('[RateLimit] Redis rate limit failed, falling back to in-memory:', error);
    }
  }

  // In-memory fallback (original logic)
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + config.interval };
    rateLimitStore.set(key, entry);
  }

  if (entry.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      message: config.message || 'Rate limit exceeded',
    };
  }

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
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');

  const ip = cfIp || realIp || (forwarded?.split(',')[0]?.trim()) || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';

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
 * Middleware-like function to apply rate limiting (async version)
 */
export async function withRateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<Response | null> {
  const identifier = getClientIdentifier(request);
  const result = await checkRateLimit(identifier, config);

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

  return null;
}

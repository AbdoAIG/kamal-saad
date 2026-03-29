/**
 * Redis Cache Utility
 *
 * Uses Upstash Redis for serverless-friendly caching on Vercel
 * Falls back to in-memory cache if Redis is not available
 */

interface CacheOptions {
  ttl?: number // Time to live in seconds
  prefix?: string // Key prefix for namespacing
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// In-memory cache fallback
const memoryCache = new Map<string, CacheEntry<unknown>>()

// Check if Redis is available
const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

/**
 * Simple Redis client for Upstash REST API
 */
async function redisCommand(command: string[]): Promise<unknown> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error('Redis not configured')
  }

  const response = await fetch(`${REDIS_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })

  if (!response.ok) {
    throw new Error(`Redis error: ${response.status}`)
  }

  return response.json()
}

/**
 * Get value from Redis
 */
async function redisGet<T>(key: string): Promise<T | null> {
  try {
    const result = await redisCommand(['GET', key])
    if (result && typeof result === 'object' && 'result' in result) {
      const value = (result as { result: string | null }).result
      if (value) {
        return JSON.parse(value) as T
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Set value in Redis with TTL
 */
async function redisSet(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    await redisCommand(['SETEX', key, ttl.toString(), JSON.stringify(value)])
  } catch (error) {
    console.error('Redis SET error:', error)
  }
}

/**
 * Delete key from Redis
 */
async function redisDel(key: string): Promise<void> {
  try {
    await redisCommand(['DEL', key])
  } catch (error) {
    console.error('Redis DEL error:', error)
  }
}

/**
 * Delete keys by pattern from Redis
 */
async function redisDelPattern(pattern: string): Promise<void> {
  try {
    // Use SCAN to find keys matching pattern
    let cursor = '0'
    do {
      const result = await redisCommand(['SCAN', cursor, 'MATCH', pattern, 'COUNT', '100'])
      if (result && typeof result === 'object' && 'result' in result) {
        const [nextCursor, keys] = (result as { result: [string, string[]] }).result
        cursor = nextCursor
        if (keys.length > 0) {
          await redisCommand(['DEL', ...keys])
        }
        if (cursor === '0') break
      } else {
        break
      }
    } while (cursor !== '0')
  } catch (error) {
    console.error('Redis DEL pattern error:', error)
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return !!(REDIS_URL && REDIS_TOKEN)
}

/**
 * Get value from cache (Redis or in-memory)
 */
export async function cacheGet<T>(
  key: string,
  options?: CacheOptions
): Promise<T | null> {
  const fullKey = options?.prefix ? `${options.prefix}:${key}` : key

  // Try Redis first
  if (isRedisAvailable()) {
    const value = await redisGet<T>(fullKey)
    if (value !== null) {
      return value
    }
  }

  // Fallback to memory cache
  const entry = memoryCache.get(fullKey) as CacheEntry<T> | undefined
  if (entry) {
    const now = Date.now()
    if (now - entry.timestamp < entry.ttl * 1000) {
      return entry.data
    }
    // Expired - remove from cache
    memoryCache.delete(fullKey)
  }

  return null
}

/**
 * Set value in cache
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<void> {
  const ttl = options?.ttl || 300 // Default 5 minutes
  const fullKey = options?.prefix ? `${options.prefix}:${key}` : key

  // Set in Redis
  if (isRedisAvailable()) {
    await redisSet(fullKey, value, ttl)
  }

  // Also set in memory cache as backup
  memoryCache.set(fullKey, {
    data: value,
    timestamp: Date.now(),
    ttl,
  })
}

/**
 * Delete value from cache
 */
export async function cacheDel(key: string, options?: CacheOptions): Promise<void> {
  const fullKey = options?.prefix ? `${options.prefix}:${key}` : key

  // Delete from Redis
  if (isRedisAvailable()) {
    await redisDel(fullKey)
  }

  // Delete from memory cache
  memoryCache.delete(fullKey)
}

/**
 * Delete all keys matching a pattern
 */
export async function cacheDelPattern(pattern: string, options?: CacheOptions): Promise<void> {
  const fullPattern = options?.prefix ? `${options.prefix}:${pattern}` : pattern

  // Delete from Redis
  if (isRedisAvailable()) {
    await redisDelPattern(fullPattern)
  }

  // Delete from memory cache
  for (const key of memoryCache.keys()) {
    if (key.startsWith(options?.prefix ? `${options.prefix}:` : '')) {
      const keyWithoutPrefix = options?.prefix
        ? key.slice(options.prefix.length + 1)
        : key
      if (keyWithoutPrefix.match(pattern.replace(/\*/g, '.*'))) {
        memoryCache.delete(key)
      }
    }
  }
}

/**
 * Get or set cache value with a fetcher function
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  // Try to get from cache
  const cached = await cacheGet<T>(key, options)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetcher()

  // Cache the result
  await cacheSet(key, data, options)

  return data
}

/**
 * Cache key generators for common resources
 */
export const CacheKeys = {
  products: {
    list: (page: number, limit: number, filters?: string) =>
      `products:list:${page}:${limit}:${filters || 'all'}`,
    detail: (id: string) => `products:detail:${id}`,
    byCategory: (categoryId: string, page: number, limit: number) =>
      `products:category:${categoryId}:${page}:${limit}`,
    featured: () => 'products:featured',
    search: (query: string, page: number) =>
      `products:search:${encodeURIComponent(query)}:${page}`,
    advancedSearch: (filters: string) =>
      `products:adv-search:${filters}`,
    suggestions: (query: string) =>
      `products:suggestions:${encodeURIComponent(query)}`,
    trending: () => 'products:trending',
  },
  categories: {
    list: () => 'categories:list',
    detail: (id: string) => `categories:detail:${id}`,
  },
  orders: {
    list: (page: number, status?: string) =>
      `orders:list:${page}:${status || 'all'}`,
    detail: (id: string) => `orders:detail:${id}`,
  },
  dashboard: {
    stats: () => 'dashboard:stats',
    recentOrders: () => 'dashboard:recent-orders',
  },
  settings: {
    all: () => 'settings:all',
    byKey: (key: string) => `settings:${key}`,
  },
}

/**
 * Default TTL values (in seconds)
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  VERY_LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
}

/**
 * Invalidate cache for a specific resource
 */
export async function invalidateCache(resource: 'products' | 'categories' | 'orders' | 'settings' | 'dashboard'): Promise<void> {
  await cacheDelPattern(`${resource}:*`)
}

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Environment detection
const isProduction = process.env.NODE_ENV === 'production'
const isPooler = process.env.DATABASE_URL?.includes('pooler')

// Slow query threshold in milliseconds (only logged in development)
const SLOW_QUERY_THRESHOLD = 200

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: isProduction
      ? [
          { emit: 'stdout', level: 'error' },
        ]
      : [
          { emit: 'stdout', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

  // Log slow queries in development
  if (!isProduction) {
    client.$use(async (params, next) => {
      const start = Date.now()
      const result = await next(params)
      const duration = Date.now() - start
      if (duration > SLOW_QUERY_THRESHOLD) {
        console.warn(
          `[Slow Query] ${params.model}.${params.action} took ${duration}ms`
        )
      }
      return result
    })
  }

  return client
}

// Singleton pattern: reuse client in development to survive HMR,
// create fresh instance in production
export const db = globalForPrisma.prisma ?? createPrismaClient()

if (!isProduction) {
  globalForPrisma.prisma = db
}

// Log pooler mode on startup
if (isPooler) {
  console.log('[DB] Connection pooler mode detected via DATABASE_URL')
}

// Graceful shutdown: disconnect Prisma before the process exits
// to ensure all pending queries are flushed and connections are returned
const shutdown = async () => {
  try {
    await db.$disconnect()
    console.log('[DB] Disconnected from database')
  } catch {
    console.error('[DB] Error during disconnect')
  }
}

if (typeof process !== 'undefined') {
  process.on('beforeExit', shutdown)
  process.on('SIGINT', () => {
    shutdown().finally(() => process.exit(0))
  })
  process.on('SIGTERM', () => {
    shutdown().finally(() => process.exit(0))
  })
}

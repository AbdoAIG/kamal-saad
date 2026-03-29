import { NextResponse } from 'next/server'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
  requestId?: string
  userId?: string
  path?: string
  method?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logs: LogEntry[] = []
  private maxLogs = 1000

  private formatTimestamp(): string {
    return new Date().toISOString()
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL]
    const currentLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO
    return levels.indexOf(level) >= levels.indexOf(currentLevel)
  }

  private log(entry: LogEntry) {
    if (!this.shouldLog(entry.level)) return

    // Store in memory (in production, send to external service)
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console output with colors
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m', // Magenta
    }
    const reset = '\x1b[0m'

    const prefix = `${colors[entry.level]}[${entry.level.toUpperCase()}]${reset}`
    const timestamp = `\x1b[90m${entry.timestamp}\x1b[0m`

    if (this.isDevelopment) {
      console.log(`${timestamp} ${prefix} ${entry.message}`, entry.context || '')
    } else {
      // Production: structured logging
      console.log(JSON.stringify(entry))
    }

    // Send to external service in production
    if (!this.isDevelopment && (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL)) {
      this.sendToExternalService(entry)
    }
  }

  private async sendToExternalService(entry: LogEntry) {
    try {
      // In production, send to Sentry, LogRocket, etc.
      // For now, just store locally
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {})
    } catch {
      // Ignore logging errors
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log({
      timestamp: this.formatTimestamp(),
      level: LogLevel.DEBUG,
      message,
      context,
    })
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log({
      timestamp: this.formatTimestamp(),
      level: LogLevel.INFO,
      message,
      context,
    })
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log({
      timestamp: this.formatTimestamp(),
      level: LogLevel.WARN,
      message,
      context,
    })
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log({
      timestamp: this.formatTimestamp(),
      level: LogLevel.ERROR,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    })
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log({
      timestamp: this.formatTimestamp(),
      level: LogLevel.FATAL,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    })
  }

  // Request logging
  request(method: string, path: string, userId?: string) {
    const requestId = this.generateRequestId()
    this.log({
      timestamp: this.formatTimestamp(),
      level: LogLevel.INFO,
      message: `Request: ${method} ${path}`,
      requestId,
      userId,
      path,
      method,
    })
    return requestId
  }

  // API response logging
  response(requestId: string, statusCode: number, duration: number) {
    this.log({
      timestamp: this.formatTimestamp(),
      level: statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO,
      message: `Response: ${statusCode} (${duration}ms)`,
      requestId,
      context: { statusCode, duration },
    })
  }

  // Get stored logs (for admin panel)
  getLogs(limit = 100): LogEntry[] {
    return this.logs.slice(-limit)
  }

  // Clear logs
  clearLogs() {
    this.logs = []
  }
}

// Export singleton instance
export const logger = new Logger()

// API Route helper with logging
export function withLogging(
  handler: (request: Request) => Promise<NextResponse>,
  routeName: string
) {
  return async (request: Request) => {
    const startTime = Date.now()
    const requestId = logger.request(request.method, routeName)

    try {
      const response = await handler(request)
      const duration = Date.now() - startTime
      logger.response(requestId, response.status, duration)
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(`Error in ${routeName}`, error as Error)
      logger.response(requestId, 500, duration)
      
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 }
      )
    }
  }
}

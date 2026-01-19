/**
 * Structured logging utility
 * In production, this could be extended to send logs to an external service
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: {
    message: string
    stack?: string
  }
}

function formatLog(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    entry.message,
  ]

  if (entry.context && Object.keys(entry.context).length > 0) {
    parts.push(JSON.stringify(entry.context))
  }

  if (entry.error) {
    parts.push(`Error: ${entry.error.message}`)
    if (entry.error.stack && process.env.NODE_ENV === 'development') {
      parts.push(`\n${entry.error.stack}`)
    }
  }

  return parts.join(' ')
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    error: error
      ? {
          message: error.message,
          stack: error.stack,
        }
      : undefined,
  }
}

/**
 * Logger instance with structured logging methods
 */
export const logger = {
  /**
   * Debug level - only logs in development
   */
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      const entry = createLogEntry('debug', message, context)
      console.debug(formatLog(entry))
    }
  },

  /**
   * Info level - general information
   */
  info(message: string, context?: LogContext): void {
    const entry = createLogEntry('info', message, context)
    console.info(formatLog(entry))
  },

  /**
   * Warn level - warnings that don't prevent operation
   */
  warn(message: string, context?: LogContext): void {
    const entry = createLogEntry('warn', message, context)
    console.warn(formatLog(entry))
  },

  /**
   * Error level - errors that need attention
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : undefined
    const entry = createLogEntry('error', message, context, errorObj)
    console.error(formatLog(entry))

    // In production, you could send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  },
}

export default logger

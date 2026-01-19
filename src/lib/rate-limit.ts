/**
 * Simple in-memory LRU-based rate limiter
 * For production, consider using Redis or Upstash
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// LRU cache with max 10000 entries
const cache = new Map<string, RateLimitEntry>()
const MAX_CACHE_SIZE = 10000

function cleanupOldEntries() {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (entry.resetAt < now) {
      cache.delete(key)
    }
  }
}

function evictIfNeeded() {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Delete oldest 10% of entries
    const keysToDelete = Array.from(cache.keys()).slice(0, MAX_CACHE_SIZE * 0.1)
    keysToDelete.forEach((key) => cache.delete(key))
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  limit: number
  /** Time window in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if a request is within rate limits
 * @param identifier - Unique identifier (e.g., userId, IP address)
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = `rate_limit:${identifier}`

  // Periodic cleanup
  if (Math.random() < 0.01) {
    cleanupOldEntries()
    evictIfNeeded()
  }

  const existing = cache.get(key)

  // If no existing entry or window has expired, start fresh
  if (!existing || existing.resetAt < now) {
    const entry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    }
    cache.set(key, entry)
    return {
      success: true,
      remaining: config.limit - 1,
      resetAt: entry.resetAt,
    }
  }

  // Check if over limit
  if (existing.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.resetAt,
    }
  }

  // Increment count
  existing.count++
  cache.set(key, existing)

  return {
    success: true,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /** 5 requests per minute - for invite creation */
  invites: (userId: string) =>
    checkRateLimit(`invites:${userId}`, {
      limit: 5,
      windowMs: 60 * 1000, // 1 minute
    }),

  /** 10 requests per minute - for general API calls */
  api: (userId: string) =>
    checkRateLimit(`api:${userId}`, {
      limit: 10,
      windowMs: 60 * 1000,
    }),

  /** 3 requests per minute - for login attempts */
  auth: (identifier: string) =>
    checkRateLimit(`auth:${identifier}`, {
      limit: 3,
      windowMs: 60 * 1000,
    }),
}

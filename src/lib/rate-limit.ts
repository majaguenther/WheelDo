import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Use Vercel's KV environment variable names (backed by Upstash)
// These are already configured in the Vercel project
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

/**
 * Pre-configured rate limiters for common use cases
 * Uses Upstash Redis for distributed rate limiting (works on serverless)
 */
export const rateLimiters = {
  /** 5 requests per minute - for invite creation */
  invites: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    prefix: 'ratelimit:invites',
    analytics: true, // Enable analytics in Upstash dashboard
  }),

  /** 10 requests per minute - for general API calls */
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'ratelimit:api',
    analytics: true,
  }),

  /** 3 requests per minute - for login attempts */
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'),
    prefix: 'ratelimit:auth',
    analytics: true,
  }),
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

/**
 * Check if a request is within rate limits
 * @param limiter - The rate limiter to use
 * @param identifier - Unique identifier (e.g., userId, IP address)
 * @returns Result indicating if request is allowed
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  const result = await limiter.limit(identifier)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}

/**
 * Get the base URL for the application.
 * Uses Vercel's built-in env vars for automatic configuration.
 *
 * This is in a separate file to avoid importing dynamic modules
 * when used in static contexts like sitemap.ts and robots.ts.
 */
export function getBaseUrl(): string {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

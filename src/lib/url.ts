/**
 * Get the base URL for the application.
 * Handles different environments: local dev, Vercel preview, and production.
 */
export function getBaseUrl(): string {
  // Explicit app URL takes priority
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  // Vercel production URL (custom domain or project production URL)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  // Fallback to deployment URL (preview deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

/**
 * Get the RP ID (domain without protocol/port) for WebAuthn/passkey configuration.
 */
export function getRpId(): string {
  const url = getBaseUrl()
  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch {
    return 'localhost'
  }
}

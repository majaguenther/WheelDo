import 'server-only'

/**
 * Fetch an external image and convert to base64 data URL.
 * Returns null if fetch fails (allows graceful fallback to initials avatar).
 *
 * This is necessary because Satori (used by ImageResponse) must fetch external
 * URLs during rendering. If the external URL is slow, blocked, or fails,
 * the entire ImageResponse fails with 500. By pre-fetching and converting
 * to base64, we avoid I/O during the render phase.
 */
export async function fetchImageAsBase64(url: string | null): Promise<string | null> {
  if (!url) return null

  try {
    const response = await fetch(url, {
      // Short timeout to prevent hanging
      signal: AbortSignal.timeout(3000),
    })

    if (!response.ok) return null

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const contentType = response.headers.get('content-type') || 'image/png'

    return `data:${contentType};base64,${base64}`
  } catch {
    // Log error but don't throw - allow fallback to initials
    console.warn('Failed to fetch avatar image:', url)
    return null
  }
}

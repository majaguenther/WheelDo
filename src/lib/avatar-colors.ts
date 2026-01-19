/**
 * A curated palette of distinct, accessible colors for avatars
 * These colors are chosen to have good contrast with white text
 */
const AVATAR_COLORS = [
  '#e11d48', // rose-600
  '#c026d3', // fuchsia-600
  '#7c3aed', // violet-600
  '#2563eb', // blue-600
  '#0891b2', // cyan-600
  '#059669', // emerald-600
  '#65a30d', // lime-600
  '#ca8a04', // yellow-600
  '#ea580c', // orange-600
  '#dc2626', // red-600
  '#4f46e5', // indigo-600
  '#0d9488', // teal-600
] as const

/**
 * DJB2 hash algorithm - simple and well-distributed
 */
function djb2Hash(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Get a deterministic avatar color based on user's name or email
 * The color will always be the same for the same input
 */
export function getAvatarColor(name: string | null | undefined, email: string): string {
  // Use name if available, otherwise email
  const input = (name || email).toLowerCase().trim()
  const hash = djb2Hash(input)
  const index = hash % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

/**
 * Get initials from a name or email
 * Examples:
 * - "John Doe" -> "JD"
 * - "john.doe@example.com" -> "JD"
 * - "john" -> "JO"
 * - "j" -> "J"
 */
export function getInitials(name: string | null | undefined, email: string): string {
  const input = name || email.split('@')[0]
  const trimmed = input.trim()

  if (!trimmed) {
    return '?'
  }

  // Split by common separators
  const parts = trimmed.split(/[\s._-]+/).filter(Boolean)

  if (parts.length >= 2) {
    // Take first letter of first and last parts
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  if (parts.length === 1 && parts[0].length >= 2) {
    // Take first two letters
    return parts[0].slice(0, 2).toUpperCase()
  }

  // Single character
  return parts[0]?.[0]?.toUpperCase() || '?'
}

/**
 * Get both color and initials for a user
 */
export function getAvatarProps(user: { name?: string | null; email: string }) {
  return {
    color: getAvatarColor(user.name, user.email),
    initials: getInitials(user.name, user.email),
  }
}

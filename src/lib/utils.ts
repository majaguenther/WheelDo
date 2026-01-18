import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return ''

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

/**
 * Parse duration string to minutes
 */
export function parseDuration(duration: string): number | null {
  const trimmed = duration.trim().toLowerCase()

  // Match patterns like "30", "30m", "30 min", "1h", "1h 30m", "1.5h"
  const hoursMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*h/)
  const minutesMatch = trimmed.match(/(\d+)\s*(?:m|min)?(?:\s|$)/)

  let totalMinutes = 0

  if (hoursMatch) {
    totalMinutes += parseFloat(hoursMatch[1]) * 60
  }

  if (minutesMatch && !hoursMatch) {
    totalMinutes += parseInt(minutesMatch[1], 10)
  } else if (minutesMatch && hoursMatch) {
    // If we have both, the minutes part comes after hours
    const minsAfterHours = trimmed.match(/h\s*(\d+)/)
    if (minsAfterHours) {
      totalMinutes += parseInt(minsAfterHours[1], 10)
    }
  }

  return totalMinutes > 0 ? Math.round(totalMinutes) : null
}

/**
 * Get deadline urgency color based on how close the deadline is
 */
export function getDeadlineColor(deadline: Date | null | undefined): string | null {
  if (!deadline) return null

  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  const hoursRemaining = diff / (1000 * 60 * 60)

  if (hoursRemaining < 0) {
    return 'text-red-600 bg-red-50' // Overdue
  }
  if (hoursRemaining < 24) {
    return 'text-red-500 bg-red-50' // Less than 24 hours
  }
  if (hoursRemaining < 72) {
    return 'text-orange-500 bg-orange-50' // Less than 3 days
  }
  if (hoursRemaining < 168) {
    return 'text-yellow-500 bg-yellow-50' // Less than a week
  }

  return null
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const absDiff = Math.abs(diff)

  const minutes = Math.floor(absDiff / (1000 * 60))
  const hours = Math.floor(absDiff / (1000 * 60 * 60))
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))

  const isPast = diff < 0
  const prefix = isPast ? '' : 'in '
  const suffix = isPast ? ' ago' : ''

  if (minutes < 1) {
    return 'just now'
  }
  if (minutes < 60) {
    return `${prefix}${minutes}m${suffix}`
  }
  if (hours < 24) {
    return `${prefix}${hours}h${suffix}`
  }
  if (days < 7) {
    return `${prefix}${days}d${suffix}`
  }

  return date.toLocaleDateString()
}

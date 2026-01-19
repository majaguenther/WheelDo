import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Cron endpoint to clean up expired data
 * Vercel cron jobs hit this endpoint on a schedule
 *
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */

// Verify the request is from Vercel Cron
function isValidCronRequest(request: NextRequest): boolean {
  // In production, verify the cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // If CRON_SECRET is set, require it
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`
  }

  // In development, allow unauthenticated requests
  return process.env.NODE_ENV === 'development'
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  if (!isValidCronRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const now = new Date()

    // Delete expired task invites
    const deletedInvites = await db.taskInvite.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    })

    // Delete old read notifications (older than 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const deletedNotifications = await db.notification.deleteMany({
      where: {
        read: true,
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    })

    // Delete orphaned session data (older than 30 days)
    // This depends on your auth setup - adjust as needed

    return NextResponse.json({
      success: true,
      cleaned: {
        expiredInvites: deletedInvites.count,
        oldNotifications: deletedNotifications.count,
      },
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Cron cleanup failed:', error)
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}

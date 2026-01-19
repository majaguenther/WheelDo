import { NextRequest, NextResponse } from 'next/server'
import { getNotifications, getUnreadCount } from '@/data/notifications'
import { markNotificationsRead, markAllNotificationsRead } from '@/actions/notifications'
import { getCurrentUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const countOnly = searchParams.get('countOnly') === 'true'

    if (countOnly) {
      const count = await getUnreadCount()
      return NextResponse.json({ count })
    }

    const notifications = await getNotifications({ limit, unreadOnly })
    const unreadCount = await getUnreadCount()

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ids, markAll } = await request.json()

    if (markAll) {
      const result = await markAllNotificationsRead()
      if (!result.success) {
        return NextResponse.json({ error: result.error.message }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    const result = await markNotificationsRead({ notificationIds: ids })
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark notifications as read:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}

import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-server'
import type { NotificationDTO } from './dto/notification.dto'

// Re-export the DTO type for convenience
export type { NotificationDTO } from './dto/notification.dto'

/**
 * Get notifications for current user
 */
export const getNotifications = cache(
  async (options: { unreadOnly?: boolean; limit?: number } = {}): Promise<NotificationDTO[]> => {
    const user = await getCurrentUser()
    if (!user) return []

    const { unreadOnly = false, limit = 50 } = options

    const notifications = await db.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly && { read: false }),
      },
      include: {
        task: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      taskId: n.taskId,
      taskTitle: n.task?.title ?? null,
      createdAt: n.createdAt,
    }))
  }
)

/**
 * Get unread notification count
 */
export const getUnreadCount = cache(async (): Promise<number> => {
  const user = await getCurrentUser()
  if (!user) return 0

  return db.notification.count({
    where: {
      userId: user.id,
      read: false,
    },
  })
})

/**
 * Check if notification belongs to current user
 */
export const isNotificationOwner = cache(async (notificationId: string): Promise<boolean> => {
  const user = await getCurrentUser()
  if (!user) return false

  const notification = await db.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true },
  })

  return notification?.userId === user.id
})

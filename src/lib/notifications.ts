import 'server-only'
import { db } from './db'
import type { NotificationType } from '@/generated/prisma/client'

/**
 * Create a notification for a user
 */
export async function createNotification(data: {
  userId: string
  type: NotificationType
  title: string
  message: string
  taskId?: string
}) {
  return db.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      taskId: data.taskId,
    },
  })
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: {
      userId,
      read: false,
    },
  })
}

/**
 * Get notifications for a user with pagination
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
  }
) {
  const { limit = 20, offset = 0, unreadOnly = false } = options || {}

  return db.notification.findMany({
    where: {
      userId,
      ...(unreadOnly && { read: false }),
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

/**
 * Mark notifications as read
 */
export async function markAsRead(userId: string, notificationIds: string[]) {
  return db.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId, // Ensure user owns these notifications
    },
    data: { read: true },
  })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  return db.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: { read: true },
  })
}

/**
 * Delete old notifications (older than 30 days)
 */
export async function cleanupOldNotifications() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return db.notification.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      read: true,
    },
  })
}

/**
 * Notify all collaborators about an event on a task
 */
export async function notifyCollaborators(
  taskId: string,
  excludeUserId: string,
  notification: {
    type: NotificationType
    title: string
    message: string
  }
) {
  // Get task with owner and collaborators
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      userId: true,
      collaborators: {
        select: { userId: true },
      },
    },
  })

  if (!task) {
    return
  }

  // Collect all user IDs to notify (owner + collaborators, excluding the actor)
  const userIds = new Set<string>()
  if (task.userId !== excludeUserId) {
    userIds.add(task.userId)
  }
  for (const collab of task.collaborators) {
    if (collab.userId !== excludeUserId) {
      userIds.add(collab.userId)
    }
  }

  // Create notifications for all
  if (userIds.size > 0) {
    await db.notification.createMany({
      data: Array.from(userIds).map((userId) => ({
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        taskId,
      })),
    })
  }
}

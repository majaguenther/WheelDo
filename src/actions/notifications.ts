'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-server'
import {
  ActionError,
  withActionErrorHandling,
  type ActionResult,
} from '@/core/errors/action-error'
import {
  notificationIdSchema,
  markNotificationsReadSchema,
} from '@/core/validation/schemas'

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(
  notificationId: unknown
): Promise<ActionResult<{ success: true }>> {
  return withActionErrorHandling(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new ActionError('UNAUTHORIZED', 'Authentication required')
    }

    const validatedId = notificationIdSchema.safeParse(notificationId)
    if (!validatedId.success) {
      throw new ActionError('VALIDATION_ERROR', 'Invalid notification ID')
    }

    // Check ownership and update
    const notification = await db.notification.findFirst({
      where: { id: validatedId.data, userId: user.id },
    })
    if (!notification) {
      throw new ActionError('NOT_FOUND', 'Notification not found')
    }

    await db.notification.update({
      where: { id: validatedId.data },
      data: { read: true },
    })

    // Notifications are polled client-side, no path revalidation needed

    return { success: true }
  })
}

/**
 * Mark multiple notifications as read
 */
export async function markNotificationsRead(
  input: unknown
): Promise<ActionResult<{ success: true; count: number }>> {
  return withActionErrorHandling(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new ActionError('UNAUTHORIZED', 'Authentication required')
    }

    const result = markNotificationsReadSchema.safeParse(input)
    if (!result.success) {
      throw new ActionError('VALIDATION_ERROR', 'Invalid input', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const { notificationIds } = result.data

    const updateResult = await db.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: user.id, // Only update user's own notifications
      },
      data: { read: true },
    })

    // Notifications are polled client-side, no path revalidation needed

    return { success: true, count: updateResult.count }
  })
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<ActionResult<{ success: true; count: number }>> {
  return withActionErrorHandling(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new ActionError('UNAUTHORIZED', 'Authentication required')
    }

    const updateResult = await db.notification.updateMany({
      where: {
        userId: user.id,
        read: false,
      },
      data: { read: true },
    })

    // Notifications are polled client-side, no path revalidation needed

    return { success: true, count: updateResult.count }
  })
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: unknown
): Promise<ActionResult<{ success: true }>> {
  return withActionErrorHandling(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new ActionError('UNAUTHORIZED', 'Authentication required')
    }

    const validatedId = notificationIdSchema.safeParse(notificationId)
    if (!validatedId.success) {
      throw new ActionError('VALIDATION_ERROR', 'Invalid notification ID')
    }

    // Check ownership
    const notification = await db.notification.findFirst({
      where: { id: validatedId.data, userId: user.id },
    })
    if (!notification) {
      throw new ActionError('NOT_FOUND', 'Notification not found')
    }

    await db.notification.delete({ where: { id: validatedId.data } })

    // Notifications are polled client-side, no path revalidation needed

    return { success: true }
  })
}

/**
 * Delete all read notifications
 */
export async function deleteReadNotifications(): Promise<ActionResult<{ success: true; count: number }>> {
  return withActionErrorHandling(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new ActionError('UNAUTHORIZED', 'Authentication required')
    }

    const deleteResult = await db.notification.deleteMany({
      where: {
        userId: user.id,
        read: true,
      },
    })

    // Notifications are polled client-side, no path revalidation needed

    return { success: true, count: deleteResult.count }
  })
}

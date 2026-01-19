import { z } from 'zod'

/**
 * Notification ID validation schema
 */
export const notificationIdSchema = z.string().cuid('Invalid notification ID')

/**
 * Notification IDs array schema
 */
export const notificationIdsSchema = z.array(notificationIdSchema).min(1, 'At least one notification ID required')

/**
 * Mark notifications read input
 */
export const markNotificationsReadSchema = z.object({
  notificationIds: notificationIdsSchema,
})

export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>

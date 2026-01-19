import type { NotificationType } from '@/generated/prisma/client'

/**
 * Notification DTO - safe to import on both client and server
 */
export interface NotificationDTO {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  taskId: string | null
  taskTitle: string | null
  createdAt: Date
}

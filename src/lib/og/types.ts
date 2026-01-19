// Re-export Prisma types for OG usage
import type { Urgency, Effort } from '@/generated/prisma/client'
export type { Urgency, Effort }

// OG-specific data types
export type InviteOGData = {
  taskTitle: string
  inviterName: string
  inviterImage: string | null
  canEdit: boolean
  expired: boolean
}

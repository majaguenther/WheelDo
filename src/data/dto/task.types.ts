import type { Urgency, Effort, TaskStatus, RecurrenceType } from '@/generated/prisma/client'
import type { CategoryDTO } from './category.types'
import type { UserDTO } from './user.types'

export type TaskRole = 'owner' | 'editor' | 'viewer'

/**
 * Location DTO - structured location data
 */
export interface TaskLocationDTO {
  formatted: string | null
  lat: number | null
  lon: number | null
  city: string | null
  country: string | null
  placeId: string | null
}

/**
 * Child task DTO - minimal info for nested display
 */
export interface ChildTaskDTO {
  id: string
  title: string
  status: TaskStatus
  urgency: Urgency
}

/**
 * Task DTO - safe public representation with permission filtering
 */
export interface TaskDTO {
  id: string
  title: string
  body: string | null
  status: TaskStatus
  urgency: Urgency
  effort: Effort
  duration: number | null
  deadline: Date | null
  location: TaskLocationDTO | null
  recurrenceType: RecurrenceType
  completedAt: Date | null
  position: number
  categoryId: string | null
  category: CategoryDTO | null
  parentId: string | null
  children: ChildTaskDTO[]
  collaboratorCount: number
  role: TaskRole
  canEdit: boolean
  owner: UserDTO
  createdAt: Date
  updatedAt: Date
}

/**
 * Collaborator with user details
 */
export interface CollaboratorDTO {
  id: string
  user: UserDTO
  canEdit: boolean
}

/**
 * Task with full details including collaborators
 */
export interface TaskDetailDTO extends TaskDTO {
  collaborators: CollaboratorDTO[]
  parent: { id: string; title: string } | null
}

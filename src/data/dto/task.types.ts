import type { Urgency, Effort, TaskStatus } from '@/generated/prisma/client'
import type { CategoryDTO } from './category.types'
import type { UserDTO } from './user.types'

export type TaskRole = 'owner' | 'editor' | 'viewer'

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
  location: string | null
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
 * Task with full details including collaborators
 */
export interface TaskDetailDTO extends TaskDTO {
  collaborators: Array<UserDTO & { canEdit: boolean }>
  parent: { id: string; title: string } | null
}

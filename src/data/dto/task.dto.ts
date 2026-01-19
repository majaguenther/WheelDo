import 'server-only'
import type {
  Task,
  Category,
  User,
  TaskCollaborator,
  Urgency,
  Effort,
  TaskStatus,
} from '@/generated/prisma/client'
import { toCategoryDTO, type CategoryDTO } from './category.dto'
import { toUserDTO, type UserDTO } from './user.dto'

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

type TaskWithRelations = Task & {
  category: Category | null
  children: Task[]
  collaborators: (TaskCollaborator & { user: Pick<User, 'id' | 'name' | 'email' | 'image'> })[]
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>
  parent?: Task | null
}

/**
 * Determine user's role on a task
 */
function getUserRole(
  task: { userId: string; collaborators: { userId: string; canEdit: boolean }[] },
  viewerId: string
): TaskRole | null {
  if (task.userId === viewerId) {
    return 'owner'
  }

  const collaborator = task.collaborators.find((c) => c.userId === viewerId)
  if (collaborator) {
    return collaborator.canEdit ? 'editor' : 'viewer'
  }

  return null
}

/**
 * Check if user can view the task
 */
export function canViewTask(
  task: { userId: string; collaborators: { userId: string; canEdit: boolean }[] },
  viewerId: string
): boolean {
  return getUserRole(task, viewerId) !== null
}

/**
 * Convert Task to DTO with permission filtering
 * Returns null if viewer doesn't have access
 */
export function toTaskDTO(task: TaskWithRelations, viewerId: string): TaskDTO | null {
  const role = getUserRole(task, viewerId)

  if (!role) {
    return null // User cannot see this task
  }

  return {
    id: task.id,
    title: task.title,
    body: task.body,
    status: task.status,
    urgency: task.urgency,
    effort: task.effort,
    duration: task.duration,
    deadline: task.deadline,
    location: task.location,
    completedAt: task.completedAt,
    position: task.position,
    categoryId: task.categoryId,
    category: task.category ? toCategoryDTO(task.category) : null,
    parentId: task.parentId,
    children: task.children.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      urgency: c.urgency,
    })),
    collaboratorCount: task.collaborators.length,
    role,
    canEdit: role === 'owner' || role === 'editor',
    owner: toUserDTO(task.user),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}

/**
 * Convert Task to DetailDTO with full collaborator info
 */
export function toTaskDetailDTO(task: TaskWithRelations, viewerId: string): TaskDetailDTO | null {
  const baseDTO = toTaskDTO(task, viewerId)

  if (!baseDTO) {
    return null
  }

  return {
    ...baseDTO,
    collaborators: task.collaborators.map((c) => ({
      ...toUserDTO(c.user),
      canEdit: c.canEdit,
    })),
    parent: task.parent ? { id: task.parent.id, title: task.parent.title } : null,
  }
}

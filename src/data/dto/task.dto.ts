import 'server-only'
import type { Task, Category, User, TaskCollaborator } from '@/generated/prisma/client'
import { toCategoryDTO } from './category.dto'
import { toUserDTO } from './user.dto'

// Re-export types from the client-safe types file
export type { TaskRole, ChildTaskDTO, TaskDTO, TaskDetailDTO } from './task.types'
import type { TaskDTO, TaskDetailDTO, TaskRole } from './task.types'

type TaskWithRelations = Task & {
  category: Category | null
  children: Task[]
  collaborators: (TaskCollaborator & { user: Pick<User, 'id' | 'name' | 'email' | 'image'> })[]
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>
  parent?: Task | { id: string; title: string } | null
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
    recurrenceType: task.recurrenceType,
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
      id: c.id,
      user: toUserDTO(c.user),
      canEdit: c.canEdit,
    })),
    parent: task.parent ? { id: task.parent.id, title: task.parent.title } : null,
  }
}

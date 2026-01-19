import 'server-only'
import { db } from './db'

export type TaskRole = 'owner' | 'editor' | 'viewer' | null

/**
 * Get the user's role on a specific task
 */
export async function getTaskRole(userId: string, taskId: string): Promise<TaskRole> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      userId: true,
      collaborators: {
        where: { userId },
        select: { canEdit: true },
      },
    },
  })

  if (!task) {
    return null
  }

  // Check if user is the owner
  if (task.userId === userId) {
    return 'owner'
  }

  // Check if user is a collaborator
  const collaborator = task.collaborators[0]
  if (collaborator) {
    return collaborator.canEdit ? 'editor' : 'viewer'
  }

  return null
}

/**
 * Check if user can view the task (owner, editor, or viewer)
 */
export async function canViewTask(userId: string, taskId: string): Promise<boolean> {
  const role = await getTaskRole(userId, taskId)
  return role !== null
}

/**
 * Check if user can edit the task (owner or editor)
 */
export async function canEditTask(userId: string, taskId: string): Promise<boolean> {
  const role = await getTaskRole(userId, taskId)
  return role === 'owner' || role === 'editor'
}

/**
 * Check if user is the task owner
 */
export async function isTaskOwner(userId: string, taskId: string): Promise<boolean> {
  const role = await getTaskRole(userId, taskId)
  return role === 'owner'
}

/**
 * Authorization helper that throws if user doesn't have required permission
 */
export async function requireTaskPermission(
  userId: string,
  taskId: string,
  permission: 'view' | 'edit' | 'owner'
): Promise<TaskRole> {
  const role = await getTaskRole(userId, taskId)

  if (role === null) {
    throw new Error('Task not found or access denied')
  }

  const hasPermission =
    permission === 'view' ||
    (permission === 'edit' && (role === 'owner' || role === 'editor')) ||
    (permission === 'owner' && role === 'owner')

  if (!hasPermission) {
    throw new Error(
      permission === 'owner'
        ? 'Only the task owner can perform this action'
        : 'You do not have permission to edit this task'
    )
  }

  return role
}

/**
 * Get task with authorization check
 */
export async function getTaskWithAuth(userId: string, taskId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      category: true,
      parent: true,
      children: {
        include: {
          category: true,
          children: true,
        },
      },
      collaborators: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  if (!task) {
    return null
  }

  // Check if user has access
  const isOwner = task.userId === userId
  const collaborator = task.collaborators.find((c) => c.userId === userId)

  if (!isOwner && !collaborator) {
    return null
  }

  const role: TaskRole = isOwner ? 'owner' : collaborator?.canEdit ? 'editor' : 'viewer'

  return {
    ...task,
    role,
  }
}

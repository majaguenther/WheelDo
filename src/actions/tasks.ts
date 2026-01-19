'use server'

import { revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/data/auth'
import { canEditTask, isTaskOwner } from '@/data/tasks'
import {
  ActionError,
  actionError,
  withActionErrorHandling,
  type ActionResult,
} from '@/core/errors/action-error'
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  taskIdSchema,
} from '@/core/validation/schemas'

/**
 * Create a new task
 */
export async function createTask(input: unknown): Promise<ActionResult<{ taskId: string }>> {
  return withActionErrorHandling(async () => {
    // 1. Always re-authenticate in every Server Action
    const user = await getCurrentUser()
    if (!user) {
      throw new ActionError('UNAUTHORIZED', 'Authentication required')
    }

    // 2. Validate ALL input with Zod
    const result = createTaskSchema.safeParse(input)
    if (!result.success) {
      throw new ActionError('VALIDATION_ERROR', 'Invalid input', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validated = result.data

    // 3. Verify parentId belongs to user (if provided)
    if (validated.parentId) {
      const parentTask = await db.task.findFirst({
        where: {
          id: validated.parentId,
          OR: [
            { userId: user.id },
            { collaborators: { some: { userId: user.id, canEdit: true } } },
          ],
        },
      })
      if (!parentTask) {
        throw new ActionError('FORBIDDEN', 'Invalid parent task')
      }
    }

    // 4. Verify categoryId belongs to user (if provided)
    if (validated.categoryId) {
      const category = await db.category.findFirst({
        where: { id: validated.categoryId, userId: user.id },
      })
      if (!category) {
        throw new ActionError('FORBIDDEN', 'Invalid category')
      }
    }

    // 5. Create task
    const task = await db.task.create({
      data: {
        title: validated.title,
        body: validated.body,
        duration: validated.duration,
        location: validated.location,
        effort: validated.effort,
        urgency: validated.urgency,
        deadline: validated.deadline ? new Date(validated.deadline) : null,
        categoryId: validated.categoryId,
        parentId: validated.parentId,
        userId: user.id,
      },
    })

    // 6. Revalidate cache
    revalidateTag('tasks', 'max')

    return { taskId: task.id }
  })
}

/**
 * Update an existing task
 */
export async function updateTask(
  taskId: unknown,
  input: unknown
): Promise<ActionResult<{ taskId: string }>> {
  return withActionErrorHandling(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new ActionError('UNAUTHORIZED', 'Authentication required')
    }

    // Validate taskId
    const validatedId = taskIdSchema.safeParse(taskId)
    if (!validatedId.success) {
      throw new ActionError('VALIDATION_ERROR', 'Invalid task ID')
    }

    // Validate input
    const result = updateTaskSchema.safeParse(input)
    if (!result.success) {
      throw new ActionError('VALIDATION_ERROR', 'Invalid input', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validated = result.data

    // Check authorization (owner or editor)
    const canEdit = await canEditTask(validatedId.data)
    if (!canEdit) {
      throw new ActionError('NOT_FOUND', 'Task not found or access denied')
    }

    // Only owners can change certain fields
    const isOwner = await isTaskOwner(validatedId.data)
    if (!isOwner && (validated.categoryId !== undefined || validated.parentId !== undefined)) {
      throw new ActionError('FORBIDDEN', 'Only owners can change category or parent')
    }

    // Verify categoryId if provided
    if (validated.categoryId) {
      const category = await db.category.findFirst({
        where: { id: validated.categoryId, userId: user.id },
      })
      if (!category) {
        throw new ActionError('FORBIDDEN', 'Invalid category')
      }
    }

    // Verify parentId if provided
    if (validated.parentId) {
      const parentTask = await db.task.findFirst({
        where: {
          id: validated.parentId,
          OR: [
            { userId: user.id },
            { collaborators: { some: { userId: user.id, canEdit: true } } },
          ],
        },
      })
      if (!parentTask) {
        throw new ActionError('FORBIDDEN', 'Invalid parent task')
      }
    }

    // Update task
    await db.task.update({
      where: { id: validatedId.data },
      data: {
        ...validated,
        deadline: validated.deadline ? new Date(validated.deadline) : validated.deadline,
      },
    })

    revalidateTag('tasks', 'max')

    return { taskId: validatedId.data }
  })
}

/**
 * Update task status
 */
export async function updateTaskStatus(input: unknown): Promise<ActionResult<{ success: true }>> {
  return withActionErrorHandling(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new ActionError('UNAUTHORIZED', 'Authentication required')
    }

    const result = updateTaskStatusSchema.safeParse(input)
    if (!result.success) {
      throw new ActionError('VALIDATION_ERROR', 'Invalid input')
    }

    const { taskId, status } = result.data

    // Check authorization (owner or editor)
    const canEdit = await canEditTask(taskId)
    if (!canEdit) {
      throw new ActionError('NOT_FOUND', 'Task not found or access denied')
    }

    // If starting a task, ensure no other task is in progress
    if (status === 'IN_PROGRESS') {
      const existingInProgress = await db.task.findFirst({
        where: {
          OR: [{ userId: user.id }, { collaborators: { some: { userId: user.id } } }],
          status: 'IN_PROGRESS',
          id: { not: taskId },
        },
      })

      if (existingInProgress) {
        throw new ActionError(
          'CONFLICT',
          'Another task is already in progress. Please complete or defer it first.'
        )
      }
    }

    // Update task
    await db.task.update({
      where: { id: taskId },
      data: {
        status,
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
        ...(status !== 'COMPLETED' && { completedAt: null }),
      },
    })

    revalidateTag('tasks', 'max')

    return { success: true }
  })
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: unknown): Promise<ActionResult<{ success: true }>> {
  return withActionErrorHandling(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new ActionError('UNAUTHORIZED', 'Authentication required')
    }

    const validatedId = taskIdSchema.safeParse(taskId)
    if (!validatedId.success) {
      throw new ActionError('VALIDATION_ERROR', 'Invalid task ID')
    }

    // Only owners can delete
    const isOwner = await isTaskOwner(validatedId.data)
    if (!isOwner) {
      throw new ActionError('NOT_FOUND', 'Task not found')
    }

    await db.task.delete({ where: { id: validatedId.data } })

    revalidateTag('tasks', 'max')

    return { success: true }
  })
}

/**
 * Defer a task (move back to pending)
 */
export async function deferTask(taskId: unknown): Promise<ActionResult<{ success: true }>> {
  return updateTaskStatus({ taskId, status: 'PENDING' })
}

/**
 * Start a task
 */
export async function startTask(taskId: unknown): Promise<ActionResult<{ success: true }>> {
  const validatedId = taskIdSchema.safeParse(taskId)
  if (!validatedId.success) {
    return actionError('VALIDATION_ERROR', 'Invalid task ID')
  }
  return updateTaskStatus({ taskId: validatedId.data, status: 'IN_PROGRESS' })
}

/**
 * Complete a task
 */
export async function completeTask(taskId: unknown): Promise<ActionResult<{ success: true }>> {
  const validatedId = taskIdSchema.safeParse(taskId)
  if (!validatedId.success) {
    return actionError('VALIDATION_ERROR', 'Invalid task ID')
  }
  return updateTaskStatus({ taskId: validatedId.data, status: 'COMPLETED' })
}

/**
 * Revert a completed task to pending
 */
export async function revertTask(taskId: unknown): Promise<ActionResult<{ success: true }>> {
  const validatedId = taskIdSchema.safeParse(taskId)
  if (!validatedId.success) {
    return actionError('VALIDATION_ERROR', 'Invalid task ID')
  }
  return updateTaskStatus({ taskId: validatedId.data, status: 'PENDING' })
}

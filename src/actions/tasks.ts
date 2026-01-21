'use server'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-server'
import { canEditTask, isTaskOwner } from '@/data/tasks'
import {
  ActionError,
  actionError,
  withActionErrorHandling,
  type ActionResult,
} from '@/core/errors/action-error'
import { toActionState, type ActionState } from '@/core/errors/action-state'
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

    // 3. Verify parentId belongs to user and validate hierarchy (if provided)
    if (validated.parentId) {
      const parentTask = await db.task.findFirst({
        where: {
          id: validated.parentId,
          OR: [
            { userId: user.id },
            { collaborators: { some: { userId: user.id, canEdit: true } } },
          ],
        },
        select: { parentId: true },
      })
      if (!parentTask) {
        throw new ActionError('FORBIDDEN', 'Invalid parent task')
      }

      // Prevent assigning a task that already has a parent (no multi-level nesting)
      if (parentTask.parentId !== null) {
        throw new ActionError(
          'VALIDATION_ERROR',
          'Cannot assign a subtask as a parent. Only root-level tasks can be parents.'
        )
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

    // 5. Block recurrence if being added as subtask
    if (validated.parentId && validated.recurrenceType && validated.recurrenceType !== 'NONE') {
      throw new ActionError(
        'VALIDATION_ERROR',
        'Subtasks cannot have recurrence enabled'
      )
    }

    // 6. Create task
    const task = await db.task.create({
      data: {
        title: validated.title,
        body: validated.body,
        duration: validated.duration,
        locationFormatted: validated.locationFormatted,
        locationLat: validated.locationLat,
        locationLon: validated.locationLon,
        locationCity: validated.locationCity,
        locationCountry: validated.locationCountry,
        locationPlaceId: validated.locationPlaceId,
        effort: validated.effort,
        urgency: validated.urgency,
        deadline: validated.deadline ? new Date(validated.deadline) : null,
        categoryId: validated.categoryId,
        parentId: validated.parentId,
        recurrenceType: validated.recurrenceType,
        userId: user.id,
      },
    })

    // 7. Revalidate cache
    revalidateTag(`tasks:${user.id}`, 'max')

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

    // If parentId is being set, validate strictly
    if (validated.parentId !== undefined) {
      if (validated.parentId === validatedId.data) {
        throw new ActionError('VALIDATION_ERROR', 'Task cannot be its own parent')
      }

      if (validated.parentId !== null) {
        const parentTask = await db.task.findFirst({
          where: {
            id: validated.parentId,
            OR: [
              { userId: user.id },
              { collaborators: { some: { userId: user.id, canEdit: true } } },
            ],
          },
          select: { parentId: true },
        })
        if (!parentTask) {
          throw new ActionError('FORBIDDEN', 'Invalid parent task')
        }

        // Prevent assigning a task that already has a parent (no multi-level nesting)
        if (parentTask.parentId !== null) {
          throw new ActionError(
            'VALIDATION_ERROR',
            'Cannot assign a subtask as a parent. Only root-level tasks can be parents.'
          )
        }
      }
    }

    // If recurrence is being set, check for children
    if (validated.recurrenceType && validated.recurrenceType !== 'NONE') {
      const taskWithChildren = await db.task.findUnique({
        where: { id: validatedId.data },
        select: { children: { select: { id: true } }, parentId: true },
      })

      // Block recurrence on tasks with children
      if (taskWithChildren?.children && taskWithChildren.children.length > 0) {
        throw new ActionError(
          'VALIDATION_ERROR',
          'Tasks with subtasks cannot have recurrence enabled'
        )
      }

      // Block recurrence if task has a parent (is a subtask)
      if (taskWithChildren?.parentId !== null) {
        throw new ActionError(
          'VALIDATION_ERROR',
          'Subtasks cannot have recurrence enabled'
        )
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

    revalidateTag(`tasks:${user.id}`, 'max')

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

    // Block starting or completing tasks with incomplete children
    if (status === 'IN_PROGRESS' || status === 'COMPLETED') {
      const task = await db.task.findUnique({
        where: { id: taskId },
        include: { children: { select: { status: true } } },
      })

      if (task?.children && task.children.length > 0) {
        const hasIncompleteChildren = task.children.some((c) => c.status !== 'COMPLETED')
        if (hasIncompleteChildren) {
          throw new ActionError(
            'CONFLICT',
            'Complete all subtasks first before starting or completing this task.'
          )
        }
      }
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

    revalidateTag(`tasks:${user.id}`, 'max')

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

    revalidateTag(`tasks:${user.id}`, 'max')

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

// =============================================================================
// FormData-based Server Actions for useActionState / form action pattern
// =============================================================================

/**
 * Create a new task via FormData (for use with form action)
 */
export async function createTaskFormAction(
  _prevState: ActionState<{ taskId: string }>,
  formData: FormData
): Promise<ActionState<{ taskId: string }>> {
  const input = {
    title: formData.get('title') as string,
    body: (formData.get('body') as string) || undefined,
    duration: formData.get('duration') ? Number(formData.get('duration')) : undefined,
    urgency: (formData.get('urgency') as string) || undefined,
    effort: (formData.get('effort') as string) || undefined,
    deadline: (formData.get('deadline') as string) || undefined,
    categoryId: (formData.get('categoryId') as string) || undefined,
    parentId: (formData.get('parentId') as string) || undefined,
    locationFormatted: (formData.get('locationFormatted') as string) || undefined,
    locationLat: formData.get('locationLat') ? Number(formData.get('locationLat')) : undefined,
    locationLon: formData.get('locationLon') ? Number(formData.get('locationLon')) : undefined,
    locationCity: (formData.get('locationCity') as string) || undefined,
    locationCountry: (formData.get('locationCountry') as string) || undefined,
    locationPlaceId: (formData.get('locationPlaceId') as string) || undefined,
    recurrenceType: (formData.get('recurrenceType') as string) || undefined,
  }

  const result = await createTask(input)

  if (result.success) {
    // Redirect happens after revalidation (which is already in createTask)
    redirect(`/tasks/${result.data.taskId}`)
  }

  return toActionState(result)
}

/**
 * Update an existing task via FormData (for use with form action)
 * taskId is bound to the action via .bind(null, taskId)
 */
export async function updateTaskFormAction(
  taskId: string,
  _prevState: ActionState<{ taskId: string }>,
  formData: FormData
): Promise<ActionState<{ taskId: string }>> {
  const input = {
    title: formData.get('title') as string,
    body: (formData.get('body') as string) || undefined,
    duration: formData.get('duration') ? Number(formData.get('duration')) : undefined,
    urgency: (formData.get('urgency') as string) || undefined,
    effort: (formData.get('effort') as string) || undefined,
    deadline: (formData.get('deadline') as string) || undefined,
    categoryId: (formData.get('categoryId') as string) || undefined,
    parentId: (formData.get('parentId') as string) || undefined,
    locationFormatted: (formData.get('locationFormatted') as string) || undefined,
    locationLat: formData.get('locationLat') ? Number(formData.get('locationLat')) : undefined,
    locationLon: formData.get('locationLon') ? Number(formData.get('locationLon')) : undefined,
    locationCity: (formData.get('locationCity') as string) || undefined,
    locationCountry: (formData.get('locationCountry') as string) || undefined,
    locationPlaceId: (formData.get('locationPlaceId') as string) || undefined,
    recurrenceType: (formData.get('recurrenceType') as string) || undefined,
  }

  const result = await updateTask(taskId, input)
  return toActionState(result)
}

/**
 * Start a task via FormData (for use with form action)
 */
export async function startTaskFormAction(
  _prevState: ActionState<{ success: true }>,
  formData: FormData
): Promise<ActionState<{ success: true }>> {
  const taskId = formData.get('taskId') as string
  const result = await startTask(taskId)
  return toActionState(result)
}

/**
 * Complete a task via FormData (for use with form action)
 */
export async function completeTaskFormAction(
  _prevState: ActionState<{ success: true }>,
  formData: FormData
): Promise<ActionState<{ success: true }>> {
  const taskId = formData.get('taskId') as string
  const result = await completeTask(taskId)

  if (result.success) {
    redirect('/dashboard')
  }

  return toActionState(result)
}

/**
 * Defer a task via FormData (for use with form action)
 */
export async function deferTaskFormAction(
  _prevState: ActionState<{ success: true }>,
  formData: FormData
): Promise<ActionState<{ success: true }>> {
  const taskId = formData.get('taskId') as string
  const result = await deferTask(taskId)
  return toActionState(result)
}

/**
 * Revert a task via FormData (for use with form action)
 */
export async function revertTaskFormAction(
  _prevState: ActionState<{ success: true }>,
  formData: FormData
): Promise<ActionState<{ success: true }>> {
  const taskId = formData.get('taskId') as string
  const result = await revertTask(taskId)
  return toActionState(result)
}

/**
 * Delete a task via FormData (for use with form action)
 */
export async function deleteTaskFormAction(
  _prevState: ActionState<{ success: true }>,
  formData: FormData
): Promise<ActionState<{ success: true }>> {
  const taskId = formData.get('taskId') as string
  const result = await deleteTask(taskId)

  if (result.success) {
    redirect('/dashboard')
  }

  return toActionState(result)
}

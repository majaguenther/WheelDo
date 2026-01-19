import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'
import { getCurrentUser } from './auth'
import { toTaskDTO, toTaskDetailDTO, type TaskDTO, type TaskDetailDTO } from './dto/task.dto'

/**
 * Standard task include for queries
 */
const taskInclude = {
  category: true,
  children: {
    orderBy: { position: 'asc' as const },
  },
  collaborators: {
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  },
  user: {
    select: { id: true, name: true, email: true, image: true },
  },
} as const

/**
 * Get all tasks for current user (owned and collaborated)
 * Memoized within a single request
 */
export const getTasks = cache(async (): Promise<TaskDTO[]> => {
  const user = await getCurrentUser()
  if (!user) return []

  const tasks = await db.task.findMany({
    where: {
      OR: [{ userId: user.id }, { collaborators: { some: { userId: user.id } } }],
      parentId: null, // Only top-level tasks
    },
    include: taskInclude,
    orderBy: [{ status: 'asc' }, { urgency: 'desc' }, { deadline: 'asc' }, { position: 'asc' }],
  })

  // Filter and transform to DTOs
  const dtos = tasks.map((task) => toTaskDTO(task, user.id))

  return dtos.filter((dto): dto is TaskDTO => dto !== null)
})

/**
 * Get tasks filtered by status
 */
export const getTasksByStatus = cache(
  async (status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED'): Promise<TaskDTO[]> => {
    const user = await getCurrentUser()
    if (!user) return []

    const tasks = await db.task.findMany({
      where: {
        OR: [{ userId: user.id }, { collaborators: { some: { userId: user.id } } }],
        parentId: null,
        status,
      },
      include: taskInclude,
      orderBy: [{ urgency: 'desc' }, { deadline: 'asc' }, { position: 'asc' }],
    })

    const dtos = tasks.map((task) => toTaskDTO(task, user.id))
    return dtos.filter((dto): dto is TaskDTO => dto !== null)
  }
)

/**
 * Get completed tasks for history view
 */
export const getCompletedTasks = cache(async (): Promise<TaskDTO[]> => {
  const user = await getCurrentUser()
  if (!user) return []

  const tasks = await db.task.findMany({
    where: {
      OR: [{ userId: user.id }, { collaborators: { some: { userId: user.id } } }],
      status: 'COMPLETED',
    },
    include: taskInclude,
    orderBy: { completedAt: 'desc' },
  })

  const dtos = tasks.map((task) => toTaskDTO(task, user.id))
  return dtos.filter((dto): dto is TaskDTO => dto !== null)
})

/**
 * Get tasks eligible for the wheel (pending, within duration limit)
 */
export const getWheelEligibleTasks = cache(async (maxDuration?: number): Promise<TaskDTO[]> => {
  const user = await getCurrentUser()
  if (!user) return []

  const tasks = await db.task.findMany({
    where: {
      OR: [{ userId: user.id }, { collaborators: { some: { userId: user.id } } }],
      parentId: null,
      status: 'PENDING',
      ...(maxDuration && {
        OR: [{ duration: null }, { duration: { lte: maxDuration } }],
      }),
      // Exclude tasks with incomplete parent dependencies
      parent: {
        OR: [{ status: { not: 'PENDING' } }, { id: undefined }],
      },
    },
    include: taskInclude,
    orderBy: [{ urgency: 'desc' }, { deadline: 'asc' }],
  })

  const dtos = tasks.map((task) => toTaskDTO(task, user.id))
  return dtos.filter((dto): dto is TaskDTO => dto !== null)
})

/**
 * Get the currently active task (in progress)
 */
export const getActiveTask = cache(async (): Promise<TaskDTO | null> => {
  const user = await getCurrentUser()
  if (!user) return null

  const task = await db.task.findFirst({
    where: {
      OR: [{ userId: user.id }, { collaborators: { some: { userId: user.id } } }],
      status: 'IN_PROGRESS',
    },
    include: taskInclude,
  })

  if (!task) return null
  return toTaskDTO(task, user.id)
})

/**
 * Get single task by ID with authorization check
 */
export const getTaskById = cache(async (taskId: string): Promise<TaskDetailDTO | null> => {
  const user = await getCurrentUser()
  if (!user) return null

  const task = await db.task.findFirst({
    where: {
      id: taskId,
      OR: [{ userId: user.id }, { collaborators: { some: { userId: user.id } } }],
    },
    include: {
      ...taskInclude,
      parent: true,
    },
  })

  if (!task) return null
  return toTaskDetailDTO(task, user.id)
})

/**
 * Check if user owns a task
 */
export const isTaskOwner = cache(async (taskId: string): Promise<boolean> => {
  const user = await getCurrentUser()
  if (!user) return false

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { userId: true },
  })

  return task?.userId === user.id
})

/**
 * Check if user can edit a task (owner or editor)
 */
export const canEditTask = cache(async (taskId: string): Promise<boolean> => {
  const user = await getCurrentUser()
  if (!user) return false

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      userId: true,
      collaborators: {
        where: { userId: user.id },
        select: { canEdit: true },
      },
    },
  })

  if (!task) return false
  if (task.userId === user.id) return true

  return task.collaborators[0]?.canEdit ?? false
})

/**
 * Get user's role on a task
 */
export const getTaskRole = cache(
  async (taskId: string): Promise<'owner' | 'editor' | 'viewer' | null> => {
    const user = await getCurrentUser()
    if (!user) return null

    const task = await db.task.findUnique({
      where: { id: taskId },
      select: {
        userId: true,
        collaborators: {
          where: { userId: user.id },
          select: { canEdit: true },
        },
      },
    })

    if (!task) return null
    if (task.userId === user.id) return 'owner'

    const collaborator = task.collaborators[0]
    if (!collaborator) return null

    return collaborator.canEdit ? 'editor' : 'viewer'
  }
)

import 'server-only'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentUser } from './auth'
import { toTaskDTO, toTaskDetailDTO, type TaskDTO, type TaskDetailDTO } from './dto/task.dto'

// ============================================
// Helper functions for parent/child dependencies
// ============================================

/**
 * Check if a task is blocked (has incomplete children)
 * A parent task is blocked until ALL children are completed
 */
export function isTaskBlocked(task: TaskDTO): boolean {
  if (!task.children || task.children.length === 0) return false
  return task.children.some((child) => child.status !== 'COMPLETED')
}

/**
 * Get completion progress for a parent task
 * Returns completed count, total count, and percentage
 */
export function getTaskProgress(task: TaskDTO): { completed: number; total: number; percent: number } {
  if (!task.children || task.children.length === 0) {
    return { completed: 0, total: 0, percent: 100 }
  }
  const completed = task.children.filter((c) => c.status === 'COMPLETED').length
  const total = task.children.length
  return { completed, total, percent: Math.round((completed / total) * 100) }
}

/**
 * Lightweight include for list views - no full collaborator join, just counts
 */
const taskListInclude = {
  category: { select: { id: true, name: true, color: true, icon: true } },
  children: {
    orderBy: { position: 'asc' as const },
    select: { id: true, title: true, status: true, urgency: true },
  },
  _count: { select: { collaborators: true } },
  user: { select: { id: true, name: true, email: true, image: true } },
} as const

/**
 * Full include for detail views - includes all collaborator data
 */
const taskDetailInclude = {
  category: true,
  children: { orderBy: { position: 'asc' as const } },
  collaborators: {
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  },
  user: { select: { id: true, name: true, email: true, image: true } },
  parent: { select: { id: true, title: true } },
} as const

// ============================================
// New functions with userId parameter (for parallel data fetching)
// ============================================

/**
 * Get all tasks for a user (owned and collaborated)
 * Optimized: uses lightweight include, no internal auth check
 */
export const getTasksForUser = (userId: string) =>
  unstable_cache(
    async () => {
      const tasks = await db.task.findMany({
        where: {
          OR: [{ userId }, { collaborators: { some: { userId } } }],
          parentId: null,
        },
        include: taskListInclude,
        orderBy: [{ status: 'asc' }, { urgency: 'desc' }, { deadline: 'asc' }, { position: 'asc' }],
      })
      return tasks.map((task) => toTaskDTOFromList(task, userId)).filter((dto): dto is TaskDTO => dto !== null)
    },
    ['tasks', userId],
    { tags: [`tasks:${userId}`], revalidate: 60 }
  )()

/**
 * Get active task (in progress) for a user
 */
export const getActiveTaskForUser = (userId: string) =>
  unstable_cache(
    async () => {
      const task = await db.task.findFirst({
        where: {
          OR: [{ userId }, { collaborators: { some: { userId } } }],
          status: 'IN_PROGRESS',
        },
        include: taskListInclude,
      })
      if (!task) return null
      return toTaskDTOFromList(task, userId)
    },
    ['tasks', userId, 'active'],
    { tags: [`tasks:${userId}`], revalidate: 60 }
  )()

/**
 * Get completed tasks for a user (history view)
 */
export const getCompletedTasksForUser = (userId: string) =>
  unstable_cache(
    async () => {
      const tasks = await db.task.findMany({
        where: {
          OR: [{ userId }, { collaborators: { some: { userId } } }],
          status: 'COMPLETED',
        },
        include: taskListInclude,
        orderBy: { completedAt: 'desc' },
      })
      return tasks.map((task) => toTaskDTOFromList(task, userId)).filter((dto): dto is TaskDTO => dto !== null)
    },
    ['tasks', userId, 'completed'],
    { tags: [`tasks:${userId}`], revalidate: 60 }
  )()

/**
 * Get wheel-eligible tasks for a user
 * Eligible = PENDING + unblocked (no incomplete children) + within duration
 * Note: Parents with incomplete children are blocked and should NOT appear on wheel
 */
export const getWheelEligibleTasksForUser = (userId: string, maxDuration?: number) =>
  unstable_cache(
    async () => {
      const tasks = await db.task.findMany({
        where: {
          AND: [
            // 1. User owns or collaborates
            {
              OR: [{ userId }, { collaborators: { some: { userId } } }],
            },
            // 2. Must be PENDING
            { status: 'PENDING' },
            // 3. Duration filter (optional)
            ...(maxDuration
              ? [{ OR: [{ duration: null }, { duration: { lte: maxDuration } }] }]
              : []),
          ],
        },
        include: taskListInclude,
        orderBy: [{ urgency: 'desc' }, { deadline: 'asc' }],
      })

      // Filter out blocked parents (tasks with incomplete children)
      const unblockedTasks = tasks.filter((task) => {
        // If task has children, all must be COMPLETED for it to be eligible
        if (task.children && task.children.length > 0) {
          return task.children.every((c) => c.status === 'COMPLETED')
        }
        return true
      })

      return unblockedTasks.map((task) => toTaskDTOFromList(task, userId)).filter((dto): dto is TaskDTO => dto !== null)
    },
    ['tasks', userId, 'wheel', maxDuration?.toString() ?? 'all'],
    { tags: [`tasks:${userId}`], revalidate: 60 }
  )()

/**
 * Get all tasks for a user including children (for flat list view)
 * Unlike getTasksForUser, this does NOT filter out children
 */
export const getAllTasksForUser = (userId: string) =>
  unstable_cache(
    async () => {
      const tasks = await db.task.findMany({
        where: {
          OR: [{ userId }, { collaborators: { some: { userId } } }],
          // NO parentId filter - get all tasks including children
        },
        include: taskListInclude,
        orderBy: [{ status: 'asc' }, { urgency: 'desc' }, { deadline: 'asc' }, { position: 'asc' }],
      })
      return tasks.map((task) => toTaskDTOFromList(task, userId)).filter((dto): dto is TaskDTO => dto !== null)
    },
    ['tasks', userId, 'all'],
    { tags: [`tasks:${userId}`], revalidate: 60 }
  )()

/**
 * Get potential parent tasks for a user
 * Only returns root-level tasks (no grandparenting allowed)
 */
export const getPotentialParentTasks = (userId: string) =>
  unstable_cache(
    async () => {
      const tasks = await db.task.findMany({
        where: {
          OR: [{ userId }, { collaborators: { some: { userId, canEdit: true } } }],
          parentId: null, // Only root-level tasks can be parents
          status: { in: ['PENDING', 'IN_PROGRESS'] }, // Only show active tasks as potential parents
        },
        include: taskListInclude,
        orderBy: [{ urgency: 'desc' }, { deadline: 'asc' }, { title: 'asc' }],
      })
      return tasks.map((task) => toTaskDTOFromList(task, userId)).filter((dto): dto is TaskDTO => dto !== null)
    },
    ['tasks', userId, 'potential-parents'],
    { tags: [`tasks:${userId}`], revalidate: 60 }
  )()

/**
 * Get single task by ID for a user (detail view)
 */
export const getTaskByIdForUser = (taskId: string, userId: string) =>
  unstable_cache(
    async () => {
      const task = await db.task.findFirst({
        where: {
          id: taskId,
          OR: [{ userId }, { collaborators: { some: { userId } } }],
        },
        include: taskDetailInclude,
      })
      if (!task) return null
      return toTaskDetailDTO(task, userId)
    },
    ['tasks', userId, 'detail', taskId],
    { tags: [`tasks:${userId}`], revalidate: 60 }
  )()

// ============================================
// Helper to convert list query result to DTO
// ============================================

type TaskListQueryResult = Awaited<ReturnType<typeof db.task.findMany<{ include: typeof taskListInclude }>>>[number]

function toTaskDTOFromList(task: TaskListQueryResult, viewingUserId: string): TaskDTO | null {
  const isOwner = task.userId === viewingUserId
  const isCollaborator = !isOwner // If not owner and we got the task, user is a collaborator

  // For list views, we don't have collaborator canEdit info, so default to false for collaborators
  const canEdit = isOwner

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
    category: task.category,
    parentId: task.parentId,
    children: task.children,
    collaboratorCount: task._count.collaborators,
    role: isOwner ? 'owner' : (isCollaborator ? 'viewer' : 'viewer'),
    canEdit,
    owner: task.user,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}

// ============================================
// Legacy functions (for backwards compatibility during migration)
// These still call getCurrentUser() internally
// ============================================

/**
 * Standard task include for legacy queries
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
 * Internal cached function to fetch tasks for a user
 */
const fetchTasksForUser = (userId: string) =>
  unstable_cache(
    async () => {
      const tasks = await db.task.findMany({
        where: {
          OR: [{ userId }, { collaborators: { some: { userId } } }],
          parentId: null,
        },
        include: taskInclude,
        orderBy: [{ status: 'asc' }, { urgency: 'desc' }, { deadline: 'asc' }, { position: 'asc' }],
      })
      const dtos = tasks.map((task) => toTaskDTO(task, userId))
      return dtos.filter((dto): dto is TaskDTO => dto !== null)
    },
    ['tasks-legacy', userId],
    { tags: [`tasks:${userId}`], revalidate: 60 }
  )

/**
 * Get all tasks for current user (owned and collaborated)
 * @deprecated Use getTasksForUser(userId) with user from getCurrentUser()
 */
export const getTasks = cache(async (): Promise<TaskDTO[]> => {
  const user = await getCurrentUser()
  if (!user) return []
  return fetchTasksForUser(user.id)()
})

/**
 * Internal cached function to fetch tasks by status
 */
const fetchTasksByStatus = (
  userId: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED'
) =>
  unstable_cache(
    async () => {
      const tasks = await db.task.findMany({
        where: {
          OR: [{ userId }, { collaborators: { some: { userId } } }],
          parentId: null,
          status,
        },
        include: taskInclude,
        orderBy: [{ urgency: 'desc' }, { deadline: 'asc' }, { position: 'asc' }],
      })
      const dtos = tasks.map((task) => toTaskDTO(task, userId))
      return dtos.filter((dto): dto is TaskDTO => dto !== null)
    },
    ['tasks-legacy', userId, 'status', status],
    { tags: [`tasks:${userId}`], revalidate: 60 }
  )

/**
 * Get tasks filtered by status
 * @deprecated Use getTasksForUser and filter client-side
 */
export const getTasksByStatus = cache(
  async (status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED'): Promise<TaskDTO[]> => {
    const user = await getCurrentUser()
    if (!user) return []
    return fetchTasksByStatus(user.id, status)()
  }
)

/**
 * Internal cached function to fetch completed tasks
 */
const fetchCompletedTasks = (userId: string) =>
  unstable_cache(
    async () => {
      const tasks = await db.task.findMany({
        where: {
          OR: [{ userId }, { collaborators: { some: { userId } } }],
          status: 'COMPLETED',
        },
        include: taskInclude,
        orderBy: { completedAt: 'desc' },
      })
      const dtos = tasks.map((task) => toTaskDTO(task, userId))
      return dtos.filter((dto): dto is TaskDTO => dto !== null)
    },
    ['tasks-legacy', userId, 'completed'],
    { tags: [`tasks:${userId}`], revalidate: 60 }
  )

/**
 * Get completed tasks for history view
 * @deprecated Use getCompletedTasksForUser(userId)
 */
export const getCompletedTasks = cache(async (): Promise<TaskDTO[]> => {
  const user = await getCurrentUser()
  if (!user) return []
  return fetchCompletedTasks(user.id)()
})

/**
 * Internal cached function to fetch wheel-eligible tasks
 */
const fetchWheelTasks = (userId: string, maxDuration?: number) =>
  unstable_cache(
    async () => {
      const tasks = await db.task.findMany({
        where: {
          AND: [
            // 1. User owns or collaborates
            {
              OR: [{ userId }, { collaborators: { some: { userId } } }],
            },
            // 2. Must be PENDING
            { status: 'PENDING' },
            // 3. Duration filter (optional)
            ...(maxDuration
              ? [{ OR: [{ duration: null }, { duration: { lte: maxDuration } }] }]
              : []),
          ],
        },
        include: taskInclude,
        orderBy: [{ urgency: 'desc' }, { deadline: 'asc' }],
      })

      // Filter out blocked parents (tasks with incomplete children)
      const unblockedTasks = tasks.filter((task) => {
        // If task has children, all must be COMPLETED for it to be eligible
        if (task.children && task.children.length > 0) {
          return task.children.every((c) => c.status === 'COMPLETED')
        }
        return true
      })

      const dtos = unblockedTasks.map((task) => toTaskDTO(task, userId))
      return dtos.filter((dto): dto is TaskDTO => dto !== null)
    },
    ['tasks-legacy', userId, 'wheel', maxDuration?.toString() ?? 'all'],
    { tags: [`tasks:${userId}`], revalidate: 60 }
  )

/**
 * Get tasks eligible for the wheel (pending, within duration limit)
 * @deprecated Use getWheelEligibleTasksForUser(userId, maxDuration)
 */
export const getWheelEligibleTasks = cache(async (maxDuration?: number): Promise<TaskDTO[]> => {
  const user = await getCurrentUser()
  if (!user) return []
  return fetchWheelTasks(user.id, maxDuration)()
})

/**
 * Internal cached function to fetch active task
 */
const fetchActiveTask = (userId: string) =>
  unstable_cache(
    async () => {
      const task = await db.task.findFirst({
        where: {
          OR: [{ userId }, { collaborators: { some: { userId } } }],
          status: 'IN_PROGRESS',
        },
        include: taskInclude,
      })
      if (!task) return null
      return toTaskDTO(task, userId)
    },
    ['tasks-legacy', userId, 'active'],
    { tags: [`tasks:${userId}`], revalidate: 60 }
  )

/**
 * Get the currently active task (in progress)
 * @deprecated Use getActiveTaskForUser(userId)
 */
export const getActiveTask = cache(async (): Promise<TaskDTO | null> => {
  const user = await getCurrentUser()
  if (!user) return null
  return fetchActiveTask(user.id)()
})

/**
 * Internal cached function to fetch task by ID
 */
const fetchTaskById = (userId: string, taskId: string) =>
  unstable_cache(
    async () => {
      const task = await db.task.findFirst({
        where: {
          id: taskId,
          OR: [{ userId }, { collaborators: { some: { userId } } }],
        },
        include: {
          ...taskInclude,
          parent: true,
        },
      })
      if (!task) return null
      return toTaskDetailDTO(task, userId)
    },
    ['tasks-legacy', userId, 'detail', taskId],
    { tags: [`tasks:${userId}`], revalidate: 60 }
  )

/**
 * Get single task by ID with authorization check
 * @deprecated Use getTaskByIdForUser(taskId, userId)
 */
export const getTaskById = cache(async (taskId: string): Promise<TaskDetailDTO | null> => {
  const user = await getCurrentUser()
  if (!user) return null
  return fetchTaskById(user.id, taskId)()
})

// ============================================
// Authorization helpers (not cached - always fresh)
// ============================================

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

// ============================================
// API Route Helpers (for use when session is pre-validated)
// ============================================

/**
 * Check if user owns a task (for API routes)
 */
export async function isTaskOwnerById(userId: string, taskId: string): Promise<boolean> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { userId: true },
  })
  return task?.userId === userId
}

/**
 * Check if user can view a task (for API routes)
 */
export async function canViewTaskById(userId: string, taskId: string): Promise<boolean> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      userId: true,
      collaborators: {
        where: { userId },
        select: { id: true },
      },
    },
  })

  if (!task) return false
  return task.userId === userId || task.collaborators.length > 0
}

/**
 * Check if user can edit a task (for API routes)
 */
export async function canEditTaskById(userId: string, taskId: string): Promise<boolean> {
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

  if (!task) return false
  if (task.userId === userId) return true
  return task.collaborators[0]?.canEdit ?? false
}

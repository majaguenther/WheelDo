import 'server-only'
import { db } from './db'
import { requireAuth } from './auth'
import type { TaskStatus, Urgency, Effort, RecurrenceType, Prisma } from '@prisma/client'

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    category: true
    children: {
      include: {
        category: true
        children: true
      }
    }
  }
}>

export async function getTasks(options?: {
  status?: TaskStatus[]
  parentId?: string | null
}) {
  const user = await requireAuth()

  return db.task.findMany({
    where: {
      userId: user.id,
      ...(options?.status && { status: { in: options.status } }),
      ...(options?.parentId === null ? { parentId: null } : {}),
      ...(options?.parentId ? { parentId: options.parentId } : {}),
    },
    include: {
      category: true,
      children: {
        include: {
          category: true,
          children: true,
        },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: [
      { status: 'asc' }, // IN_PROGRESS first
      { urgency: 'desc' }, // HIGH urgency first
      { deadline: 'asc' }, // Earliest deadline first
      { position: 'asc' },
    ],
  })
}

export async function getActiveTask() {
  const user = await requireAuth()

  return db.task.findFirst({
    where: {
      userId: user.id,
      status: 'IN_PROGRESS',
    },
    include: {
      category: true,
      children: {
        include: {
          category: true,
          children: true,
        },
      },
    },
  })
}

export async function getTask(id: string) {
  const user = await requireAuth()

  return db.task.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      category: true,
      parent: true,
      children: {
        include: {
          category: true,
          children: true,
        },
      },
    },
  })
}

export async function getCompletedTasks() {
  const user = await requireAuth()

  return db.task.findMany({
    where: {
      userId: user.id,
      status: 'COMPLETED',
    },
    include: {
      category: true,
      children: true,
    },
    orderBy: { completedAt: 'desc' },
  })
}

export async function getTasksForWheel(maxDuration?: number) {
  const user = await requireAuth()

  return db.task.findMany({
    where: {
      userId: user.id,
      status: 'PENDING',
      parentId: null, // Only top-level tasks
      ...(maxDuration && { duration: { lte: maxDuration } }),
    },
    include: {
      category: true,
      children: true,
    },
  })
}

export async function createTask(data: {
  title: string
  body?: string
  duration?: number
  location?: string
  effort?: Effort
  urgency?: Urgency
  deadline?: Date
  recurrenceType?: RecurrenceType
  recurrenceRule?: string
  parentId?: string
  categoryId?: string
}) {
  const user = await requireAuth()

  // Get the max position for ordering
  const maxPosition = await db.task.aggregate({
    where: { userId: user.id, parentId: data.parentId || null },
    _max: { position: true },
  })

  return db.task.create({
    data: {
      ...data,
      userId: user.id,
      position: (maxPosition._max.position || 0) + 1,
    },
    include: {
      category: true,
      children: true,
    },
  })
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string
    body: string
    duration: number
    location: string
    effort: Effort
    urgency: Urgency
    deadline: Date
    status: TaskStatus
    recurrenceType: RecurrenceType
    recurrenceRule: string
    parentId: string
    categoryId: string
    position: number
  }>
) {
  const user = await requireAuth()

  // If setting to IN_PROGRESS, first defer any other in-progress task
  if (data.status === 'IN_PROGRESS') {
    await db.task.updateMany({
      where: {
        userId: user.id,
        status: 'IN_PROGRESS',
        id: { not: id },
      },
      data: { status: 'PENDING' },
    })
  }

  // If completing, set completedAt
  const completedAt = data.status === 'COMPLETED' ? new Date() : undefined

  return db.task.update({
    where: { id, userId: user.id },
    data: {
      ...data,
      ...(completedAt && { completedAt }),
    },
    include: {
      category: true,
      children: true,
    },
  })
}

export async function deleteTask(id: string) {
  const user = await requireAuth()

  return db.task.delete({
    where: { id, userId: user.id },
  })
}

export async function getCategories() {
  const user = await requireAuth()

  return db.category.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
  })
}

export async function createCategory(data: { name: string; color?: string; icon?: string }) {
  const user = await requireAuth()

  return db.category.create({
    data: {
      ...data,
      userId: user.id,
    },
  })
}

export async function createDefaultCategories(userId: string) {
  const defaults = [
    { name: 'Work', color: '#3b82f6', icon: 'Briefcase' },
    { name: 'Personal', color: '#8b5cf6', icon: 'User' },
    { name: 'Health', color: '#22c55e', icon: 'Heart' },
    { name: 'Finance', color: '#f59e0b', icon: 'DollarSign' },
    { name: 'Home', color: '#ec4899', icon: 'Home' },
  ]

  return db.category.createMany({
    data: defaults.map((cat) => ({ ...cat, userId })),
    skipDuplicates: true,
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import type { Effort, Urgency, RecurrenceType } from '@/generated/prisma/client'

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get owned tasks
    const ownedTasks = await db.task.findMany({
      where: {
        userId: session.user.id,
        parentId: null,
      },
      include: {
        category: true,
        children: {
          include: {
            category: true,
            children: true,
          },
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
      },
      orderBy: [
        { status: 'asc' },
        { urgency: 'desc' },
        { deadline: 'asc' },
        { position: 'asc' },
      ],
    })

    // Get shared tasks (where user is a collaborator)
    const sharedTasks = await db.task.findMany({
      where: {
        parentId: null,
        collaborators: {
          some: { userId: session.user.id },
        },
      },
      include: {
        category: true,
        children: {
          include: {
            category: true,
            children: true,
          },
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
      },
      orderBy: [
        { status: 'asc' },
        { urgency: 'desc' },
        { deadline: 'asc' },
        { position: 'asc' },
      ],
    })

    // Add role info to tasks
    const tasksWithRoles = [
      ...ownedTasks.map((task) => ({
        ...task,
        role: 'owner' as const,
        isShared: task.collaborators.length > 0,
      })),
      ...sharedTasks.map((task) => {
        const collab = task.collaborators.find((c) => c.userId === session.user.id)
        return {
          ...task,
          role: (collab?.canEdit ? 'editor' : 'viewer') as 'editor' | 'viewer',
          isShared: true,
        }
      }),
    ]

    return NextResponse.json(tasksWithRoles)
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      body: taskBody,
      duration,
      location,
      effort = 'MODERATE',
      urgency = 'MEDIUM',
      deadline,
      recurrenceType = 'NONE',
      recurrenceRule,
      parentId,
      categoryId,
    } = body as {
      title: string
      body?: string
      duration?: number
      location?: string
      effort?: Effort
      urgency?: Urgency
      deadline?: string
      recurrenceType?: RecurrenceType
      recurrenceRule?: string
      parentId?: string
      categoryId?: string
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get max position for ordering
    const maxPosition = await db.task.aggregate({
      where: {
        userId: session.user.id,
        parentId: parentId || null,
      },
      _max: { position: true },
    })

    const task = await db.task.create({
      data: {
        title: title.trim(),
        body: taskBody?.trim(),
        duration,
        location,
        effort,
        urgency,
        deadline: deadline ? new Date(deadline) : null,
        recurrenceType,
        recurrenceRule,
        parentId,
        categoryId,
        userId: session.user.id,
        position: (maxPosition._max.position || 0) + 1,
      },
      include: {
        category: true,
        children: true,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

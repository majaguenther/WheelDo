import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import type { TaskStatus, Effort, Urgency, RecurrenceType } from '@/generated/prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const task = await db.task.findFirst({
      where: {
        id,
        userId: session.user.id,
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

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Failed to fetch task:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const {
      title,
      body: taskBody,
      duration,
      location,
      effort,
      urgency,
      deadline,
      status,
      recurrenceType,
      recurrenceRule,
      parentId,
      categoryId,
      position,
    } = body as {
      title?: string
      body?: string
      duration?: number
      location?: string
      effort?: Effort
      urgency?: Urgency
      deadline?: string
      status?: TaskStatus
      recurrenceType?: RecurrenceType
      recurrenceRule?: string
      parentId?: string
      categoryId?: string
      position?: number
    }

    // Verify the task belongs to the user
    const existingTask = await db.task.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // If setting to IN_PROGRESS, first defer any other in-progress task
    if (status === 'IN_PROGRESS') {
      await db.task.updateMany({
        where: {
          userId: session.user.id,
          status: 'IN_PROGRESS',
          id: { not: id },
        },
        data: { status: 'PENDING' },
      })
    }

    // If completing, set completedAt
    const completedAt = status === 'COMPLETED' ? new Date() : undefined

    const task = await db.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(taskBody !== undefined && { body: taskBody.trim() }),
        ...(duration !== undefined && { duration }),
        ...(location !== undefined && { location }),
        ...(effort !== undefined && { effort }),
        ...(urgency !== undefined && { urgency }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(status !== undefined && { status }),
        ...(recurrenceType !== undefined && { recurrenceType }),
        ...(recurrenceRule !== undefined && { recurrenceRule }),
        ...(parentId !== undefined && { parentId }),
        ...(categoryId !== undefined && { categoryId }),
        ...(position !== undefined && { position }),
        ...(completedAt && { completedAt }),
      },
      include: {
        category: true,
        children: true,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify the task belongs to the user
    const existingTask = await db.task.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await db.task.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}

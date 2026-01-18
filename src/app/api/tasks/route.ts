import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Effort, Urgency, RecurrenceType } from '@/generated/prisma/client'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasks = await db.task.findMany({
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
      },
      orderBy: [
        { status: 'asc' },
        { urgency: 'desc' },
        { deadline: 'asc' },
        { position: 'asc' },
      ],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
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

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { canViewTaskById } from '@/data/tasks'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: taskId } = await params

    // Check if user can view the task
    const canView = await canViewTaskById(session.user.id, taskId)
    if (!canView) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const collaborators = await db.taskCollaborator.findMany({
      where: { taskId },
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
      orderBy: { createdAt: 'asc' },
    })

    // Get task owner info
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: {
        userId: true,
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

    return NextResponse.json({
      owner: task?.user,
      collaborators: collaborators.map((c) => ({
        id: c.id,
        userId: c.userId,
        canEdit: c.canEdit,
        createdAt: c.createdAt,
        user: c.user,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch collaborators:', error)
    return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 })
  }
}

// Note: PATCH and DELETE operations are now handled by Server Actions
// in src/actions/collaborators.ts for immediate cache invalidation

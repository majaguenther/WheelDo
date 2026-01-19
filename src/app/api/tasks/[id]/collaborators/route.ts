import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { canViewTask, isTaskOwner } from '@/lib/task-authorization'
import { createNotification } from '@/lib/notifications'

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
    const canView = await canViewTask(session.user.id, taskId)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: taskId } = await params
    const { userId: targetUserId } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Check authorization
    const isOwner = await isTaskOwner(session.user.id, taskId)
    const isSelf = targetUserId === session.user.id

    if (!isOwner && !isSelf) {
      return NextResponse.json(
        { error: 'Only the task owner can remove collaborators, or you can remove yourself' },
        { status: 403 }
      )
    }

    // Get task info for notification
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: { title: true, userId: true },
    })

    // Get user info for notification
    const removedUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { name: true, email: true },
    })

    // Remove the collaborator
    await db.taskCollaborator.delete({
      where: {
        taskId_userId: {
          taskId,
          userId: targetUserId,
        },
      },
    })

    // Notify the owner if someone left, or notify the removed user if owner removed them
    if (isSelf && !isOwner && task) {
      await createNotification({
        userId: task.userId,
        type: 'COLLABORATOR_LEFT',
        title: 'Collaborator left',
        message: `${removedUser?.name || removedUser?.email || 'A collaborator'} left "${task.title}"`,
        taskId,
      })
    } else if (isOwner && !isSelf && removedUser) {
      await createNotification({
        userId: targetUserId,
        type: 'COLLABORATOR_LEFT',
        title: 'Removed from task',
        message: `You were removed from "${task?.title}"`,
        taskId,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove collaborator:', error)
    return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 })
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

    const { id: taskId } = await params
    const { userId: targetUserId, canEdit } = await request.json()

    if (!targetUserId || typeof canEdit !== 'boolean') {
      return NextResponse.json({ error: 'userId and canEdit are required' }, { status: 400 })
    }

    // Only owner can change permissions
    const isOwner = await isTaskOwner(session.user.id, taskId)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only the task owner can change collaborator permissions' },
        { status: 403 }
      )
    }

    const collaborator = await db.taskCollaborator.update({
      where: {
        taskId_userId: {
          taskId,
          userId: targetUserId,
        },
      },
      data: { canEdit },
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
    })

    return NextResponse.json(collaborator)
  } catch (error) {
    console.error('Failed to update collaborator:', error)
    return NextResponse.json({ error: 'Failed to update collaborator' }, { status: 500 })
  }
}

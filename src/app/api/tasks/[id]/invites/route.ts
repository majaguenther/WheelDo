import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { isTaskOwner } from '@/lib/task-authorization'
import { createInvite, getTaskInvites, revokeInvite } from '@/lib/invites'

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

    // Only owner can view invites
    const isOwner = await isTaskOwner(session.user.id, taskId)
    if (!isOwner) {
      return NextResponse.json({ error: 'Only the task owner can view invites' }, { status: 403 })
    }

    const invites = await getTaskInvites(taskId, session.user.id)
    return NextResponse.json(invites)
  } catch (error) {
    console.error('Failed to fetch invites:', error)
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: taskId } = await params
    const { canEdit = false } = await request.json()

    // Only owner can create invites
    const isOwner = await isTaskOwner(session.user.id, taskId)
    if (!isOwner) {
      return NextResponse.json({ error: 'Only the task owner can create invites' }, { status: 403 })
    }

    const invite = await createInvite(taskId, canEdit, session.user.id)

    // Build the full invite URL
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
    const inviteUrl = `${baseUrl}/invite/${invite.token}`

    return NextResponse.json({
      ...invite,
      url: inviteUrl,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Maximum')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Failed to create invite:', error)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
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
    const { inviteId } = await request.json()

    if (!inviteId) {
      return NextResponse.json({ error: 'inviteId is required' }, { status: 400 })
    }

    // Only owner can revoke invites
    const isOwner = await isTaskOwner(session.user.id, taskId)
    if (!isOwner) {
      return NextResponse.json({ error: 'Only the task owner can revoke invites' }, { status: 403 })
    }

    await revokeInvite(inviteId, session.user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to revoke invite:', error)
    return NextResponse.json({ error: 'Failed to revoke invite' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { validateInvite, acceptInvite } from '@/lib/invites'

// GET: Get invite details (public, shows task info)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const result = await validateInvite(token)

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Invite not found' ? 404 : 410 }
      )
    }

    // Return limited public info
    return NextResponse.json({
      taskTitle: result.invite.task.title,
      canEdit: result.invite.canEdit,
      invitedBy: {
        name: result.invite.creator.name,
        image: result.invite.creator.image,
      },
      expiresAt: result.invite.expiresAt,
    })
  } catch (error) {
    console.error('Failed to validate invite:', error)
    return NextResponse.json({ error: 'Failed to validate invite' }, { status: 500 })
  }
}

// POST: Accept the invite (requires auth)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await params

    const result = await acceptInvite(token, session.user.id)

    return NextResponse.json({
      success: true,
      taskId: result.task.id,
      taskTitle: result.task.title,
      alreadyCollaborator: result.alreadyCollaborator,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return NextResponse.json({ error: error.message }, { status: 410 })
      }
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('owner') || error.message.includes('already')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    console.error('Failed to accept invite:', error)
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 })
  }
}

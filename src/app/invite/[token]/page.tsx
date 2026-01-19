import type { Metadata } from 'next'
import { getSession } from '@/lib/auth-server'
import { validateInvite } from '@/lib/invites'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AcceptInviteButton } from './accept-invite-button'
import { CircleDot, Pencil, Eye, Clock } from 'lucide-react'
import Link from 'next/link'
import { getInviteForOG } from '@/lib/og/data'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const invite = await getInviteForOG(token)

  if (!invite || invite.expired) {
    return {
      title: 'Invalid Invite',
    }
  }

  return {
    title: `Join "${invite.taskTitle}"`,
    description: `${invite.inviterName} invited you to collaborate`,
  }
}

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const session = await getSession()

  // Validate the invite
  const result = await validateInvite(token)

  if (!result.valid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="p-3 rounded-2xl bg-destructive/10 inline-block">
            <CircleDot className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">
            {result.error === 'Invite has expired' ? 'Invite Expired' : 'Invalid Invite'}
          </h1>
          <p className="text-muted-foreground">
            {result.error === 'Invite has expired'
              ? 'This invite link has expired. Please ask the task owner for a new invite.'
              : 'This invite link is not valid. It may have been revoked or the task may have been deleted.'}
          </p>
          <Link
            href={session?.user ? '/dashboard' : '/'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            {session?.user ? 'Go to Dashboard' : 'Go Home'}
          </Link>
        </div>
      </div>
    )
  }

  const { invite } = result

  // Calculate days until expiry
  const expiresAt = new Date(invite.expiresAt)
  const now = new Date()
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-2xl bg-primary/10">
            <CircleDot className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">WheelDo</h1>
        </div>

        {/* Invite card */}
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">You&apos;ve been invited!</h2>
            <p className="text-muted-foreground text-sm">
              to collaborate on a task
            </p>
          </div>

          {/* Task info */}
          <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Task
              </p>
              <p className="font-medium text-lg">{invite.task.title}</p>
            </div>

            <div className="flex items-center gap-3">
              <Avatar
                user={invite.creator}
                size="sm"
              />
              <div>
                <p className="text-sm">
                  Invited by <span className="font-medium">{invite.creator.name || invite.creator.email}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Permission badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Permission level</span>
            <Badge variant="outline" className="gap-1">
              {invite.canEdit ? (
                <>
                  <Pencil className="h-3 w-3" />
                  Can edit
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" />
                  Can view
                </>
              )}
            </Badge>
          </div>

          {/* Expiry notice */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {daysRemaining === 1
                ? 'Expires tomorrow'
                : `Expires in ${daysRemaining} days`}
            </span>
          </div>

          {/* Action buttons */}
          {session?.user ? (
            <AcceptInviteButton token={token} />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Sign in to accept this invite
              </p>
              <Link
                href={`/login?callbackUrl=/invite/${token}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Sign in with GitHub
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

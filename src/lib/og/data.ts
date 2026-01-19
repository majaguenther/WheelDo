'server-only'

import { db } from '@/lib/db'
import type { InviteOGData } from './types'

export async function getInviteForOG(token: string): Promise<InviteOGData | null> {
  const invite = await db.taskInvite.findUnique({
    where: { token },
    select: {
      canEdit: true,
      expiresAt: true,
      task: {
        select: {
          title: true,
        },
      },
      creator: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  })

  if (!invite) {
    return null
  }

  const expired = new Date() > new Date(invite.expiresAt)

  return {
    taskTitle: invite.task.title,
    inviterName: invite.creator.name || 'Someone',
    inviterImage: invite.creator.image,
    canEdit: invite.canEdit,
    expired,
  }
}

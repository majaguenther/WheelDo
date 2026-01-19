import 'server-only'

import { db } from '@/lib/db'
import { fetchImageAsBase64 } from './utils'
import type { InviteOGData } from './types'

export async function getInviteForOG(token: string): Promise<InviteOGData | null> {
  try {
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

    // Pre-fetch avatar as base64 (prevents ImageResponse I/O issues)
    const avatarBase64 = await fetchImageAsBase64(invite.creator.image)

    const expired = new Date() > new Date(invite.expiresAt)

    return {
      taskTitle: invite.task.title,
      inviterName: invite.creator.name || 'Someone',
      inviterImage: avatarBase64, // Now base64 or null
      canEdit: invite.canEdit,
      expired,
    }
  } catch (error) {
    console.error('Failed to fetch invite for OG:', error)
    return null
  }
}

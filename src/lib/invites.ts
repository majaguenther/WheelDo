import 'server-only'
import { randomBytes } from 'crypto'
import { db } from './db'
import { createNotification } from './notifications'

const INVITE_EXPIRY_DAYS = 7
const MAX_INVITES_PER_TASK = 10

/**
 * Generate a cryptographically secure invite token
 */
export function generateInviteToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Create an invite for a task
 */
export async function createInvite(
  taskId: string,
  canEdit: boolean,
  createdBy: string
): Promise<{ id: string; token: string; canEdit: boolean; expiresAt: Date }> {
  // Check if task exists and user is owner
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { userId: true, title: true },
  })

  if (!task) {
    throw new Error('Task not found')
  }

  if (task.userId !== createdBy) {
    throw new Error('Only the task owner can create invites')
  }

  // Check invite limit
  const existingInvites = await db.taskInvite.count({
    where: { taskId },
  })

  if (existingInvites >= MAX_INVITES_PER_TASK) {
    throw new Error(`Maximum of ${MAX_INVITES_PER_TASK} invites per task reached`)
  }

  const token = generateInviteToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS)

  const invite = await db.taskInvite.create({
    data: {
      token,
      taskId,
      createdBy,
      canEdit,
      expiresAt,
    },
  })

  return {
    id: invite.id,
    token: invite.token,
    canEdit: invite.canEdit,
    expiresAt: invite.expiresAt,
  }
}

/**
 * Validate an invite token
 */
export async function validateInvite(token: string) {
  const invite = await db.taskInvite.findUnique({
    where: { token },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          userId: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  if (!invite) {
    return { valid: false, error: 'Invite not found' } as const
  }

  if (new Date() > invite.expiresAt) {
    return { valid: false, error: 'Invite has expired' } as const
  }

  return {
    valid: true,
    invite: {
      id: invite.id,
      canEdit: invite.canEdit,
      expiresAt: invite.expiresAt,
      task: invite.task,
      creator: invite.creator,
    },
  } as const
}

/**
 * Accept an invite and become a collaborator
 */
export async function acceptInvite(token: string, userId: string) {
  const validation = await validateInvite(token)

  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const { invite } = validation

  // Check if user is already the owner
  if (invite.task.userId === userId) {
    throw new Error('You are already the owner of this task')
  }

  // Check if user is already a collaborator
  const existingCollaborator = await db.taskCollaborator.findUnique({
    where: {
      taskId_userId: {
        taskId: invite.task.id,
        userId,
      },
    },
  })

  if (existingCollaborator) {
    // Update permissions if invite grants higher access
    if (invite.canEdit && !existingCollaborator.canEdit) {
      await db.taskCollaborator.update({
        where: { id: existingCollaborator.id },
        data: { canEdit: true },
      })
    }
    return { task: invite.task, alreadyCollaborator: true }
  }

  // Get the accepting user's info for notification
  const acceptingUser = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  })

  // Create collaborator
  await db.taskCollaborator.create({
    data: {
      taskId: invite.task.id,
      userId,
      canEdit: invite.canEdit,
      invitedBy: invite.creator.id,
    },
  })

  // Notify task owner
  await createNotification({
    userId: invite.task.userId,
    type: 'COLLABORATOR_JOINED',
    title: 'New collaborator',
    message: `${acceptingUser?.name || acceptingUser?.email || 'Someone'} joined "${invite.task.title}"`,
    taskId: invite.task.id,
  })

  return { task: invite.task, alreadyCollaborator: false }
}

/**
 * Get all active invites for a task
 */
export async function getTaskInvites(taskId: string, ownerId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { userId: true },
  })

  if (!task || task.userId !== ownerId) {
    throw new Error('Only the task owner can view invites')
  }

  return db.taskInvite.findMany({
    where: {
      taskId,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      token: true,
      canEdit: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Revoke an invite
 */
export async function revokeInvite(inviteId: string, userId: string) {
  const invite = await db.taskInvite.findUnique({
    where: { id: inviteId },
    include: {
      task: {
        select: { userId: true },
      },
    },
  })

  if (!invite) {
    throw new Error('Invite not found')
  }

  if (invite.task.userId !== userId) {
    throw new Error('Only the task owner can revoke invites')
  }

  await db.taskInvite.delete({
    where: { id: inviteId },
  })
}

/**
 * Clean up expired invites (can be called periodically)
 */
export async function cleanupExpiredInvites() {
  await db.taskInvite.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
}

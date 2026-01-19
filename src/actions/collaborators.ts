'use server'

import {revalidateTag} from 'next/cache'
import {db} from '@/lib/db'
import {getCurrentUser} from '@/data/auth'
import {isTaskOwnerById} from '@/data/tasks'
import {createNotification} from '@/lib/notifications'
import {
    ActionError,
    withActionErrorHandling,
    type ActionResult,
} from '@/core/errors/action-error'

/**
 * Update a collaborator's permission (canEdit)
 * Only the task owner can change collaborator permissions
 */
export async function updateCollaboratorPermission(
    taskId: string,
    targetUserId: string,
    canEdit: boolean
): Promise<ActionResult<{ collaborator: { userId: string; canEdit: boolean } }>> {
    return withActionErrorHandling(async () => {
        const user = await getCurrentUser()
        if (!user) {
            throw new ActionError('UNAUTHORIZED', 'Authentication required')
        }

        if (!taskId || !targetUserId) {
            throw new ActionError('VALIDATION_ERROR', 'taskId, targetUserId, and canEdit are required')
        }

        // Only owner can change permissions
        const isOwner = await isTaskOwnerById(user.id, taskId)
        if (!isOwner) {
            throw new ActionError('FORBIDDEN', 'Only the task owner can change collaborator permissions')
        }

        // Update the collaborator's permission
        const collaborator = await db.taskCollaborator.update({
            where: {
                taskId_userId: {taskId, userId: targetUserId},
            },
            data: {canEdit},
            include: {
                user: {
                    select: {id: true, name: true, email: true, image: true},
                },
            },
        })

        // Invalidate cache for the collaborator whose permissions changed
        revalidateTag(`tasks:${targetUserId}`, 'max')

        return {
            collaborator: {
                userId: collaborator.userId,
                canEdit: collaborator.canEdit,
            },
        }
    })
}

/**
 * Remove a collaborator from a task
 * Owner can remove any collaborator, collaborators can remove themselves
 */
export async function removeCollaborator(
    taskId: string,
    targetUserId: string
): Promise<ActionResult<{ success: true }>> {
    return withActionErrorHandling(async () => {
        const user = await getCurrentUser()
        if (!user) {
            throw new ActionError('UNAUTHORIZED', 'Authentication required')
        }

        if (!taskId || !targetUserId) {
            throw new ActionError('VALIDATION_ERROR', 'taskId and targetUserId are required')
        }

        // Check authorization
        const isOwner = await isTaskOwnerById(user.id, taskId)
        const isSelf = targetUserId === user.id

        if (!isOwner && !isSelf) {
            throw new ActionError(
                'FORBIDDEN',
                'Only the task owner can remove collaborators, or you can remove yourself'
            )
        }

        // Get task info for notification
        const task = await db.task.findUnique({
            where: {id: taskId},
            select: {title: true, userId: true},
        })

        // Get user info for notification
        const removedUser = await db.user.findUnique({
            where: {id: targetUserId},
            select: {name: true, email: true},
        })

        // Remove the collaborator
        await db.taskCollaborator.delete({
            where: {
                taskId_userId: {taskId, userId: targetUserId},
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

        // Invalidate caches for affected users
        revalidateTag(`tasks:${targetUserId}`, 'max') // Removed collaborator
        if (task) {
            revalidateTag(`tasks:${task.userId}`, 'max') // Task owner
        }

        return {success: true}
    })
}

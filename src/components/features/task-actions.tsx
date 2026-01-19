'use client'

import { useState, useEffect, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, Check, Trash2, Users, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
import { ShareTaskModal } from './share-task-modal'
import {
  startTaskFormAction,
  completeTaskFormAction,
  deferTaskFormAction,
  revertTaskFormAction,
  deleteTaskFormAction,
} from '@/actions/tasks'
import type { TaskStatus } from '@/generated/prisma/client'

interface TaskActionsProps {
  task: {
    id: string
    title: string
    status: TaskStatus
  }
  role?: 'owner' | 'editor' | 'viewer'
  onEditClick?: () => void
}

export function TaskActions({ task, role = 'owner', onEditClick }: TaskActionsProps) {
  const router = useRouter()
  const [showShareModal, setShowShareModal] = useState(false)
  const isOwner = role === 'owner'
  const canEdit = role === 'owner' || role === 'editor'

  // Action states for each operation
  const [startState, startAction, isStartPending] = useActionState(startTaskFormAction, null)
  const [completeState, completeAction, isCompletePending] = useActionState(completeTaskFormAction, null)
  const [deferState, deferAction, isDeferPending] = useActionState(deferTaskFormAction, null)
  const [revertState, revertAction, isRevertPending] = useActionState(revertTaskFormAction, null)
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteTaskFormAction, null)

  // Refresh router on success (for non-redirect actions)
  useEffect(() => {
    if (startState?.success || deferState?.success || revertState?.success) {
      router.refresh()
    }
  }, [startState?.success, deferState?.success, revertState?.success, router])

  // Log errors to console
  useEffect(() => {
    if (startState?.error) console.error('Failed to start task:', startState.error.message)
    if (completeState?.error) console.error('Failed to complete task:', completeState.error.message)
    if (deferState?.error) console.error('Failed to defer task:', deferState.error.message)
    if (revertState?.error) console.error('Failed to revert task:', revertState.error.message)
    if (deleteState?.error) console.error('Failed to delete task:', deleteState.error.message)
  }, [startState?.error, completeState?.error, deferState?.error, revertState?.error, deleteState?.error])

  const isPending = isStartPending || isCompletePending || isDeferPending || isRevertPending || isDeletePending

  const isInProgress = task.status === 'IN_PROGRESS'
  const isCompleted = task.status === 'COMPLETED'

  return (
    <>
      <div className={`flex flex-wrap gap-3 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Edit button - visible for owner/editor, hidden for completed tasks */}
        {canEdit && !isCompleted && onEditClick && (
          <Button onClick={onEditClick} variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}

        {/* Start Task */}
        {canEdit && !isCompleted && !isInProgress && (
          <form action={startAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <SubmitButton className="gap-2" pendingText="Starting...">
              <Play className="h-4 w-4" />
              Start Task
            </SubmitButton>
          </form>
        )}

        {/* Defer and Complete (when in progress) */}
        {canEdit && isInProgress && (
          <>
            <form action={deferAction}>
              <input type="hidden" name="taskId" value={task.id} />
              <SubmitButton variant="outline" className="gap-2" pendingText="Deferring...">
                <Pause className="h-4 w-4" />
                Defer
              </SubmitButton>
            </form>
            <form action={completeAction}>
              <input type="hidden" name="taskId" value={task.id} />
              <SubmitButton className="gap-2" pendingText="Completing...">
                <Check className="h-4 w-4" />
                Complete
              </SubmitButton>
            </form>
          </>
        )}

        {/* Reopen (when completed) */}
        {canEdit && isCompleted && (
          <form action={revertAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <SubmitButton variant="outline" className="gap-2" pendingText="Reopening...">
              Reopen Task
            </SubmitButton>
          </form>
        )}

        {/* Share button - visible to everyone but full control for owner */}
        <Button
          onClick={() => setShowShareModal(true)}
          variant="outline"
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          {isOwner ? 'Share' : 'Collaborators'}
        </Button>

        {/* Delete (owner only) */}
        {isOwner && (
          <form action={deleteAction} className="ml-auto">
            <input type="hidden" name="taskId" value={task.id} />
            <SubmitButton
              variant="destructive"
              className="gap-2"
              pendingText="Deleting..."
              onClick={(e) => {
                if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                  e.preventDefault()
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </SubmitButton>
          </form>
        )}
      </div>

      <ShareTaskModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        taskId={task.id}
        taskTitle={task.title}
        isOwner={isOwner}
      />
    </>
  )
}

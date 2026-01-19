'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, Check, Trash2, Users, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareTaskModal } from './share-task-modal'
import { startTask, completeTask, deferTask, revertTask, deleteTask as deleteTaskAction } from '@/actions/tasks'
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
  const [isPending, startTransition] = useTransition()
  const [showShareModal, setShowShareModal] = useState(false)
  const isOwner = role === 'owner'
  const canEdit = role === 'owner' || role === 'editor'

  const handleUpdateStatus = async (status: TaskStatus) => {
    startTransition(async () => {
      let result
      switch (status) {
        case 'IN_PROGRESS':
          result = await startTask(task.id)
          break
        case 'COMPLETED':
          result = await completeTask(task.id)
          break
        case 'DEFERRED':
          result = await deferTask(task.id)
          break
        case 'PENDING':
          result = await revertTask(task.id)
          break
        default:
          console.error('Unknown status:', status)
          return
      }

      if (!result.success) {
        console.error('Failed to update task:', result.error.message)
        return
      }

      router.refresh()
      if (status === 'COMPLETED') {
        router.push('/dashboard')
      }
    })
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return
    }

    startTransition(async () => {
      const result = await deleteTaskAction(task.id)

      if (!result.success) {
        console.error('Failed to delete task:', result.error.message)
        return
      }

      router.push('/dashboard')
      router.refresh()
    })
  }

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

        {canEdit && !isCompleted && !isInProgress && (
          <Button onClick={() => handleUpdateStatus('IN_PROGRESS')} className="gap-2">
            <Play className="h-4 w-4" />
            Start Task
          </Button>
        )}

        {canEdit && isInProgress && (
          <>
            <Button onClick={() => handleUpdateStatus('DEFERRED')} variant="outline" className="gap-2">
              <Pause className="h-4 w-4" />
              Defer
            </Button>
            <Button onClick={() => handleUpdateStatus('COMPLETED')} className="gap-2">
              <Check className="h-4 w-4" />
              Complete
            </Button>
          </>
        )}

        {canEdit && isCompleted && (
          <Button onClick={() => handleUpdateStatus('PENDING')} variant="outline" className="gap-2">
            Reopen Task
          </Button>
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

        {isOwner && (
          <Button onClick={handleDelete} variant="destructive" className="gap-2 ml-auto">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
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

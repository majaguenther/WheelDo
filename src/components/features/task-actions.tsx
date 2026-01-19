'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, Check, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareTaskModal } from './share-task-modal'
import type { Task, TaskStatus } from '@/generated/prisma/client'

interface TaskActionsProps {
  task: Task
  role?: 'owner' | 'editor' | 'viewer'
}

export function TaskActions({ task, role = 'owner' }: TaskActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showShareModal, setShowShareModal] = useState(false)
  const isOwner = role === 'owner'
  const canEdit = role === 'owner' || role === 'editor'

  const updateStatus = async (status: TaskStatus) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })

        if (!res.ok) throw new Error('Failed to update task')

        router.refresh()
        if (status === 'COMPLETED') {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to update task:', error)
      }
    })
  }

  const deleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: 'DELETE',
        })

        if (!res.ok) throw new Error('Failed to delete task')

        router.push('/dashboard')
        router.refresh()
      } catch (error) {
        console.error('Failed to delete task:', error)
      }
    })
  }

  const isInProgress = task.status === 'IN_PROGRESS'
  const isCompleted = task.status === 'COMPLETED'

  return (
    <>
      <div className={`flex flex-wrap gap-3 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
        {canEdit && !isCompleted && !isInProgress && (
          <Button onClick={() => updateStatus('IN_PROGRESS')} className="gap-2">
            <Play className="h-4 w-4" />
            Start Task
          </Button>
        )}

        {canEdit && isInProgress && (
          <>
            <Button onClick={() => updateStatus('PENDING')} variant="outline" className="gap-2">
              <Pause className="h-4 w-4" />
              Defer
            </Button>
            <Button onClick={() => updateStatus('COMPLETED')} className="gap-2">
              <Check className="h-4 w-4" />
              Complete
            </Button>
          </>
        )}

        {canEdit && isCompleted && (
          <Button onClick={() => updateStatus('PENDING')} variant="outline" className="gap-2">
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
          <Button onClick={deleteTask} variant="destructive" className="gap-2 ml-auto">
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

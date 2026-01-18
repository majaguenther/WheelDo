'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Task, TaskStatus } from '@prisma/client'

interface TaskActionsProps {
  task: Task
}

export function TaskActions({ task }: TaskActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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
    <div className={`flex flex-wrap gap-3 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
      {!isCompleted && !isInProgress && (
        <Button onClick={() => updateStatus('IN_PROGRESS')} className="gap-2">
          <Play className="h-4 w-4" />
          Start Task
        </Button>
      )}

      {isInProgress && (
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

      {isCompleted && (
        <Button onClick={() => updateStatus('PENDING')} variant="outline" className="gap-2">
          Reopen Task
        </Button>
      )}

      <Button onClick={deleteTask} variant="destructive" className="gap-2 ml-auto">
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
    </div>
  )
}

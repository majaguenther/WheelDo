'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TaskCard } from './task-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { ListTodo, Plus, Filter } from 'lucide-react'
import { startTask, completeTask, deferTask, revertTask } from '@/actions/tasks'
import type { TaskDTO } from '@/data/dto/task.types'
import type { TaskStatus } from '@/generated/prisma/client'

interface TaskListProps {
  tasks: TaskDTO[]
  activeTaskId?: string | null
  onCreateTask?: () => void
}

export function TaskList({ tasks, activeTaskId, onCreateTask }: TaskListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'mine' | 'shared'>('all')

  // Memoize active task lookup
  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId),
    [tasks, activeTaskId]
  )

  // Memoize other tasks filtering
  const otherTasks = useMemo(
    () => tasks.filter((t) => t.id !== activeTaskId && t.parentId === null),
    [tasks, activeTaskId]
  )

  // Memoize filtered tasks by ownership
  const filteredTasks = useMemo(() => {
    return otherTasks.filter((task) => {
      // Always exclude completed tasks from the main list
      if (task.status === 'COMPLETED') return false
      // Apply ownership filter
      if (ownershipFilter === 'mine') return task.role === 'owner'
      if (ownershipFilter === 'shared') return task.role !== 'owner'
      return true
    })
  }, [otherTasks, ownershipFilter])

  // Memoize status change handler
  const handleStatusChange = useCallback(
    async (taskId: string, status: TaskStatus) => {
      startTransition(async () => {
        let result
        switch (status) {
          case 'IN_PROGRESS':
            result = await startTask(taskId)
            break
          case 'COMPLETED':
            result = await completeTask(taskId)
            break
          case 'DEFERRED':
            result = await deferTask(taskId)
            break
          case 'PENDING':
            result = await revertTask(taskId)
            break
          default:
            console.error('Unknown status:', status)
            return
        }

        if (!result.success) {
          console.error('Failed to update task:', result.error.message)
        }

        router.refresh()
      })
    },
    [router]
  )

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<ListTodo className="h-8 w-8" />}
        title="No tasks yet"
        description="Create your first task to get started. Remember, you can only work on one task at a time!"
        action={
          onCreateTask && (
            <Button onClick={onCreateTask}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )
        }
      />
    )
  }

  return (
    <div className={isPending ? 'opacity-50 pointer-events-none' : ''}>
      {/* Active task */}
      {activeTask && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Currently Working On
          </h2>
          <TaskCard
            task={activeTask}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      {/* Ownership filter tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2" role="group" aria-label="Task ownership filter">
          <button
            onClick={() => setOwnershipFilter('all')}
            aria-pressed={ownershipFilter === 'all'}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              ownershipFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setOwnershipFilter('mine')}
            aria-pressed={ownershipFilter === 'mine'}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              ownershipFilter === 'mine'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            My Tasks
          </button>
          <button
            onClick={() => setOwnershipFilter('shared')}
            aria-pressed={ownershipFilter === 'shared'}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              ownershipFilter === 'shared'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            Shared
          </button>
        </div>
        <Button variant="ghost" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <EmptyState
          title="No tasks match your filter"
          description="Try adjusting your filters or create a new task."
        />
      )}
    </div>
  )
}

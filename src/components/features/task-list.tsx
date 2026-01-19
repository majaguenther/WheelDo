'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TaskCard } from './task-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { ListTodo, Plus, Filter } from 'lucide-react'
import { updateTaskStatus } from '@/actions/tasks'
import type { TaskDTO } from '@/data/dto/task.dto'
import type { TaskStatus } from '@/generated/prisma/client'

interface TaskListProps {
  tasks: TaskDTO[]
  activeTaskId?: string | null
  onCreateTask?: () => void
}

export function TaskList({ tasks, activeTaskId, onCreateTask }: TaskListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress'>('all')

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

  // Memoize filtered tasks
  const filteredTasks = useMemo(() => {
    return otherTasks.filter((task) => {
      if (filter === 'all') return task.status !== 'COMPLETED'
      if (filter === 'pending') return task.status === 'PENDING'
      if (filter === 'in_progress') return task.status === 'IN_PROGRESS'
      return true
    })
  }, [otherTasks, filter])

  // Memoize status change handler
  const handleStatusChange = useCallback(
    async (taskId: string, status: TaskStatus) => {
      startTransition(async () => {
        const result = await updateTaskStatus({ taskId, status })

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

      {/* Filter tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'pending'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            Pending
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

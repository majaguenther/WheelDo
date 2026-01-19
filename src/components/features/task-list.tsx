'use client'

import { useMemo } from 'react'
import { TaskCard } from './task-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { ListTodo, Plus } from 'lucide-react'
import type { TaskDTO } from '@/data/dto/task.types'

interface TaskListProps {
  tasks: TaskDTO[]
  activeTaskId?: string | null
  onCreateTask?: () => void
}

export function TaskList({ tasks, activeTaskId, onCreateTask }: TaskListProps) {
  // Memoize active task lookup
  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId),
    [tasks, activeTaskId]
  )

  // Memoize other tasks filtering - flat list (no tree structure)
  // Children appear as regular cards alongside parents
  const otherTasks = useMemo(
    () => tasks.filter((t) => t.id !== activeTaskId),
    [tasks, activeTaskId]
  )

  // Memoize filtered tasks (exclude completed)
  const filteredTasks = useMemo(() => {
    return otherTasks.filter((task) => task.status !== 'COMPLETED')
  }, [otherTasks])

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
    <div>
      {/* Active task */}
      {activeTask && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Currently Working On
          </h2>
          <TaskCard task={activeTask} />
        </div>
      )}

      {/* Task list */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
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

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Calendar, Clock, Search, Check, Trash2 } from 'lucide-react'
import { cn, formatDuration } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { revertTask, deleteTask } from '@/actions/tasks'
import type { TaskDTO } from '@/data/dto/task.dto'

interface HistoryListProps {
  tasks: TaskDTO[]
}

export function HistoryList({ tasks }: HistoryListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase()) ||
    task.body?.toLowerCase().includes(search.toLowerCase())
  )

  // Group tasks by date
  const groupedTasks = filteredTasks.reduce((groups, task) => {
    const date = task.completedAt
      ? new Date(task.completedAt).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Unknown date'

    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(task)
    return groups
  }, {} as Record<string, TaskDTO[]>)

  const handleRevert = async (taskId: string) => {
    startTransition(async () => {
      const result = await revertTask(taskId)
      if (!result.success) {
        console.error('Failed to revert task:', result.error.message)
      }
      router.refresh()
    })
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task permanently?')) {
      return
    }

    startTransition(async () => {
      const result = await deleteTask(taskId)
      if (!result.success) {
        console.error('Failed to delete task:', result.error.message)
      }
      router.refresh()
    })
  }

  return (
    <div className={cn(isPending && 'opacity-50 pointer-events-none')}>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search completed tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grouped task list */}
      <div className="space-y-8">
        {Object.entries(groupedTasks).map(([date, dateTasks]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm text-muted-foreground">{date}</h3>
              <Badge variant="secondary" className="text-xs">
                {dateTasks.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {dateTasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  {/* Check icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-through text-muted-foreground">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {task.category && (
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${task.category.color}20`, color: task.category.color }}
                        >
                          {task.category.name}
                        </span>
                      )}
                      {task.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(task.duration)}
                        </span>
                      )}
                      {task.completedAt && (
                        <span>
                          {new Date(task.completedAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRevert(task.id)}
                      title="Revert to pending"
                      className="h-8 w-8"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(task.id)}
                      title="Delete permanently"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && search && (
        <p className="text-center text-muted-foreground py-8">
          No tasks found matching &quot;{search}&quot;
        </p>
      )}
    </div>
  )
}

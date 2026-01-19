'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Clock,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Check,
  Zap,
  AlertCircle,
} from 'lucide-react'
import { cn, formatDuration, formatRelativeTime, getDeadlineColor } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Task, Category, Urgency, Effort, TaskStatus } from '@/generated/prisma/client'

interface TaskCardProps {
  task: Task & {
    category: Category | null
    children: Task[]
  }
  onStatusChange?: (taskId: string, status: TaskStatus) => void
  showChildren?: boolean
  isChild?: boolean
}

const urgencyColors: Record<Urgency, string> = {
  HIGH: 'border-l-red-500',
  MEDIUM: 'border-l-yellow-500',
  LOW: 'border-l-green-500',
}

const effortIcons: Record<Effort, { icon: typeof Zap; count: number }> = {
  MINIMAL: { icon: Zap, count: 1 },
  LOW: { icon: Zap, count: 2 },
  MODERATE: { icon: Zap, count: 3 },
  HIGH: { icon: Zap, count: 4 },
  EXTREME: { icon: Zap, count: 5 },
}

// Safely parse location - handles both JSON objects and plain text
function parseLocation(location: string): string {
  try {
    const parsed = JSON.parse(location)
    return parsed.formatted?.split(',')[0] || parsed.name || location
  } catch {
    // If JSON parsing fails, treat it as plain text
    return location
  }
}

export function TaskCard({
  task,
  onStatusChange,
  showChildren = true,
  isChild = false,
}: TaskCardProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = task.children && task.children.length > 0
  const deadlineColor = getDeadlineColor(task.deadline)
  const isInProgress = task.status === 'IN_PROGRESS'
  const isCompleted = task.status === 'COMPLETED'

  const handleCardClick = () => {
    router.push(`/tasks/${task.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardClick()
    }
  }

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStatusChange?.(task.id, 'IN_PROGRESS')
  }

  const handleDefer = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStatusChange?.(task.id, 'PENDING')
  }

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStatusChange?.(task.id, 'COMPLETED')
  }

  return (
    <div className={cn('space-y-2', isChild && 'ml-6 md:ml-8')}>
      <div
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="link"
        tabIndex={0}
        className={cn(
          'group relative rounded-lg border bg-card p-4 transition-shadow hover:shadow-md border-l-4 cursor-pointer',
          urgencyColors[task.urgency],
          isInProgress && 'ring-2 ring-primary ring-offset-2 bg-primary/5',
          isCompleted && 'opacity-60'
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Expand/collapse for children */}
          {hasChildren && showChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="mt-1 p-0.5 rounded hover:bg-secondary"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'font-medium',
                  isCompleted && 'line-through'
                )}
              >
                {task.title}
              </span>
              {isInProgress && (
                <Badge variant="default" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  In Progress
                </Badge>
              )}
              {task.category && (
                <Badge
                  variant="outline"
                  style={{ borderColor: task.category.color, color: task.category.color }}
                >
                  {task.category.name}
                </Badge>
              )}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {/* Duration */}
              {task.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(task.duration)}
                </span>
              )}

              {/* Location */}
              {task.location && (
                <span className="flex items-center gap-1 truncate max-w-[150px]">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {parseLocation(task.location)}
                  </span>
                </span>
              )}

              {/* Deadline */}
              {task.deadline && (
                <span
                  className={cn(
                    'flex items-center gap-1 px-1.5 py-0.5 rounded',
                    deadlineColor
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {formatRelativeTime(new Date(task.deadline))}
                </span>
              )}

              {/* Effort */}
              <span className="flex items-center gap-0.5">
                {Array.from({ length: effortIcons[task.effort].count }).map((_, i) => (
                  <Zap
                    key={i}
                    className="h-3 w-3 fill-current text-yellow-500"
                  />
                ))}
              </span>
            </div>

            {/* Body preview */}
            {task.body && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {task.body}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isCompleted && !isInProgress && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleStart}
                title="Start task"
                className="h-8 w-8"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            {isInProgress && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDefer}
                  title="Defer task"
                  className="h-8 w-8"
                >
                  <Pause className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="default"
                  onClick={handleComplete}
                  title="Complete task"
                  className="h-8 w-8"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && showChildren && isExpanded && (
        <div className="space-y-2">
          {task.children.map((child) => (
            <TaskCard
              key={child.id}
              task={child as Task & { category: Category | null; children: Task[] }}
              onStatusChange={onStatusChange}
              showChildren={false}
              isChild
            />
          ))}
        </div>
      )}
    </div>
  )
}

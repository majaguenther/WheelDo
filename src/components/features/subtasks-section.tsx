'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Plus, Circle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SubtaskProgressBadge } from './subtask-progress-badge'
import { Button } from '@/components/ui/button'
import type { ChildTaskDTO } from '@/data/dto/task.types'

interface SubtasksSectionProps {
  subtasks: ChildTaskDTO[]
  onAddSubtask?: () => void
}

/**
 * GitHub-style collapsible subtasks section for task detail page
 * Shows progress badge and list of subtasks with status icons
 */
export function SubtasksSection({ subtasks, onAddSubtask }: SubtasksSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (subtasks.length === 0 && !onAddSubtask) return null

  const completed = subtasks.filter((c) => c.status === 'COMPLETED').length
  const total = subtasks.length

  const urgencyColors = {
    HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-secondary/30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-secondary rounded transition-colors"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                !isExpanded && '-rotate-90'
              )}
            />
          </button>
          <h3 className="font-semibold text-sm">Subtasks</h3>
        </div>
        {total > 0 && (
          <SubtaskProgressBadge completed={completed} total={total} />
        )}
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="divide-y">
          {/* Subtask list */}
          {subtasks.map((child) => (
            <Link
              key={child.id}
              href={`/tasks/${child.id}`}
              className="flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors"
            >
              {/* Status icon */}
              {child.status === 'COMPLETED' ? (
                <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
              ) : child.status === 'IN_PROGRESS' ? (
                <div className="relative h-5 w-5 flex-shrink-0">
                  <Circle className="h-5 w-5 text-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  </div>
                </div>
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}

              {/* Title */}
              <span
                className={cn(
                  'flex-1 truncate',
                  child.status === 'COMPLETED' && 'line-through text-muted-foreground'
                )}
              >
                {child.title}
              </span>

              {/* Urgency badge */}
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full capitalize',
                  urgencyColors[child.urgency]
                )}
              >
                {child.urgency.toLowerCase()}
              </span>
            </Link>
          ))}

          {/* Add subtask button */}
          {onAddSubtask && (
            <div className="p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onAddSubtask}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create subtask
              </Button>
            </div>
          )}

          {/* Empty state */}
          {subtasks.length === 0 && onAddSubtask && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No subtasks yet. Create one to break this task into smaller pieces.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

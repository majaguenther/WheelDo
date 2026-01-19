'use client'

import { cn } from '@/lib/utils'

interface SubtaskProgressBadgeProps {
  completed: number
  total: number
  className?: string
}

/**
 * GitHub-style progress indicator for subtask completion
 * Shows circular progress ring with completed/total count
 */
export function SubtaskProgressBadge({ completed, total, className }: SubtaskProgressBadgeProps) {
  if (total === 0) return null

  const percent = Math.round((completed / total) * 100)
  const isComplete = completed === total
  const circumference = 2 * Math.PI * 6 // r=6
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium',
        isComplete
          ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-400'
          : 'bg-secondary/50 border-border text-muted-foreground',
        className
      )}
      title={`${percent}% completed (${completed} of ${total} subtasks)`}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" className="flex-shrink-0">
        {/* Background circle */}
        <circle
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          cx="8"
          cy="8"
          r="6"
          className="opacity-20"
        />
        {/* Progress circle */}
        <circle
          stroke={isComplete ? '#8b5cf6' : 'hsl(var(--primary))'}
          strokeWidth="2"
          fill="transparent"
          cx="8"
          cy="8"
          r="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 8 8)"
          className="transition-all duration-300"
        />
        {/* Checkmark when complete */}
        {isComplete && (
          <path
            d="M5.5 8L7 9.5L10.5 6"
            stroke="#8b5cf6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>
      <span>{completed}/{total}</span>
    </div>
  )
}

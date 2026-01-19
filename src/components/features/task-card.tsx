'use client'

import {useMemo, memo, useEffect, useActionState} from 'react'
import {useRouter} from 'next/navigation'
import {
    Clock,
    MapPin,
    Calendar,
    Play,
    Pause,
    Check,
    Zap,
    AlertCircle,
    Users,
    Lock,
    Loader2,
} from 'lucide-react'
import {cn, formatDuration, formatRelativeTime, getDeadlineColor} from '@/lib/utils'
import {Badge} from '@/components/ui/badge'
import {SubtaskProgressBadge} from './subtask-progress-badge'
import {
    startTaskFormAction,
    deferTaskFormAction,
    completeTaskFormAction,
} from '@/actions/tasks'
import type {TaskDTO} from '@/data/dto/task.types'
import type {Urgency, Effort} from '@/generated/prisma/client'

interface TaskCardProps {
    task: TaskDTO
}

const urgencyColors: Record<Urgency, string> = {
    HIGH: 'border-l-red-500',
    MEDIUM: 'border-l-yellow-500',
    LOW: 'border-l-green-500',
}

const effortIcons: Record<Effort, { icon: typeof Zap; count: number }> = {
    MINIMAL: {icon: Zap, count: 1},
    LOW: {icon: Zap, count: 2},
    MODERATE: {icon: Zap, count: 3},
    HIGH: {icon: Zap, count: 4},
    EXTREME: {icon: Zap, count: 5},
}

// Safely parse location - handles both JSON objects and plain text
function parseLocation(location: string): string {
    try {
        const parsed = JSON.parse(location)
        return parsed.formatted?.split(',')[0] || parsed.name || location
    } catch {
        return location
    }
}

// Action button component with form
function ActionButton({
                          action,
                          taskId,
                          icon: Icon,
                          title,
                          variant = 'ghost',
                          disabled,
                      }: {
    action: typeof startTaskFormAction
    taskId: string
    icon: typeof Play
    title: string
    variant?: 'ghost' | 'default'
    disabled?: boolean
}) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(action, null)

    useEffect(() => {
        if (state?.success) {
            router.refresh()
        }
    }, [state?.success, router])

    return (
        <form action={formAction} onClick={(e) => e.stopPropagation()}>
            <input type="hidden" name="taskId" value={taskId}/>
            <button
                type="submit"
                disabled={disabled || isPending}
                title={title}
                className={cn(
                    'inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                    variant === 'ghost' && 'hover:bg-secondary hover:text-secondary-foreground',
                    variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin"/>
                ) : (
                    <Icon className="h-4 w-4"/>
                )}
            </button>
        </form>
    )
}

export const TaskCard = memo(function TaskCard({task}: TaskCardProps) {
    const router = useRouter()

    const deadlineColor = useMemo(
        () => getDeadlineColor(task.deadline),
        [task.deadline]
    )
    const isInProgress = task.status === 'IN_PROGRESS'
    const isCompleted = task.status === 'COMPLETED'
    const canEdit = task.canEdit
    const isShared = task.role !== 'owner'

    // Check if task is blocked (has incomplete children)
    const isBlocked = useMemo(() => {
        if (!task.children || task.children.length === 0) return false
        return task.children.some((child) => child.status !== 'COMPLETED')
    }, [task.children])

    // Get subtask progress
    const subtaskProgress = useMemo(() => {
        if (!task.children || task.children.length === 0) return null
        const completed = task.children.filter((c) => c.status === 'COMPLETED').length
        const total = task.children.length
        return {completed, total}
    }, [task.children])

    const handleCardClick = () => {
        router.push(`/tasks/${task.id}`)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleCardClick()
        }
    }

    return (
        <div
            onClick={handleCardClick}
            onKeyDown={handleKeyDown}
            role="link"
            tabIndex={0}
            className={cn(
                'group relative rounded-lg border bg-card p-4 transition-shadow hover:shadow-md border-l-4 cursor-pointer',
                urgencyColors[task.urgency],
                isInProgress && 'ring-2 ring-primary ring-offset-2 bg-primary/5',
                isCompleted && 'opacity-60',
                isBlocked && !isCompleted && 'border-l-gray-400'
            )}
        >
            {/* Header */}
            <div className="flex items-start gap-3">

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
            <span
                className={cn('font-medium', isCompleted && 'line-through')}
            >
              {task.title}
            </span>
                        {/* Subtask progress badge */}
                        {subtaskProgress && (
                            <SubtaskProgressBadge
                                completed={subtaskProgress.completed}
                                total={subtaskProgress.total}
                            />
                        )}
                        {/* Blocked indicator */}
                        {isBlocked && !isCompleted && (
                            <Badge variant="secondary" className="gap-1 text-muted-foreground">
                                <Lock className="h-3 w-3"/>
                                Blocked
                            </Badge>
                        )}
                        {isInProgress && (
                            <Badge variant="default" className="gap-1">
                                <AlertCircle className="h-3 w-3"/>
                                In Progress
                            </Badge>
                        )}
                        {isShared && (
                            <Badge variant="secondary" className="gap-1">
                                <Users className="h-3 w-3"/>
                                Shared
                            </Badge>
                        )}
                        {task.category && (
                            <Badge
                                variant="outline"
                                style={{
                                    borderColor: task.category.color,
                                    color: task.category.color,
                                }}
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
                <Clock className="h-3.5 w-3.5"/>
                                {formatDuration(task.duration)}
              </span>
                        )}

                        {/* Location */}
                        {task.location && (
                            <span className="flex items-center gap-1 truncate max-w-37.5">
                <MapPin className="h-3.5 w-3.5 shrink-0"/>
                <span className="truncate">{parseLocation(task.location)}</span>
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
                <Calendar className="h-3.5 w-3.5"/>
                                {formatRelativeTime(new Date(task.deadline))}
              </span>
                        )}

                        {/* Effort */}
                        <span className="flex items-center gap-0.5">
              {Array.from({length: effortIcons[task.effort].count}).map(
                  (_, i) => (
                      <Zap
                          key={i}
                          className="h-3 w-3 fill-current text-yellow-500"
                      />
                  )
              )}
            </span>

                        {/* Collaborator count */}
                        {task.collaboratorCount > 0 && (
                            <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5"/>
                                {task.collaboratorCount}
              </span>
                        )}
                    </div>

                    {/* Body preview */}
                    {task.body && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {task.body}
                        </p>
                    )}
                </div>

                {/* Actions */}
                {canEdit && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isCompleted && !isInProgress && (
                            <ActionButton
                                action={startTaskFormAction}
                                taskId={task.id}
                                icon={Play}
                                title={isBlocked ? 'Complete all subtasks first' : 'Start task'}
                                disabled={isBlocked}
                            />
                        )}
                        {isInProgress && (
                            <>
                                <ActionButton
                                    action={deferTaskFormAction}
                                    taskId={task.id}
                                    icon={Pause}
                                    title="Defer task"
                                />
                                <ActionButton
                                    action={completeTaskFormAction}
                                    taskId={task.id}
                                    icon={Check}
                                    title={isBlocked ? 'Complete all subtasks first' : 'Complete task'}
                                    variant="default"
                                    disabled={isBlocked}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
})

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowLeft,
  Clock,
  MapPin,
  Calendar,
  Flag,
  Zap,
  Repeat,
  FolderOpen,
  Users,
  Lock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { buildGoogleMapsUrl } from '@/types/location'
import { getCurrentUser } from '@/lib/auth-server'
import { getTaskByIdForUser, getPotentialParentTasks } from '@/data/tasks'
import { getCategoriesForUser } from '@/data/categories'
import { formatDuration, formatRelativeTime, getDeadlineColor, cn } from '@/lib/utils'
import { TaskDetailSkeleton } from '@/components/skeletons'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { TaskActionsWithEdit } from '@/components/features/task-actions-with-edit'
import { Avatar } from '@/components/ui/avatar'
import { SubtasksSection } from '@/components/features/subtasks-section'
import { SubtaskProgressBadge } from '@/components/features/subtask-progress-badge'

// Static metadata - no private task data exposed
// Task details are only shown via invite links (/invite/[token])
export const metadata: Metadata = {
  title: 'Task Details',
  description: 'Sign in to view this task on WheelDo',
}

interface TaskPageProps {
  params: Promise<{ id: string }>
}

async function TaskContent({ params }: TaskPageProps) {
  const user = await getCurrentUser()
  if (!user) return null

  const { id } = await params

  // Fetch task, categories, and potential parent tasks in parallel
  const [task, categories, potentialParents] = await Promise.all([
    getTaskByIdForUser(id, user.id),
    getCategoriesForUser(user.id),
    getPotentialParentTasks(user.id),
  ])

  if (!task) {
    notFound()
  }

  const deadlineColor = getDeadlineColor(task.deadline)
  const isSharedTask = task.role !== 'owner'

  // Check if task is blocked (has incomplete children)
  const hasChildren = task.children && task.children.length > 0
  const isBlocked = hasChildren && task.children.some((c) => c.status !== 'COMPLETED')
  const subtaskProgress = hasChildren
    ? {
        completed: task.children.filter((c) => c.status === 'COMPLETED').length,
        total: task.children.length,
      }
    : null

  const effortLabels = {
    MINIMAL: '1 - Minimal',
    LOW: '2 - Low',
    MODERATE: '3 - Moderate',
    HIGH: '4 - High',
    EXTREME: '5 - Extreme',
  }

  const urgencyLabels = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
  }

  const urgencyColors = {
    LOW: 'text-green-600',
    MEDIUM: 'text-yellow-600',
    HIGH: 'text-red-600',
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tasks
      </Link>

      {/* Task header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          {/* Subtask progress badge */}
          {subtaskProgress && (
            <SubtaskProgressBadge
              completed={subtaskProgress.completed}
              total={subtaskProgress.total}
            />
          )}
          {/* Blocked indicator */}
          {isBlocked && task.status !== 'COMPLETED' && (
            <Badge variant="secondary" className="gap-1 text-muted-foreground">
              <Lock className="h-3 w-3" />
              Blocked
            </Badge>
          )}
          {task.status === 'IN_PROGRESS' && (
            <Badge variant="default">In Progress</Badge>
          )}
          {task.status === 'COMPLETED' && (
            <Badge variant="success">Completed</Badge>
          )}
          {isSharedTask && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              Shared with you
            </Badge>
          )}
        </div>

        {/* Blocked warning */}
        {isBlocked && task.status !== 'COMPLETED' && (
          <div className="flex items-center gap-2 p-3 mb-3 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">
              Complete all subtasks before you can start or complete this task.
            </span>
          </div>
        )}

        {/* Show owner for shared tasks */}
        {isSharedTask && task.owner && (
          <div className="flex items-center gap-2 mb-2">
            <Avatar user={task.owner} size="xs" />
            <span className="text-sm text-muted-foreground">
              Owned by {task.owner.name || task.owner.email}
            </span>
          </div>
        )}

        {task.body && (
          <p className="text-muted-foreground">{task.body}</p>
        )}
      </div>

      {/* Task actions */}
      <TaskActionsWithEdit
        task={task}
        role={task.role}
        categories={categories}
        availableTasks={potentialParents}
      />

      {/* Task details */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="grid gap-4">
            {/* Category */}
            {task.category && (
              <div className="flex items-center gap-3">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <Badge
                    variant="outline"
                    style={{ borderColor: task.category.color, color: task.category.color }}
                  >
                    {task.category.name}
                  </Badge>
                </div>
              </div>
            )}

            {/* Duration */}
            {task.duration && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{formatDuration(task.duration)}</p>
                </div>
              </div>
            )}

            {/* Deadline */}
            {task.deadline && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className={cn('font-medium', deadlineColor)}>
                    {new Date(task.deadline).toLocaleString()}
                    <span className="text-sm ml-2">
                      ({formatRelativeTime(new Date(task.deadline))})
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Urgency */}
            <div className="flex items-center gap-3">
              <Flag className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Urgency</p>
                <p className={cn('font-medium', urgencyColors[task.urgency])}>
                  {urgencyLabels[task.urgency]}
                </p>
              </div>
            </div>

            {/* Effort */}
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Effort</p>
                <p className="font-medium">{effortLabels[task.effort]}</p>
              </div>
            </div>

            {/* Recurrence */}
            {task.recurrenceType !== 'NONE' && (
              <div className="flex items-center gap-3">
                <Repeat className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Repeats</p>
                  <p className="font-medium capitalize">{task.recurrenceType.toLowerCase()}</p>
                </div>
              </div>
            )}

            {/* Location */}
            {task.location?.formatted && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  {task.location.lat && task.location.lon ? (
                    <a
                      href={buildGoogleMapsUrl(task.location.lat, task.location.lon)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline inline-flex items-center gap-1.5"
                    >
                      {task.location.formatted}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <p className="font-medium">{task.location.formatted}</p>
                  )}
                  {(task.location.city || task.location.country) && (
                    <p className="text-sm text-muted-foreground">
                      {[task.location.city, task.location.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subtasks section - GitHub-style collapsible */}
      {(hasChildren || task.role === 'owner') && (
        <div className="mt-6">
          <SubtasksSection
            subtasks={task.children || []}
            // TODO: Add onAddSubtask handler to open create modal with parentId
          />
        </div>
      )}

      {/* Parent task */}
      {task.parent && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Parent Task</h2>
          <Link
            href={`/tasks/${task.parent.id}`}
            className="block p-3 rounded-lg border hover:bg-secondary/50 transition-colors"
          >
            <p className="font-medium">{task.parent.title}</p>
          </Link>
        </div>
      )}

      {/* Collaborators */}
      {task.collaborators && task.collaborators.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaborators
          </h2>
          <div className="space-y-2">
            {task.collaborators.map((collab) => (
              <div
                key={collab.id}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <Avatar user={collab.user} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {collab.user.name || collab.user.email}
                  </p>
                  {collab.user.name && (
                    <p className="text-sm text-muted-foreground truncate">
                      {collab.user.email}
                    </p>
                  )}
                </div>
                <Badge variant="outline">
                  {collab.canEdit ? 'Editor' : 'Viewer'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-6 text-sm text-muted-foreground">
        <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
        <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
        {task.completedAt && (
          <p>Completed: {new Date(task.completedAt).toLocaleString()}</p>
        )}
      </div>
    </div>
  )
}

export default function TaskPage(props: TaskPageProps) {
  return (
    <Suspense fallback={<TaskDetailSkeleton />}>
      <TaskContent {...props} />
    </Suspense>
  )
}

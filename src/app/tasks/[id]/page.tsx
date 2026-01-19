import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
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
} from 'lucide-react'
import { getSession } from '@/lib/auth-server'
import { getTaskWithAuth } from '@/lib/task-authorization'
import { formatDuration, formatRelativeTime, getDeadlineColor, cn } from '@/lib/utils'
import { AppShell } from '@/components/ui/app-shell'
import { LoadingPage } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { TaskActions } from '@/components/features/task-actions'
import { Avatar } from '@/components/ui/avatar'

// Safely parse location - handles both JSON objects and plain text
function parseLocation(location: string): string {
  try {
    const parsed = JSON.parse(location)
    return parsed.formatted || parsed.name || location
  } catch {
    return location
  }
}

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
  const session = await getSession()
  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params
  const task = await getTaskWithAuth(session.user.id, id)

  if (!task) {
    notFound()
  }

  const deadlineColor = getDeadlineColor(task.deadline)
  const isSharedTask = task.role !== 'owner'

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
    <AppShell>
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

          {/* Show owner for shared tasks */}
          {isSharedTask && task.user && (
            <div className="flex items-center gap-2 mb-2">
              <Avatar user={task.user} size="xs" />
              <span className="text-sm text-muted-foreground">
                Owned by {task.user.name || task.user.email}
              </span>
            </div>
          )}

          {task.body && (
            <p className="text-muted-foreground">{task.body}</p>
          )}
        </div>

        {/* Task actions */}
        <TaskActions task={task} role={task.role} />

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
              {task.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">
                      {parseLocation(task.location)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subtasks */}
        {task.children && task.children.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Subtasks</h2>
            <div className="space-y-2">
              {task.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/tasks/${child.id}`}
                  className="block p-3 rounded-lg border hover:bg-secondary/50 transition-colors"
                >
                  <p className={cn('font-medium', child.status === 'COMPLETED' && 'line-through text-muted-foreground')}>
                    {child.title}
                  </p>
                </Link>
              ))}
            </div>
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
    </AppShell>
  )
}

export default function TaskPage(props: TaskPageProps) {
  return (
    <Suspense fallback={<LoadingPage />}>
      <TaskContent {...props} />
    </Suspense>
  )
}

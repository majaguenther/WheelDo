'use client'

import { use } from 'react'
import { Clock, AlertCircle } from 'lucide-react'
import { DurationFilter } from './duration-filter'
import { SpinWheel } from './spin-wheel'
import { EmptyState } from '@/components/ui/empty-state'
import type { TaskDTO } from '@/data/dto/task.types'

interface WheelContentProps {
  tasksPromise: Promise<TaskDTO[]>
  activeTaskPromise: Promise<TaskDTO | null>
  maxDuration?: number
}

export function WheelContent({
  tasksPromise,
  activeTaskPromise,
  maxDuration,
}: WheelContentProps) {
  // Use React 19 use() hook to unwrap promises
  const tasks = use(tasksPromise)
  const activeTask = use(activeTaskPromise)

  // Active task warning - user must complete or defer before spinning
  if (activeTask) {
    return (
      <div className="p-6 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
              Task in Progress
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              Complete or defer &quot;{activeTask.title}&quot; before spinning.
            </p>
            <a
              href="/dashboard"
              className="inline-flex mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <DurationFilter currentValue={maxDuration} />

      {tasks.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-8 w-8" />}
          title="No eligible tasks"
          description={
            maxDuration
              ? `No pending tasks found that take ${maxDuration} minutes or less.`
              : 'Create some tasks to spin the wheel!'
          }
          action={
            <a
              href="/dashboard"
              className="inline-flex px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </a>
          }
        />
      ) : (
        <>
          <SpinWheel tasks={tasks} />
          <p className="text-center text-sm text-muted-foreground mt-6">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} on the wheel
            {maxDuration && ` (${maxDuration} min or less)`}
          </p>
        </>
      )}
    </>
  )
}

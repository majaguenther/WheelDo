import { Suspense } from 'react'
import { Clock, AlertCircle } from 'lucide-react'
import { getCurrentUser } from '@/data/auth'
import { getWheelEligibleTasksForUser, getActiveTaskForUser } from '@/data/tasks'
import { SpinWheel } from '@/components/features/spin-wheel'
import { WheelSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/ui/empty-state'
import { DurationFilter } from '@/components/features/duration-filter'

export const metadata = {
  title: 'Spin the Wheel',
}

interface WheelPageProps {
  searchParams: Promise<{ maxDuration?: string }>
}

async function WheelContent({ searchParams }: WheelPageProps) {
  const user = await getCurrentUser()
  if (!user) return null

  const params = await searchParams
  const maxDuration = params.maxDuration ? parseInt(params.maxDuration, 10) : undefined

  // Fetch in parallel
  const [tasks, activeTask] = await Promise.all([
    getWheelEligibleTasksForUser(user.id, maxDuration),
    getActiveTaskForUser(user.id),
  ])

  // If there's an active task, show a warning
  if (activeTask) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Spin the Wheel</h1>
          <p className="text-muted-foreground">You already have an active task!</p>
        </div>

        <div className="p-6 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Task in Progress
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                You&apos;re currently working on &quot;{activeTask.title}&quot;. Complete or defer
                it before spinning the wheel.
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
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Spin the Wheel</h1>
        <p className="text-muted-foreground">
          Can&apos;t decide? Let the wheel choose your next task!
        </p>
      </div>

      {/* Duration filter */}
      <div className="mb-8">
        <DurationFilter currentValue={maxDuration} />
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-8 w-8" />}
          title="No eligible tasks"
          description={
            maxDuration
              ? `No pending tasks found that take ${maxDuration} minutes or less. Try increasing the duration filter or add some quick tasks.`
              : 'You need at least one pending task to spin the wheel. Create some tasks first!'
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
    </div>
  )
}

export default function WheelPage(props: WheelPageProps) {
  return (
    <Suspense fallback={<WheelSkeleton />}>
      <WheelContent {...props} />
    </Suspense>
  )
}

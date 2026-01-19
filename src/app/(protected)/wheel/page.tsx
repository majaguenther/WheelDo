import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/data/auth'
import { getWheelEligibleTasksForUser, getActiveTaskForUser } from '@/data/tasks'
import { WheelContent } from '@/components/features/wheel-content'
import { WheelSkeleton } from '@/components/skeletons'

export const metadata = {
  title: 'Spin the Wheel',
}

interface WheelPageProps {
  searchParams: Promise<{ maxDuration?: string }>
}

export default async function WheelPage({ searchParams }: WheelPageProps) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Next.js 15+: await searchParams
  const params = await searchParams
  const maxDuration = params.maxDuration
    ? Math.max(1, parseInt(params.maxDuration, 10) || 0)
    : undefined

  // Create promises for streaming - don't await here
  const tasksPromise = getWheelEligibleTasksForUser(user.id, maxDuration)
  const activeTaskPromise = getActiveTaskForUser(user.id)

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Spin the Wheel</h1>
        <p className="text-muted-foreground">
          Can&apos;t decide? Let the wheel choose!
        </p>
      </header>

      <Suspense fallback={<WheelSkeleton />}>
        <WheelContent
          tasksPromise={tasksPromise}
          activeTaskPromise={activeTaskPromise}
          maxDuration={maxDuration}
        />
      </Suspense>
    </div>
  )
}

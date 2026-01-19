import { Suspense } from 'react'
import { CircleDot } from 'lucide-react'
import { getTasks, getActiveTask } from '@/data/tasks'
import { getCategories } from '@/data/categories'
import { getCurrentUser } from '@/data/auth'
import { db } from '@/lib/db'
import { TaskList } from '@/components/features/task-list'
import { LoadingPage } from '@/components/ui/loading'
import { CreateTaskButton } from '@/components/features/create-task-button'

export const metadata = {
  title: 'Dashboard',
}

// Default categories to create for new users
const DEFAULT_CATEGORIES = [
  { name: 'Work', color: '#3b82f6', icon: 'briefcase' },
  { name: 'Personal', color: '#8b5cf6', icon: 'user' },
  { name: 'Health', color: '#22c55e', icon: 'heart' },
  { name: 'Finance', color: '#eab308', icon: 'wallet' },
  { name: 'Home', color: '#f97316', icon: 'home' },
]

async function ensureDefaultCategories(userId: string) {
  const existingCount = await db.category.count({
    where: { userId },
  })

  if (existingCount === 0) {
    await db.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        userId,
      })),
    })
  }
}

async function DashboardContent() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Ensure default categories exist for new users
  await ensureDefaultCategories(user.id)

  // Fetch data using DAL functions (all with built-in auth checks)
  const [tasks, activeTask, categories] = await Promise.all([
    getTasks(),
    getActiveTask(),
    getCategories(),
  ])

  // Filter to show only pending and in-progress tasks
  const activeTasks = tasks.filter(
    (t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS'
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground text-sm">
            {activeTask
              ? 'You have an active task. Complete or defer it to start another.'
              : 'Pick a task to start working on.'}
          </p>
        </div>
        <CreateTaskButton categories={categories} />
      </div>

      {/* Quick actions */}
      {!activeTask && activeTasks.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CircleDot className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Can&apos;t decide?</p>
                <p className="text-sm text-muted-foreground">
                  Let the wheel choose your next task!
                </p>
              </div>
            </div>
            <a
              href="/wheel"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <CircleDot className="h-4 w-4" />
              Spin the Wheel
            </a>
          </div>
        </div>
      )}

      {/* Task list */}
      <TaskList tasks={activeTasks} activeTaskId={activeTask?.id} />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <DashboardContent />
    </Suspense>
  )
}

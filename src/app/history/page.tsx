import { Suspense } from 'react'
import { History as HistoryIcon } from 'lucide-react'
import { getCompletedTasks } from '@/data/tasks'
import { LoadingPage } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { HistoryList } from '@/components/features/history-list'

export const metadata = {
  title: 'History',
}

async function HistoryContent() {
  const tasks = await getCompletedTasks()

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Completion History</h1>
          <p className="text-muted-foreground text-sm">View all your completed tasks</p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <HistoryIcon className="h-3.5 w-3.5" />
          {tasks.length} completed
        </Badge>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="h-8 w-8" />}
          title="No completed tasks yet"
          description="Tasks you complete will appear here. Start by finishing your first task!"
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
        <HistoryList tasks={tasks} />
      )}
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <HistoryContent />
    </Suspense>
  )
}

import { Skeleton, SkeletonText, SkeletonButton } from './skeleton'

export function TaskDetailSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Back link */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Task header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <SkeletonText className="w-3/4" />
      </div>

      {/* Task actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <SkeletonButton className="w-28" />
        <SkeletonButton className="w-24" />
        <SkeletonButton className="w-20" />
      </div>

      {/* Task details card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="grid gap-4">
          {/* Category */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <div className="space-y-1">
              <SkeletonText className="w-16" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <div className="space-y-1">
              <SkeletonText className="w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <div className="space-y-1">
              <SkeletonText className="w-16" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>

          {/* Urgency */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <div className="space-y-1">
              <SkeletonText className="w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>

          {/* Effort */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <div className="space-y-1">
              <SkeletonText className="w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="mt-6 space-y-1">
        <SkeletonText className="w-48" />
        <SkeletonText className="w-48" />
      </div>
    </div>
  )
}

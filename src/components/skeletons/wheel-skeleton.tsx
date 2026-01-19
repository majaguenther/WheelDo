import { Skeleton, SkeletonText } from './skeleton'

export function WheelSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <SkeletonText className="w-64 mx-auto" />
      </div>

      {/* Duration filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 justify-center">
          <Skeleton className="h-9 w-16 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>

      {/* Wheel placeholder */}
      <div className="flex flex-col items-center">
        <Skeleton className="h-72 w-72 rounded-full" />
        <Skeleton className="h-12 w-32 rounded-lg mt-6" />
      </div>

      {/* Task count */}
      <SkeletonText className="w-40 mx-auto mt-6" />
    </div>
  )
}

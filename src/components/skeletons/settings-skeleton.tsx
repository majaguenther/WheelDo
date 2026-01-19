import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton } from './skeleton'

function SettingsCardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
        <SkeletonText className="w-48" />
      </div>
      <div className="p-6 pt-0">
        {children}
      </div>
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <Skeleton className="h-8 w-32 mb-6" />

      <div className="space-y-6">
        {/* Profile section */}
        <SettingsCardSkeleton>
          <div className="flex items-center gap-4">
            <SkeletonAvatar className="h-16 w-16" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <SkeletonText className="w-48" />
            </div>
          </div>
          <SkeletonButton className="mt-6 w-24" />
        </SettingsCardSkeleton>

        {/* Sessions section */}
        <SettingsCardSkeleton>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <SkeletonText className="w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </SettingsCardSkeleton>

        {/* Categories section */}
        <SettingsCardSkeleton>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-18 rounded-full" />
            <Skeleton className="h-8 w-22 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        </SettingsCardSkeleton>

        {/* Theme section */}
        <SettingsCardSkeleton>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        </SettingsCardSkeleton>
      </div>
    </div>
  )
}

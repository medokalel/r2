import { cn } from '@/lib/utils'

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

/** Shimmer placeholder for the four stat cards at the top of the dashboard. */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 @5xl:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-[120px] flex-col justify-between gap-3 rounded-lg border border-neutral-100 bg-white p-4 @sm:justify-start @sm:gap-6 @sm:p-5"
        >
          <SkeletonBlock className="size-8 rounded-md @sm:size-10" />
          <div className="flex flex-col gap-2">
            <SkeletonBlock className="h-8 w-2/5" />
            <SkeletonBlock className="h-4 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Shimmer placeholder for the "Tasks required now" table. */
export function DashboardTasksTableSkeleton() {
  return (
    <div
      className="flex flex-1 flex-col rounded-lg border border-neutral-100 bg-white py-5"
      aria-hidden
    >
      <div className="mx-5 mb-5 mt-1 flex items-center justify-between">
        <SkeletonBlock className="h-7 w-44" />
        <SkeletonBlock className="h-5 w-16" />
      </div>
      <div className="mx-5 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-md border border-neutral-50 p-4"
          >
            <div className="flex flex-1 flex-col gap-2">
              <SkeletonBlock className="h-4 w-2/5" />
              <SkeletonBlock className="h-3 w-1/4" />
            </div>
            <SkeletonBlock className="h-4 w-1/6" />
            <SkeletonBlock className="h-7 w-[126px] rounded-sm" />
            <SkeletonBlock className="h-4 w-1/6" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Shimmer placeholder for the "Latest activities" feed. */
export function DashboardActivitiesSkeleton() {
  return (
    <div
      className="flex w-full flex-col rounded-lg border border-neutral-100 bg-white lg:max-w-[400px]"
      aria-hidden
    >
      <div className="mb-4 flex items-center gap-2 rounded-t-lg bg-primary-25 p-6">
        <SkeletonBlock className="size-8 rounded-md" />
        <SkeletonBlock className="h-6 w-32" />
      </div>
      <div className="flex flex-col gap-6 p-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex gap-3">
            <SkeletonBlock className="size-9 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <SkeletonBlock className="h-3 w-1/4" />
              <SkeletonBlock className="h-4 w-3/5" />
              <SkeletonBlock className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 
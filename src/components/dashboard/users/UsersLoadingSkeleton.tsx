import { cn } from '@/lib/utils'

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

/** Shimmer placeholder for the three stat cards at the top of the Users page. */
export function UsersStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col justify-between gap-6 rounded-lg border border-neutral-100 bg-white p-5"
        >
          <SkeletonBlock className="size-9 rounded-md" />
          <div className="flex flex-col gap-2">
            <SkeletonBlock className="h-8 w-2/5" />
            <SkeletonBlock className="h-4 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Shimmer placeholder for the users table (search bar, header, and rows). */
export function UsersTableSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border border-neutral-100 bg-white py-5" aria-hidden>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-11 w-80 rounded-md" />
          <SkeletonBlock className="h-11 w-24 rounded-md" />
        </div>
        <SkeletonBlock className="h-11 w-32 rounded-md" />
      </div>

      <div className="mx-5 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-md border border-neutral-50 p-4"
          >
            <SkeletonBlock className="h-4 w-6" />
            <SkeletonBlock className="h-4 flex-1" />
            <SkeletonBlock className="h-4 w-1/6" />
            <SkeletonBlock className="h-4 w-1/5" />
            <SkeletonBlock className="h-4 w-1/6" />
            <SkeletonBlock className="h-6 w-14 rounded-full" />
            <SkeletonBlock className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}
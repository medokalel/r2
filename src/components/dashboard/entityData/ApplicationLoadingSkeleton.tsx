import { useTranslation } from 'react-i18next'
import { AppIcon, BuildingIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

function SkeletonField() {
  return (
    <div className="flex flex-col gap-2">
      <SkeletonBlock className="h-4 w-2/5" />
      <SkeletonBlock className="h-12 w-full" />
    </div>
  )
}

/** Shimmer placeholder shown while an application draft is being loaded. */
export function ApplicationLoadingSkeleton() {
  const { t } = useTranslation()

  return (
    <div className="relative flex flex-1 flex-col gap-5">
      {/* Skeleton of the entity-data form layout */}
      <div className="flex flex-col gap-5 opacity-60" aria-hidden>
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-6 w-1/4" />
        </div>

        <div className="rounded-lg border border-neutral-100 bg-white p-5">
          <div className="flex flex-col gap-6">
            <SkeletonBlock className="h-6 w-1/3" />
            <SkeletonField />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SkeletonField />
              <SkeletonField />
              <SkeletonField />
              <SkeletonField />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-100 bg-white p-5">
          <div className="flex flex-col gap-6">
            <SkeletonBlock className="h-6 w-1/4" />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SkeletonField />
              <SkeletonField />
              <SkeletonField />
              <SkeletonField />
            </div>
          </div>
        </div>
      </div>

      {/* Centered brand mark */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
        <div className="relative flex items-center justify-center">
          <span className="absolute size-20 animate-ping rounded-full bg-primary/15" />
          <div className="relative flex size-16 items-center justify-center rounded-lg border border-primary/20 bg-white shadow-xl">
            <AppIcon icon={BuildingIcon} size={32} className="text-primary" />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 shadow-sm">
          <p className="text-body font-medium text-primary">{t('common.loading')}</p>
          <span className="flex items-end gap-1 pb-1" aria-hidden>
            <span className="size-1.5 animate-bounce rounded-full bg-primary" />
            <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
          </span>
        </div>
      </div>
    </div>
  )
}

/** Shimmer placeholder for the certification requests card grid. */
export function RequestCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-lg border border-neutral-100 bg-white px-5 py-6"
        >
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-10 w-28 rounded-md" />
            <SkeletonBlock className="size-10 rounded-lg" />
          </div>
          <div className="flex flex-col items-center gap-2 py-2">
            <SkeletonBlock className="h-4 w-1/3" />
            <SkeletonBlock className="h-6 w-2/3" />
          </div>
          <div className="flex flex-col items-center gap-2 border-t border-neutral-100 pt-4 pb-2">
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-6 w-2/3" />
          </div>
          <SkeletonBlock className="h-12 w-full rounded-md" />
          <SkeletonBlock className="h-12 w-full rounded-md" />
        </div>
      ))}
    </div>
  )
}

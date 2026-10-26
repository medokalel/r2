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

export function ProfileLoadingSkeleton() {
  const { t } = useTranslation()

  return (
    <div className="relative flex flex-1 flex-col gap-5">
      {/* Skeleton of the step-1 layout */}
      <div className="flex flex-col gap-5 opacity-60" aria-hidden>
        {/* Header card: logo box + summary fields */}
        <div className="flex flex-col gap-5 rounded-lg border border-neutral-100 bg-white p-5 lg:flex-row">
          <div className="flex w-full gap-3 lg:w-[500px] lg:shrink-0">
            <SkeletonBlock className="size-12 shrink-0" />
            <div className="flex flex-1 flex-col gap-3">
              <SkeletonBlock className="h-5 w-1/3" />
              <SkeletonBlock className="h-[190px] w-full rounded-lg" />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <SkeletonField />
            <SkeletonField />
          </div>
        </div>

        {/* Map + basic data cards */}
        <div className="flex flex-col items-start gap-5 lg:flex-row">
          <div className="w-full rounded-lg border border-neutral-100 bg-white p-4 sm:p-6 lg:w-[42%] lg:shrink-0 lg:p-8">
            <div className="flex flex-col gap-6">
              <SkeletonBlock className="h-6 w-1/2" />
              <SkeletonBlock className="h-[320px] w-full rounded-lg" />
            </div>
          </div>
          <div className="min-w-0 flex-1 rounded-lg border border-neutral-100 bg-white p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6">
              <SkeletonBlock className="h-6 w-1/3" />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
              </div>
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
          <p className="text-body font-medium text-primary">
            {t('companyProfile.messages.loading')}
          </p>
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

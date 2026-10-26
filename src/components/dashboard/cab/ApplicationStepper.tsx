import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const STEPS = [
  { key: 'clientInformation', subtitleKey: 'companyContact' },
  { key: 'standardsAndScope', subtitleKey: 'certificationRequirements' },
  { key: 'sitesAndFacilities', subtitleKey: 'locationsActivities' },
  { key: 'documents', subtitleKey: 'requiredDocuments' },
  { key: 'reviewAndConfirm', subtitleKey: 'reviewBeforeSubmit' },
] as const

interface ApplicationStepperProps {
  current: 1 | 2 | 3 | 4 | 5
  className?: string
  // TODO(DEV ONLY): remove onStepClick once the Application Draft flow is
  // finished — this is a dev-convenience shortcut to jump between steps
  // without filling each one in order, not meant for production.
  onStepClick?: (step: 1 | 2 | 3 | 4 | 5) => void
}

/**
 * Horizontal tab bar for the Application Draft wizard — five equal-width
 * tabs (title + short subtitle) inside a bordered/rounded card matching the
 * page's other cards, the active tab highlighted with a light blue fill and
 * a blue underline flush with its bottom edge.
 */
export function ApplicationStepper({ current, className, onStepClick }: ApplicationStepperProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-white', className)}>
      {STEPS.map((step, index) => {
        const number = (index + 1) as 1 | 2 | 3 | 4 | 5
        const isActive = number === current
        const isFirst = index === 0
        const isLast = index === STEPS.length - 1

        return (
          <button
            key={step.key}
            type="button"
            aria-current={isActive ? 'step' : undefined}
            onClick={() => onStepClick?.(number)}
            className={cn(
              'relative flex min-w-0 flex-1 flex-col items-center gap-1 border-e border-neutral-100 px-4 py-3.5 text-center last:border-e-0',
              isActive && 'bg-primary-50',
              isFirst && 'rounded-s-lg',
              isLast && 'rounded-e-lg'
            )}
          >
            <span
              className={cn(
                'truncate text-body font-semibold',
                isActive ? 'text-primary' : 'text-neutral-900'
              )}
            >
              {t(`cab.applicationDraft.steps.${step.key}`)}
            </span>
            <span className={cn('truncate text-body-sm', isActive ? 'text-primary/70' : 'text-neutral-500')}>
              {t(`cab.applicationDraft.stepSubtitles.${step.subtitleKey}`)}
            </span>
            {isActive && (
              <span
                className={cn(
                  'absolute inset-x-0 bottom-0 h-[3px] bg-primary',
                  isFirst && 'rounded-es-lg',
                  isLast && 'rounded-ee-lg'
                )}
                aria-hidden
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
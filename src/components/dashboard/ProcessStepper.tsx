import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { accreditationSteps, certificationSteps } from '@/components/dashboard/processSteps'
import { cn } from '@/lib/utils'

interface ProcessStepperProps {
  activeStep?: number
  /** 'certification' = CAB certification lifecycle; 'accreditation' = AB accreditation flow (default). */
  flow?: 'accreditation' | 'certification'
}

export function ProcessStepper({ activeStep = 0, flow = 'accreditation' }: ProcessStepperProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const steps = flow === 'certification' ? certificationSteps : accreditationSteps

  return (
    <nav
      aria-label={t('cab.pipeline.title', 'Certification pipeline')}
      className="flex shrink-0 gap-2 overflow-x-auto border-b-2 border-neutral-100 bg-white p-3 sm:p-5"
    >
      {steps.map(({ key, icon: Icon, href, fallback }, index) => {
        const isActive = index === activeStep
        const isCompleted = index < activeStep
        const isHighlighted = isActive || isCompleted
        const label = t(key, fallback ? { defaultValue: fallback } : undefined)

        return (
          <button
            key={key}
            type="button"
            onClick={href ? () => navigate(href) : undefined}
            aria-current={isActive ? 'step' : undefined}
            title={label}
            className={cn(
              'group flex min-w-[7.5rem] flex-1 flex-col gap-4 text-start',
              href ? 'cursor-pointer' : 'cursor-default'
            )}
          >
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full transition-colors',
                isHighlighted ? 'bg-primary-50' : 'bg-neutral-100',
                href && 'group-hover:bg-primary-50'
              )}
            >
              <Icon className={cn(isHighlighted ? 'text-primary' : 'text-neutral-700', href && 'group-hover:text-primary')} />
            </div>

            <div
              className={cn(
                'h-1 w-full rounded-md',
                isHighlighted ? 'bg-primary' : 'bg-neutral-100'
              )}
            />

            <p
              className={cn(
                'line-clamp-2 text-body-sm font-semibold leading-[1.6] sm:text-body',
                isActive ? 'text-primary' : 'text-neutral-600',
                href && 'group-hover:text-primary'
              )}
            >
              {label}
            </p>
          </button>
        )
      })}
    </nav>
  )
}

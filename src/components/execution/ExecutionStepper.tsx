import { useTranslation } from 'react-i18next'
import { TickCircle } from 'iconsax-reactjs'
import type { ExecutionStep, ExecutionStepKey } from '@/lib/api/executionApi'
import { stepLabel } from '@/lib/execution/executionText'
import { cn } from '@/lib/utils'

interface ExecutionStepperProps {
  steps: ExecutionStep[]
  selected: ExecutionStepKey
  onSelect: (step: ExecutionStepKey) => void
}

/**
 * The six-step process stepper (design system: horizontal with labels on desktop, numbers only on
 * phones with the selected step's name underneath). Any step can be opened; done steps show a tick.
 */
export function ExecutionStepper({ steps, selected, onSelect }: ExecutionStepperProps) {
  const { t } = useTranslation()
  const index = steps.findIndex((s) => s.key === selected)
  return (
    <nav aria-label={t('execution.stepperLabel')} className="rounded-lg border border-neutral-100 bg-white p-3 sm:p-4">
      <ol className="flex items-start gap-1 sm:gap-2" data-testid="execution-stepper">
        {steps.map((step, i) => {
          const active = step.key === selected
          return (
            <li key={step.key} className="flex min-w-0 flex-1 items-start">
              <button
                type="button"
                onClick={() => onSelect(step.key)}
                aria-current={active ? 'step' : undefined}
                className="group flex min-h-11 w-full min-w-0 flex-col items-center gap-1.5 rounded-md px-1 py-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                data-step={step.key}
                data-status={step.status}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-body-sm font-bold transition-colors',
                    step.status === 'done' && 'border-success-500 bg-success-500 text-white',
                    step.status === 'current' && 'border-primary bg-primary-50 text-primary',
                    step.status === 'todo' && 'border-neutral-200 bg-white text-neutral-600',
                    active && 'ring-2 ring-primary ring-offset-2',
                  )}
                >
                  {step.status === 'done' ? <TickCircle size={20} variant="Bold" /> : i + 1}
                </span>
                <span className={cn('hidden text-caption font-medium leading-tight lg:block', active ? 'text-primary' : 'text-neutral-700')}>{stepLabel(t, step.key)}</span>
              </button>
              {i < steps.length - 1 && <span aria-hidden className={cn('mt-[18px] hidden h-0.5 min-w-2 flex-1 sm:block', step.status === 'done' ? 'bg-success-500' : 'bg-neutral-200')} />}
            </li>
          )
        })}
      </ol>
      <p className="mt-2 text-center text-body-sm font-semibold text-neutral-900 lg:hidden">
        {t('execution.stepOf', { step: index + 1, total: steps.length })} · {stepLabel(t, selected)}
      </p>
    </nav>
  )
}

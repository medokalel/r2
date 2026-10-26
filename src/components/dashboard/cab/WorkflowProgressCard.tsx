import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { certificationStageForPath, certificationSteps } from '@/components/dashboard/processSteps'
import type { WorkflowStep, WorkflowStepStatus } from '@/lib/workflowSteps'
import { cn } from '@/lib/utils'

interface WorkflowProgressCardProps {
  steps: WorkflowStep[]
  title: string
  viewFullLabel: string
  statusLabels: Record<WorkflowStepStatus, string>
  onViewFullWorkflow?: () => void
  className?: string
}

/**
 * Read-only overview of a CAB workflow (client registration, application
 * receipt, review, etc.) — shared by every CAB page that shows one, so a
 * style change here applies everywhere instead of needing to be repeated.
 */
export function WorkflowProgressCard({
  steps,
  title,
  viewFullLabel,
  statusLabels,
  onViewFullWorkflow,
  className,
}: WorkflowProgressCardProps) {
  // Without a page-specific handler, the button opens the end-to-end certification workflow.
  const [fullOpen, setFullOpen] = useState(false)
  return (
    <aside
      className={cn(
        'w-full shrink-0 rounded-lg border border-neutral-100 bg-white p-5 lg:w-[340px]',
        className
      )}
    >
      <h3 className="text-body-lg font-semibold text-neutral-900">{title}</h3>

      <ol className="mt-4 space-y-5">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1
          const isActive = step.status === 'inProgress'
          const isCompleted = step.status === 'completed'

          return (
            <li key={step.key} className="relative flex items-start gap-3">
              {!isLast && (
                <span
                  className={cn(
                    'absolute start-3 top-6 -bottom-5 w-0.5',
                    isCompleted ? 'bg-success-500' : isActive ? 'bg-primary' : 'bg-neutral-100'
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold',
                  isCompleted
                    ? 'bg-success-500 text-white'
                    : isActive
                      ? 'bg-primary text-white'
                      : 'bg-neutral-50 text-neutral-600'
                )}
              >
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M3 7.2L6 10.2L11 4"
                      stroke="white"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      'text-body-sm font-semibold',
                      isActive || isCompleted ? 'text-neutral-900' : 'text-neutral-800'
                    )}
                  >
                    {step.label}
                  </p>
                  <span
                    className={cn(
                      'shrink-0 rounded-sm px-2 py-0.5 text-caption font-medium',
                      isCompleted
                        ? 'bg-success-50 text-success-600'
                        : isActive
                          ? 'bg-warning-50 text-warning-700'
                          : 'bg-neutral-50 text-neutral-600'
                    )}
                  >
                    {statusLabels[step.status]}
                  </span>
                </div>
                <p className="mt-0.5 text-body-sm text-neutral-600">{step.description}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <button
        type="button"
        onClick={onViewFullWorkflow ?? (() => setFullOpen(true))}
        className="mt-5 flex w-full items-center justify-center rounded-md border border-primary px-4 py-3 text-body-sm font-semibold text-primary transition-colors hover:bg-primary-25"
      >
        {viewFullLabel}
      </button>
      {!onViewFullWorkflow && <FullWorkflowDialog open={fullOpen} onOpenChange={setFullOpen} />}
    </aside>
  )
}

/** All certification stages (ISO/IEC 17021-1 order), the current one marked, each linking to its module. */
function FullWorkflowDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const current = certificationStageForPath(location.pathname)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-100 p-5">
            <div>
              <Dialog.Title className="text-h3-semi text-text-primary">
                {t('cab.pipeline.title', 'Certification pipeline')}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-body-3 text-text-secondary">
                {t('cab.pipeline.dialogHint', 'From application to surveillance. Select a stage to open it.')}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md px-2 py-1 text-body-lg leading-none text-neutral-700 hover:bg-neutral-25" aria-label={t('common.close', 'Close')}>
              ×
            </Dialog.Close>
          </div>
          <ol className="min-h-0 flex-1 overflow-y-auto p-5">
            {certificationSteps.map((step, index) => {
              const done = index < current
              const here = index === current
              const Icon = step.icon
              return (
                <li key={step.key} className="relative">
                  {index < certificationSteps.length - 1 && (
                    <span className={cn('absolute start-5 top-11 h-[calc(100%-2.75rem+0.5rem)] w-0.5', done ? 'bg-success-500' : 'bg-neutral-100')} aria-hidden />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false)
                      if (step.href) navigate(step.href)
                    }}
                    className={cn(
                      'mb-2 flex w-full items-center gap-3 rounded-md p-1.5 text-start transition-colors hover:bg-primary-25',
                      here && 'bg-primary-25'
                    )}
                  >
                    <span className={cn('relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full', done ? 'bg-success-500 text-white' : here ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-700')}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-body-3-semibold', here ? 'text-primary' : 'text-text-primary')}>
                        {index + 1}. {t(step.key, step.fallback ? { defaultValue: step.fallback } : undefined)}
                      </span>
                    </span>
                    {here && (
                      <span className="shrink-0 rounded-sm bg-primary px-2 py-0.5 text-caption font-medium text-white">
                        {t('cab.pipeline.youAreHere', 'You are here')}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ol>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
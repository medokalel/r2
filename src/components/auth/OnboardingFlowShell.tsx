import { type ReactNode, useEffect, useRef, useState } from 'react'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { OnboardingStepTransition } from '@/components/auth/OnboardingStepTransition'
import { AppIcon, HistoryIcon, TaskSquareIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/buttonVariants'

export interface OnboardingIntroContent {
  title: string
  description: string
  estimatedTimeValue: string
  estimatedTimeLabel: string
  estimatedTimeDescription?: string
  howItWorksLabel: string
  howItWorksValue: string
  cta: string
}

export interface OnboardingSuccessContent {
  title: string
  description: string
  back: string
  cta: string
}

interface OnboardingFlowShellProps {
  step: number
  introStep: number
  successStep: number
  firstFormStep: number
  lastFormStep: number
  wideStep?: number
  wideSteps?: number[]
  brandingStep?: number
  intro?: OnboardingIntroContent
  success: OnboardingSuccessContent
  onIntroStart?: () => void
  onSuccessBack: () => void
  onSuccessContinue: () => void
  children: ReactNode
  actions?: ReactNode
  error?: ReactNode
  /** e.g. "CAB SETUP" — shown with the step counter above each form screen. */
  stepBadgeLabel?: string
  /** 1-based position of the current screen within `stepBadgeTotal`. */
  stepBadgeCurrent?: number
  stepBadgeTotal?: number
}

export function OnboardingFlowShell({
  step,
  introStep,
  successStep,
  firstFormStep,
  lastFormStep,
  wideStep,
  wideSteps,
  brandingStep,
  intro,
  success,
  onIntroStart,
  onSuccessBack,
  onSuccessContinue,
  children,
  actions,
  error,
  stepBadgeLabel,
  stepBadgeCurrent,
  stepBadgeTotal,
}: OnboardingFlowShellProps) {
  const isFormStep = step >= firstFormStep && step <= lastFormStep
  const previousStepRef = useRef(step)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  useEffect(() => {
    setDirection(step >= previousStepRef.current ? 'forward' : 'back')
    previousStepRef.current = step
  }, [step])

  const isWideStep = wideSteps?.includes(step) ?? step === wideStep

  const stepClassName =
    brandingStep !== undefined && step === brandingStep
      ? 'w-full'
      : isWideStep
        ? 'mx-auto w-full max-w-[752px]'
        : 'mx-auto w-full max-w-[640px]'

  return (
    <div
      className="flex min-h-screen flex-col bg-slate-50 bg-cover bg-fixed bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/Group.png')" }}
    >
      <CabHeader title="" />

      <main className="mx-auto flex w-full max-w-[876px] flex-1 items-start px-6 py-10">
        {intro && step === introStep && (
          <OnboardingStepTransition key="intro" direction={direction} className="mx-auto w-full max-w-[640px]">
            <h1 className="text-page-title text-text-primary mb-1">{intro.title}</h1>
            <p className="mb-6 text-body-2 text-neutral-600">{intro.description}</p>

            <div className="mb-4 flex min-h-[66px] items-center gap-3 rounded-md border border-neutral-300 bg-white px-4 py-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-subtle">
                <AppIcon icon={HistoryIcon} size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-body-2-semibold text-neutral-900">
                  {intro.estimatedTimeValue} {intro.estimatedTimeLabel}
                </p>
                {intro.estimatedTimeDescription && (
                  <p className="text-body-3 text-neutral-600">{intro.estimatedTimeDescription}</p>
                )}
              </div>
            </div>

            <div className="mb-6 min-h-[92px] rounded-md border border-neutral-300 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-subtle">
                  <AppIcon icon={TaskSquareIcon} size={18} className="text-primary" />
                </div>
                <p className="text-body-2-semibold text-neutral-900">{intro.howItWorksLabel}</p>
              </div>
              <p className="text-body-3 text-neutral-600">{intro.howItWorksValue}</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onIntroStart}
                className={cn(buttonVariants({ variant: 'primary', size: 'default' }), 'w-full sm:w-[157px]')}
              >
                {intro.cta}
              </button>
            </div>
          </OnboardingStepTransition>
        )}

        {step === successStep && (
          <OnboardingStepTransition
            key="success"
            direction={direction}
            className="mx-auto flex w-full max-w-[640px] flex-col items-center rounded-lg border border-neutral-300 bg-white px-6 py-7 text-center sm:px-12"
          >
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-success-50 text-2xl motion-safe:animate-[fadeInScale_0.45s_ease-out_both]" aria-hidden>
              ✨
            </div>
            <h1 className="text-page-title text-text-primary mb-1">{success.title}</h1>
            <p className="mb-6 max-w-md text-body-2 text-neutral-600">{success.description}</p>
            <div className="flex w-full max-w-[328px] flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={onSuccessBack}
                className="h-10 flex-1 rounded-md border border-primary text-body-2-semibold text-primary transition-colors hover:bg-neutral-50"
              >
                {success.back}
              </button>
              <button
                type="button"
                onClick={onSuccessContinue}
                className={cn(buttonVariants({ variant: 'primary', size: 'default' }), 'flex-1')}
              >
                {success.cta}
              </button>
            </div>
          </OnboardingStepTransition>
        )}

        {isFormStep && (
          <OnboardingStepTransition key={step} direction={direction} className={cn(stepClassName)}>
            {stepBadgeLabel && stepBadgeCurrent !== undefined && stepBadgeTotal !== undefined && (
              <p className="mb-4 flex items-center gap-2 text-caption font-semibold uppercase tracking-[0.08em] text-primary">
                <span className="inline-flex items-center rounded-full bg-primary-subtle px-3 py-1">
                  {stepBadgeLabel}
                </span>
                <span lang="en" dir="ltr" className="text-neutral-600">
                  {stepBadgeCurrent}/{stepBadgeTotal}
                </span>
              </p>
            )}
            {children}
            {error}
            {actions}
          </OnboardingStepTransition>
        )}
      </main>
    </div>
  )
}

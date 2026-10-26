import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { TourTooltip } from '@/components/ui/TourTooltip'
import { useOptionalTour } from '@/context/tour/useTour'
import type { TourStepConfig } from '@/context/tour/tourTypes'
import { getNextCabTourInfo } from '@/config/cabTourSequence'

interface DashboardTourStepProps {
  /** Ordered steps for the tour this stepId belongs to. Defaults to active tour's steps. */
  steps?: TourStepConfig[]
  stepId: string
  children: ReactNode
  /** Extra classes for the tour anchor's wrapper div */
  className?: string
}

export function DashboardTourStep({ steps: stepsProp, stepId, children, className }: DashboardTourStepProps) {
  const tour = useOptionalTour()
  const { t } = useTranslation()

  if (!tour) {
    return <>{children}</>
  }

  const steps = stepsProp ?? tour.steps

  const { tourId, activeStepId, isTourActive, nextStep, prevStep, skipTour } = tour
  const config = steps.find((s) => s.id === stepId)

  if (!config) {
    return <>{children}</>
  }

  // Only the step the tour is currently on is ever open — no hover fallback,
  // no click-to-jump. Advancing only happens via the Skip/Back/Next buttons,
  // so this stays a plain boolean the whole component tree can rely on.
  const isOpen = isTourActive && activeStepId === stepId
  const isLastStep = config.step === config.totalSteps
  const hasNextSection = Boolean(tourId && getNextCabTourInfo(tourId))

  const finishLabel = hasNextSection
    ? t('cab.tour.nextSection', 'انتقل للقسم التالي')
    : t('cab.tour.finish', 'إنهاء الجولة')

  return (
    <TourTooltip
      step={config.step}
      totalSteps={config.totalSteps}
      title={config.title}
      description={config.description}
      side={config.side}
      align={config.align}
      alignOffset={config.alignOffset}
      open={isOpen}
      onNext={nextStep}
      nextLabel={isLastStep ? finishLabel : t('cab.tour.next', 'التالي')}
      backLabel={t('cab.tour.back', 'السابق')}
      skipLabel={t('cab.tour.skip', 'تخطي الجولة')}
      closeLabel={t('cab.tour.close', 'إغلاق')}
      onBack={config.step > 1 ? prevStep : undefined}
      onSkip={skipTour}
      className={className}
    >
      {children}
    </TourTooltip>
  )
}

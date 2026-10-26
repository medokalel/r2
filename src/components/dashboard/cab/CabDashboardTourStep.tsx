import { useEffect, useState, type ReactNode } from 'react'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { useCabDashboardTourSteps } from '@/config/cabTourSteps'
import { useOptionalTour, type TourStepConfig } from '@/context/TourContext'

const XL_MEDIA_QUERY = '(min-width: 1280px)'

function useIsXlScreen(): boolean {
  const [isXl, setIsXl] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(XL_MEDIA_QUERY).matches : true,
  )

  useEffect(() => {
    const mq = window.matchMedia(XL_MEDIA_QUERY)
    const onChange = () => setIsXl(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isXl
}

interface CabTourStepProps {
  steps: TourStepConfig[]
  stepId?: string
  children: ReactNode
  /** Extra classes for the tour anchor's wrapper div — e.g. to center a
   *  fixed-size child instead of letting it sit at the wrapper's start edge. */
  className?: string
}

export function CabTourStep({ steps, stepId, children, className }: CabTourStepProps) {
  if (!stepId) return <>{children}</>
  return (
    <DashboardTourStep steps={steps} stepId={stepId} className={className}>
      {children}
    </DashboardTourStep>
  )
}

interface CabResponsiveTourStepProps {
  steps: TourStepConfig[]
  stepId: string
  children: ReactNode
  desktopClassName?: string
  mobileClassName?: string
}

/** Sidebar tours rendered twice (desktop + mobile). Only the visible copy opens the popover. */
export function CabResponsiveTourStep({
  steps,
  stepId,
  children,
  desktopClassName = 'hidden flex-col xl:flex',
  mobileClassName = 'flex flex-col gap-4 xl:hidden',
}: CabResponsiveTourStepProps) {
  const tour = useOptionalTour()
  const isXl = useIsXlScreen()
  const isActive = tour?.isTourActive === true && tour.activeStepId === stepId

  const desktopContent =
    isActive && isXl ? (
      <CabTourStep steps={steps} stepId={stepId}>
        {children}
      </CabTourStep>
    ) : (
      children
    )

  const mobileContent =
    isActive && !isXl ? (
      <CabTourStep steps={steps} stepId={stepId}>
        {children}
      </CabTourStep>
    ) : (
      children
    )

  return (
    <>
      <aside className={desktopClassName}>{desktopContent}</aside>
      <div className={mobileClassName}>{mobileContent}</div>
    </>
  )
}

interface CabDashboardTourStepProps {
  stepId: string
  children: ReactNode
  steps?: TourStepConfig[]
  className?: string
}

/** CAB tour anchor — defaults to dashboard steps when `steps` is omitted. */
export function CabDashboardTourStep({
  stepId,
  children,
  steps,
  className,
}: CabDashboardTourStepProps) {
  const dashboardSteps = useCabDashboardTourSteps()
  return (
    <CabTourStep steps={steps ?? dashboardSteps} stepId={stepId} className={className}>
      {children}
    </CabTourStep>
  )
}

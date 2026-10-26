import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useDirection } from '@/context/direction/useDirection'
import { CabSidebarProvider } from '@/context/cabSidebar/CabSidebarProvider'
import { CabSidebar } from '@/components/dashboard/cab/CabSidebar'
import { PageFeedback } from '@/components/dashboard/PageFeedback'
import { AssistantWidget } from '@/components/assistant/AssistantWidget'
import { TourProvider } from '@/context/tour/TourProvider'
import type { TourStepConfig } from '@/context/tour/tourTypes'
import { useCabDashboardTourSteps } from '@/config/cabTourSteps'
import {
  getNextCabTourInfo,
  markTourPending,
  skipRemainingCabWorkflowTours,
} from '@/config/cabTourSequence'

interface CabLayoutProps {
  children: React.ReactNode
  className?: string
  /** Legacy prop from cab-workspace pages — ignored; main navbar is always used. */
  sidebarVariant?: string
  /** Override the tour that StartTourButton launches on this page.
   *  If omitted, falls back to the default CAB-dashboard tour. */
  tourId?: string
  tourSteps?: TourStepConfig[]
  /** Fired when the user finishes this page's tour. If not passed, defaults to chaining the next workspace section. */
  onTourComplete?: () => void
  /** Bump to remount the tour provider after resetting tour state. */
  tourSessionKey?: number
}

function CabShell({ children, className }: { children: React.ReactNode; className?: string }) {
  const { dir } = useDirection()
  return (
    <CabSidebarProvider>
      <div dir={dir} className={cn('flex min-h-screen bg-neutral-25', className)}>
        <CabSidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
          {children}
          <PageFeedback />
          {/* Room for the assistant button so it never covers the end of the page. */}
          <div aria-hidden className="h-20 shrink-0" />
        </div>
        <AssistantWidget />
      </div>
    </CabSidebarProvider>
  )
}

function CabLayoutWithDashboardTour({
  children,
  className,
  onTourComplete,
  tourSessionKey,
}: {
  children: React.ReactNode
  className?: string
  onTourComplete?: () => void
  tourSessionKey: number
}) {
  const navigate = useNavigate()
  const dashboardTourSteps = useCabDashboardTourSteps()

  const handleComplete = () => {
    if (onTourComplete) {
      onTourComplete()
      return
    }
    const chain = getNextCabTourInfo('cab-dashboard')
    if (chain) {
      markTourPending(chain.nextTourId)
      navigate(chain.nextRoute)
    }
  }

  const handleSkip = () => {
    skipRemainingCabWorkflowTours('cab-dashboard')
  }

  return (
    <TourProvider
      key={tourSessionKey}
      tourId="cab-dashboard"
      steps={dashboardTourSteps}
      onComplete={handleComplete}
      onSkip={handleSkip}
    >
      <CabShell className={className}>{children}</CabShell>
    </TourProvider>
  )
}

export function CabLayout({
  children,
  className,
  tourId,
  tourSteps,
  onTourComplete,
  tourSessionKey = 0,
}: CabLayoutProps) {
  const navigate = useNavigate()

  if (tourId && tourSteps) {
    const handleComplete = () => {
      if (onTourComplete) {
        onTourComplete()
        return
      }
      const chain = getNextCabTourInfo(tourId)
      if (chain) {
        markTourPending(chain.nextTourId)
        navigate(chain.nextRoute)
      }
    }

    const handleSkip = () => {
      skipRemainingCabWorkflowTours(tourId)
    }

    return (
      <TourProvider
        key={tourSessionKey}
        tourId={tourId}
        steps={tourSteps}
        onComplete={handleComplete}
        onSkip={handleSkip}
      >
        <CabShell className={className}>{children}</CabShell>
      </TourProvider>
    )
  }

  return (
    <CabLayoutWithDashboardTour
      className={className}
      onTourComplete={onTourComplete}
      tourSessionKey={tourSessionKey}
    >
      {children}
    </CabLayoutWithDashboardTour>
  )
}

import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { TourProvider } from '@/context/tour/TourProvider'
import type { TourStepConfig } from '@/context/tour/tourTypes'
import {
  CAB_TOUR_NEXT_ROUTE,
  getNextCabTourId,
  isCabWorkflowTour,
  markTourPending,
  skipRemainingCabWorkflowTours,
  type CabWorkflowTourId,
} from '@/config/cabTourSequence'

interface CabTourProviderProps {
  tourId: CabWorkflowTourId
  steps: TourStepConfig[]
  children: ReactNode
}

/** Wraps TourProvider and chains across CAB workflow pages on Finish. */
export function CabTourProvider({ tourId, steps, children }: CabTourProviderProps) {
  const navigate = useNavigate()

  const handleComplete = () => {
    const nextRoute = CAB_TOUR_NEXT_ROUTE[tourId]
    const nextTourId = getNextCabTourId(tourId)
    if (nextRoute && nextTourId) {
      markTourPending(nextTourId)
      navigate(nextRoute)
    }
  }

  const handleSkip = () => {
    skipRemainingCabWorkflowTours(tourId)
  }

  return (
    <TourProvider
      tourId={tourId}
      steps={steps}
      onComplete={isCabWorkflowTour(tourId) ? handleComplete : undefined}
      onSkip={isCabWorkflowTour(tourId) ? handleSkip : undefined}
    >
      {children}
    </TourProvider>
  )
}

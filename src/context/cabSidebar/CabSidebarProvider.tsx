import { useMemo, useState } from 'react'
import type { CabWorkflowTourId } from '@/config/cabTourSequence'
import type { TourStepConfig } from '@/context/tour/tourTypes'
import { CabSidebarContext } from './cabSidebarContext'

export function CabSidebarProvider({
  children,
  tourId,
  tourSteps,
}: {
  children: React.ReactNode
  tourId?: CabWorkflowTourId
  tourSteps?: TourStepConfig[]
}) {
  const [expanded, setExpanded] = useState(false)
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null)
  const value = useMemo(
    () => ({ expanded, setExpanded, mobileOpenPath, setMobileOpenPath, tourId, tourSteps }),
    [expanded, mobileOpenPath, tourId, tourSteps]
  )

  return <CabSidebarContext.Provider value={value}>{children}</CabSidebarContext.Provider>
}

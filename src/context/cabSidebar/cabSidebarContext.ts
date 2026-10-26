import { createContext } from 'react'
import type { CabWorkflowTourId } from '@/config/cabTourSequence'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export interface CabSidebarContextValue {
  expanded: boolean
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>
  /** Phones/small tablets: the route the drawer was opened on (null = closed). Navigating closes it. */
  mobileOpenPath: string | null
  setMobileOpenPath: React.Dispatch<React.SetStateAction<string | null>>
  tourId?: CabWorkflowTourId
  tourSteps?: TourStepConfig[]
}

export const CabSidebarContext = createContext<CabSidebarContextValue | null>(null)

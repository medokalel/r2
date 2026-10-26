export interface TourStepConfig {
  id: string
  step: number
  totalSteps: number
  title: string
  description: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  /** Radix Popover alignOffset — nudges the popover along the alignment axis, RTL-aware. */
  alignOffset?: number
}

export interface TourContextType {
  tourId: string
  steps: TourStepConfig[]
  currentStepIndex: number
  activeStepId: string | null
  totalSteps: number
  isTourActive: boolean
  isSkipped: boolean
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  startTour: () => void
}

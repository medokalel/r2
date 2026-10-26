import { useEffect, useState, type ReactNode } from 'react'
import { TourContext } from './tourContext'
import { getTourPendingKey, getTourStatusKey, setTourStatus } from './tourStorage'
import type { TourStepConfig } from './tourTypes'

interface TourState {
  currentStepIndex: number
  isTourActive: boolean
  isSkipped: boolean
}

const INITIAL_TOUR_STATE: TourState = { currentStepIndex: 0, isTourActive: false, isSkipped: false }

/**
 * What the persisted pending/status flags say this tour should look like.
 * Returns only the fields that change; `null` means "leave the state as is".
 * Pure read — the pending flag itself is cleared in an effect.
 */
function readStoredTourState(tourId: string): Partial<TourState> | null {
  const isPending = localStorage.getItem(getTourPendingKey(tourId)) === 'true'
  const status = localStorage.getItem(getTourStatusKey(tourId))

  // If marked pending (e.g. navigated from previous page tour), ALWAYS auto-start.
  if (isPending) {
    return { currentStepIndex: 0, isTourActive: true, isSkipped: false }
  }

  if (status === 'skipped' || status === 'completed') {
    return { isTourActive: false, isSkipped: true }
  }

  if (!status) {
    return { currentStepIndex: 0, isTourActive: true, isSkipped: false }
  }

  return null
}

interface TourProviderProps {
  /** Unique id for this tour (e.g. 'cab-dashboard', 'auditee-dashboard'). Namespaces its storage keys. */
  tourId: string
  /** Ordered steps this tour walks through. */
  steps: TourStepConfig[]
  children: ReactNode
  /** Called after the user clicks Finish on the last step. */
  onComplete?: () => void
  /** Called after the user skips the tour (in addition to persisting skipped status). */
  onSkip?: () => void
}

export function TourProvider({ tourId, steps, children, onComplete, onSkip }: TourProviderProps) {
  const [tour, setTour] = useState<TourState>(() => ({
    ...INITIAL_TOUR_STATE,
    ...readStoredTourState(tourId),
  }))
  const [syncedTourId, setSyncedTourId] = useState(tourId)

  // Re-read the stored flags when the tour id changes (adjusting state during render).
  if (syncedTourId !== tourId) {
    setSyncedTourId(tourId)
    const stored = readStoredTourState(tourId)
    if (stored) setTour((prev) => ({ ...prev, ...stored }))
  }

  // A pending tour has now been picked up: clear the one-shot flag and any stale status.
  useEffect(() => {
    const pendingKey = getTourPendingKey(tourId)
    if (localStorage.getItem(pendingKey) === 'true') {
      localStorage.removeItem(pendingKey)
      localStorage.removeItem(getTourStatusKey(tourId))
    }
  }, [tourId])

  const { currentStepIndex, isTourActive, isSkipped } = tour
  const activeStepConfig = steps[currentStepIndex]
  const activeStepId = isTourActive && activeStepConfig ? activeStepConfig.id : null

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setTour((prev) => ({ ...prev, currentStepIndex: prev.currentStepIndex + 1 }))
    } else {
      setTour((prev) => ({ ...prev, isTourActive: false, isSkipped: true }))
      setTourStatus(tourId, 'completed')
      onComplete?.()
    }
  }

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setTour((prev) => ({ ...prev, currentStepIndex: prev.currentStepIndex - 1 }))
    }
  }

  const skipTour = () => {
    setTour((prev) => ({ ...prev, isTourActive: false, isSkipped: true }))
    setTourStatus(tourId, 'skipped')
    onSkip?.()
  }

  const startTour = () => {
    localStorage.removeItem(getTourStatusKey(tourId))
    setTour({ currentStepIndex: 0, isTourActive: true, isSkipped: false })
  }

  return (
    <TourContext.Provider
      value={{
        tourId,
        steps,
        currentStepIndex,
        activeStepId,
        totalSteps: steps.length,
        isTourActive,
        isSkipped,
        nextStep,
        prevStep,
        skipTour,
        startTour,
      }}
    >
      {children}
    </TourContext.Provider>
  )
}

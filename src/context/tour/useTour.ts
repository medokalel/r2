import { useContext } from 'react'
import { TourContext } from './tourContext'
import type { TourContextType } from './tourTypes'

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}

/**
 * Same context, but returns `undefined` instead of throwing when there's no
 * TourProvider above. For components reused across many pages (e.g. a shared
 * header) where only some of those pages actually run a tour — lets them
 * render a "take the tour" affordance only where one exists.
 */
export function useOptionalTour(): TourContextType | undefined {
  return useContext(TourContext)
}

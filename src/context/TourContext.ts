// Public entry point kept for existing imports. The provider, context object,
// hooks and storage helpers live in ./tour so each module stays Fast Refresh-safe.
export { TourProvider } from './tour/TourProvider'
export { useTour, useOptionalTour } from './tour/useTour'
export { getTourUserKey, getTourStatusKey, setTourStatus, markTourPending } from './tour/tourStorage'
export type { TourStepConfig, TourContextType } from './tour/tourTypes'

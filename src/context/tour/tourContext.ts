import { createContext } from 'react'
import type { TourContextType } from './tourTypes'

export const TourContext = createContext<TourContextType | undefined>(undefined)

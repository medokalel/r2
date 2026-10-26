import { useContext } from 'react'
import { DirectionContext } from './directionContext'

export const useDirection = () => useContext(DirectionContext)

import { useEffect, useState } from 'react'

/** Preserve readable, responsive layouts on phones instead of shrinking desktop UI. */
const DESIGN_WIDTH = 1640
const MOBILE_BREAKPOINT = 768

export function useFitScale() {
  const getScale = () =>
    window.innerWidth < MOBILE_BREAKPOINT ? 1 : Math.min(1, window.innerWidth / DESIGN_WIDTH)

  const [scale, setScale] = useState(getScale)

  useEffect(() => {
    const onResize = () => setScale(getScale())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return scale
}

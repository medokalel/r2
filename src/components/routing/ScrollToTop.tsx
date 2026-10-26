import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function resetScrollPositions() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  document.querySelectorAll('main, .overflow-y-auto, .overflow-auto').forEach((el) => {
    if (!(el instanceof HTMLElement)) return
    if (el.closest('aside')) return
    el.scrollTop = 0
  })
}

/** Scroll to the top whenever the route changes. */
export function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    resetScrollPositions()
  }, [pathname, search])

  return null
}

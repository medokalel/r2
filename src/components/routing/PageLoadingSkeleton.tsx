import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useValuesChanged } from '@/hooks/useValuesChanged'

/** Full-page shimmer shown while a lazy route chunk loads. */
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-live="polite">
      <div className="border-b border-neutral-100 px-5 py-4 sm:px-6">
        <div className="skeleton h-8 w-40" />
      </div>
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="skeleton h-7 w-56" />
        <div className="skeleton h-4 w-80 max-w-full" />
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="skeleton h-24 rounded-lg" />
          <div className="skeleton h-24 rounded-lg" />
          <div className="skeleton h-24 rounded-lg" />
        </div>
        <div className="mt-1 rounded-lg border border-neutral-100 bg-white p-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="skeleton mb-3 h-10 w-full last:mb-0" />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Visible on every route change so skeleton loading is not only a fast chunk flash. */
export function RouteSkeletonOverlay({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [show, setShow] = useState(true)

  // Show the overlay again in the render where the route changes.
  const pathnameChanged = useValuesChanged([pathname])
  if (pathnameChanged) {
    setShow(true)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setShow(false), 500)
    return () => window.clearTimeout(timer)
  }, [pathname])

  return (
    <>
      {children}
      {show ? (
        <div className="fixed inset-0 z-[2000] overflow-auto bg-white">
          <PageLoadingSkeleton />
        </div>
      ) : null}
    </>
  )
}

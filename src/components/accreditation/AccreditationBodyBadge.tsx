import { useState } from 'react'
import { accreditationBodyMonogram, type AccreditationBody } from '@/lib/accreditationBodies'
import { cn } from '@/lib/utils'

interface AccreditationBodyBadgeProps {
  body: AccreditationBody
  size?: 'sm' | 'md'
  className?: string
}

/** Public URL of a body's logo, or null when only the monogram is available. */
function logoUrl(body: AccreditationBody): string | null {
  return body.logo ? `${import.meta.env.BASE_URL}${body.logo}` : null
}

/** The body's logo when the app has one, otherwise a monogram of its acronym. */
export function AccreditationBodyBadge({ body, size = 'sm', className }: AccreditationBodyBadgeProps) {
  const logo = logoUrl(body)
  const [failed, setFailed] = useState(false)
  const box = size === 'md' ? 'h-10 w-10 text-caption' : 'h-7 w-7 text-overline'

  if (logo && !failed) {
    return (
      <span className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-sm border border-neutral-300 bg-white', box, className)}>
        <img src={logo} alt={body.acronym} className="h-full w-full object-contain p-0.5" onError={() => setFailed(true)} />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-sm bg-primary-subtle font-bold tracking-tight text-primary',
        box,
        className
      )}
    >
      {accreditationBodyMonogram(body)}
    </span>
  )
}

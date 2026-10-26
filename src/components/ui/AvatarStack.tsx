import { cn } from '@/lib/utils'

interface AvatarStackProps {
  /** Pre-computed initials for each member, e.g. ['AK', 'JD', 'MK']. */
  items: string[]
  /** How many avatars to render before collapsing the rest into a "+N" bubble. */
  max?: number
  className?: string
}

/**
 * A row of overlapping initials avatars with a "+N" overflow bubble.
 * No avatar-group primitive existed in the app yet — `UserAvatar` renders a
 * single image-based avatar, and other initials badges (e.g. in
 * CabApplicationReviewPage) are single, non-overlapping bubbles. This stays
 * small and generic enough to be reused anywhere a team needs to render this
 * way, not just the audit calendar.
 */
export function AvatarStack({ items, max = 2, className }: AvatarStackProps) {
  const visible = items.slice(0, max)
  const overflow = items.length - visible.length

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((initials, i) => (
        <span
          key={`${initials}-${i}`}
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-caption font-bold text-primary',
            i > 0 && '-ms-2'
          )}
        >
          {initials}
        </span>
      ))}
      {overflow > 0 && (
        <span className="-ms-2 flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-300 text-caption font-semibold text-neutral-600">
          +{overflow}
        </span>
      )}
    </div>
  )
}
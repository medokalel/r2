import type { NonconformityStatus } from '@/lib/api/cabNonconformitiesApi'
import { cn } from '@/lib/utils'

/**
 * Single source of truth for nonconformity status colors.
 * Rectangular badge styled to match the standard across CAB tables.
 */
const STATUS_STYLES: Record<NonconformityStatus, string> = {
  open: 'bg-warning-50 text-warning-700',
  in_progress: 'bg-primary-50 text-primary',
  submitted: 'bg-orange-50 text-orange-600',
  closed: 'bg-success-50 text-success-600',
  overdue: 'bg-error-50 text-error-600',
}

interface NonconformityStatusBadgeProps {
  status: NonconformityStatus
  label: string
  className?: string
}

export function NonconformityStatusBadge({
  status,
  label,
  className,
}: NonconformityStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
        STATUS_STYLES[status],
        className,
      )}
    >
      {label}
    </span>
  )
}
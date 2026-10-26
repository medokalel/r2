import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import type { CertificationLifecycleStatus } from '@/lib/api/cabCertificationApi'
import { cn } from '@/lib/utils'

/**
 * Single source of truth for certification lifecycle status colors — was a
 * private helper inside CabCertificationCyclesPage; lifted out so the manage
 * page renders the exact same badge instead of redefining the color map.
 */
const LIFECYCLE_STATUS_STYLES: Record<CertificationLifecycleStatus, string> = {
  active: 'bg-success-50 text-success-600',
  upcoming: 'bg-primary-50 text-primary',
  suspended: 'bg-orange-50 text-orange-600',
  expired: 'bg-error-50 text-error-600',
}

interface CertificationLifecycleBadgeProps {
  status: CertificationLifecycleStatus
  label: string
  className?: string
}

export function CertificationLifecycleBadge({ status, label, className }: CertificationLifecycleBadgeProps) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
        LIFECYCLE_STATUS_STYLES[status],
        className,
      )}
    >
      {enumLabel(t, label)}
    </span>
  )
}
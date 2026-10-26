import { useTranslation } from 'react-i18next'
import type { PriceStatus } from '@/lib/api/travelApi'
import { cn } from '@/lib/utils'
import { STATUS_TONE, statusHint, statusLabel } from '@/components/travel/travelHelpers'

/** Price status chip of a travel cost line (LIVE only from a connected provider). */
export function PriceStatusBadge({ status, className }: { status: PriceStatus; className?: string }) {
  const { t } = useTranslation()
  return (
    <span
      title={statusHint(t, status)}
      className={cn('inline-flex items-center justify-center rounded-sm px-2 py-0.5 text-caption font-medium whitespace-nowrap', STATUS_TONE[status], className)}
    >
      {statusLabel(t, status)}
    </span>
  )
}

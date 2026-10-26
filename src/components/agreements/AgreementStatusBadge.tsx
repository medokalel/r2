import { useTranslation } from 'react-i18next'
import type { AgreementStatus } from '@/lib/api/agreementsApi'
import { cn } from '@/lib/utils'
import { STATUS_TONE, statusLabel } from '@/components/agreements/agreementHelpers'

/** Agreement status chip, same shape as the other CAB register badges. */
export function AgreementStatusBadge({ status, className }: { status: AgreementStatus; className?: string }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
        STATUS_TONE[status],
        className,
      )}
    >
      {statusLabel(t, status)}
    </span>
  )
}

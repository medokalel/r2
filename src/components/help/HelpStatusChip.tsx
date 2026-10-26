import { NonconformityStatusBadge } from '@/components/dashboard/cab/NonconformityStatusBadge'
import { CertificationLifecycleBadge } from '@/components/dashboard/cab/CertificationLifecycleBadge'
import { QuotationStatusBadge } from '@/components/dashboard/cab/QuotationView'
import { InvoiceStatusBadge, SubscriptionStatusBadge } from '@/components/platform/PlatformUi'
import type { NonconformityStatus } from '@/lib/api/cabNonconformitiesApi'
import type { CertificationLifecycleStatus } from '@/lib/api/cabCertificationApi'
import type { QuotationStatus } from '@/lib/api/cabQuotationApi'
import type { PlatformInvoiceStatus, SubscriptionStatus } from '@/lib/api/platformTypes'
import { STATUS_DOMAINS } from '@/lib/help/statuses'
import type { HelpStatusDomain } from '@/lib/help/types'
import { cn } from '@/lib/utils'

const chipClass = 'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-caption font-medium'

/** The app's own status chip for a value, so iHelp shows exactly what users see on screen. */
export function HelpStatusChip({ domain, value, label }: { domain?: HelpStatusDomain; value: string | null; label: string }) {
  if (domain && value) {
    switch (domain) {
      case 'nonconformity':
        return <NonconformityStatusBadge status={value as NonconformityStatus} label={label} />
      case 'lifecycle':
        return <CertificationLifecycleBadge status={value as CertificationLifecycleStatus} label={value} />
      case 'quotation':
        return <QuotationStatusBadge status={value as QuotationStatus} />
      case 'subscription':
        return <SubscriptionStatusBadge status={value as SubscriptionStatus} />
      case 'platformInvoice':
        return <InvoiceStatusBadge status={value as PlatformInvoiceStatus} />
      default: {
        const tone = STATUS_DOMAINS[domain].tone?.(value)
        if (tone) return <span className={cn(chipClass, tone)}>{label}</span>
      }
    }
  }
  return <span className={cn(chipClass, 'border border-border-default bg-bg-secondary text-text-primary')}>{label}</span>
}

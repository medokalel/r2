import { useTranslation } from 'react-i18next'
import { isAtLimit, isNearLimit, usagePercent } from '@/lib/subscriptionFeatures'
import { cn } from '@/lib/utils'

interface UsageMeterProps {
  label?: string
  used: number
  /** null = unlimited */
  limit: number | null
  /** Thin bar without the text line (tables). */
  compact?: boolean
  className?: string
}

/** Used / limit bar: brand blue, amber from 80 %, red at the limit; "Unlimited" when there is no cap. */
export function UsageMeter({ label, used, limit, compact = false, className }: UsageMeterProps) {
  const { t } = useTranslation()
  const percent = usagePercent(used, limit)
  const atLimit = isAtLimit(used, limit)
  const near = isNearLimit(used, limit)
  const tone = atLimit ? 'bg-error-500' : near ? 'bg-warning-500' : 'bg-primary'
  const width = percent == null ? 100 : Math.min(100, Math.max(percent, used > 0 ? 3 : 0))

  return (
    <div className={cn('min-w-0', className)}>
      {!compact && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label && <span className="truncate text-body-sm font-medium text-neutral-800">{label}</span>}
          <span className="shrink-0 text-body-sm text-neutral-600" dir="ltr">
            {limit == null ? `${used.toLocaleString('en-US')} / ∞` : `${used.toLocaleString('en-US')} / ${limit.toLocaleString('en-US')}`}
          </span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-neutral-100"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit ?? undefined}
        aria-valuenow={used}
        aria-valuetext={limit == null ? t('platform.common.unlimitedUsage', { used }) : t('platform.common.usageOf', { used, limit })}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', percent == null ? 'bg-accent-teal/60' : tone)}
          style={{ width: `${width}%` }}
        />
      </div>
      {compact && (
        <p className="mt-1 text-caption text-neutral-600" dir="ltr">
          {limit == null ? `${used.toLocaleString('en-US')} / ∞` : `${used.toLocaleString('en-US')} / ${limit.toLocaleString('en-US')}`}
        </p>
      )}
    </div>
  )
}

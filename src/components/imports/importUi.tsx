import { useTranslation } from 'react-i18next'
import type { ImportRowStatus } from '@/lib/imports/types'
import { STATUS_STYLES } from '@/components/imports/importText'
import { cn } from '@/lib/utils'

/** Small shared pieces of the import wizard and the migration hub. */

export function ImportStatusChip({ status, className }: { status: ImportRowStatus; className?: string }) {
  const { t } = useTranslation()
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-caption font-semibold ring-1 ring-inset', STATUS_STYLES[status].chip, className)}>
      <span aria-hidden className={cn('size-1.5 rounded-full', STATUS_STYLES[status].dot)} />
      {t(`imports.review.status.${status}`)}
    </span>
  )
}

function ringTone(value: number): string {
  if (value >= 90) return 'text-success-500'
  if (value >= 60) return 'text-primary'
  return 'text-warning-500'
}

/** Circular percentage (completeness). */
export function CompletenessRing({ value, size = 104, label }: { value: number; size?: number; label?: string }) {
  const stroke = Math.max(6, Math.round(size / 11))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label ?? ''} ${clamped}%`.trim()}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-neutral-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', ringTone(clamped))}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[22px] font-bold tabular-nums text-text-primary" dir="ltr">
        {clamped}%
      </span>
    </div>
  )
}

/** Thin horizontal completeness bar (per row). */
export function MiniBar({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
        <span className={cn('block h-full rounded-full', value >= 90 ? 'bg-success-500' : value >= 60 ? 'bg-primary' : 'bg-warning-400')} style={{ width: `${value}%` }} />
      </span>
      <span className="text-caption tabular-nums text-text-secondary" dir="ltr">
        {value}%
      </span>
    </span>
  )
}

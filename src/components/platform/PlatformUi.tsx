import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { PlatformInvoiceStatus, SubscriptionStatus } from '@/lib/api/platformTypes'
import { cn } from '@/lib/utils'
import { PLATFORM_BRAND } from '@/components/platform/platformStyles'

/** Building blocks of the platform console, styled like the CAB registers (white cards, alabaster borders, brand-blue table heads). */


function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-500 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  crumbs,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  crumbs?: Array<{ label: string; to?: string }>
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3">
      {crumbs && crumbs.length > 0 && (
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-body-sm" aria-label={t('platform.common.breadcrumb')}>
          {crumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-2">
              {i > 0 && <Chevron />}
              {crumb.to ? (
                <Link to={crumb.to} className="truncate font-light text-neutral-500 hover:text-primary">
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-neutral-800">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-page-title text-text-primary">{title}</h1>
          {subtitle && <p className="mt-1 text-body-sm text-neutral-600">{subtitle}</p>}
        </div>
        {actions && <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">{actions}</div>}
      </div>
    </div>
  )
}

export function Card({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('min-w-0 rounded-lg border border-neutral-100 bg-white', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-5 py-4">
          {title && <h2 className="text-body font-semibold text-neutral-900">{title}</h2>}
          {actions}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export function KpiCard({
  label,
  value,
  hint,
  accent = PLATFORM_BRAND.blue,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  accent?: string
}) {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-lg border border-neutral-100 bg-white p-4 sm:p-5">
      <span className="absolute inset-y-0 start-0 w-1" style={{ backgroundColor: accent }} aria-hidden />
      <p className="truncate text-body-sm font-medium text-neutral-600">{label}</p>
      <p className="mt-1 truncate text-[24px] font-bold leading-tight text-neutral-900 sm:text-[28px]" dir="ltr" style={{ textAlign: 'start' }}>
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-caption text-neutral-600">{hint}</p>}
    </div>
  )
}

const SUBSCRIPTION_STYLES: Record<SubscriptionStatus, string> = {
  TRIAL: 'bg-accent-blue/10 text-accent-blue',
  ACTIVE: 'bg-success-50 text-success-700',
  PAST_DUE: 'bg-warning-50 text-warning-800',
  SUSPENDED: 'bg-error-50 text-error-600',
  CANCELLED: 'bg-neutral-100 text-neutral-700',
  EXPIRED: 'bg-neutral-100 text-neutral-700',
}

const INVOICE_STYLES: Record<PlatformInvoiceStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  ISSUED: 'bg-accent-blue/10 text-accent-blue',
  PAID: 'bg-success-50 text-success-700',
  PARTIALLY_PAID: 'bg-accent-teal/10 text-accent-teal',
  OVERDUE: 'bg-error-50 text-error-600',
  VOID: 'bg-neutral-100 text-neutral-500 line-through',
}

const badgeClass = 'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2.5 py-1 text-caption font-medium'

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  const { t } = useTranslation()
  return <span className={cn(badgeClass, SUBSCRIPTION_STYLES[status] ?? SUBSCRIPTION_STYLES.CANCELLED)}>{t(`platform.status.${status}`)}</span>
}

export function InvoiceStatusBadge({ status }: { status: PlatformInvoiceStatus }) {
  const { t } = useTranslation()
  return <span className={cn(badgeClass, INVOICE_STYLES[status] ?? INVOICE_STYLES.DRAFT)}>{t(`platform.invoiceStatus.${status}`)}</span>
}

export function PlanBadge({ code, name }: { code: string; name: string }) {
  const tone =
    code === 'ENTERPRISE' ? 'border-warning-500/40 bg-warning-500/10 text-warning-700' : code === 'PROFESSIONAL' ? 'border-accent-teal/30 bg-accent-teal/10 text-accent-teal' : 'border-primary/20 bg-primary-25 text-primary'
  return <span className={cn(badgeClass, 'border', tone)}>{name}</span>
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 px-6 py-8 text-center">
      <p className="text-body font-semibold text-neutral-800">{title}</p>
      {hint && <p className="mt-1 max-w-md text-body-sm text-neutral-600">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label={t('platform.common.loading')}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-neutral-50" />
      ))}
    </div>
  )
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-error-100 bg-error-50 p-4 text-body-sm text-error-700 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-body-sm font-semibold text-error-700 underline-offset-4 hover:underline">
          {t('platform.common.retry')}
        </button>
      )}
    </div>
  )
}

export function FieldLabel({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-body-sm font-semibold text-neutral-800">
      {children}
      {required && <span className="text-error-500"> *</span>}
    </label>
  )
}


/** Table wrapper: horizontal scroll inside the card only (never the page) from md up. */
export function DataTable({ head, children, minWidth = 860 }: { head: React.ReactNode[]; children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse text-start" style={{ minWidth }}>
        <thead>
          <tr className="bg-primary text-white">
            {head.map((cell, i) => (
              <th key={i} className="px-4 py-3.5 text-start text-body-sm font-medium whitespace-nowrap">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}


/** Phone layout of a register: one card per row. */
export function MobileCards({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 md:hidden">{children}</div>
}

export function MobileCard({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const className = 'w-full min-w-0 rounded-lg border border-neutral-100 bg-white p-4 text-start'
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(className, 'transition-colors hover:border-primary/30')}>
      {children}
    </button>
  ) : (
    <div className={className}>{children}</div>
  )
}

export function KeyValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption font-medium text-neutral-600">{label}</dt>
      <dd className="mt-0.5 break-words text-body-sm text-neutral-900">{children}</dd>
    </div>
  )
}

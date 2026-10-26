import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'

/**
 * Small titled stat card — was private to MultiSiteRulePreview, lifted out
 * here so ReviewConfirmStep (Key Information Summary cards) reuses the same
 * component instead of redefining it.
 */
export function Card({ title, children, highlight }: { title: string; children: ReactNode; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        highlight ? 'border-dashed border-primary/40 bg-primary-25' : 'border-neutral-100 bg-white'
      )}
    >
      <p className="text-body-sm text-neutral-600">{title}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

export function Badge({ tone, children }: { tone: 'green' | 'red' | 'neutral'; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
        tone === 'green' && 'bg-success-100 text-success-600',
        tone === 'red' && 'bg-error-50 text-error-600',
        tone === 'neutral' && 'bg-neutral-50 text-neutral-700'
      )}
    >
      {children}
    </span>
  )
}

export function ReadOnlyField({
  label,
  children,
  className,
}: {
  label: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-caption font-medium text-neutral-600">{label}</p>
      <div className="mt-1 break-words text-body-sm font-semibold text-neutral-900">{children || notSet()}</div>
    </div>
  )
}

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-lg border border-neutral-100 bg-white p-5', className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-body-1-medium text-neutral-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

export function CalloutCard({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'blue' | 'amber' | 'green' | 'red'
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        tone === 'blue' && 'border-primary-100 bg-primary-25 text-primary',
        tone === 'amber' && 'border-accent-cream bg-orange-50 text-[#a05a00]',
        tone === 'green' && 'border-success-200 bg-success-50 text-success-700',
        tone === 'red' && 'border-error-200 bg-error-50 text-error-700'
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-body-sm font-semibold">{title}</p>
        <p className="mt-1 text-body-sm leading-relaxed text-neutral-700">{children}</p>
      </div>
    </div>
  )
}

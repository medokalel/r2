import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { TickCircle, Warning2 } from 'iconsax-reactjs'
import { Checkbox } from '@/components/ui/Checkbox'
import { cn } from '@/lib/utils'
import type { StepBlocker } from '@/lib/api/executionApi'
import { blockerText } from '@/lib/execution/executionText'

/** Shared building blocks of the audit execution, checklist and stage report screens (design-system tokens). */

export function Panel({ title, description, actions, children, className, id }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn('flex min-w-0 flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-4 sm:p-5', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-body font-bold text-neutral-900">{title}</h2>}
            {description && <p className="mt-0.5 text-body-sm text-neutral-600">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function Field({ label, hint, children, required, htmlFor }: { label: ReactNode; hint?: ReactNode; children: ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-body-sm font-medium text-neutral-800">
        {label}
        {required && <span className="text-error-700"> *</span>}
      </label>
      {children}
      {hint && <p className="text-caption text-neutral-600">{hint}</p>}
    </div>
  )
}

/** A checkbox row with label and hint, 44 px touch target. */
export function CheckRow({ checked, onChange, label, hint, disabled, testId }: { checked: boolean; onChange: (next: boolean) => void; label: ReactNode; hint?: ReactNode; disabled?: boolean; testId?: string }) {
  return (
    <label className={cn('flex min-h-11 cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5', checked ? 'border-success-500 bg-success-25' : 'border-neutral-100 bg-white', disabled && 'cursor-not-allowed opacity-70')} data-testid={testId}>
      <Checkbox checked={checked} onChange={() => onChange(!checked)} disabled={disabled} className="mt-0.5" />
      <span className="min-w-0">
        <span className="block text-body-sm font-medium text-neutral-900">{label}</span>
        {hint && <span className="mt-0.5 block text-caption text-neutral-600">{hint}</span>}
      </span>
    </label>
  )
}

/** A readiness line: done (green tick) or open (warning). */
export function StatusLine({ ok, label, detail, action }: { ok: boolean; label: ReactNode; detail?: ReactNode; action?: ReactNode }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-neutral-100 px-3 py-2.5">
      <div className="flex min-w-0 items-start gap-2.5">
        {ok ? <TickCircle size={20} variant="Bold" className="mt-0.5 shrink-0 text-success-500" /> : <Warning2 size={20} variant="Bold" className="mt-0.5 shrink-0 text-warning-500" />}
        <div className="min-w-0">
          <p className="text-body-sm font-medium text-neutral-900">{label}</p>
          {detail && <p className="text-caption text-neutral-600">{detail}</p>}
        </div>
      </div>
      {action}
    </li>
  )
}

export function BlockerList({ blockers, title }: { blockers: StepBlocker[]; title?: ReactNode }) {
  const { t } = useTranslation()
  if (!blockers.length) return null
  return (
    <div role="status" className="rounded-md border border-warning-100 bg-warning-50 px-4 py-3" data-testid="step-blockers">
      <p className="text-body-sm font-semibold text-warning-700">{title ?? t('execution.blockers.title')}</p>
      <ul className="mt-1.5 list-disc space-y-0.5 ps-5 text-caption text-neutral-800">
        {blockers.map((b) => (
          <li key={b.code}>{blockerText(t, b)}</li>
        ))}
      </ul>
    </div>
  )
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-2 py-0.5 text-caption font-medium', className)}>{children}</span>
}

/** "Draft for the product owner's review" badge of library content still in review. */
export function DraftBadge() {
  const { t } = useTranslation()
  return <Chip className="border-warning-500 bg-warning-50 text-warning-700">{t('execution.checklists.draftBadge')}</Chip>
}

/** Badge of iCASCO library content approved by the product owner. */
export function ApprovedLibraryBadge() {
  const { t } = useTranslation()
  return <Chip className="border-success-500 bg-success-50 text-success-700">{t('execution.checklists.approvedBadge')}</Chip>
}

/** Review badge of a library checklist: draft (warning) or approved (success); nothing for CAB checklists. */
export function LibraryReviewBadge({ draft, reviewStatus }: { draft: boolean; reviewStatus?: 'draft' | 'approved' | null }) {
  if (draft) return <DraftBadge />
  return reviewStatus === 'approved' ? <ApprovedLibraryBadge /> : null
}

export function ProgressBar({ value, total, label, tone = 'primary' }: { value: number; total: number; label?: ReactNode; tone?: 'primary' | 'warning' | 'success' }) {
  const pct = total ? Math.min(100, Math.round((value / total) * 100)) : 0
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {label && <div className="flex justify-between gap-2 text-caption text-neutral-700">{label}</div>}
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn('h-full rounded-full transition-[width]', tone === 'warning' ? 'bg-warning-500' : tone === 'success' ? 'bg-success-500' : 'bg-primary')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/** Simple definition grid (label / value pairs). */
export function InfoGrid({ rows }: { rows: Array<[ReactNode, ReactNode]> }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map(([label, value], i) => (
        <div key={i} className="min-w-0">
          <dt className="text-caption text-neutral-600">{label}</dt>
          <dd className="break-words text-body-sm font-medium text-neutral-900">{value || '·'}</dd>
        </div>
      ))}
    </dl>
  )
}

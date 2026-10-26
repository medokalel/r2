import { forwardRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { focusField, type FieldIssue } from '@/lib/fieldNavigation'
import { cn } from '@/lib/utils'
import { AlertAccent } from '@/components/ui/Alert'

interface ErrorSummaryProps {
  /** Heading; defaults to "Fix these before you continue". */
  title?: string
  issues: FieldIssue[]
  /** Optional row of actions under the list (e.g. "Continue anyway"). */
  footer?: ReactNode
  /** 'error' blocks the action; 'warning' only advises. */
  tone?: 'error' | 'warning'
  className?: string
}

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden className="shrink-0 rtl:-scale-x-100">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Validation summary where every item is a link: it focuses the exact field (switching page or
 * tab first through `onSelect`) or opens the page where the problem is fixed, with a way back.
 */
export const ErrorSummary = forwardRef<HTMLDivElement, ErrorSummaryProps>(function ErrorSummary(
  { title, issues, footer, tone = 'error', className },
  ref,
) {
  const { t } = useTranslation()
  if (issues.length === 0) return null
  const warning = tone === 'warning'

  const itemClass = cn(
    'group flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-start text-body-sm font-semibold transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-1',
    warning
      ? 'text-warning-700 hover:bg-warning-100 focus-visible:outline-warning-500'
      : 'text-error-700 hover:bg-error-100/60 focus-visible:outline-error-500',
  )

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className={cn(
        'relative overflow-hidden rounded-md p-4 ps-6 outline-none',
        warning ? 'bg-bg-warning' : 'bg-bg-error',
        className,
      )}
    >
      <AlertAccent tone={warning ? 'warning' : 'error'} />
      <div className="mb-1.5 flex items-start gap-2.5 px-1">
        <span
          className={cn(
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-caption font-bold text-white',
            warning ? 'bg-warning-500' : 'bg-error-500',
          )}
          aria-hidden
        >
          !
        </span>
        <div className="min-w-0">
          <p className={cn('text-body-sm font-bold', warning ? 'text-warning-800' : 'text-error-800')}>
            {title ?? t('ui.errorSummary.title', { count: issues.length })}
          </p>
          <p className={cn('text-caption', warning ? 'text-warning-700' : 'text-error-700')}>{t('ui.errorSummary.hint')}</p>
        </div>
      </div>
      <ul className="flex flex-col">
        {issues.map((issue) => (
          <li key={issue.key}>
            {issue.to ? (
              <Link to={issue.to} onClick={issue.onSelect} className={itemClass}>
                <span className="min-w-0 underline decoration-current/30 underline-offset-2">{issue.message}</span>
                <Chevron />
              </Link>
            ) : (
              <button
                type="button"
                className={itemClass}
                onClick={() => {
                  issue.onSelect?.()
                  if (issue.fieldId) focusField(issue.fieldId)
                }}
              >
                <span className="min-w-0 underline decoration-current/30 underline-offset-2">{issue.message}</span>
                <Chevron />
              </button>
            )}
          </li>
        ))}
      </ul>
      {footer && <div className="mt-2 flex flex-wrap gap-2 px-1">{footer}</div>}
    </div>
  )
})

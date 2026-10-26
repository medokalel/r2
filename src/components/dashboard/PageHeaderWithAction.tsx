import type { ReactNode } from 'react'

interface PageHeaderWithActionProps {
  title: string
  subtitle?: string
  action?: {
    icon: ReactNode
    label: string
    onClick: () => void
  }
}

/**
 * Bold page title + light subtitle, with an optional circular icon button
 * at the trailing edge (e.g. a calendar shortcut). Generic on purpose —
 * any dashboard page can reuse it, not just the CAB one.
 */
export function PageHeaderWithAction({ title, subtitle, action }: PageHeaderWithActionProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-page-title text-text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-body-sm text-neutral-600">{subtitle}</p>}
      </div>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          aria-label={action.label}
          className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary transition-colors hover:bg-primary-100"
        >
          {action.icon}
        </button>
      )}
    </div>
  )
}
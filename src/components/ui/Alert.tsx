import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { alertClassName, alertToneClassNames, type AlertTone } from '@/components/ui/alertStyles'

/** The 4px accent bar on the inline-start edge. */
export function AlertAccent({ tone }: { tone: AlertTone }) {
  return <span aria-hidden className={cn('absolute inset-y-4 start-3 w-1 rounded-xs', alertToneClassNames[tone].bar)} />
}

interface AlertProps {
  tone?: AlertTone
  title?: ReactNode
  children?: ReactNode
  action?: ReactNode
  className?: string
  role?: 'status' | 'alert'
}

/**
 * Inline alert banner. Title: Body S SemiBold, text-primary. Description: Caption, text-secondary.
 */
export function Alert({ tone = 'info', title, children, action, className, role = 'status' }: AlertProps) {
  return (
    <div role={role} className={alertClassName(tone, cn('flex-wrap justify-between', className))}>
      <AlertAccent tone={tone} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && <p className="text-body-sm font-semibold text-text-primary">{title}</p>}
        {children && <div className="text-caption text-text-secondary">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

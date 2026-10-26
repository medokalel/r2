import { cn } from '@/lib/utils'

export type AlertTone = 'success' | 'error' | 'warning' | 'info'

/** Figma Design System > Alert (267:31556): tinted fill per tone plus a 4px accent bar. */
export const alertToneClassNames: Record<AlertTone, { box: string; bar: string }> = {
  success: { box: 'bg-bg-success-subtle', bar: 'bg-success-500' },
  error: { box: 'bg-bg-error', bar: 'bg-error-500' },
  warning: { box: 'bg-bg-warning', bar: 'bg-warning-500' },
  info: { box: 'bg-bg-info', bar: 'bg-info-500' },
}

/** Container classes for an inline alert (radius/md, 16px padding, room for the accent bar). */
export function alertClassName(tone: AlertTone, className?: string) {
  return cn('relative flex items-start gap-3 overflow-hidden rounded-md p-4 ps-6', alertToneClassNames[tone].box, className)
}

import { cn } from '@/lib/utils'

/**
 * Figma Design System > Page Tabs (228:33840): a segmented strip on a Neutral/50 track with a
 * Neutral/200 hairline and 4px inner padding. The active tab is a white Body SemiBold chip
 * (radius/sm); inactive tabs are Body Regular in text-secondary. Scrolls sideways on narrow screens.
 */
export const pageTabListClassName =
  'inline-flex max-w-full items-center gap-1 self-start overflow-x-auto scrollbar-hide rounded-md border border-border-strong bg-bg-tertiary p-1'

export function pageTabClassName(active: boolean, className?: string) {
  return cn(
    'inline-flex min-h-9 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-sm px-3 py-1.5 text-body-2 leading-[1.6] transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1',
    active ? 'bg-white font-semibold text-text-primary shadow-sm' : 'font-normal text-text-secondary hover:text-text-primary',
    className,
  )
}

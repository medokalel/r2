import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageQuestion } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { audienceForPath, helpContextPath, HELP_BASE } from '@/lib/help/paths'
import { cn } from '@/lib/utils'

/**
 * The "?" in the top bar of every page: opens the iHelp article mapped to the current route
 * (iHelp resolves it, so this button carries no help content and stays tiny).
 */
export function HelpButton({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const inHelp = pathname === HELP_BASE || pathname.startsWith(`${HELP_BASE}/`)
  const label = t('help.context.button')
  return (
    <Link
      to={inHelp ? HELP_BASE : helpContextPath(pathname, audienceForPath(pathname))}
      aria-label={label}
      title={label}
      data-help-button
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-white text-icon-primary transition-colors hover:border-primary-200 hover:bg-bg-brand-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
        inHelp && 'border-primary-200 bg-bg-brand-light text-primary',
        className,
      )}
    >
      <AppIcon icon={MessageQuestion} size={20} />
    </Link>
  )
}

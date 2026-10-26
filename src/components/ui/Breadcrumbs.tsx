import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { AppIcon, ArrowRightIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  /** Where the crumb goes. The last crumb is the current page and is never a link. */
  to?: string
}

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-icon-secondary rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Breadcrumb trail with a back button. Every crumb except the current page is a
 * link; Back returns to the previous crumb (or the previous screen).
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const parent = [...items.slice(0, -1)].reverse().find((item) => item.to)
  const back = () => (window.history.length > 1 ? navigate(-1) : parent?.to && navigate(parent.to))

  return (
    <nav className={cn('flex min-w-0 flex-wrap items-center gap-2 text-caption sm:text-body-sm', className)} aria-label={t('common.breadcrumb')}>
      <button
        type="button"
        onClick={back}
        aria-label={t('common.back', 'Back')}
        title={t('common.back', 'Back')}
        className="me-1 flex size-10 shrink-0 items-center justify-center rounded-full border border-border-default text-icon-primary transition-colors hover:border-primary-100 hover:bg-bg-brand-light hover:text-primary"
      >
        <span aria-hidden className="inline-flex -scale-x-100 rtl:scale-x-100"><AppIcon icon={ArrowRightIcon} size={18} /></span>
      </button>
      {items.map((item, index) => {
        const last = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
            {last || !item.to ? (
              <span aria-current={last ? 'page' : undefined} className={cn('truncate', last ? 'font-semibold text-text-primary' : 'font-normal text-text-secondary')}>
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="truncate font-normal text-text-secondary underline-offset-4 transition-colors hover:text-primary hover:underline">
                {item.label}
              </Link>
            )}
            {!last && <Chevron />}
          </span>
        )
      })}
    </nav>
  )
}

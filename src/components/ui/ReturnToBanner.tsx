import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { RETURN_TO_PARAM, returnToLabel, safeReturnTo } from '@/lib/fieldNavigation'
import { AlertAccent } from '@/components/ui/Alert'
import { alertClassName } from '@/components/ui/alertStyles'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { cn } from '@/lib/utils'

/**
 * Shown on a page opened from an error link elsewhere (`?returnTo=`): says why the user is here
 * and gives the way back once the fix is saved.
 */
export function ReturnToBanner({ message }: { message?: string }) {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const returnTo = safeReturnTo(params.get(RETURN_TO_PARAM))
  if (!returnTo) return null
  const label = returnToLabel(t, returnTo)

  return (
    <div
      role="status"
      className={alertClassName('info', 'flex-wrap items-center justify-between')}
    >
      <AlertAccent tone="info" />
      <p className="min-w-0 text-body-sm text-text-primary">{message ?? t('ui.returnTo.hint', { page: label })}</p>
      <Link
        to={returnTo}
        className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'shrink-0')}
      >
        <span aria-hidden className="inline-block rtl:-scale-x-100">{'←'}</span>
        {t('ui.returnTo.back', { page: label })}
      </Link>
    </div>
  )
}

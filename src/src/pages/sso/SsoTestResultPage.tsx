import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CloseCircle, TickCircle } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/routes'
import { SSO_TEST_MESSAGE, ssoErrorKey } from '@/lib/sso'

/**
 * /sso/test-result?connection=…&status=success|failed[&error=CODE]: end of a "Test connection"
 * round trip, opened in the popup. It tells the Single sign-on page (the opener) to reload the
 * stored result, then closes itself. Nothing secret travels here: the claims stay on the server.
 */
export function SsoTestResultPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const connectionId = params.get('connection')
  const ok = params.get('status') === 'success'
  const error = params.get('error')

  useEffect(() => {
    const opener = window.opener as Window | null
    if (!opener || opener === window) return
    try {
      opener.postMessage({ type: SSO_TEST_MESSAGE, connectionId, ok }, window.location.origin)
    } catch {
      // opener on another origin: the settings page refreshes on focus instead
    }
    const timer = window.setTimeout(() => window.close(), 1800)
    return () => window.clearTimeout(timer)
  }, [connectionId, ok])

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-25 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-neutral-100 bg-white p-6 text-center shadow-card sm:p-8" role="status">
        <span className={`mx-auto flex size-14 items-center justify-center rounded-full ${ok ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-600'}`}>
          <AppIcon icon={ok ? TickCircle : CloseCircle} size={28} />
        </span>
        <h1 className="mt-4 text-body-lg font-semibold text-text-primary">{t('sso.testResult.title')}</h1>
        <p className="mt-2 text-body-sm text-neutral-700">{ok ? t('sso.testResult.success') : t('sso.testResult.failed')}</p>
        {!ok && error && <p className="mt-2 text-body-sm text-error-700">{t(ssoErrorKey(error))}</p>}
        <div className="mt-6 flex flex-col items-center gap-3">
          <Button variant="primary" size="md" onClick={() => window.close()}>
            {t('sso.testResult.close')}
          </Button>
          <Link to={ROUTES.cabSso} className="text-body-sm font-medium text-primary hover:underline">
            {t('sso.page.title')}
          </Link>
        </div>
      </div>
    </main>
  )
}

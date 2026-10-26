import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { consumeImpersonationHandoff, getImpersonation } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'

/** Landing page of the tab the platform console opens: takes the staged token and enters the CAB workspace. */
export function ImpersonationStartPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const info = consumeImpersonationHandoff() ?? getImpersonation()
    if (info) navigate(ROUTES.workspace, { replace: true })
    else {
      const id = setTimeout(() => setFailed(true), 0)
      return () => clearTimeout(id)
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-25 p-4">
      <div className="w-full max-w-md rounded-3xl border border-neutral-100 bg-white p-8 text-center shadow-card">
        {failed ? (
          <>
            <h1 className="text-section-title text-text-primary">{t('subscription.impersonationStart.failedTitle')}</h1>
            <p className="mt-2 text-body-sm text-neutral-600">{t('subscription.impersonationStart.failedBody')}</p>
            <Link to={ROUTES.login} className="mt-5 inline-block text-body-sm font-semibold text-primary hover:underline">
              {t('subscription.impersonationStart.toLogin')}
            </Link>
          </>
        ) : (
          <p className="text-body-sm text-neutral-600">{t('subscription.impersonationStart.opening')}</p>
        )}
      </div>
    </div>
  )
}

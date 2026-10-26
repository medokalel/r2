import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CloseCircle, SecuritySafe } from 'iconsax-reactjs'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { exchangeSsoCode } from '@/lib/api/ssoApi'
import { ApiError } from '@/lib/api/client'
import { getPostLoginRedirect, saveAuthSession } from '@/lib/authStorage'
import { clearPendingRegistration } from '@/lib/pendingRegistrationStorage'
import { ROUTES } from '@/lib/routes'
import { safeRedirectPath, ssoErrorIsRetryable, ssoErrorKey } from '@/lib/sso'

/**
 * /sso/complete?code=… (or ?error=CODE): the browser lands here after the identity provider.
 * The one-time code is exchanged for the normal iCASCO session (POST /auth/sso/exchange), so no
 * token ever appears in a URL. Errors show what happened and what to do next.
 */
export function SsoCompletePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const code = params.get('code')
  const redirect = safeRedirectPath(params.get('redirect'))
  const [error, setError] = useState<string | null>(params.get('error') ?? (code ? null : 'SSO_STATE_INVALID'))
  const started = useRef(false)

  useEffect(() => {
    if (!code || started.current) return
    started.current = true
    // Drop the code from the address bar and history right away.
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${ROUTES.ssoComplete}`)
    exchangeSsoCode(code)
      .then((data) => {
        clearPendingRegistration()
        saveAuthSession(data, false)
        navigate(redirect ?? getPostLoginRedirect(data), { replace: true })
      })
      .catch((err: unknown) => setError(err instanceof ApiError && err.code ? err.code : 'SSO_VALIDATION_FAILED'))
  }, [code, navigate, redirect])

  return (
    <AuthLayout>
      <LanguageToggle variant="icon" className="mb-8" />
      {!error ? (
        <div className="flex flex-col items-start gap-4" role="status" aria-live="polite">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-25 text-primary">
            <AppIcon icon={SecuritySafe} size={28} className="animate-pulse" />
          </span>
          <h1 className="text-page-title text-text-primary">{t('sso.complete.signingIn')}</h1>
          <p className="text-body-1 text-neutral-600">{t('sso.complete.signingInHint')}</p>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4" role="alert">
          <span className="flex size-14 items-center justify-center rounded-full bg-error-50 text-error-600">
            <AppIcon icon={CloseCircle} size={28} />
          </span>
          <h1 className="text-page-title text-text-primary">{t('sso.complete.failedTitle')}</h1>
          <p className="text-body-1 text-neutral-700">{t(ssoErrorKey(error))}</p>
          {!ssoErrorIsRetryable(error) && <p className="text-body-sm text-neutral-600">{t('sso.complete.contactAdmin')}</p>}
          <code dir="ltr" className="rounded-sm bg-neutral-50 px-2 py-1 text-caption text-neutral-700">
            {error}
          </code>
          <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row">
            <Button variant="primary" className="h-12 sm:w-auto" onClick={() => navigate(ROUTES.login, { replace: true })}>
              {ssoErrorIsRetryable(error) ? t('sso.complete.tryAgain') : t('sso.complete.backToLogin')}
            </Button>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SecuritySafe } from 'iconsax-reactjs'
import { AppIcon, MailIcon } from '@/components/icons'
import { Alert, TextField } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { discoverSso, ssoStartUrl } from '@/lib/api/ssoApi'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { isWorkEmail, ssoErrorKey } from '@/lib/sso'

interface SsoLoginPanelProps {
  /** Email already typed in the password form (pre-fills the work email). */
  email?: string
  /** The password sign-in answered SSO_REQUIRED: open the panel with a notice. */
  required?: boolean
  /** App path to open after sign-in. */
  redirect?: string | null
}

/**
 * "Continue with SSO" on the login page: work email → POST /auth/sso/discover → the identity
 * provider (GET /auth/sso/:id/start). In the preview the identity provider is simulated in-app.
 */
export function SsoLoginPanel({ email = '', required = false, redirect = null }: SsoLoginPanelProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(required)
  const [workEmail, setWorkEmail] = useState(email)
  const [busy, setBusy] = useState<null | 'checking' | string>(null)
  const [error, setError] = useState<string | null>(null)
  const [opened, setOpened] = useState(required)

  // Re-open (and pre-fill) when the password sign-in reports that SSO is required.
  if (required && !opened) {
    setOpened(true)
    setOpen(true)
    if (email) setWorkEmail(email)
  }

  const valid = isWorkEmail(workEmail)
  const start = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!valid || busy) return
    setError(null)
    setBusy('checking')
    try {
      const found = await discoverSso(workEmail)
      if (!found.sso || !found.connectionId) {
        setError(t(ssoErrorKey('SSO_NOT_CONFIGURED')))
        setBusy(null)
        return
      }
      setBusy(found.connectionName ?? t(`sso.providers.${found.provider ?? 'generic_oidc'}`))
      const url = ssoStartUrl(found.connectionId, { email: workEmail, redirect })
      if (isDemoMode()) navigate(url.replace(/^#/, ''))
      else window.location.assign(url)
    } catch (err) {
      setError(getUserErrorMessage(err, t))
      setBusy(null)
    }
  }

  if (!open) {
    return (
      <div className="mt-5">
        <div className="flex items-center gap-3 text-caption text-neutral-500" aria-hidden>
          <span className="h-px flex-1 bg-neutral-200" />
          {t('sso.login.or')}
          <span className="h-px flex-1 bg-neutral-200" />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setWorkEmail((current) => current || email)
            setOpen(true)
          }}
          className="mt-4 h-12 w-full"
          icon={<AppIcon icon={SecuritySafe} size={20} />}
        >
          {t('sso.login.continue')}
        </Button>
      </div>
    )
  }

  return (
    <section className="mt-5 rounded-lg border border-neutral-100 bg-neutral-25 p-4 sm:p-5" aria-labelledby="sso-login-title">
      <h2 id="sso-login-title" className="flex items-center gap-2 text-body font-semibold text-neutral-900">
        <AppIcon icon={SecuritySafe} size={20} className="text-primary" />
        {t('sso.login.title')}
      </h2>
      <p className="mt-1 text-body-sm text-neutral-600">{t('sso.login.hint')}</p>
      {required && (
        <Alert tone="info" className="mt-3">
          {t('sso.login.requiredNotice')}
        </Alert>
      )}
      <form onSubmit={start} className="mt-4 flex flex-col gap-4" noValidate>
        <TextField
          id="sso-email"
          type="email"
          autoComplete="email"
          label={t('sso.login.emailLabel')}
          placeholder={t('sso.login.emailPlaceholder')}
          icon={MailIcon}
          value={workEmail}
          onChange={(e) => setWorkEmail(e.target.value)}
          error={workEmail.trim() && !valid ? t('validation.invalidEmail') : undefined}
        />
        {error && (
          <Alert tone="error" role="alert">
            {error}
          </Alert>
        )}
        <Button type="submit" variant="primary" disabled={!valid || Boolean(busy)} className="h-12 w-full" aria-busy={Boolean(busy) || undefined}>
          {busy === 'checking' ? t('sso.login.checking') : busy ? t('sso.login.redirecting', { name: busy }) : t('sso.login.submit')}
        </Button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          className="text-center text-body-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('sso.login.back')}
        </button>
      </form>
    </section>
  )
}

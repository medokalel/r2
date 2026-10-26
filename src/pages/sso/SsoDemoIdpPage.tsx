import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { InfoCircle } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { TextField } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { ProviderMark } from '@/components/sso/SsoUi'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { demoCompleteLogin, demoConnectionSummary, demoRecordTest } from '@/lib/api/demo/ssoDemo'
import { ROUTES } from '@/lib/routes'
import { safeRedirectPath } from '@/lib/sso'

const nameFromEmail = (email: string) =>
  email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')

/**
 * Preview only: stands in for the identity provider (Microsoft, Google, Okta, a SAML IdP) so the
 * whole single sign-on round trip can be tried without one. With the real API the browser goes to
 * the real identity provider instead and never opens this page.
 */
export function SsoDemoIdpPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const connectionId = params.get('connection') ?? ''
  const testMode = params.get('mode') === 'test'
  const redirect = safeRedirectPath(params.get('redirect'))
  const summary = isDemoMode() ? demoConnectionSummary(connectionId) : null
  const [email, setEmail] = useState(params.get('email') ?? (testMode ? 'admin@casco.example' : ''))
  const [name, setName] = useState(() => nameFromEmail(params.get('email') ?? (testMode ? 'admin@casco.example' : '')))
  const [groups, setGroups] = useState('iCASCO-Admins')
  const [busy, setBusy] = useState(false)

  const groupList = groups.split(',').map((g) => g.trim()).filter(Boolean)
  const providerName = summary ? t(`sso.providers.${summary.provider}`) : ''

  const finish = (path: string) => navigate(path, { replace: true })

  const proceed = async () => {
    if (!summary || busy) return
    setBusy(true)
    if (testMode) {
      const status = await demoRecordTest(connectionId, email, name, groupList)
      finish(`${ROUTES.ssoTestResult}?connection=${encodeURIComponent(connectionId)}&status=${status}`)
      return
    }
    const result = await demoCompleteLogin(connectionId, email, groupList)
    const query = new URLSearchParams(result.code ? { code: result.code } : { error: result.error ?? 'SSO_VALIDATION_FAILED' })
    if (result.code && redirect) query.set('redirect', redirect)
    finish(`${ROUTES.ssoComplete}?${query.toString()}`)
  }

  const cancel = () => {
    if (testMode) finish(`${ROUTES.ssoTestResult}?connection=${encodeURIComponent(connectionId)}&status=failed&error=SSO_IDP_ERROR`)
    else finish(`${ROUTES.ssoComplete}?error=SSO_IDP_ERROR`)
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-neutral-50 px-4 py-8 sm:justify-center">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-3 py-1 text-caption font-semibold text-warning-800">
            <AppIcon icon={InfoCircle} size={14} />
            {t('sso.demoIdp.badge')}
          </span>
          <LanguageToggle variant="icon" />
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-card sm:p-8">
          {!summary ? (
            <p role="alert" className="text-body text-neutral-800">
              {t('sso.demoIdp.unknown')}
            </p>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                void proceed()
              }}
            >
              <div className="flex items-center gap-3">
                <ProviderMark provider={summary.provider} size={44} />
                <div className="min-w-0">
                  <h1 className="text-body-lg font-semibold text-neutral-900">{t('sso.demoIdp.title', { provider: providerName })}</h1>
                  <p className="text-body-sm text-neutral-600">{t('sso.demoIdp.subtitle', { name: summary.name })}</p>
                </div>
              </div>
              {testMode && <p className="rounded-md bg-bg-info px-3 py-2 text-body-sm text-neutral-800">{t('sso.demoIdp.testMode')}</p>}
              <TextField id="idp-email" type="email" label={t('sso.demoIdp.account')} value={email} onChange={(e) => setEmail(e.target.value)} />
              <TextField id="idp-name" label={t('sso.demoIdp.name')} value={name} onChange={(e) => setName(e.target.value)} />
              <div>
                <TextField id="idp-groups" label={t('sso.demoIdp.groups')} value={groups} onChange={(e) => setGroups(e.target.value)} />
                <p className="mt-1 text-caption text-neutral-600">{t('sso.demoIdp.groupsHint')}</p>
              </div>
              <p className="text-caption text-neutral-600">{t('sso.demoIdp.consent')}</p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" size="md" onClick={cancel} disabled={busy}>
                  {t('sso.demoIdp.cancel')}
                </Button>
                <Button type="submit" variant="primary" size="md" disabled={busy || !email.includes('@')} aria-busy={busy || undefined}>
                  {t('sso.demoIdp.continue')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

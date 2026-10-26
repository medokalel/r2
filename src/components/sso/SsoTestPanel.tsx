import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { SsoSection, StatusChip } from '@/components/sso/SsoUi'
import { getSsoConnection, startSsoTest, type SsoConnection } from '@/lib/api/ssoApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { SSO_TEST_MESSAGE, ssoErrorKey } from '@/lib/sso'

const display = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value))

/**
 * "Test connection": opens the identity provider in a popup (POST /cab/sso/connections/:id/test),
 * waits for the popup to report back (/sso/test-result posts a message) and shows the stored result:
 * the claims received and how iCASCO maps them. No session or user is created.
 */
export function SsoTestPanel({ connection, onUpdated }: { connection: SsoConnection; onUpdated: (c: SsoConnection) => void }) {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const popup = useRef<Window | null>(null)
  const last = connection.lastTest
  const result = last?.result ?? null

  useEffect(() => {
    if (!waiting) return
    const refresh = () =>
      getSsoConnection(connection.id)
        .then((fresh) => {
          onUpdated(fresh)
          setWaiting(false)
        })
        .catch(() => setWaiting(false))
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: string; connectionId?: string } | null
      if (data?.type === SSO_TEST_MESSAGE && data.connectionId === connection.id) void refresh()
    }
    // Popup closed without reporting (cancelled, or another origin): read whatever was stored.
    const timer = window.setInterval(() => {
      if (popup.current?.closed) {
        window.clearInterval(timer)
        void refresh()
      }
    }, 800)
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
      window.clearInterval(timer)
    }
  }, [waiting, connection.id, onUpdated])

  const run = async () => {
    setError(null)
    // Open the window first (inside the click) so pop-up blockers allow it, then point it at the IdP.
    const win = window.open('', 'icasco-sso-test', 'width=520,height=700')
    if (!win) {
      setError(t('sso.test.popupBlocked'))
      return
    }
    try {
      const { authorizationUrl } = await startSsoTest(connection.id)
      win.location.href = authorizationUrl
      popup.current = win
      setWaiting(true)
    } catch (err) {
      win.close()
      setError(getUserErrorMessage(err, t))
    }
  }

  const yesNo = (value: boolean | undefined) => (value ? t('sso.common.yes') : t('sso.common.no'))

  return (
    <SsoSection
      title={t('sso.test.title')}
      hint={t('sso.test.hint')}
      actions={
        <Button variant="secondary" size="md" onClick={() => void run()} disabled={waiting} icon={<AppIcon icon={Activity} size={18} />}>
          {waiting ? t('sso.test.running') : t('sso.test.run')}
        </Button>
      }
    >
      {error && (
        <p role="alert" className="rounded-md border border-error-100 bg-error-50 px-3 py-2 text-body-sm text-error-700">
          {error}
        </p>
      )}
      {!last ? (
        <p className="text-body-sm text-neutral-600">{t('sso.test.none')}</p>
      ) : (
        <div className="flex min-w-0 flex-col gap-4" data-testid="sso-test-result">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone={last.status === 'SUCCESS' ? 'success' : 'error'}>{t(`sso.test.${last.status}`)}</StatusChip>
            <span className="text-caption text-neutral-600">{t('sso.test.lastRun', { date: f.dateTime(last.at) })}</span>
          </div>
          {last.status === 'FAILED' && (
            <div className="rounded-md bg-error-50 px-3 py-2 text-body-sm text-error-700">
              <p className="font-semibold">{t(ssoErrorKey(result?.code))}</p>
              {result?.error && (
                <p className="mt-1 break-words" dir="ltr" style={{ textAlign: 'start' }}>
                  {result.error}
                </p>
              )}
            </div>
          )}
          {result?.mapped && (
            <div>
              <h4 className="text-body-sm font-semibold text-neutral-800">{t('sso.test.mapped')}</h4>
              <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {[
                  [t('sso.test.email'), result.mapped.email ?? '-'],
                  [t('sso.test.name'), result.mapped.name ?? '-'],
                  [t('sso.test.groups'), result.mapped.groups.length ? result.mapped.groups.join(', ') : t('sso.test.noGroups')],
                  [t('sso.test.role'), result.mapped.role ? t(`sso.roles.${result.mapped.role}`, { defaultValue: result.mapped.role }) : t('sso.test.noRole')],
                  [t('sso.test.matchedGroup'), result.mapped.matchedGroup ?? '-'],
                  [t('sso.test.domainVerified'), yesNo(result.domainVerified)],
                  [t('sso.test.userExists'), yesNo(result.userExists)],
                  [t('sso.test.wouldProvision'), yesNo(result.wouldProvision)],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-caption font-medium text-neutral-600">{label}</dt>
                    <dd className="break-words text-body-sm text-neutral-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {(result?.warnings ?? []).length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {result?.warnings?.map((w) => (
                <li key={w} className="rounded-md bg-warning-50 px-3 py-2 text-body-sm text-warning-800">
                  {t(`sso.test.warnings.${w}`, { defaultValue: w })}
                </li>
              ))}
            </ul>
          )}
          {result?.claims && (
            <details className="min-w-0 rounded-md border border-neutral-100">
              <summary className="cursor-pointer px-3 py-2 text-body-sm font-semibold text-neutral-800">{t('sso.test.claims')}</summary>
              <dl className="flex flex-col divide-y divide-neutral-100 border-t border-neutral-100" dir="ltr">
                {Object.entries(result.claims).map(([key, value]) => (
                  <div key={key} className="grid min-w-0 grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    <dt className="break-all font-mono text-[12px] text-neutral-600">{key}</dt>
                    <dd className="break-all font-mono text-[12px] text-neutral-900">{display(value)}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </div>
      )}
    </SsoSection>
  )
}

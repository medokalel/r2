import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { InfoCircle, Lock1, Warning2 } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { useSubscription } from '@/hooks/useSubscription'
import { endImpersonation, getImpersonation } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

const DISMISSED_KEY = 'icasco_dismissed_announcements'

function readDismissed(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(DISMISSED_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function useClock(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function formatTime(iso: string, lang: string) {
  return new Intl.DateTimeFormat(lang.startsWith('ar') ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

/** "Signed in by iCASCO support — reason — ends at …" while a platform user works in this CAB workspace. */
export function ImpersonationBanner({ server }: { server?: { byName: string; expiresAt: string | null } | null }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const now = useClock(30_000)
  const local = getImpersonation()
  // GET /subscription says who is signed in (server truth); the hand-off adds the reason typed in the console.
  const endsAt = server?.expiresAt ?? local?.endsAt ?? null
  if ((!server && !local) || (endsAt && new Date(endsAt).getTime() <= now)) return null
  const name = local?.tenantName ?? ''
  return (
    <div role="status" className="flex flex-col gap-2 bg-primary px-4 py-2.5 text-body-sm text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="min-w-0">
        <span className="font-semibold">
          {name ? t('subscription.banners.impersonation', { name }) : t('subscription.banners.impersonationNoName')}
          {server?.byName ? ` (${server.byName})` : ''}
        </span>
        {local?.reason && <span className="opacity-80"> · {local.reason}</span>}
        {endsAt && <span className="font-medium"> · {t('subscription.banners.endsAt', { time: formatTime(endsAt, i18n.language) })}</span>}
      </p>
      <button
        type="button"
        onClick={() => {
          endImpersonation()
          window.close()
          // When the tab was not opened by the console, closing is refused: leave the workspace instead.
          navigate(ROUTES.login, { replace: true })
        }}
        className="shrink-0 self-start rounded-sm border border-white/40 px-3 py-1 text-caption font-semibold hover:bg-white/10 sm:self-auto"
      >
        {t('subscription.banners.endImpersonation')}
      </button>
    </div>
  )
}

/** Read-only, impersonation and announcement banners shown under the CAB header. */
export function SubscriptionBanners() {
  const { t } = useTranslation()
  const { subscription } = useSubscription()
  const [dismissed, setDismissed] = useState<string[]>(readDismissed)
  const announcements = (subscription?.announcements ?? []).filter((a) => !dismissed.includes(a.id))

  const dismiss = (id: string) => {
    const next = [...dismissed, id]
    setDismissed(next)
    try {
      sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
    } catch {
      // storage blocked: dismissed for this page view only
    }
  }

  return (
    <>
      <ImpersonationBanner server={subscription?.impersonation} />
      {subscription?.readOnly && (
        <div role="alert" className="flex flex-col gap-2 border-b border-error-100 bg-error-50 px-4 py-2.5 text-body-sm text-error-700 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex min-w-0 items-start gap-2">
            <AppIcon icon={Lock1} size={18} className="mt-0.5 shrink-0" />
            <span>
              <span className="font-semibold">{t('subscription.banners.readOnlyTitle')}</span> {t(`subscription.banners.readOnlyBody.${subscription.status}`, { defaultValue: t('subscription.banners.readOnlyBody.default') })}
            </span>
          </p>
          <Link to={ROUTES.cabSubscription} className="shrink-0 text-body-sm font-semibold underline-offset-4 hover:underline">
            {t('subscription.openMySubscription')}
          </Link>
        </div>
      )}
      {announcements.map((a) => (
        <div
          key={a.id}
          role="status"
          className={cn(
            'flex items-start gap-3 border-b px-4 py-2.5 text-body-sm sm:px-6',
            a.severity === 'WARNING' ? 'border-warning-100 bg-warning-50 text-warning-900' : 'border-primary-100 bg-primary-25 text-primary-700',
          )}
        >
          <AppIcon icon={a.severity === 'WARNING' ? Warning2 : InfoCircle} size={18} className="mt-0.5 shrink-0" />
          <p className="min-w-0 flex-1">
            <span className="font-semibold">{a.title}</span> <span className="opacity-90">{a.body}</span>
          </p>
          <button
            type="button"
            onClick={() => dismiss(a.id)}
            aria-label={t('subscription.banners.dismiss')}
            className="flex size-6 shrink-0 items-center justify-center rounded-sm opacity-70 hover:bg-black/5 hover:opacity-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
    </>
  )
}

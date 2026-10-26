import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppIcon, NotificationIcon } from '@/components/icons'
import { isAuditClientSession } from '@/lib/authStorage'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationAudience,
} from '@/lib/api/notificationsApi'
// Plain join: tailwind-merge treats the design-system size classes (text-body-3)
// as colours and would drop them next to a text colour.
const cx = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(' ')

/** Groups notification types by tone so the dot colour says what kind of action it is. */
const TONE: Record<string, string> = {
  application_received: 'bg-primary',
  information_responded: 'bg-primary',
  quotation_pending_approval: 'bg-warning-500',
  audit_plan_pending_approval: 'bg-warning-500',
  nonconformity_response_received: 'bg-warning-500',
  decision_ready: 'bg-primary',
  invoice_overdue: 'bg-error-600',
  offer_awaiting_acceptance: 'bg-warning-500',
  information_requested: 'bg-warning-500',
  audit_plan_to_confirm: 'bg-warning-500',
  nonconformity_response_due: 'bg-error-600',
  invoice_due: 'bg-warning-500',
  certificate_issued: 'bg-success-600',
  offer_accepted: 'bg-success-600',
  offer_rejected: 'bg-error-600',
  information_reminder: 'bg-warning-500',
  certificate_reinstated: 'bg-success-600',
  agreement_drafted: 'bg-primary',
  agreement_signed_by_client: 'bg-warning-500',
  agreement_to_sign: 'bg-warning-500',
  agreement_active: 'bg-success-600',
  agreement_terminated: 'bg-error-600',
  audit_report_issued: 'bg-primary',
  audit_report_acknowledged: 'bg-success-600',
  audit_team_assigned: 'bg-success-600',
  team_exception_requested: 'bg-warning-500',
  team_exception_decided: 'bg-primary',
  impartiality_declared: 'bg-warning-500',
}

/** English text of the newer types, used until their i18n keys are in the locale files (agreement types live in the agreements fragment). */
const FALLBACK_TEXT: Record<string, { title: string; body: string }> = {
  offer_accepted: { title: 'Offer {{ref}} accepted', body: '{{client}} accepted the offer. Plan the audit and issue the advance invoice.' },
  offer_rejected: { title: 'Offer {{ref}} rejected', body: '{{client}} rejected the offer. Review it and prepare a revision if needed.' },
  information_reminder: { title: 'Reminder: information needed for {{ref}}', body: 'Please provide: {{item}}.' },
  certificate_reinstated: { title: 'Certificate {{ref}} reinstated', body: 'Your certificate is valid again.' },
}

function useRelativeTime() {
  const { i18n } = useTranslation()
  return useCallback(
    (iso: string) => {
      const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60_000)
      const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' })
      if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
      const diffH = Math.round(diffMin / 60)
      if (Math.abs(diffH) < 24) return rtf.format(diffH, 'hour')
      return rtf.format(Math.round(diffH / 24), 'day')
    },
    [i18n.language],
  )
}

interface NotificationsBellProps {
  /** Shown on the badge until the first load finishes. */
  fallbackCount?: number
}

export function NotificationsBell({ fallbackCount = 0 }: NotificationsBellProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const relTime = useRelativeTime()
  const audience: NotificationAudience =
    location.pathname.startsWith('/portal') || isAuditClientSession() ? 'client' : 'cab'

  const [items, setItems] = useState<AppNotification[] | null>(null)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'all' | 'unread'>('all')
  const [failed, setFailed] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const load = useCallback(async () => {
    try {
      setFailed(false)
      setItems(await fetchNotifications(audience))
    } catch {
      setFailed(true)
    }
  }, [audience])

  useEffect(() => {
    let cancelled = false
    fetchNotifications(audience)
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [audience])

  // Close on outside click and Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const unread = items ? items.filter((n) => !n.read).length : fallbackCount
  const shown = (items ?? []).filter((n) => tab === 'all' || !n.read)

  const openItem = async (n: AppNotification) => {
    setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? prev)
    setOpen(false)
    void markNotificationRead(audience, n.id)
    navigate(n.link)
  }

  const readAll = async () => {
    setItems((prev) => prev?.map((x) => ({ ...x, read: true })) ?? prev)
    void markAllNotificationsRead(audience)
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          'relative flex size-10 items-center justify-center text-neutral-800 hover:text-primary',
          open && 'text-primary',
        )}
        aria-label={
          unread > 0
            ? t('notifications.buttonUnread', { count: unread })
            : t('cab.header.notifications')
        }
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <AppIcon icon={NotificationIcon} size={32} />
        {unread > 0 && (
          <span className="absolute end-1 top-0.5 flex size-[18px] items-center justify-center rounded-full bg-primary px-2.5 py-2.5 text-caption font-semibold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('cab.header.notifications')}
          className="absolute end-0 top-full z-50 mt-2 flex max-h-[min(32rem,calc(100vh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-neutral-100 bg-white shadow-card"
        >
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
            <p className="text-body-2-medium text-neutral-900">{t('cab.header.notifications')}</p>
            <button
              type="button"
              onClick={readAll}
              disabled={unread === 0}
              className="text-body-3 text-primary hover:underline disabled:cursor-default disabled:text-neutral-500 disabled:no-underline"
            >
              {t('notifications.markAllRead')}
            </button>
          </div>

          <div className="flex gap-1 border-b border-neutral-100 px-3 py-2" role="tablist">
            {(['all', 'unread'] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cx(
                  'rounded-full px-3 py-1 text-body-3',
                  tab === k ? 'bg-primary-50 text-primary' : 'text-neutral-700 hover:bg-neutral-50',
                )}
              >
                {k === 'all' ? t('notifications.tabs.all') : t('notifications.tabs.unread', { count: unread })}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {items === null && !failed && (
              <ul className="divide-y divide-neutral-50" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex gap-3 px-4 py-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-neutral-300" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3 w-3/4 animate-pulse rounded bg-neutral-100" />
                      <span className="block h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {failed && (
              <div className="px-4 py-8 text-center">
                <p className="text-body-3 text-neutral-700">{t('notifications.loadError')}</p>
                <button type="button" onClick={load} className="mt-2 text-body-3 text-primary hover:underline">
                  {t('errors.retry')}
                </button>
              </div>
            )}

            {items !== null && !failed && shown.length === 0 && (
              <p className="px-4 py-10 text-center text-body-3 text-neutral-600">
                {tab === 'unread' ? t('notifications.emptyUnread') : t('notifications.empty')}
              </p>
            )}

            {shown.length > 0 && (
              <ul className="divide-y divide-neutral-50">
                {shown.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={cx(
                        'flex w-full gap-3 px-4 py-3 text-start hover:bg-neutral-50 focus-visible:bg-neutral-50',
                        !n.read && 'bg-primary-25',
                      )}
                    >
                      <span
                        className={cx('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-neutral-400' : TONE[n.type] ?? 'bg-primary')}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className={cx('block text-body-3', n.read ? 'text-neutral-800' : 'font-semibold text-neutral-900')}>
                          {t([`notifications.types.${n.type}.title`, `agreements.notifications.${n.type}.title`, `execution.notifications.${n.type}.title`, `team.notifications.${n.type}.title`], { ...n.params, defaultValue: FALLBACK_TEXT[n.type]?.title })}
                        </span>
                        <span className="mt-0.5 block text-body-3 text-neutral-600">
                          {t([`notifications.types.${n.type}.body`, `agreements.notifications.${n.type}.body`, `execution.notifications.${n.type}.body`, `team.notifications.${n.type}.body`], { ...n.params, defaultValue: FALLBACK_TEXT[n.type]?.body })}
                        </span>
                        <span className="mt-1 block text-caption text-neutral-500">{relTime(n.createdAt)}</span>
                      </span>
                      {!n.read && <span className="sr-only">{t('notifications.unread')}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

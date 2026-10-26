import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { SUBSCRIPTION_ERROR_EVENT, isSubscriptionErrorCode, type SubscriptionErrorCode } from '@/lib/api/client'
import { subscriptionErrorMessage } from '@/lib/errorMessages'
import { getToasts, subscribeToasts, toast } from '@/lib/toast'
import { ROUTES } from '@/lib/routes'

const VISIBLE_MS = 9000

/**
 * Friendly toast for FEATURE_NOT_IN_PLAN / SUBSCRIPTION_READ_ONLY / USER_LIMIT_REACHED /
 * CERTIFICATE_LIMIT_REACHED / SUBSCRIPTION_ENDED with a link to "My subscription". It replaces the plain error
 * toast the page raises for the same failure, so the user sees one message, with the link.
 */
export function SubscriptionErrorNotice() {
  const { t } = useTranslation()
  const [code, setCode] = useState<SubscriptionErrorCode | null>(null)
  const [detail, setDetail] = useState<{ feature?: string; limit?: number; used?: number; active?: number }>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onError = (event: Event) => {
      const payload = (event as CustomEvent<{ code?: string; feature?: string; limit?: number; used?: number; active?: number }>).detail ?? {}
      const next = payload.code
      if (!isSubscriptionErrorCode(next)) return
      setCode(next)
      setDetail(payload)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCode(null), VISIBLE_MS)
    }
    window.addEventListener(SUBSCRIPTION_ERROR_EVENT, onError)
    return () => {
      window.removeEventListener(SUBSCRIPTION_ERROR_EVENT, onError)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  // While shown, drop the page's identical plain toast (raised a moment after the request fails).
  useEffect(() => {
    if (!code) return
    const text = subscriptionErrorMessage(code, t)
    const sweep = () => getToasts().filter((item) => item.message === text).forEach((item) => toast.dismiss(item.id))
    sweep()
    return subscribeToasts(sweep)
  }, [code, t])

  if (!code) return null
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-5 z-[101] flex justify-center px-4">
      <div
        role="alert"
        className="pointer-events-auto relative flex w-full max-w-[460px] items-start gap-3 overflow-hidden rounded-lg rounded-s-none border border-s-0 border-neutral-100 bg-white py-3.5 ps-5 pe-3 shadow-xl"
      >
        <span className="absolute inset-y-0 start-0 w-1 bg-warning-500" aria-hidden />
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning-500/15 text-warning-700" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
          </svg>
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-body-sm font-medium leading-[1.6] text-neutral-900">{subscriptionErrorMessage(code, t)}</p>
          {code === 'FEATURE_NOT_IN_PLAN' && detail.feature && (
            <p className="text-body-sm text-neutral-700">{t('subscription.notice.feature', { feature: t(`platform.features.${detail.feature}`, { defaultValue: detail.feature }) })}</p>
          )}
          {(code === 'USER_LIMIT_REACHED' || code === 'CERTIFICATE_LIMIT_REACHED') && detail.limit != null && (
            <p className="text-body-sm text-neutral-700">{t('subscription.notice.usage', { used: detail.used ?? detail.active ?? detail.limit, limit: detail.limit })}</p>
          )}
          <Link to={ROUTES.cabSubscription} onClick={() => setCode(null)} className="mt-1 inline-block text-body-sm font-semibold text-primary hover:underline">
            {t('subscription.openMySubscription')}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setCode(null)}
          aria-label={t('common.close')}
          className="flex size-7 shrink-0 items-center justify-center rounded-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  )
}

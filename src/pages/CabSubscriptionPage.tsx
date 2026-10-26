import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Crown1, Lock1, TickCircle } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import type { TourStepConfig } from '@/context/tour/tourTypes'
import { InvoiceDetailsDialog } from '@/components/platform/InvoiceTable'
import { Card, EmptyState, ErrorBlock, InvoiceStatusBadge, KeyValue, LoadingBlock, SubscriptionStatusBadge } from '@/components/platform/PlatformUi'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { UsageMeter } from '@/components/subscription/UsageMeter'
import { UpgradeRequestDialog } from '@/components/subscription/UpgradeRequestDialog'
import { useSubscription } from '@/hooks/useSubscription'
import { FEATURE_KEYS, type PlatformInvoice } from '@/lib/api/platformTypes'
import { ROUTES } from '@/lib/routes'
import { isNearLimit } from '@/lib/subscriptionFeatures'
import { cn } from '@/lib/utils'
import { rangeText } from '@/lib/emptyValue'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-500 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** "My subscription" for CAB staff: plan, status, renewal, usage, included modules, iCASCO invoices, upgrade request. */
export function CabSubscriptionPage() {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  const { subscription: sub, loading, error, refresh } = useSubscription()
  const [requesting, setRequesting] = useState(false)
  const [viewing, setViewing] = useState<PlatformInvoice | null>(null)

  const certWarning = sub ? sub.warnings?.certificates ?? isNearLimit(sub.limits.certificates.active, sub.limits.certificates.limit) : false
  const userWarning = sub ? sub.warnings?.users ?? isNearLimit(sub.limits.users.used, sub.limits.users.limit) : false
  const included = sub ? FEATURE_KEYS.filter((k) => sub.features[k]) : []
  const missing = sub ? FEATURE_KEYS.filter((k) => !sub.features[k]) : []
  const days = sub ? f.daysFromNow(sub.currentPeriodEnd) : null
  // One-step page tour (instead of the dashboard tour CabLayout would start by default).
  const tourSteps: TourStepConfig[] = [
    { id: 'subscription-header', step: 1, totalSteps: 1, title: t('subscription.tour.title'), description: t('subscription.tour.body'), side: 'bottom', align: 'start' },
  ]

  return (
    <CabLayout tourId="cab-subscription" tourSteps={tourSteps}>
      <CabHeader title={t('subscription.page.title')} />
      <main className="flex flex-1 flex-col gap-5 page-main">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-body-sm" aria-label={t('platform.common.breadcrumb')}>
          <Link to={ROUTES.workspace} className="font-light text-neutral-500 hover:text-primary">
            {t('subscription.page.breadcrumbParent')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-800">{t('subscription.page.title')}</span>
        </nav>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <CabTourStep steps={tourSteps} stepId="subscription-header">
            <div>
              <h1 className="text-page-title text-text-primary">{t('subscription.page.title')}</h1>
              <p className="mt-1 text-body-sm text-neutral-600">{t('subscription.page.subtitle')}</p>
            </div>
          </CabTourStep>
          <Button variant="primary" icon={<AppIcon icon={Crown1} size={20} />} onClick={() => setRequesting(true)} disabled={!sub} className="w-full sm:w-auto">
            {t('subscription.requestUpgrade')}
          </Button>
        </div>

        {error && !sub ? <ErrorBlock message={t('subscription.page.loadError')} onRetry={refresh} /> : null}
        {loading && !sub ? <LoadingBlock rows={5} /> : null}

        {sub && (
          <>
            <section className="relative overflow-hidden rounded-3xl p-5 text-white sm:p-7" style={{ background: 'linear-gradient(120deg, #1236A5 0%, #005FAE 60%, #008C8A 100%)' }}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <p className="text-caption font-semibold uppercase tracking-[0.14em] text-warning-300">{t('subscription.page.currentPlan')}</p>
                  <h2 className="mt-1 text-[28px] font-bold leading-tight sm:text-[32px]">{sub.plan.name}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-sm bg-white px-1 py-0.5">
                      <SubscriptionStatusBadge status={sub.status} />
                    </span>
                    <span className="text-body-sm text-white/85">{t(`platform.cycle.${sub.billingCycle}`)}</span>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-4 text-body-sm sm:flex sm:gap-8">
                  <div>
                    <dt className="text-white/70">{sub.status === 'TRIAL' ? t('subscription.page.trialEnds') : t('subscription.page.renewal')}</dt>
                    <dd className="mt-0.5 text-body font-semibold">{f.date(sub.currentPeriodEnd)}</dd>
                    {days != null && days >= 0 && <dd className="text-white/70">{t('platform.common.inDays', { count: days })}</dd>}
                  </div>
                  {sub.plan.supportHoursMonthly != null && (
                    <div>
                      <dt className="text-white/70">{t('subscription.page.supportHours')}</dt>
                      <dd className="mt-0.5 text-body font-semibold">{t('subscription.page.hoursPerMonth', { count: sub.plan.supportHoursMonthly })}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </section>

            {sub.ended && (
              <div role="alert" className="rounded-lg border border-error-100 bg-error-50 p-4 text-body-sm text-error-700">
                <p className="font-semibold">{t('subscription.errors.SUBSCRIPTION_ENDED')}</p>
                <p className="mt-1">{t('subscription.page.endedBody')}</p>
              </div>
            )}
            {sub.readOnly && !sub.ended && (
              <div role="alert" className="rounded-lg border border-error-100 bg-error-50 p-4 text-body-sm text-error-700">
                <p className="font-semibold">{t('subscription.banners.readOnlyTitle')}</p>
                <p className="mt-1">{t(`subscription.banners.readOnlyBody.${sub.status}`, { defaultValue: t('subscription.banners.readOnlyBody.default') })}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card title={t('subscription.page.usage')}>
                <div className="flex flex-col gap-5">
                  <div>
                    <UsageMeter label={t('subscription.page.users')} used={sub.limits.users.used} limit={sub.limits.users.limit} />
                    {userWarning && <p className="mt-2 text-caption font-medium text-warning-700">{t('subscription.page.usersWarning')}</p>}
                  </div>
                  <div>
                    <UsageMeter label={t('subscription.page.certificates')} used={sub.limits.certificates.active} limit={sub.limits.certificates.limit} />
                    {certWarning && (
                      <p className="mt-2 rounded-md bg-warning-500/10 px-3 py-2 text-caption font-medium text-warning-700">{t('subscription.page.certificatesWarning')}</p>
                    )}
                  </div>
                </div>
              </Card>
              <Card title={t('subscription.page.planDetails')}>
                <dl className="grid grid-cols-2 gap-4">
                  <KeyValue label={t('platform.common.plan')}>{sub.plan.name}</KeyValue>
                  <KeyValue label={t('platform.common.billingCycle')}>{t(`platform.cycle.${sub.billingCycle}`)}</KeyValue>
                  {sub.plan.includedUsers != null && <KeyValue label={t('subscription.page.includedUsers')}>{sub.plan.includedUsers}</KeyValue>}
                  <KeyValue label={t('subscription.page.certificateCap')}>
                    {sub.limits.certificates.limit == null ? t('platform.common.unlimited') : f.number(sub.limits.certificates.limit)}
                  </KeyValue>
                  {sub.plan.priceMonthly != null && (
                    <KeyValue label={t('subscription.page.price')}>
                      <span dir="ltr">
                        {sub.billingCycle === 'YEARLY' && sub.plan.priceYearly != null ? `${f.usd(sub.plan.priceYearly)} / ${t('platform.common.year')}` : `${f.usd(sub.plan.priceMonthly)} / ${t('platform.common.month')}`}
                      </span>
                    </KeyValue>
                  )}
                </dl>
              </Card>
            </div>

            <Card title={t('subscription.page.modules')}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-body-sm font-semibold text-neutral-800">{t('subscription.page.included', { count: included.length })}</p>
                  <ul className="flex flex-col gap-1.5">
                    {included.map((key) => (
                      <li key={key} className="flex items-center gap-2 text-body-sm text-neutral-800">
                        <AppIcon icon={TickCircle} size={18} className="shrink-0 text-success-600" />
                        {t(`platform.features.${key}`)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-caption text-neutral-600">{t('subscription.page.coreAlways')}</p>
                </div>
                <div>
                  <p className="mb-2 text-body-sm font-semibold text-neutral-800">{t('subscription.page.notIncluded', { count: missing.length })}</p>
                  {missing.length === 0 ? (
                    <p className="text-body-sm text-neutral-600">{t('subscription.page.everythingIncluded')}</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {missing.map((key) => (
                        <li key={key} className="flex items-center gap-2 text-body-sm text-neutral-600">
                          <AppIcon icon={Lock1} size={18} className="shrink-0 text-neutral-500" />
                          {t(`platform.features.${key}`)}
                        </li>
                      ))}
                    </ul>
                  )}
                  {missing.length > 0 && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setRequesting(true)}>
                      {t('subscription.requestUpgrade')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <Card title={t('subscription.page.invoices')}>
              {sub.invoices.length === 0 ? (
                <EmptyState title={t('subscription.page.noInvoices')} />
              ) : (
                <ul className="flex flex-col divide-y divide-neutral-100">
                  {sub.invoices.map((invoice) => (
                    <li key={invoice.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <button type="button" onClick={() => setViewing(invoice)} className="text-body-sm font-semibold text-primary hover:underline" dir="ltr">
                          {invoice.number}
                        </button>
                        <p className="text-caption text-neutral-600">
                          {rangeText(f.date(invoice.periodStart), f.date(invoice.periodEnd))} · {t('platform.invoices.dueDate')}: {f.date(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className={cn('text-end')}>
                          <span className="block text-body-sm font-semibold text-neutral-900" dir="ltr">{f.usd(invoice.total)}</span>
                          <span className="block text-caption text-neutral-600" dir="ltr">≈ {f.sar(invoice.totalSar)}</span>
                        </span>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-caption text-neutral-600">{t('subscription.page.paymentNote')}</p>
            </Card>
          </>
        )}
      </main>
      <InvoiceDetailsDialog invoice={viewing} onClose={() => setViewing(null)} />
      <UpgradeRequestDialog open={requesting} onClose={() => setRequesting(false)} currentPlanCode={sub?.plan.code} />
    </CabLayout>
  )
}

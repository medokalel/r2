import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { createTenant, getPlatformSettings, listPlans } from '@/lib/api/platformApi'
import type { BillingCycle } from '@/lib/api/platformTypes'
import { getCountryOptions } from '@/lib/countries'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { PLATFORM_ROUTES, platformTenantPath } from '@/lib/platformRoutes'
import { computeInvoiceTotals } from '@/lib/subscriptionFeatures'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Card, ErrorBlock, FieldLabel, KeyValue, LoadingBlock, PageHeader } from '@/components/platform/PlatformUi'
import { inputClassName, textareaClassName } from '@/components/platform/platformStyles'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { useLoader } from '@/components/platform/useLoader'
import { notSet } from '@/lib/emptyValue'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function PlatformTenantCreatePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const f = usePlatformFormat()
  const plans = useLoader(listPlans, [])
  const settings = useLoader(getPlatformSettings, [])
  const countries = useMemo(() => getCountryOptions(i18n.language?.startsWith('ar') ? 'ar' : 'en'), [i18n.language])

  const [legalEntityName, setLegalEntityName] = useState('')
  const [tradingName, setTradingName] = useState('')
  const [country, setCountry] = useState('SA')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [planId, setPlanId] = useState('')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY')
  const [withTrial, setWithTrial] = useState(true)
  const [trialDays, setTrialDays] = useState('')
  const [extraUsers, setExtraUsers] = useState('0')
  const [waived, setWaived] = useState(false)
  const [waiverReason, setWaiverReason] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activePlans = (plans.data ?? []).filter((p) => p.isActive)
  const selectedPlan = activePlans.find((p) => p.id === planId) ?? null
  const defaultTrial = settings.data?.trialDays ?? 14
  const trialValue = trialDays === '' ? defaultTrial : Number(trialDays)
  const extra = Math.max(0, Number(extraUsers) || 0)

  const errors = {
    legalEntityName: !legalEntityName.trim() ? t('platform.form.required') : '',
    adminName: !adminName.trim() ? t('platform.form.required') : '',
    adminEmail: !EMAIL.test(adminEmail.trim()) ? t('platform.form.invalidEmail') : '',
    planId: !selectedPlan ? t('platform.form.required') : '',
    trialDays: withTrial && (!Number.isInteger(trialValue) || trialValue < 1 || trialValue > 90) ? t('platform.form.range', { min: 1, max: 90 }) : '',
    extraUsers: !Number.isInteger(Number(extraUsers)) || Number(extraUsers) < 0 ? t('platform.form.wholeNumber') : '',
    waiverReason: waived && !waiverReason.trim() ? t('platform.form.required') : '',
  }
  const valid = Object.values(errors).every((e) => !e)

  const firstInvoice = (() => {
    if (!selectedPlan || !settings.data) return null
    const months = billingCycle === 'YEARLY' ? 12 : 1
    const lines = [
      { quantity: 1, unitPrice: billingCycle === 'YEARLY' ? selectedPlan.priceYearly : selectedPlan.priceMonthly },
      { quantity: extra * months, unitPrice: selectedPlan.extraUserPriceMonthly },
      { quantity: waived ? 0 : 1, unitPrice: selectedPlan.onboardingFee },
    ]
    return computeInvoiceTotals(lines, settings.data.vatRate, settings.data.sarRate)
  })()

  const submit = async () => {
    setTouched(true)
    if (!valid || busy || !selectedPlan) return
    setBusy(true)
    setError(null)
    try {
      const id = await createTenant({
        legalEntityName: legalEntityName.trim(),
        tradingName: tradingName.trim() || undefined,
        country,
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        planId: selectedPlan.id,
        billingCycle,
        trialDays: withTrial ? trialValue : 0,
        extraUsers: extra,
        onboardingFeeWaived: waived,
        waiverReason: waived ? waiverReason.trim() : undefined,
      })
      toast.success(t('platform.tenantCreate.created', { email: adminEmail.trim() }))
      navigate(platformTenantPath(id))
    } catch (err) {
      setError(getUserErrorMessage(err, t, { fieldLabels: { adminEmail: 'platform.tenantCreate.adminEmail', legalEntityName: 'platform.tenantCreate.legalName' } }))
    } finally {
      setBusy(false)
    }
  }

  const fieldError = (message: string) => (touched && message ? <p className="text-caption text-error-600">{message}</p> : null)

  return (
    <>
      <PageHeader
        title={t('platform.tenantCreate.title')}
        subtitle={t('platform.tenantCreate.subtitle')}
        crumbs={[{ label: t('platform.tenants.title'), to: PLATFORM_ROUTES.tenants }, { label: t('platform.tenantCreate.title') }]}
      />
      {plans.error ? <ErrorBlock message={getUserErrorMessage(plans.error, t)} onRetry={plans.reload} /> : null}
      {plans.loading && !plans.data ? (
        <LoadingBlock rows={6} />
      ) : (
        <form
          className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
          noValidate
        >
          <div className="flex min-w-0 flex-col gap-5">
            <Card title={t('platform.tenantCreate.cab')}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <FieldLabel htmlFor="t-legal" required>{t('platform.tenantCreate.legalName')}</FieldLabel>
                  <input id="t-legal" className={inputClassName} value={legalEntityName} onChange={(e) => setLegalEntityName(e.target.value)} maxLength={200} />
                  {fieldError(errors.legalEntityName)}
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="t-trading">{t('platform.tenantCreate.tradingName')}</FieldLabel>
                  <input id="t-trading" className={inputClassName} value={tradingName} onChange={(e) => setTradingName(e.target.value)} maxLength={200} />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel required>{t('platform.tenantCreate.country')}</FieldLabel>
                  <SearchableSelect
                    value={country}
                    onChange={setCountry}
                    options={countries.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }))}
                    searchPlaceholder={t('platform.common.search')}
                  />
                </div>
              </div>
            </Card>

            <Card title={t('platform.tenantCreate.admin')}>
              <p className="-mt-1 mb-4 text-body-sm text-neutral-600">{t('platform.tenantCreate.adminHint')}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="t-admin" required>{t('platform.tenantCreate.adminName')}</FieldLabel>
                  <input id="t-admin" className={inputClassName} value={adminName} onChange={(e) => setAdminName(e.target.value)} maxLength={120} />
                  {fieldError(errors.adminName)}
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="t-email" required>{t('platform.tenantCreate.adminEmail')}</FieldLabel>
                  <input id="t-email" type="email" dir="ltr" className={inputClassName} value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} maxLength={160} />
                  {fieldError(errors.adminEmail)}
                </div>
              </div>
            </Card>

            <Card title={t('platform.tenantCreate.plan')}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3" role="radiogroup" aria-label={t('platform.tenantCreate.plan')}>
                {activePlans.map((plan) => {
                  const selected = plan.id === planId
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setPlanId(plan.id)}
                      className={cn(
                        'flex min-w-0 flex-col items-start gap-1 rounded-lg border p-4 text-start transition-colors',
                        selected ? 'border-primary bg-primary-25 ring-2 ring-primary/15' : 'border-neutral-100 hover:border-primary/40',
                      )}
                    >
                      <span className="text-body font-semibold text-neutral-900">{plan.name}</span>
                      <span className="text-body-sm text-neutral-700" dir="ltr">
                        {f.usd(plan.priceMonthly)} / {t('platform.common.month')}
                      </span>
                      <span className="text-caption text-neutral-600">
                        {t('platform.plans.usersIncluded', { count: plan.includedUsers })} ·{' '}
                        {plan.maxActiveCertificates == null ? t('platform.plans.unlimitedCertificates') : t('platform.plans.certificatesCap', { count: plan.maxActiveCertificates })}
                      </span>
                    </button>
                  )
                })}
              </div>
              {fieldError(errors.planId)}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <FieldLabel>{t('platform.common.billingCycle')}</FieldLabel>
                  <div className="flex gap-2">
                    {(['MONTHLY', 'YEARLY'] as const).map((cycle) => (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => setBillingCycle(cycle)}
                        aria-pressed={billingCycle === cycle}
                        className={cn(
                          'h-11 flex-1 rounded-md border text-body-sm font-medium',
                          billingCycle === cycle ? 'border-primary bg-primary text-white' : 'border-neutral-100 bg-white text-neutral-800 hover:border-primary/40',
                        )}
                      >
                        {t(`platform.cycle.${cycle}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="t-extra">{t('platform.common.extraUsers')}</FieldLabel>
                  <input id="t-extra" type="number" min={0} step={1} dir="ltr" className={inputClassName} value={extraUsers} onChange={(e) => setExtraUsers(e.target.value)} />
                  {fieldError(errors.extraUsers)}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-body-sm text-neutral-800">
                    <Checkbox checked={withTrial} onChange={() => setWithTrial((v) => !v)} />
                    {t('platform.tenantCreate.startTrial')}
                  </label>
                  {withTrial && (
                    <>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        dir="ltr"
                        aria-label={t('platform.tenantCreate.trialDays')}
                        placeholder={String(defaultTrial)}
                        className={inputClassName}
                        value={trialDays}
                        onChange={(e) => setTrialDays(e.target.value)}
                      />
                      <p className="text-caption text-neutral-600">{t('platform.tenantCreate.trialDaysHint', { count: trialValue || defaultTrial })}</p>
                    </>
                  )}
                  {fieldError(errors.trialDays)}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-body-sm text-neutral-800">
                    <Checkbox checked={waived} onChange={() => setWaived((v) => !v)} />
                    {t('platform.tenantCreate.waiveOnboarding')}
                  </label>
                  {waived && (
                    <>
                      <textarea
                        rows={2}
                        aria-label={t('platform.tenantCreate.waiverReason')}
                        placeholder={t('platform.tenantCreate.waiverReason')}
                        className={textareaClassName}
                        value={waiverReason}
                        onChange={(e) => setWaiverReason(e.target.value)}
                        maxLength={500}
                      />
                      {fieldError(errors.waiverReason)}
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <Card title={t('platform.tenantCreate.summary')} className="xl:sticky xl:top-20">
              <dl className="grid grid-cols-2 gap-4">
                <KeyValue label={t('platform.common.plan')}>{selectedPlan?.name ?? notSet()}</KeyValue>
                <KeyValue label={t('platform.common.billingCycle')}>{t(`platform.cycle.${billingCycle}`)}</KeyValue>
                <KeyValue label={t('platform.tenantCreate.users')}>{selectedPlan ? selectedPlan.includedUsers + extra : notSet()}</KeyValue>
                <KeyValue label={t('platform.tenantCreate.trial')}>{withTrial ? t('platform.common.days', { count: trialValue || defaultTrial }) : t('platform.common.no')}</KeyValue>
              </dl>
              {firstInvoice && (
                <div className="mt-5 rounded-lg bg-neutral-25 p-4 text-body-sm">
                  <p className="mb-2 font-semibold text-neutral-900">{t('platform.tenantCreate.firstInvoice')}</p>
                  <div className="flex justify-between gap-2"><span>{t('platform.invoices.subtotal')}</span><span dir="ltr">{f.usd(firstInvoice.subtotal)}</span></div>
                  <div className="flex justify-between gap-2"><span>{t('platform.invoices.vat', { rate: f.percent(settings.data?.vatRate ?? 0) })}</span><span dir="ltr">{f.usd(firstInvoice.vatAmount)}</span></div>
                  <div className="mt-1 flex justify-between gap-2 border-t border-neutral-100 pt-2 font-semibold"><span>{t('platform.invoices.total')}</span><span dir="ltr">{f.usd(firstInvoice.total)}</span></div>
                  <p className="mt-1 text-end text-caption text-neutral-600" dir="ltr">≈ {f.sar(firstInvoice.totalSar)}</p>
                  {withTrial && <p className="mt-2 text-caption text-neutral-600">{t('platform.tenantCreate.invoiceAfterTrial')}</p>}
                </div>
              )}
              {error && (
                <p role="alert" className="mt-4 whitespace-pre-line rounded-md border border-error-100 bg-error-50 px-3 py-2 text-body-sm text-error-700">
                  {error}
                </p>
              )}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(PLATFORM_ROUTES.tenants)} disabled={busy}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" variant="primary" className="flex-1" disabled={busy || (touched && !valid)} aria-busy={busy || undefined}>
                  {t('platform.tenantCreate.submit')}
                </Button>
              </div>
            </Card>
          </div>
        </form>
      )}
    </>
  )
}

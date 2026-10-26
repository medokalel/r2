import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { ConfirmActionDialog } from '@/components/dashboard/ConfirmActionDialog'
import { ApiError } from '@/lib/api/client'
import { archivePlan, createPlan, listPlans, updatePlan } from '@/lib/api/platformApi'
import { FEATURE_KEYS, type FeatureMap, type Plan, type PlanInput } from '@/lib/api/platformTypes'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { PLATFORM_ROUTES } from '@/lib/platformRoutes'
import { toast } from '@/lib/toast'
import { Card, ErrorBlock, FieldLabel, LoadingBlock, PageHeader } from '@/components/platform/PlatformUi'
import { inputClassName, textareaClassName } from '@/components/platform/platformStyles'
import { useLoader } from '@/components/platform/useLoader'

type Form = Record<
  'code' | 'name' | 'description' | 'priceMonthly' | 'priceYearly' | 'includedUsers' | 'maxActiveCertificates' | 'iafApiQuota' | 'supportHoursMonthly' | 'extraUserPriceMonthly' | 'onboardingFee' | 'sortOrder',
  string
> & { features: FeatureMap }

const blank = (): Form => ({
  code: '', name: '', description: '', priceMonthly: '', priceYearly: '', includedUsers: '5', maxActiveCertificates: '', iafApiQuota: '',
  supportHoursMonthly: '0', extraUserPriceMonthly: '10', onboardingFee: '1000', sortOrder: '10',
  features: Object.fromEntries(FEATURE_KEYS.map((k) => [k, false])) as FeatureMap,
})

const fromPlan = (p: Plan): Form => ({
  code: p.code, name: p.name, description: p.description ?? '', priceMonthly: String(p.priceMonthly), priceYearly: String(p.priceYearly),
  includedUsers: String(p.includedUsers), maxActiveCertificates: p.maxActiveCertificates == null ? '' : String(p.maxActiveCertificates),
  iafApiQuota: p.iafApiQuota == null ? '' : String(p.iafApiQuota), supportHoursMonthly: String(p.supportHoursMonthly),
  extraUserPriceMonthly: String(p.extraUserPriceMonthly), onboardingFee: String(p.onboardingFee), sortOrder: String(p.sortOrder),
  features: { ...(Object.fromEntries(FEATURE_KEYS.map((k) => [k, false])) as FeatureMap), ...p.features },
})

function PlanForm({ plan }: { plan: Plan | null }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState<Form>(() => (plan ? fromPlan(plan) : blank()))
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [archiving, setArchiving] = useState<'ask' | 'force' | null>(null)

  const set = (key: keyof Omit<Form, 'features'>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const money = (v: string) => v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0
  const whole = (v: string, optional = false) => (v.trim() === '' ? optional : Number.isInteger(Number(v)) && Number(v) >= 0)

  const errors: Partial<Record<keyof Form, string>> = {
    code: /^[A-Z0-9_]{2,30}$/.test(form.code.trim().toUpperCase()) ? '' : t('platform.plans.codeRule'),
    name: form.name.trim() ? '' : t('platform.form.required'),
    priceMonthly: money(form.priceMonthly) ? '' : t('platform.form.amount'),
    priceYearly: money(form.priceYearly) ? '' : t('platform.form.amount'),
    extraUserPriceMonthly: money(form.extraUserPriceMonthly) ? '' : t('platform.form.amount'),
    onboardingFee: money(form.onboardingFee) ? '' : t('platform.form.amount'),
    includedUsers: whole(form.includedUsers) && Number(form.includedUsers) >= 1 ? '' : t('platform.form.wholeNumber'),
    maxActiveCertificates: whole(form.maxActiveCertificates, true) ? '' : t('platform.form.wholeNumber'),
    iafApiQuota: whole(form.iafApiQuota, true) ? '' : t('platform.form.wholeNumber'),
    supportHoursMonthly: whole(form.supportHoursMonthly) ? '' : t('platform.form.wholeNumber'),
    sortOrder: whole(form.sortOrder) ? '' : t('platform.form.wholeNumber'),
  }
  const valid = Object.values(errors).every((e) => !e)

  const payload = (): PlanInput => ({
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    description: form.description.trim(),
    priceMonthly: Number(form.priceMonthly),
    priceYearly: Number(form.priceYearly),
    currency: 'USD',
    includedUsers: Number(form.includedUsers),
    maxActiveCertificates: form.maxActiveCertificates.trim() === '' ? null : Number(form.maxActiveCertificates),
    iafApiQuota: form.iafApiQuota.trim() === '' ? null : Number(form.iafApiQuota),
    supportHoursMonthly: Number(form.supportHoursMonthly),
    extraUserPriceMonthly: Number(form.extraUserPriceMonthly),
    onboardingFee: Number(form.onboardingFee),
    sortOrder: Number(form.sortOrder),
    features: form.features,
  })

  const save = async () => {
    setTouched(true)
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    try {
      if (plan) await updatePlan(plan.id, payload())
      else await createPlan(payload())
      toast.success(plan ? t('platform.plans.saved') : t('platform.plans.created'))
      navigate(PLATFORM_ROUTES.plans)
    } catch (err) {
      setError(getUserErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  const field = (key: keyof Omit<Form, 'features' | 'description'>, label: string, opts: { required?: boolean; hint?: string; numeric?: boolean; prefix?: string } = {}) => (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={`plan-${key}`} required={opts.required}>
        {label}
      </FieldLabel>
      <input
        id={`plan-${key}`}
        className={inputClassName}
        value={form[key]}
        onChange={set(key)}
        type={opts.numeric ? 'number' : 'text'}
        min={opts.numeric ? 0 : undefined}
        step={opts.numeric ? 'any' : undefined}
        dir={opts.numeric || key === 'code' ? 'ltr' : undefined}
        disabled={key === 'code' && Boolean(plan)}
        placeholder={opts.prefix}
      />
      {opts.hint && <p className="text-caption text-neutral-600">{opts.hint}</p>}
      {touched && errors[key] && <p className="text-caption text-error-600">{errors[key]}</p>}
    </div>
  )

  const allOn = FEATURE_KEYS.every((k) => form.features[k])

  return (
    <form
      className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
      noValidate
    >
      <div className="flex min-w-0 flex-col gap-5">
        <Card title={t('platform.plans.identity')}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('code', t('platform.plans.code'), { required: true, hint: plan ? t('platform.plans.codeLocked') : t('platform.plans.codeRule') })}
            {field('name', t('platform.plans.name'), { required: true })}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <FieldLabel htmlFor="plan-description">{t('platform.plans.description')}</FieldLabel>
              <textarea id="plan-description" rows={3} className={textareaClassName} value={form.description} onChange={set('description')} maxLength={500} />
            </div>
            {field('sortOrder', t('platform.plans.sortOrder'), { numeric: true })}
          </div>
        </Card>
        <Card title={t('platform.plans.pricing')}>
          <p className="-mt-1 mb-4 text-body-sm text-neutral-600">{t('platform.plans.pricingHint')}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('priceMonthly', t('platform.plans.priceMonthly'), { required: true, numeric: true })}
            {field('priceYearly', t('platform.plans.priceYearly'), { required: true, numeric: true })}
            {field('extraUserPriceMonthly', t('platform.plans.extraUserPriceLabel'), { required: true, numeric: true })}
            {field('onboardingFee', t('platform.plans.onboardingFee'), { required: true, numeric: true })}
          </div>
        </Card>
        <Card title={t('platform.plans.limits')}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('includedUsers', t('platform.plans.includedUsers'), { required: true, numeric: true })}
            {field('maxActiveCertificates', t('platform.plans.maxCertificates'), { numeric: true, hint: t('platform.plans.blankUnlimited') })}
            {field('iafApiQuota', t('platform.plans.iafApiQuota'), { numeric: true, hint: t('platform.plans.blankUnlimited') })}
            {field('supportHoursMonthly', t('platform.plans.supportHoursLabel'), { required: true, numeric: true })}
          </div>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <Card
          title={t('platform.plans.featureChecklist')}
          actions={
            <button
              type="button"
              className="text-body-sm font-semibold text-primary hover:underline"
              onClick={() => setForm((f) => ({ ...f, features: Object.fromEntries(FEATURE_KEYS.map((k) => [k, !allOn])) as FeatureMap }))}
            >
              {allOn ? t('platform.plans.clearAll') : t('platform.plans.selectAll')}
            </button>
          }
        >
          <ul className="flex flex-col gap-1">
            {FEATURE_KEYS.map((key) => (
              <li key={key}>
                <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-body-sm text-neutral-800 hover:bg-neutral-25">
                  <Checkbox checked={form.features[key]} onChange={() => setForm((f) => ({ ...f, features: { ...f.features, [key]: !f.features[key] } }))} />
                  <span className="min-w-0 flex-1">{t(`platform.features.${key}`)}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-caption text-neutral-600">{t('platform.plans.coreNote')}</p>
        </Card>
        {error && (
          <p role="alert" className="whitespace-pre-line rounded-md border border-error-100 bg-error-50 px-3 py-2 text-body-sm text-error-700">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {plan?.isActive && (
            <Button type="button" variant="destructive" onClick={() => setArchiving('ask')} disabled={busy} className="sm:me-auto">
              {t('platform.plans.archive')}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => navigate(PLATFORM_ROUTES.plans)} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={busy || (touched && !valid)}>
            {plan ? t('platform.common.saveChanges') : t('platform.plans.create')}
          </Button>
        </div>
      </div>

      {plan && (
        <ConfirmActionDialog
          open={archiving !== null}
          title={archiving === 'force' ? t('platform.plans.archiveForceTitle') : t('platform.plans.archiveTitle', { name: plan.name })}
          description={archiving === 'force' ? t('platform.plans.archiveForceBody', { count: plan.tenantCount }) : t('platform.plans.archiveBody')}
          confirmLabel={archiving === 'force' ? t('platform.plans.archiveAnyway') : t('platform.plans.archive')}
          destructive
          onClose={() => setArchiving(null)}
          onConfirm={async () => {
            try {
              await archivePlan(plan.id, archiving === 'force')
            } catch (err) {
              if (err instanceof ApiError && err.status === 409 && archiving === 'ask') {
                // Tenants are still on the plan: ask once more before archiving anyway.
                setTimeout(() => setArchiving('force'), 0)
                return
              }
              throw new Error(getUserErrorMessage(err, t), { cause: err })
            }
            toast.success(t('platform.plans.archivedToast'))
            navigate(PLATFORM_ROUTES.plans)
          }}
        />
      )}
    </form>
  )
}

export function PlatformPlanEditorPage() {
  const { t } = useTranslation()
  const { planId } = useParams()
  const isNew = !planId || planId === 'new'
  const { data, loading, error, reload } = useLoader(() => (isNew ? Promise.resolve([] as Plan[]) : listPlans()), [planId])
  const plan = isNew ? null : (data ?? []).find((p) => p.id === planId) ?? null

  return (
    <>
      <PageHeader
        title={isNew ? t('platform.plans.new') : t('platform.plans.editTitle', { name: plan?.name ?? '…' })}
        crumbs={[{ label: t('platform.plans.title'), to: PLATFORM_ROUTES.plans }, { label: isNew ? t('platform.plans.new') : plan?.name ?? '…' }]}
      />
      {error ? <ErrorBlock message={getUserErrorMessage(error, t)} onRetry={reload} /> : null}
      {loading ? <LoadingBlock rows={6} /> : isNew ? <PlanForm plan={null} /> : plan ? <PlanForm key={plan.id} plan={plan} /> : <ErrorBlock message={t('errors.notFound')} />}
    </>
  )
}

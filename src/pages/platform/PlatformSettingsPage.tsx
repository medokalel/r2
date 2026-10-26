import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { Card, ErrorBlock, FieldLabel, LoadingBlock, PageHeader } from '@/components/platform/PlatformUi'
import { inputClassName } from '@/components/platform/platformStyles'
import { useLoader } from '@/components/platform/useLoader'
import { getPlatformSettings, listPlans, patchPlatformSettings } from '@/lib/api/platformApi'
import type { Plan, PlatformSettings } from '@/lib/api/platformTypes'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { PLATFORM_ROUTES } from '@/lib/platformRoutes'
import { toast } from '@/lib/toast'

type Draft = Record<keyof PlatformSettings, string>

const toDraft = (s: PlatformSettings): Draft => ({
  sarRate: String(s.sarRate),
  vatRate: String(Math.round(s.vatRate * 10000) / 100),
  pastDueGraceDays: String(s.pastDueGraceDays),
  quarantineMonths: String(s.quarantineMonths),
  trialDays: String(s.trialDays),
  paymentTermsDays: String(s.paymentTermsDays),
  trialPlanCode: s.trialPlanCode,
})

function SettingsForm({ settings, plans }: { settings: PlatformSettings; plans: Plan[] }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Draft>(() => toDraft(settings))
  const [saved, setSaved] = useState<PlatformSettings>(settings)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const n = (key: keyof Draft) => Number(draft[key])
  const errors: Partial<Record<keyof Draft, string>> = {
    sarRate: n('sarRate') > 0 && n('sarRate') < 100 ? '' : t('platform.form.range', { min: 0.01, max: 99 }),
    vatRate: n('vatRate') >= 0 && n('vatRate') <= 100 ? '' : t('platform.form.range', { min: 0, max: 100 }),
    pastDueGraceDays: Number.isInteger(n('pastDueGraceDays')) && n('pastDueGraceDays') >= 0 && n('pastDueGraceDays') <= 365 ? '' : t('platform.form.range', { min: 0, max: 365 }),
    quarantineMonths: Number.isInteger(n('quarantineMonths')) && n('quarantineMonths') >= 0 && n('quarantineMonths') <= 60 ? '' : t('platform.form.range', { min: 0, max: 60 }),
    trialDays: Number.isInteger(n('trialDays')) && n('trialDays') >= 0 && n('trialDays') <= 365 ? '' : t('platform.form.range', { min: 0, max: 365 }),
    paymentTermsDays: Number.isInteger(n('paymentTermsDays')) && n('paymentTermsDays') >= 0 && n('paymentTermsDays') <= 365 ? '' : t('platform.form.range', { min: 0, max: 365 }),
  }
  const valid = Object.values(errors).every((e) => !e) && Object.values(draft).every((v) => v.trim() !== '')
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(saved))

  const save = async () => {
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    try {
      const next = await patchPlatformSettings({
        sarRate: n('sarRate'),
        vatRate: Math.round(n('vatRate') * 100) / 10000,
        pastDueGraceDays: n('pastDueGraceDays'),
        quarantineMonths: n('quarantineMonths'),
        trialDays: n('trialDays'),
        paymentTermsDays: n('paymentTermsDays'),
        trialPlanCode: draft.trialPlanCode,
      })
      setSaved(next)
      setDraft(toDraft(next))
      toast.success(t('platform.settings.saved'))
    } catch (err) {
      setError(getUserErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  const field = (key: keyof Draft, label: string, hint: string, suffix: string, step = '1') => (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={`set-${key}`} required>
        {label}
      </FieldLabel>
      <div className="flex items-center gap-2">
        <input
          id={`set-${key}`}
          type="number"
          step={step}
          min={0}
          dir="ltr"
          className={inputClassName}
          value={draft[key]}
          onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
        />
        <span className="w-16 shrink-0 text-body-sm text-neutral-600">{suffix}</span>
      </div>
      <p className="text-caption text-neutral-600">{hint}</p>
      {errors[key] && <p className="text-caption text-error-600">{errors[key]}</p>}
    </div>
  )

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
      noValidate
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title={t('platform.settings.billing')}>
          <div className="flex flex-col gap-5">
            {field('sarRate', t('platform.settings.sarRate'), t('platform.settings.sarRateHint'), t('platform.common.sar'), '0.0001')}
            {field('vatRate', t('platform.settings.vatRate'), t('platform.settings.vatRateHint'), '%', '0.01')}
            {field('paymentTermsDays', t('platform.settings.paymentTerms'), t('platform.settings.paymentTermsHint'), t('platform.settings.daysUnit'))}
          </div>
        </Card>
        <Card title={t('platform.settings.lifecycle')}>
          <div className="flex flex-col gap-5">
            {field('trialDays', t('platform.settings.trialDays'), t('platform.settings.trialDaysHint'), t('platform.settings.daysUnit'))}
            <div className="flex flex-col gap-2">
              <FieldLabel required>{t('platform.settings.trialPlan')}</FieldLabel>
              <SelectField
                value={draft.trialPlanCode}
                onChange={(v) => setDraft((d) => ({ ...d, trialPlanCode: v }))}
                options={(plans.some((p) => p.code === draft.trialPlanCode) ? plans : [...plans, { code: draft.trialPlanCode, name: draft.trialPlanCode, isActive: true } as Plan])
                  .filter((p) => p.isActive)
                  .map((p) => ({ value: p.code, label: p.name }))}
              />
              <p className="text-caption text-neutral-600">{t('platform.settings.trialPlanHint')}</p>
            </div>
            {field('pastDueGraceDays', t('platform.settings.graceDays'), t('platform.settings.graceDaysHint'), t('platform.settings.daysUnit'))}
            {field('quarantineMonths', t('platform.settings.quarantineMonths'), t('platform.settings.quarantineMonthsHint'), t('platform.settings.monthsUnit'))}
          </div>
        </Card>
      </div>
      {error && (
        <p role="alert" className="rounded-md border border-error-100 bg-error-50 px-3 py-2 text-body-sm text-error-700">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={!dirty || busy} onClick={() => setDraft(toDraft(saved))}>
          {t('platform.common.reset')}
        </Button>
        <Button type="submit" variant="primary" disabled={!dirty || !valid || busy}>
          {t('platform.common.saveChanges')}
        </Button>
      </div>
    </form>
  )
}

export function PlatformSettingsPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useLoader(getPlatformSettings, [])
  const plans = useLoader(listPlans, [])
  return (
    <>
      <PageHeader
        title={t('platform.settings.title')}
        subtitle={t('platform.settings.subtitle')}
        crumbs={[{ label: t('platform.nav.dashboard'), to: PLATFORM_ROUTES.dashboard }, { label: t('platform.settings.title') }]}
      />
      {error ? <ErrorBlock message={getUserErrorMessage(error, t)} onRetry={reload} /> : null}
      {loading && !data ? <LoadingBlock rows={5} /> : data ? <SettingsForm settings={data} plans={plans.data ?? []} /> : null}
    </>
  )
}

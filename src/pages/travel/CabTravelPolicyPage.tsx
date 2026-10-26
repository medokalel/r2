import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Add, Trash } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { SelectField } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { Alert } from '@/components/ui/Alert'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { Card, ErrorBlock, LoadingBlock, PageHeader } from '@/components/platform/PlatformUi'
import { travelErrorMessage } from '@/components/travel/travelHelpers'
import {
  getTravelPolicy,
  getTravelProviderStatus,
  listTravelCities,
  saveTravelPolicy,
  type TravelCity,
  type TravelPolicy,
  type TravelPolicyInput,
  type TravelPolicySettings,
  type TravelProviderStatus,
} from '@/lib/api/travelApi'
import { formatDateTime } from '@/lib/format/dates'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type NumericSetting = Exclude<keyof TravelPolicySettings, 'longFlightCabin' | 'insuranceDomestic' | 'perDiemOnLocalAudits'>

const GROUPS: Array<{ key: string; settings: NumericSetting[] }> = [
  { key: 'transport', settings: ['economyMaxFlightHours', 'carVsFlightKm', 'maxGroundHours', 'airportTransferDefault', 'carRentalPerDay', 'fuelPerKm', 'localTransportPerDay', 'passengersPerCar'] },
  { key: 'trip', settings: ['travelBufferDays', 'earlyArrivalThresholdHours', 'lateReturnThresholdHours', 'combineSitesKm', 'localRadiusKm', 'maxExtraHoursForSaving'] },
  { key: 'costs', settings: ['contingencyPct', 'insurancePct', 'defaultHotelRate', 'defaultPerDiem', 'flightBaseFare', 'flightPerKm', 'premiumEconomyMultiplier', 'businessMultiplier'] },
  { key: 'pricing', settings: ['liveWindowDays', 'bookingHorizonDays', 'benchmarkAnnualIncreasePct', 'quoteValidityDays', 'bookingLeadDays', 'adjustmentApprovalThreshold', 'groundSpeedKmh', 'roadFactor', 'airportOverheadHours'] },
]

const PROVIDER_TONE = { live: 'bg-success-50 text-success-700', demo: 'bg-error-50 text-error-600', off: 'bg-warning-50 text-warning-700', on: 'bg-primary-50 text-primary' }

/** CAB settings → Travel policy: rules and rates of the travel cost calculator, plus provider status. */
export function CabTravelPolicyPage() {
  const { t, i18n } = useTranslation()
  const ar = i18n.language.startsWith('ar')
  const [policy, setPolicy] = useState<TravelPolicy | null>(null)
  const [draft, setDraft] = useState<TravelPolicyInput | null>(null)
  const [cities, setCities] = useState<TravelCity[]>([])
  const [providers, setProviders] = useState<TravelProviderStatus | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    Promise.all([getTravelPolicy(), listTravelCities(), getTravelProviderStatus(false)]).then(
      ([p, c, s]) => {
        if (!alive) return
        setPolicy(p)
        setDraft({ currency: p.currency, settings: { ...p.settings }, countries: p.countries.map((r) => ({ ...r })), cities: p.cities.map((r) => ({ ...r })), railRoutes: p.railRoutes.map((r) => ({ ...r })) })
        setCities(c)
        setProviders(s)
      },
      () => alive && setError(true),
    )
    return () => {
      alive = false
    }
  }, [attempt])

  const cityName = (key: string) => {
    const c = cities.find((x) => x.key === key)
    return c ? (ar ? c.nameAr : c.name) : key
  }
  const cityOptions = cities.map((c) => ({ value: c.key, label: `${ar ? c.nameAr : c.name} (${c.country})` }))
  const setSetting = (key: keyof TravelPolicySettings, value: number | string | boolean) => setDraft((d) => (d ? { ...d, settings: { ...d.settings, [key]: value } } : d))
  const samples = draft ? [...draft.countries, ...draft.cities, ...draft.railRoutes].filter((r) => r.sample).length : 0

  const save = async () => {
    if (!draft) return
    setSaving(true)
    setSaveError(null)
    try {
      const saved = await saveTravelPolicy(draft)
      setPolicy(saved)
      toast.success(t('travel.policy.saved'))
    } catch (err) {
      setSaveError(travelErrorMessage(err, t))
    } finally {
      setSaving(false)
    }
  }

  const check = async () => {
    setChecking(true)
    try {
      setProviders(await getTravelProviderStatus(true))
    } finally {
      setChecking(false)
    }
  }

  const numberCell = (value: number, onChange: (n: number) => void, label: string, id: string) => (
    <TextField id={id} aria-label={label} type="number" min="0" step="0.01" value={String(value)} onChange={(e) => onChange(Number(e.target.value))} />
  )

  return (
    <CabLayout>
      <CabHeader title={t('travel.policy.title')} />
      <main className="flex flex-1 flex-col gap-6 overflow-auto bg-white page-main">
        <PageHeader
          title={t('travel.policy.title')}
          subtitle={t('travel.policy.subtitle')}
          actions={
            draft && (
              <Button size="md" disabled={saving} onClick={() => void save()}>
                {saving ? t('travel.common.working') : t('travel.policy.save')}
              </Button>
            )
          }
        />
        {error ? (
          <ErrorBlock message={t('travel.errors.load')} onRetry={() => { setError(false); setAttempt((n) => n + 1) }} />
        ) : !draft || !policy ? (
          <LoadingBlock />
        ) : (
          <>
            {saveError && <Alert tone="error" role="alert" title={saveError} />}
            {samples > 0 && (
              <Alert tone="warning" title={t('travel.policy.samplesTitle', { count: samples })}>
                {t('travel.policy.samplesText')}
              </Alert>
            )}
            {policy.updatedAt && <p className="text-caption text-text-secondary">{t('travel.policy.updated', { date: formatDateTime(policy.updatedAt, i18n.language), name: policy.updatedByName ?? '' })}</p>}

            <Card
              title={t('travel.providers.title')}
              actions={
                <Button size="sm" variant="outline" disabled={checking} onClick={() => void check()}>
                  {checking ? t('travel.common.working') : t('travel.providers.check')}
                </Button>
              }
            >
              <p className="mb-2 text-body-sm text-neutral-700">{t('travel.providers.intro')}</p>
              <p className="mb-3 rounded-md bg-neutral-50 px-3 py-2 text-caption text-neutral-700" data-testid="travel-phase2">{t('travel.providers.phase2')}</p>
              <ul className="divide-y divide-neutral-100">
                {providers?.providers.map((p) => {
                  const tone = p.live ? 'live' : p.mode === 'mock' || p.mode === 'test' ? 'demo' : p.configured ? 'on' : 'off'
                  return (
                    <li key={p.kind} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-body-sm font-semibold text-neutral-900">{t(`travel.providers.kind.${p.kind}`)}</p>
                        <p className="text-caption text-text-secondary">{p.label ?? t('travel.providers.none')} · {t(`travel.providers.hint.${tone}`)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-sm px-2 py-0.5 text-caption font-medium', PROVIDER_TONE[tone])}>{t(`travel.providers.state.${tone}`)}</span>
                        {p.reachable !== null && <span className={cn('text-caption', p.reachable ? 'text-success-700' : 'text-error-600')}>{p.reachable ? t('travel.providers.reachable') : t('travel.providers.unreachable')}</span>}
                      </div>
                    </li>
                  )
                })}
              </ul>
              {providers?.checked && <p className="mt-2 text-caption text-text-secondary">{t('travel.providers.checkedAt', { date: formatDateTime(providers.checkedAt, i18n.language) })}</p>}
            </Card>

            <Card title={t('travel.policy.rules')}>
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField id="travel-currency" label={t('travel.policy.currency')} maxLength={3} value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })} />
                  <SelectField
                    id="travel-long-cabin"
                    label={t('travel.policy.settings.longFlightCabin')}
                    value={draft.settings.longFlightCabin}
                    onChange={(v) => setSetting('longFlightCabin', v)}
                    options={(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS'] as const).map((c) => ({ value: c, label: t(`travel.cabin.${c}`) }))}
                  />
                  <div className="flex flex-col justify-end gap-3 pb-1 text-body-sm">
                    <label className="flex items-center gap-2">
                      <Checkbox checked={draft.settings.insuranceDomestic} onChange={() => setSetting('insuranceDomestic', !draft.settings.insuranceDomestic)} />
                      {t('travel.policy.settings.insuranceDomestic')}
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox checked={draft.settings.perDiemOnLocalAudits} onChange={() => setSetting('perDiemOnLocalAudits', !draft.settings.perDiemOnLocalAudits)} />
                      {t('travel.policy.settings.perDiemOnLocalAudits')}
                    </label>
                  </div>
                </div>
                {GROUPS.map((group) => (
                  <section key={group.key} className="space-y-3">
                    <h3 className="text-body-sm font-semibold text-neutral-900">{t(`travel.policy.group.${group.key}`)}</h3>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {group.settings.map((key) => (
                        <TextField
                          key={key}
                          id={`travel-setting-${key}`}
                          label={t(`travel.policy.settings.${key}`)}
                          type="number"
                          min="0"
                          step="0.01"
                          value={String(draft.settings[key])}
                          onChange={(e) => setSetting(key, Number(e.target.value))}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </Card>

            <Card
              title={t('travel.policy.countries')}
              actions={
                <Button size="sm" variant="outline" onClick={() => setDraft({ ...draft, countries: [...draft.countries, { country: '', perDiem: 0, hotelCap: 0, visaFee: 0, note: '', sample: false }] })}>
                  <AppIcon icon={Add} size={16} />
                  {t('travel.policy.addCountry')}
                </Button>
              }
            >
              <p className="mb-3 text-body-sm text-neutral-700">{t('travel.policy.countriesHint')}</p>
              <div className="space-y-3">
                {draft.countries.map((row, i) => {
                  const update = (patch: Partial<typeof row>) => setDraft({ ...draft, countries: draft.countries.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
                  return (
                    <div key={i} className="grid gap-3 rounded-md border border-neutral-100 p-3 sm:grid-cols-2 lg:grid-cols-[90px_repeat(3,minmax(0,1fr))_minmax(0,1.5fr)_auto] lg:items-end">
                      <TextField id={`travel-country-${i}`} label={t('travel.policy.country')} maxLength={2} value={row.country} onChange={(e) => update({ country: e.target.value.toUpperCase() })} />
                      <TextField id={`travel-perdiem-${i}`} label={t('travel.policy.perDiem')} type="number" min="0" value={String(row.perDiem)} onChange={(e) => update({ perDiem: Number(e.target.value) })} />
                      <TextField id={`travel-hotelcap-${i}`} label={t('travel.policy.hotelCap')} type="number" min="0" value={String(row.hotelCap)} onChange={(e) => update({ hotelCap: Number(e.target.value) })} />
                      <TextField id={`travel-visa-${i}`} label={t('travel.policy.visaFee')} type="number" min="0" value={String(row.visaFee)} onChange={(e) => update({ visaFee: Number(e.target.value) })} />
                      <TextField id={`travel-note-${i}`} label={t('travel.policy.note')} maxLength={300} value={row.note ?? ''} onChange={(e) => update({ note: e.target.value })} />
                      <div className="flex items-center gap-3 pb-2">
                        <label className="flex items-center gap-2 text-body-sm whitespace-nowrap">
                          <Checkbox checked={!row.sample} onChange={() => update({ sample: !row.sample })} />
                          {t('travel.policy.confirmed')}
                        </label>
                        <Button type="button" variant="tertiary" size="sm" aria-label={t('travel.policy.removeRow')} onClick={() => setDraft({ ...draft, countries: draft.countries.filter((_, j) => j !== i) })}>
                          <AppIcon icon={Trash} size={16} />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card
                title={t('travel.policy.cities')}
                actions={
                  <Button size="sm" variant="outline" disabled={!cities.length} onClick={() => setDraft({ ...draft, cities: [...draft.cities, { cityKey: cities[0].key, hotelCap: 0, sample: false }] })}>
                    <AppIcon icon={Add} size={16} />
                    {t('travel.policy.addCity')}
                  </Button>
                }
              >
                <div className="space-y-3">
                  {draft.cities.map((row, i) => {
                    const update = (patch: Partial<typeof row>) => setDraft({ ...draft, cities: draft.cities.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
                    return (
                      <div key={i} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-end">
                        <SelectField id={`travel-city-${i}`} label={t('travel.policy.city')} value={row.cityKey} onChange={(v) => update({ cityKey: v })} options={cityOptions.length ? cityOptions : [{ value: row.cityKey, label: cityName(row.cityKey) }]} />
                        {numberCell(row.hotelCap, (n) => update({ hotelCap: n }), t('travel.policy.hotelCap'), `travel-city-cap-${i}`)}
                        <div className="flex items-center gap-3 pb-2">
                          <label className="flex items-center gap-2 text-body-sm whitespace-nowrap">
                            <Checkbox checked={!row.sample} onChange={() => update({ sample: !row.sample })} />
                            {t('travel.policy.confirmed')}
                          </label>
                          <Button type="button" variant="tertiary" size="sm" aria-label={t('travel.policy.removeRow')} onClick={() => setDraft({ ...draft, cities: draft.cities.filter((_, j) => j !== i) })}>
                            <AppIcon icon={Trash} size={16} />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card
                title={t('travel.policy.rail')}
                actions={
                  <Button size="sm" variant="outline" disabled={cities.length < 2} onClick={() => setDraft({ ...draft, railRoutes: [...draft.railRoutes, { from: cities[0].key, to: cities[1].key, fare: 0, hours: 1, operator: '', sample: false }] })}>
                    <AppIcon icon={Add} size={16} />
                    {t('travel.policy.addRoute')}
                  </Button>
                }
              >
                <p className="mb-3 text-body-sm text-neutral-700">{t('travel.policy.railHint')}</p>
                <div className="space-y-3">
                  {draft.railRoutes.map((row, i) => {
                    const update = (patch: Partial<typeof row>) => setDraft({ ...draft, railRoutes: draft.railRoutes.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
                    return (
                      <div key={i} className="grid gap-3 rounded-md border border-neutral-100 p-3 sm:grid-cols-2">
                        <SelectField id={`travel-rail-from-${i}`} label={t('travel.policy.from')} value={row.from} onChange={(v) => update({ from: v })} options={cityOptions.length ? cityOptions : [{ value: row.from, label: cityName(row.from) }]} />
                        <SelectField id={`travel-rail-to-${i}`} label={t('travel.policy.to')} value={row.to} onChange={(v) => update({ to: v })} options={cityOptions.length ? cityOptions : [{ value: row.to, label: cityName(row.to) }]} />
                        <TextField id={`travel-rail-fare-${i}`} label={t('travel.policy.fare')} type="number" min="0" value={String(row.fare)} onChange={(e) => update({ fare: Number(e.target.value) })} />
                        <TextField id={`travel-rail-hours-${i}`} label={t('travel.policy.hours')} type="number" min="0" step="0.1" value={String(row.hours)} onChange={(e) => update({ hours: Number(e.target.value) })} />
                        <TextField id={`travel-rail-operator-${i}`} label={t('travel.policy.operator')} maxLength={120} value={row.operator} onChange={(e) => update({ operator: e.target.value })} />
                        <div className="flex items-center gap-3 sm:pt-7">
                          <label className="flex items-center gap-2 text-body-sm whitespace-nowrap">
                            <Checkbox checked={!row.sample} onChange={() => update({ sample: !row.sample })} />
                            {t('travel.policy.confirmed')}
                          </label>
                          <Button type="button" variant="tertiary" size="sm" aria-label={t('travel.policy.removeRow')} onClick={() => setDraft({ ...draft, railRoutes: draft.railRoutes.filter((_, j) => j !== i) })}>
                            <AppIcon icon={Trash} size={16} />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button size="md" disabled={saving} onClick={() => void save()}>
                {saving ? t('travel.common.working') : t('travel.policy.save')}
              </Button>
            </div>
          </>
        )}
      </main>
    </CabLayout>
  )
}

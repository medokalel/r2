import { useTranslation } from 'react-i18next'
import { Add, Trash } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { SelectField } from '@/components/ui/Select'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { FormField } from '@/components/ui/FormField'
import { DatePicker } from '@/components/ui/DatePicker'
import { Checkbox } from '@/components/ui/Checkbox'
import { toIsoDate } from '@/components/dashboard/companyProfile/mappers'
import type { TravelCity, TravelMode, TravelSiteInput, TravelTeamInput } from '@/lib/api/travelApi'
import { modeLabel } from '@/components/travel/travelHelpers'

export interface TravelInputs {
  mode: TravelMode
  startDate: string
  endDate: string
  sites: TravelSiteInput[]
  team: TravelTeamInput[]
}

const asDate = (iso: string) => (iso ? new Date(`${iso}T00:00:00`) : undefined)
const MODES: TravelMode[] = ['ONSITE', 'HYBRID', 'REMOTE']
/** Select items cannot have an empty value: this one stands for "no city chosen". */
const AUTO = '__auto'
const fromSelect = (v: string) => (v === AUTO ? '' : v)

/** Mode, dates, sites and team of a travel estimate (prefilled from the record, editable). */
export function TravelInputsForm({ value, onChange, cities, teamLocked }: { value: TravelInputs; onChange: (next: TravelInputs) => void; cities: TravelCity[]; teamLocked?: boolean }) {
  const { t, i18n } = useTranslation()
  const ar = i18n.language.startsWith('ar')
  const cityOptions = [{ value: AUTO, label: t('travel.inputs.cityFromAddress') }, ...cities.map((c) => ({ value: c.name, label: `${ar ? c.nameAr : c.name} (${c.country}${c.iata ? `, ${c.iata}` : ''})` }))]
  const baseOptions = [{ value: AUTO, label: t('travel.inputs.baseFromProfile') }, ...cities.map((c) => ({ value: c.name, label: `${ar ? c.nameAr : c.name} (${c.country})` }))]
  const set = (patch: Partial<TravelInputs>) => onChange({ ...value, ...patch })
  const setSite = (i: number, patch: Partial<TravelSiteInput>) => set({ sites: value.sites.map((s, j) => (j === i ? { ...s, ...patch, resolved: undefined } : s)) })
  const setMember = (i: number, patch: Partial<TravelTeamInput>) => set({ team: value.team.map((m, j) => (j === i ? { ...m, ...patch } : m)) })

  return (
    <div className="@container space-y-5">
      <FormField label={t('travel.inputs.mode')}>
        <RadioGroup name="travel-mode" value={value.mode} onChange={(v) => set({ mode: v as TravelMode })} options={MODES.map((m) => ({ value: m, label: modeLabel(t, m) }))} />
      </FormField>
      {value.mode === 'REMOTE' && <p className="rounded-md bg-info-50 px-3 py-2 text-body-sm text-info-700">{t('travel.inputs.remoteHint')}</p>}
      <div className="grid gap-4 @lg:grid-cols-2">
        <FormField label={t('travel.inputs.startDate')} required>
          <DatePicker value={asDate(value.startDate)} onChange={(d) => set({ startDate: toIsoDate(d), endDate: value.endDate && value.endDate >= toIsoDate(d) ? value.endDate : toIsoDate(d) })} />
        </FormField>
        <FormField label={t('travel.inputs.endDate')} required>
          <DatePicker value={asDate(value.endDate)} onChange={(d) => set({ endDate: toIsoDate(d) })} />
        </FormField>
      </div>
      {value.endDate < value.startDate && <p role="alert" className="text-body-sm text-error-700">{t('travel.inputs.endBeforeStart')}</p>}

      <section className="space-y-3">
        <h4 className="text-body-sm font-semibold text-neutral-900">{t('travel.inputs.sites')}</h4>
        {value.sites.map((site, i) => (
          <div key={site.key ?? i} className="grid gap-3 rounded-md border border-neutral-100 p-3 @lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] @lg:items-end">
            <TextField id={`travel-site-name-${i}`} label={t('travel.inputs.siteName')} value={site.name} maxLength={300} onChange={(e) => setSite(i, { name: e.target.value })} />
            <SelectField id={`travel-site-city-${i}`} label={t('travel.inputs.city')} value={site.city || AUTO} onChange={(v) => setSite(i, { city: fromSelect(v) })} options={cityOptions} />
            <div className="flex items-center gap-3 pb-2">
              {value.mode === 'HYBRID' && (
                <label className="flex items-center gap-2 text-body-sm">
                  <Checkbox checked={site.onsite !== false} onChange={() => setSite(i, { onsite: site.onsite === false })} />
                  {t('travel.inputs.onsite')}
                </label>
              )}
              <Button type="button" variant="tertiary" size="sm" aria-label={t('travel.inputs.removeSite')} onClick={() => set({ sites: value.sites.filter((_, j) => j !== i) })}>
                <AppIcon icon={Trash} size={18} />
              </Button>
            </div>
            <p className="text-caption text-text-secondary @lg:col-span-3">
              {site.address ? `${site.address} · ` : ''}
              {site.resolved ? t('travel.inputs.locatedAt', { city: site.resolved.city, source: site.resolved.source }) : site.city ? t('travel.inputs.locatedAt', { city: site.city, source: t('travel.inputs.cityTable') }) : t('travel.inputs.notLocated')}
            </p>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => set({ sites: [...value.sites, { key: `site-${Date.now()}`, name: '', city: '', onsite: true }] })}>
          <AppIcon icon={Add} size={18} />
          {t('travel.inputs.addSite')}
        </Button>
      </section>

      <section className="space-y-3">
        <h4 className="text-body-sm font-semibold text-neutral-900">{t('travel.inputs.team')}</h4>
        {teamLocked && <p className="text-caption text-text-secondary">{t('travel.inputs.teamFromStep')}</p>}
        {value.team.length === 0 && <p className="text-body-sm text-warning-800">{t('travel.inputs.noTeam')}</p>}
        {value.team.map((member, i) => (
          <div key={member.key ?? `${member.name}-${i}`} className="grid gap-3 rounded-md border border-neutral-100 p-3 @lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] @lg:items-end">
            <TextField id={`travel-member-${i}`} label={t('travel.inputs.auditor')} value={member.name} disabled={teamLocked} maxLength={200} onChange={(e) => setMember(i, { name: e.target.value })} />
            <SelectField id={`travel-base-${i}`} label={t('travel.inputs.base')} value={member.baseCity || AUTO} onChange={(v) => setMember(i, { baseCity: fromSelect(v) })} options={baseOptions} />
            {!teamLocked && (
              <Button type="button" variant="tertiary" size="sm" aria-label={t('travel.inputs.removeAuditor')} onClick={() => set({ team: value.team.filter((_, j) => j !== i) })}>
                <AppIcon icon={Trash} size={18} />
              </Button>
            )}
            {member.base?.city && <p className="text-caption text-text-secondary @lg:col-span-3">{t('travel.inputs.baseIs', { city: member.base.city, source: member.base.source })}</p>}
          </div>
        ))}
        {!teamLocked && (
          <Button type="button" variant="outline" size="sm" onClick={() => set({ team: [...value.team, { key: `member-${Date.now()}`, name: '' }] })}>
            <AppIcon icon={Add} size={18} />
            {t('travel.inputs.addAuditor')}
          </Button>
        )}
      </section>
    </div>
  )
}

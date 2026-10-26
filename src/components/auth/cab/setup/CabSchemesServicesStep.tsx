import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox, TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { AppIcon, PlusIcon } from '@/components/icons'
import {
  SetupChipGroup,
  SetupRecordCard,
  SetupSection,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { CAB_ACTIVITY_OPTIONS, SERVICE_MARKET_OPTIONS, SERVICE_OPTIONS } from '@/lib/api/cabSetupApi'
import { createCustomScheme, type CabCustomScheme } from '@/lib/cabSetupForm'
import {
  ACTIVITY_BASE_STANDARD,
  catalogForActivities,
  cbRequirementTitleKey,
  standardTitleKey,
  type StandardCatalogEntry,
} from '@/lib/standardsCatalog'
import { cn } from '@/lib/utils'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'

/** One catalog scheme: its full title, and the certification-body requirement standard beside it. */
function SchemeRow({
  entry,
  checked,
  onToggle,
}: {
  entry: StandardCatalogEntry
  checked: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const key = standardTitleKey(entry)
  const title = t(`${key}.title`, { defaultValue: entry.name })
  const subtitle = t(`${key}.subtitle`, { defaultValue: '' })
  const base = ACTIVITY_BASE_STANDARD[entry.activity]

  return (
    <label
      className={cn(
        'grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 rounded-md border bg-white p-3.5 transition-colors sm:p-4',
        'md:grid-cols-[auto_minmax(0,1fr)_minmax(0,300px)] md:items-center md:gap-x-5',
        checked
          ? 'border-[var(--cab-primary)] bg-slate-50'
          : 'border-[var(--cab-border)] hover:border-primary-100',
      )}
    >
      <span className="pt-0.5 md:pt-0">
        <Checkbox
          checked={checked}
          onChange={onToggle}
          aria-label={entry.designation ? `${entry.name} ${title}` : title}
        />
      </span>

      <span className="min-w-0">
        {entry.designation ? (
          <>
            <span className="flex flex-wrap items-center gap-2">
              <span dir="ltr" className="text-body font-bold text-[var(--cab-ink)]">
                {entry.name}
              </span>
              {entry.abbreviation && (
                <span dir="ltr" className="rounded-full bg-[var(--cab-chip)] px-2 py-0.5 text-caption font-bold text-[var(--cab-muted)] shadow-[inset_0_0_0_1px_var(--cab-border)]">
                  {entry.abbreviation}
                </span>
              )}
            </span>
            <span className="mt-1 block text-body-sm font-semibold leading-[1.5] text-[var(--cab-ink)]">{title}</span>
            {subtitle && <span className="block text-caption leading-[1.5] text-[var(--cab-muted)]">{subtitle}</span>}
          </>
        ) : (
          <span className="block text-body-sm font-bold leading-[1.5] text-[var(--cab-ink)]">{title}</span>
        )}
      </span>

      <span
        className={cn(
          'col-span-2 min-w-0 rounded-md border border-dashed border-[var(--cab-border)] bg-[var(--cab-panel)] px-3 py-2.5',
          'md:col-span-1',
        )}
      >
        <span className="block text-overline font-bold uppercase tracking-[0.06em] text-[var(--cab-muted)]">
          {t('cab.setup.schemes.cbRequirementLabel')}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <span dir="ltr" className="rounded-sm bg-white px-2 py-0.5 text-caption font-bold text-[var(--cab-muted)] shadow-[inset_0_0_0_1px_var(--cab-border)]">
            {base}
          </span>
          {entry.cbRequirement && (
            <>
              <span aria-hidden className="text-caption font-bold text-[var(--cab-muted)]">+</span>
              <span dir="ltr" className="rounded-sm bg-white px-2 py-0.5 text-caption font-bold text-[var(--cab-primary)] shadow-[inset_0_0_0_1px_var(--cab-primary)]">
                {entry.cbRequirement.code}
              </span>
            </>
          )}
        </span>
        {entry.cbRequirement ? (
          <span className="mt-1 block text-caption leading-[1.5] text-[var(--cab-muted)]">
            {t(cbRequirementTitleKey(entry.cbRequirement))}
          </span>
        ) : (
          entry.designation && (
            <span className="mt-1 block text-caption leading-[1.5] text-[var(--cab-muted)]">
              {t('cab.setup.schemes.noCbRequirement')}
            </span>
          )
        )}
      </span>
    </label>
  )
}

export function CabSchemesServicesStep({ form, onPatchSetup }: CabSetupStepProps) {
  const { t } = useTranslation()
  const { schemes, services, customSchemes, primaryServiceMarket, schemeOwner, activities } = form.cabSetup

  /** Catalog schemes for the CAB's activities, grouped by activity when there is more than one. */
  const groups = useMemo(() => {
    const entries = catalogForActivities(activities)
    const order = [...new Set(entries.map((entry) => entry.activity))]
    return order.map((activity) => ({
      activity,
      label: t(CAB_ACTIVITY_OPTIONS.find((option) => option.value === activity)?.labelKey ?? activity),
      entries: entries.filter((entry) => entry.activity === activity),
    }))
  }, [activities, t])
  const totalSchemes = groups.reduce((sum, group) => sum + group.entries.length, 0)
  const selectedCount = groups.reduce(
    (sum, group) => sum + group.entries.filter((entry) => schemes.includes(entry.id)).length,
    0,
  )

  const serviceOptions = useMemo(
    () => SERVICE_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )
  const marketOptions = useMemo(
    () => SERVICE_MARKET_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )

  const toggleScheme = (value: string) => {
    onPatchSetup({
      schemes: schemes.includes(value)
        ? schemes.filter((scheme) => scheme !== value)
        : [...schemes, value],
    })
  }

  const toggleService = (value: string) => {
    onPatchSetup({
      services: services.includes(value)
        ? services.filter((service) => service !== value)
        : [...services, value],
    })
  }

  const updateCustomScheme = (id: string, fields: Partial<CabCustomScheme>) => {
    onPatchSetup({
      customSchemes: customSchemes.map((scheme) =>
        scheme.id === id ? { ...scheme, ...fields } : scheme
      ),
    })
  }

  const addCustomScheme = () => onPatchSetup({ customSchemes: [...customSchemes, createCustomScheme()] })

  return (
    <div className="w-full space-y-6">
      <SetupSection>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-body font-bold text-[var(--cab-ink)]">{t('cab.setup.schemes.schemesLabel')}</p>
            <p className="mt-1 text-caption leading-[1.6] text-[var(--cab-muted)]">{t('cab.setup.schemes.schemesHint')}</p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-caption font-bold text-[var(--cab-primary)] shadow-[inset_0_0_0_1px_var(--cab-border)] tabular-nums">
            {t('cab.setup.schemes.selectedCount', { count: selectedCount, total: totalSchemes })}
          </span>
        </div>

        <div id="cab-setup-schemes" tabIndex={-1} className="space-y-5 outline-none">
          {groups.map((group) => (
            <div key={group.activity} className="space-y-2.5">
              {groups.length > 1 && (
                <p className="text-caption font-bold uppercase tracking-[0.06em] text-[var(--cab-muted)]">{group.label}</p>
              )}
              {group.entries.map((entry) => (
                <SchemeRow
                  key={entry.id}
                  entry={entry}
                  checked={schemes.includes(entry.id)}
                  onToggle={() => toggleScheme(entry.id)}
                />
              ))}
            </div>
          ))}
        </div>
      </SetupSection>

      <SetupSection>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-body font-bold text-[var(--cab-ink)]">{t('cab.setup.schemes.customSchemesLabel')}</p>
            <p className="mt-1 text-caption leading-[1.6] text-[var(--cab-muted)]">{t('cab.setup.schemes.customSchemesHint')}</p>
          </div>
          {customSchemes.length > 0 && (
            <button
              type="button"
              onClick={addCustomScheme}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--cab-border)] bg-white px-3 py-2 text-caption font-bold text-[var(--cab-primary)] hover:border-[var(--cab-primary)]"
            >
              <AppIcon icon={PlusIcon} size={14} />
              {t('cab.setup.schemes.addCustomSchemeShort')}
            </button>
          )}
        </div>

        {customSchemes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-[var(--cab-border)] bg-white px-4 py-6 text-center">
            <p className="text-body-sm text-[var(--cab-muted)]">{t('cab.setup.schemes.customSchemesEmpty')}</p>
            <button
              type="button"
              onClick={addCustomScheme}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--cab-primary)] px-4 py-2 text-body-sm font-bold text-[var(--cab-primary)] hover:bg-[var(--cab-subtle)]"
            >
              <AppIcon icon={PlusIcon} size={16} />
              {t('cab.setup.schemes.addCustomSchemeShort')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {customSchemes.map((scheme, index) => (
              <SetupRecordCard
                key={scheme.id}
                title={scheme.name.trim() || t('cab.setup.schemes.customSchemeTitle', { index: index + 1 })}
                removeLabel={t('common.delete')}
                onRemove={() =>
                  onPatchSetup({
                    customSchemes: customSchemes.filter((item) => item.id !== scheme.id),
                  })
                }
                className="bg-white"
              >
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <TextField
                    id={`cab-setup-custom-scheme-name-${scheme.id}`}
                    label={t('cab.setup.schemes.customSchemeName')}
                    required
                    type="text"
                    value={scheme.name}
                    placeholder={t('cab.setup.schemes.customSchemeNamePlaceholder')}
                    valueKind="mixed"
                    onChange={(event) => updateCustomScheme(scheme.id, { name: event.target.value })}
                  />
                  <TextField
                    id={`cab-setup-custom-scheme-owner-${scheme.id}`}
                    label={t('cab.setup.schemes.customSchemeOwner')}
                    type="text"
                    value={scheme.owner}
                    placeholder={t('cab.setup.schemes.customSchemeOwnerPlaceholder')}
                    valueKind="text"
                    onChange={(event) => updateCustomScheme(scheme.id, { owner: event.target.value })}
                  />
                  <TextField
                    id={`cab-setup-custom-scheme-doc-${scheme.id}`}
                    label={t('cab.setup.schemes.customSchemeDocument')}
                    type="text"
                    value={scheme.normativeDocument}
                    placeholder={t('cab.setup.schemes.customSchemeDocumentPlaceholder')}
                    onChange={(event) =>
                      updateCustomScheme(scheme.id, { normativeDocument: event.target.value })
                    }
                    valueKind="mixed"
                  />
                  <TextField
                    id={`cab-setup-custom-scheme-version-${scheme.id}`}
                    label={t('cab.setup.schemes.customSchemeVersion')}
                    type="text"
                    value={scheme.version}
                    placeholder={t('cab.setup.schemes.customSchemeVersionPlaceholder')}
                    valueKind="mixed"
                    onChange={(event) => updateCustomScheme(scheme.id, { version: event.target.value })}
                  />
                </div>
              </SetupRecordCard>
            ))}
          </div>
        )}
      </SetupSection>

      <SetupSection>
        <p className="text-body font-bold text-[var(--cab-ink)]">{t('cab.setup.schemes.servicesLabel')}</p>
        <p className="mb-3 mt-1 text-caption leading-[1.6] text-[var(--cab-muted)]">{t('cab.setup.schemes.servicesHint')}</p>
        <div id="cab-setup-services" tabIndex={-1} className="outline-none">
          <SetupChipGroup options={serviceOptions} selected={services} onToggle={toggleService} />
        </div>
      </SetupSection>

      <SetupSection title={t('cab.setup.schemes.marketTitle')}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <SearchableSelect
            id="cab-setup-service-market"
            label={t('cab.setup.schemes.primaryMarket')}
            value={primaryServiceMarket}
            onChange={(value) => onPatchSetup({ primaryServiceMarket: value })}
            options={marketOptions}
            placeholder={t('cab.setup.schemes.primaryMarketPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
          <TextField
            id="cab-setup-scheme-owner"
            label={t('cab.setup.schemes.schemeOwner')}
            type="text"
            value={schemeOwner}
            placeholder={t('cab.setup.schemes.schemeOwnerPlaceholder')}
            valueKind="text"
            onChange={(event) => onPatchSetup({ schemeOwner: event.target.value })}
          />
        </div>
      </SetupSection>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupSection, SetupToggleRow } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import { OPERATING_LANGUAGE_OPTIONS } from '@/lib/api/cabOnboardingApi'
import type { IaSetupStepProps } from '@/components/auth/ia/setup/types'

/** Clamp the site/department counts to a sane range for repeatable rows later. */
function toCount(raw: string): number {
  const parsed = Number(raw.replace(/\D/g, ''))
  return Math.min(Math.max(Number.isNaN(parsed) ? 1 : parsed, 1), 999)
}

export function IaStructureStep({ form, onPatch, onPatchSetup }: IaSetupStepProps) {
  const { t, i18n } = useTranslation()
  const setup = form.iaSetup

  const countries = useMemo(
    () =>
      getCountryOptions(i18n.language).map((country) => ({
        value: country.code,
        label: `${country.flag} ${country.name}`,
      })),
    [i18n.language]
  )

  const [governorates, setGovernorates] = useState<GovernorateOption[]>([])

  useEffect(() => {
    let cancelled = false
    const load = form.country
      ? fetchGovernorateOptions(form.country)
      : Promise.resolve<GovernorateOption[]>([])
    load.then((options) => {
      if (!cancelled) setGovernorates(options)
    })
    return () => {
      cancelled = true
    }
  }, [form.country])

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <SearchableSelect
          id="ia-setup-country"
          label={t('ia.setup.structure.headOfficeCountry')}
          required
          value={form.country}
          onChange={(country) => onPatch({ country: country as CountryCode, city: '' })}
          options={countries}
          placeholder={t('register.countryPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="ia-setup-city"
          label={t('ia.setup.structure.city')}
          required
          value={form.city}
          onChange={(city) => onPatch({ city })}
          options={governorates.map((g) => ({ value: g.id, label: g.name }))}
          placeholder={form.country ? t('register.governoratePlaceholder') : t('register.selectCountryFirst')}
          searchPlaceholder={t('common.search')}
        />
        <TextField
          id="ia-setup-address"
          label={t('ia.setup.structure.address')}
          type="text"
          value={form.address}
          placeholder={t('ia.setup.structure.addressPlaceholder')}
          onChange={(event) => onPatch({ address: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <TextField
          id="ia-setup-site-count"
          label={t('ia.setup.structure.siteCount')}
          required
          type="text"
          inputMode="numeric"
          value={String(setup.siteCount)}
          onChange={(event) => onPatchSetup({ siteCount: toCount(event.target.value) })}
        />
        <TextField
          id="ia-setup-department-count"
          label={t('ia.setup.structure.departmentCount')}
          required
          type="text"
          inputMode="numeric"
          value={String(setup.departmentCount)}
          onChange={(event) => onPatchSetup({ departmentCount: toCount(event.target.value) })}
        />

        <div className="space-y-2">
          <FormLabel>{t('ia.setup.structure.languages')}</FormLabel>
          <MultiSelect
            tags={form.languages}
            options={OPERATING_LANGUAGE_OPTIONS}
            onChange={(languages) => onPatch({ languages })}
            searchable
            placeholder={t('ia.setup.structure.languagesPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
        </div>
      </div>

      <SetupSection>
        <SetupToggleRow
          label={t('ia.setup.structure.singleManagementSystem')}
          checked={setup.singleManagementSystem}
          onChange={(singleManagementSystem) => onPatchSetup({ singleManagementSystem })}
        />
        <SetupToggleRow
          label={t('ia.setup.structure.includeRemoteFunctions')}
          checked={setup.includeRemoteFunctions}
          onChange={(includeRemoteFunctions) => onPatchSetup({ includeRemoteFunctions })}
        />
      </SetupSection>
    </div>
  )
}

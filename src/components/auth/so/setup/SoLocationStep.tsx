import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupSection, SetupToggleRow } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { SO_COVERAGE_OPTIONS, coverageNeedsCountries } from '@/lib/api/soSetupApi'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import { useIpLocation } from '@/hooks/useIpLocation'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import { getTimezoneForCountry, OPERATING_LANGUAGE_OPTIONS } from '@/lib/api/cabOnboardingApi'
import type { SoSetupStepProps } from '@/components/auth/so/setup/types'

export function SoLocationStep({ form, onPatch, onPatchSetup }: SoSetupStepProps) {
  const { t, i18n } = useTranslation()
  const setup = form.soSetup

  const countries = useMemo(
    () =>
      getCountryOptions(i18n.language).map((country) => ({
        value: country.code,
        label: `${country.flag} ${country.name}`,
      })),
    [i18n.language]
  )
  const coverageOptions = useMemo(
    () => SO_COVERAGE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  const [governorates, setGovernorates] = useState<GovernorateOption[]>([])
  const ipLocation = useIpLocation()

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

  // Pre-fill the head office country from the visitor's IP once it resolves,
  // but only if the user hasn't already picked one.
  useEffect(() => {
    if (!ipLocation || form.country) return
    const detected = ipLocation.countryCode as CountryCode
    if (!countries.some((country) => country.value === detected)) return
    onPatch({ country: detected })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipLocation, countries])

  // Once the IP-detected country's governorate list loads, try to match the
  // IP's city by name — best effort only, never overrides a manual pick.
  useEffect(() => {
    if (!ipLocation?.city || form.city || governorates.length === 0) return
    if (form.country !== ipLocation.countryCode) return
    const match = governorates.find(
      (governorate) => governorate.name.toLowerCase() === ipLocation.city?.toLowerCase()
    )
    if (match) onPatch({ city: match.id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipLocation, governorates])

  useEffect(() => {
    if (!form.country) return
    const derived = getTimezoneForCountry(form.country)
    if (derived && setup.timeZone !== derived) onPatchSetup({ timeZone: derived })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.country])

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <SearchableSelect
          id="so-setup-country"
          label={t('so.setup.location.country')}
          required
          value={form.country}
          onChange={(country) => onPatch({ country: country as CountryCode, city: '' })}
          options={countries}
          placeholder={t('register.countryPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="so-setup-city"
          label={t('so.setup.location.city')}
          required
          value={form.city}
          onChange={(city) => onPatch({ city })}
          options={governorates.map((g) => ({ value: g.id, label: g.name }))}
          placeholder={form.country ? t('register.governoratePlaceholder') : t('register.selectCountryFirst')}
          searchPlaceholder={t('common.search')}
        />
        <TextField
          id="so-setup-address"
          label={t('so.setup.location.address')}
          required
          type="text"
          value={form.address}
          placeholder={t('so.setup.location.addressPlaceholder')}
          onChange={(event) => onPatch({ address: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <SearchableSelect
          id="so-setup-coverage"
          label={t('so.setup.location.coverage')}
          required
          value={setup.coverage}
          onChange={(coverage) => onPatchSetup({ coverage, coverageCountries: [] })}
          options={coverageOptions}
          placeholder={t('so.setup.location.coveragePlaceholder')}
          searchPlaceholder={t('common.search')}
        />

        <div className="space-y-2">
          <FormLabel>{t('so.setup.location.languages')}</FormLabel>
          <MultiSelect
            tags={form.languages}
            options={OPERATING_LANGUAGE_OPTIONS}
            onChange={(languages) => onPatch({ languages })}
            searchable
            placeholder={t('so.setup.location.languagesPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
        </div>

        <TextField
          id="so-setup-timezone"
          label={t('so.setup.location.timeZone')}
          type="text"
          value={setup.timeZone}
          placeholder={t('so.setup.location.timeZonePlaceholder')}
          onChange={(event) => onPatchSetup({ timeZone: event.target.value })}
        />
      </div>

      {/* Regional and international schemes must name the markets they cover. */}
      {coverageNeedsCountries(setup.coverage) && (
        <div className="space-y-2">
          <FormLabel required>{t('so.setup.location.coverageCountries')}</FormLabel>
          <MultiSelect
            tags={setup.coverageCountries}
            options={countries}
            onChange={(coverageCountries) => onPatchSetup({ coverageCountries })}
            layout="stacked"
            searchable
            placeholder={t('so.setup.location.coverageCountriesPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
        </div>
      )}

      <SetupSection>
        <SetupToggleRow
          label={t('so.setup.location.hasRegionalOffices')}
          checked={setup.hasRegionalOffices}
          onChange={(hasRegionalOffices) => onPatchSetup({ hasRegionalOffices })}
        />
        <SetupToggleRow
          label={t('so.setup.location.offeredCrossBorder')}
          checked={setup.offeredCrossBorder}
          onChange={(offeredCrossBorder) => onPatchSetup({ offeredCrossBorder })}
        />
      </SetupSection>
    </div>
  )
}

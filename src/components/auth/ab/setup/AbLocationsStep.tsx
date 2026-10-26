import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox, FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import {
  SetupAddLink,
  SetupRecordCard,
  SetupSection,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  AB_JURISDICTION_OPTIONS,
  AB_LIFECYCLE_OPTIONS,
  AB_OFFICE_TYPE_OPTIONS,
} from '@/lib/api/abSetupApi'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import { useIpLocation } from '@/hooks/useIpLocation'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import { getTimezoneForCountry, OPERATING_LANGUAGE_OPTIONS } from '@/lib/api/cabOnboardingApi'
import { createAbOffice, type AbOfficeRecord } from '@/lib/abSetupForm'
import type { AbSetupStepProps } from '@/components/auth/ab/setup/types'

function useGovernorates(country: CountryCode | '') {
  const [governorates, setGovernorates] = useState<GovernorateOption[]>([])

  useEffect(() => {
    let cancelled = false
    const load = country ? fetchGovernorateOptions(country) : Promise.resolve<GovernorateOption[]>([])
    load.then((options) => {
      if (!cancelled) setGovernorates(options)
    })
    return () => {
      cancelled = true
    }
  }, [country])

  return governorates
}

function OfficeRow({
  index,
  office,
  countries,
  onChange,
  onRemove,
}: {
  index: number
  office: AbOfficeRecord
  countries: { value: string; label: string }[]
  onChange: (fields: Partial<AbOfficeRecord>) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const governorates = useGovernorates(office.country)

  const typeOptions = useMemo(
    () => AB_OFFICE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const activityOptions = useMemo(
    () => AB_LIFECYCLE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  return (
    <SetupRecordCard
      title={t('ab.setup.locations.officeTitle', { index: index + 1 })}
      onRemove={onRemove}
      removeLabel={t('common.delete')}
    >
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id={`ab-setup-office-name-${office.id}`}
          label={t('ab.setup.locations.officeName')}
          required
          type="text"
          value={office.name}
          placeholder={t('ab.setup.locations.officeNamePlaceholder')}
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <SearchableSelect
          id={`ab-setup-office-type-${office.id}`}
          label={t('ab.setup.locations.officeType')}
          required
          value={office.type}
          onChange={(type) => onChange({ type })}
          options={typeOptions}
          placeholder={t('ab.setup.locations.officeTypePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id={`ab-setup-office-country-${office.id}`}
          label={t('ab.setup.locations.country')}
          required
          value={office.country}
          onChange={(country) => onChange({ country: country as CountryCode, city: '' })}
          options={countries}
          placeholder={t('register.countryPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id={`ab-setup-office-city-${office.id}`}
          label={t('ab.setup.locations.city')}
          required
          value={office.city}
          onChange={(city) => onChange({ city })}
          options={governorates.map((g) => ({ value: g.id, label: g.name }))}
          placeholder={office.country ? t('register.governoratePlaceholder') : t('register.selectCountryFirst')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <TextField
        id={`ab-setup-office-address-${office.id}`}
        label={t('ab.setup.locations.address')}
        type="text"
        value={office.address}
        placeholder={t('ab.setup.locations.addressPlaceholder')}
        onChange={(event) => onChange({ address: event.target.value })}
      />

      <div className="space-y-2">
        <FormLabel>{t('ab.setup.locations.officeActivities')}</FormLabel>
        <MultiSelect
          tags={office.activities}
          options={activityOptions}
          onChange={(activities) => onChange({ activities })}
          layout="stacked"
          searchable
          placeholder={t('ab.setup.locations.officeActivitiesPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>
    </SetupRecordCard>
  )
}

export function AbLocationsStep({ form, onPatch, onPatchSetup }: AbSetupStepProps) {
  const { t, i18n } = useTranslation()
  const setup = form.abSetup

  const countries = useMemo(
    () =>
      getCountryOptions(i18n.language).map((country) => ({
        value: country.code,
        label: `${country.flag} ${country.name}`,
      })),
    [i18n.language]
  )
  const governorates = useGovernorates(form.country)
  const jurisdictionOptions = useMemo(
    () => AB_JURISDICTION_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const ipLocation = useIpLocation()

  useEffect(() => {
    if (!form.country) return
    const derived = getTimezoneForCountry(form.country)
    if (derived && setup.timeZone !== derived) onPatchSetup({ timeZone: derived })
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const updateOffice = (id: string, fields: Partial<AbOfficeRecord>) => {
    onPatchSetup({
      offices: setup.offices.map((office) => (office.id === id ? { ...office, ...fields } : office)),
    })
  }

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <SearchableSelect
          id="ab-setup-country"
          label={t('ab.setup.locations.headOfficeCountry')}
          required
          value={form.country}
          onChange={(country) => onPatch({ country: country as CountryCode, city: '' })}
          options={countries}
          placeholder={t('register.countryPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="ab-setup-city"
          label={t('ab.setup.locations.city')}
          required
          value={form.city}
          onChange={(city) => onPatch({ city })}
          options={governorates.map((g) => ({ value: g.id, label: g.name }))}
          placeholder={form.country ? t('register.governoratePlaceholder') : t('register.selectCountryFirst')}
          searchPlaceholder={t('common.search')}
        />
        <TextField
          id="ab-setup-address"
          label={t('ab.setup.locations.mainOfficeAddress')}
          required
          type="text"
          value={form.address}
          placeholder={t('ab.setup.locations.addressPlaceholder')}
          onChange={(event) => onPatch({ address: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <TextField
          id="ab-setup-timezone"
          label={t('ab.setup.locations.timeZone')}
          required
          type="text"
          value={setup.timeZone}
          placeholder={t('ab.setup.locations.timeZonePlaceholder')}
          onChange={(event) => onPatchSetup({ timeZone: event.target.value })}
        />

        <div className="space-y-2">
          <FormLabel required>{t('ab.setup.locations.languages')}</FormLabel>
          <MultiSelect
            tags={form.languages}
            options={OPERATING_LANGUAGE_OPTIONS}
            onChange={(languages) => onPatch({ languages })}
            searchable
            placeholder={t('ab.setup.locations.languagesPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
        </div>

        <SearchableSelect
          id="ab-setup-jurisdiction"
          label={t('ab.setup.locations.jurisdiction')}
          value={setup.jurisdiction}
          onChange={(jurisdiction) => onPatchSetup({ jurisdiction })}
          options={jurisdictionOptions}
          placeholder={t('ab.setup.locations.jurisdictionPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <SetupSection>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            checked={setup.hasAdditionalOffices}
            onChange={() => {
              const next = !setup.hasAdditionalOffices
              onPatchSetup({
                hasAdditionalOffices: next,
                offices: next && setup.offices.length === 0 ? [createAbOffice()] : setup.offices,
              })
            }}
            aria-label={t('ab.setup.locations.hasAdditional')}
          />
          <span className="text-body-sm text-[var(--cab-ink)]">
            {t('ab.setup.locations.hasAdditional')}
          </span>
        </label>

        {setup.hasAdditionalOffices && (
          <div className="mt-4 space-y-4">
            {setup.offices.map((office, index) => (
              <OfficeRow
                key={office.id}
                index={index}
                office={office}
                countries={countries}
                onChange={(fields) => updateOffice(office.id, fields)}
                onRemove={() =>
                  onPatchSetup({ offices: setup.offices.filter((item) => item.id !== office.id) })
                }
              />
            ))}
            <SetupAddLink
              label={t('ab.setup.locations.addOffice')}
              onClick={() => onPatchSetup({ offices: [...setup.offices, createAbOffice()] })}
            />
          </div>
        )}
      </SetupSection>
    </div>
  )
}

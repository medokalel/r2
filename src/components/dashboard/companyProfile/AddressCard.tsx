import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { CountrySelectField } from '@/components/dashboard/CountrySelectField'
import { FormField, TextField } from '@/components/ui'
import { useFieldValidation } from '@/hooks/useFieldValidation'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import type { CountryCode } from '@/lib/countries'
import { GoogleMapUrlField } from './GoogleMapUrlField'
import { profileCardClassName } from './constants'
import { CardHeader } from './Primitives'
import { useProfileForm } from './ProfileFormContext'
import { addressRules } from './validation'

interface AddressCardProps {
  onGoogleMapUrlChange: (value: string) => void
}

export function AddressCard({ onGoogleMapUrlChange }: AddressCardProps) {
  const { t } = useTranslation()
  const { form, update, saveDraft, saving } = useProfileForm()
  const { fieldProps } = useFieldValidation(form, addressRules(t))
  const [loadedGovernorates, setLoadedGovernorates] = useState<{
    country: CountryCode
    options: GovernorateOption[]
  } | null>(null)

  // City options follow the selected country
  useEffect(() => {
    const country = form.country
    if (!country) return
    let cancelled = false
    fetchGovernorateOptions(country)
      .then((options) => {
        if (!cancelled) setLoadedGovernorates({ country, options })
      })
      .catch(() => {
        if (!cancelled) setLoadedGovernorates({ country, options: [] })
      })
    return () => {
      cancelled = true
    }
  }, [form.country])

  const governorates = useMemo(
    () =>
      form.country && loadedGovernorates?.country === form.country
        ? loadedGovernorates.options
        : [],
    [form.country, loadedGovernorates]
  )

  const onCountryChange = (code: CountryCode) => {
    if (code === form.country) return
    update('country', code)
    update('city', '')
  }

  const cityOptions = useMemo(() => {
    const names = governorates.map((governorate) => governorate.name)
    return form.city && !names.includes(form.city) ? [form.city, ...names] : names
  }, [governorates, form.city])

  return (
    <div className={profileCardClassName}>
      <CardHeader title={t('companyProfile.addressCard.title')} />

      <div className="flex flex-col gap-5">
        {/* Row 1: Country | City */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.addressCard.countryLabel')} required>
            <CountrySelectField value={form.country} onChange={onCountryChange} />
          </FormField>
          <FormField label={t('companyProfile.addressCard.cityLabel')} required>
            {cityOptions.length > 0 ? (
              <SearchableSelect
                value={form.city}
                options={cityOptions.map((name) => ({ value: name, label: name }))}
                onChange={(value) => update('city', value)}
                placeholder={t('companyProfile.addressCard.cityPlaceholder')}
                searchPlaceholder={t('common.search', 'Search...')}
              />
            ) : (
              <TextField
                type="text"
                placeholder={t('companyProfile.addressCard.cityPlaceholder')}
                value={form.city}
                valueKind="mixed"
                onChange={(e) => update('city', e.target.value)}
                {...fieldProps('city')}
              />
            )}
          </FormField>
        </div>

        {/* Row 2: Neighborhood | Street */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.addressCard.neighborhoodLabel')} required>
            <TextField
              type="text"
              placeholder={t('companyProfile.addressCard.neighborhoodPlaceholder')}
              value={form.district}
              valueKind="mixed"
              onChange={(e) => update('district', e.target.value)}
              {...fieldProps('district')}
            />
          </FormField>
          <FormField label={t('companyProfile.addressCard.streetLabel')} required>
            <TextField
              type="text"
              placeholder={t('companyProfile.addressCard.streetPlaceholder')}
              value={form.street}
              valueKind="mixed"
              onChange={(e) => update('street', e.target.value)}
              {...fieldProps('street')}
            />
          </FormField>
        </div>

        {/* Row 3: Building | Sub Number | Postal Code */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FormField label={t('companyProfile.addressCard.buildingLabel')} required>
            <TextField
              type="text"
              placeholder={t('companyProfile.addressCard.buildingPlaceholder')}
              value={form.buildingNumber}
              valueKind="mixed"
              onChange={(e) => update('buildingNumber', e.target.value)}
              {...fieldProps('buildingNumber')}
            />
          </FormField>
          <FormField label={t('companyProfile.addressCard.subNumberLabel')}>
            <TextField
              type="text"
              placeholder={t('companyProfile.addressCard.subNumberPlaceholder')}
              value={form.additionalNumber}
              valueKind="mixed"
              onChange={(e) => update('additionalNumber', e.target.value)}
              {...fieldProps('additionalNumber')}
            />
          </FormField>
          <FormField label={t('companyProfile.addressCard.postalCodeLabel')} required>
            <TextField
              type="text"
              dir="ltr"
              placeholder={t('companyProfile.addressCard.postalCodePlaceholder')}
              value={form.postalCode}
              valueKind="mixed"
              onChange={(e) => update('postalCode', e.target.value)}
              {...fieldProps('postalCode')}
            />
          </FormField>
        </div>

        {/* Row 4: Google Map link */}
        <GoogleMapUrlField
          label={t('companyProfile.addressCard.googleMapLabel')}
          placeholder={t('companyProfile.addressCard.googleMapPlaceholder')}
          value={form.googleMapUrl}
          onChange={onGoogleMapUrlChange}
          {...fieldProps('googleMapUrl')}
        />

        <Button variant="primary" size="lg" className="w-full" onClick={saveDraft} disabled={saving}>
          {saving ? t('common.loading') : t('companyProfile.addressCard.saveButton')}
        </Button>
      </div>
    </div>
  )
}

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneInputRow, type CountryCode } from '@/components/auth/CountryCodeSelect'
import { FormField, RadioGroup, MultiSelect, TextField } from '@/components/ui'
import { useFieldValidation } from '@/hooks/useFieldValidation'
import { LocationPicker, type LatLng } from '@/components/maps/LocationPicker'
import { cn } from '@/lib/utils'
import { getLocalizedBranchSectorOptions } from './constants'
import { GoogleMapUrlField } from './GoogleMapUrlField'
import { googleMapsUrlFor, parseLatLngFromGoogleMapsUrl } from './mappers'
import type { BranchFormValues } from './types'
import { branchRules } from './validation'

interface BranchFormFieldsProps {
  form: BranchFormValues
  set: <K extends keyof BranchFormValues>(key: K, value: BranchFormValues[K]) => void
  countryCode: CountryCode
  mapClassName?: string
  /** 'radio' matches the inline add form, 'pills' matches the edit dialog design */
  branchTypeVariant?: 'radio' | 'pills'
}

function BranchTypePills({
  value,
  onChange,
}: {
  value: BranchFormValues['branchType']
  onChange: (value: BranchFormValues['branchType']) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-4">
      {(['permanent', 'temporary'] as const).map((option) => {
        const active = value === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              'flex h-[52px] items-center gap-3 rounded-full px-6 py-3 transition-colors',
              active
                ? 'border border-primary bg-primary-25'
                : 'border border-neutral-50 bg-neutral-25 hover:border-primary/40'
            )}
          >
            <span className={cn('text-body leading-[1.6]', active ? 'text-primary' : 'text-neutral-700')}>
              {t(`companyProfile.addBranch.${option}`)}
            </span>
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                active ? 'border-primary bg-primary' : 'border-neutral-100 bg-white'
              )}
            >
              {active && <span className="size-2 rounded-full bg-white" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function BranchFormFields({
  form,
  set,
  countryCode,
  mapClassName = 'h-[200px] w-full',
  branchTypeVariant = 'radio',
}: BranchFormFieldsProps) {
  const { t } = useTranslation()
  const { fieldProps } = useFieldValidation(form, branchRules(t, countryCode))
  const branchSectorOptions = useMemo(() => getLocalizedBranchSectorOptions(t), [t])

  const onGoogleMapUrlChange = (value: string) => {
    set('googleMapUrl', value)
    // Reflect a pasted Google Maps link on the branch map
    const location = parseLatLngFromGoogleMapsUrl(value)
    if (location) set('location', location)
  }

  const onLocationChange = (location: LatLng | null) => {
    set('location', location)
    if (location) set('googleMapUrl', googleMapsUrlFor(location))
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField label={t('companyProfile.addBranch.branchNameLabel')} required>
          <TextField
            type="text"
            placeholder={t('companyProfile.addBranch.branchNamePlaceholder')}
            value={form.branchName}
            valueKind="mixed"
            onChange={(e) => set('branchName', e.target.value)}
            {...fieldProps('branchName')}
          />
        </FormField>
        <FormField label={t('companyProfile.addBranch.registryLabel')} required>
          <TextField
            type="text"
            dir="ltr"
            placeholder={t('companyProfile.addBranch.registryPlaceholder')}
            value={form.commercialRegisterNumber}
            valueKind="mixed"
            onChange={(e) => set('commercialRegisterNumber', e.target.value)}
            {...fieldProps('commercialRegisterNumber')}
          />
        </FormField>
      </div>

      <FormField label={t('companyProfile.addBranch.addressLabel')} required>
        <TextField
          type="text"
          placeholder={t('companyProfile.addBranch.addressPlaceholder')}
          value={form.address}
          valueKind="mixed"
          onChange={(e) => set('address', e.target.value)}
          {...fieldProps('address')}
        />
      </FormField>

      <GoogleMapUrlField
        label={t('companyProfile.addBranch.googleMapLabel')}
        placeholder={t('companyProfile.addBranch.googleMapPlaceholder')}
        value={form.googleMapUrl}
        onChange={onGoogleMapUrlChange}
        required
        {...fieldProps('googleMapUrl')}
      />

      <LocationPicker
        value={form.location}
        onChange={onLocationChange}
        className={mapClassName}
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField label={t('companyProfile.addBranch.managerLabel')} required>
          <TextField
            type="text"
            placeholder={t('companyProfile.addBranch.managerPlaceholder')}
            value={form.branchManagerName}
            valueKind="text"
            onChange={(e) => set('branchManagerName', e.target.value)}
            {...fieldProps('branchManagerName')}
          />
        </FormField>
        <FormField label={t('companyProfile.addBranch.phoneLabel')} required>
          <PhoneInputRow
            rowClassName="items-center gap-2"
            value={countryCode}
            onChange={(code) => set('countryCode', code)}
            aria-label={t('companyProfile.addBranch.phoneLabel')}
            className="h-12 rounded-md border border-neutral-300"
          >
            <TextField
              type="tel"
              dir="ltr"
              placeholder={t('companyProfile.basicDataCard.phonePlaceholder')}
              className="flex-1"
              value={form.phoneNumber}
              onChange={(e) => set('phoneNumber', e.target.value)}
              {...fieldProps('phoneNumber')}
            />
          </PhoneInputRow>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField label={t('companyProfile.addBranch.sectorLabel')} required>
          <MultiSelect
            tags={form.sectors}
            options={branchSectorOptions}
            onChange={(tags) => set('sectors', tags)}
          />
        </FormField>
        <FormField label={t('companyProfile.addBranch.employeesLabel')} required>
          <TextField
            type="text"
            dir="ltr"
            valueKind="number"
            maxLength={9}
            placeholder={t('companyProfile.addBranch.employeesPlaceholder')}
            value={form.employeeCount}
            onChange={(e) => set('employeeCount', e.target.value)}
            {...fieldProps('employeeCount')}
          />
        </FormField>
      </div>

      <FormField label={t('companyProfile.addBranch.branchTypeLabel')} required>
        {branchTypeVariant === 'pills' ? (
          <BranchTypePills
            value={form.branchType}
            onChange={(value) => set('branchType', value)}
          />
        ) : (
          <RadioGroup
            name="branchType"
            value={form.branchType}
            onChange={(value) => set('branchType', value as 'permanent' | 'temporary')}
            options={[
              { value: 'permanent', label: t('companyProfile.addBranch.permanent') },
              { value: 'temporary', label: t('companyProfile.addBranch.temporary') },
            ]}
          />
        )}
      </FormField>
    </>
  )
}

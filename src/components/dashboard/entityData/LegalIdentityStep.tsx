import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MailIcon, PhoneIcon, ExternalLinkArrowIcon } from '@/components/icons'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { useFieldValidation } from '@/hooks/useFieldValidation'
import { isValidEmailFormat, isValidWebsite, isValidPhoneNumber } from '@/lib/validators'
import type { CountryCode } from '@/lib/countries'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import {
  FormField,
  FormSection,
  RadioGroup,
  MultiSelect,
  TextField,
  Textarea,
} from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { CountrySelectField } from '@/components/dashboard/CountrySelectField'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { useApplicationForm } from '@/components/dashboard/entityData/ApplicationFormContext'
import {
  standards as allStandards,
  type StandardKey,
} from '@/components/dashboard/entityData/fieldTypes'

interface LegalIdentityStepProps {
  selectedStandards?: StandardKey[]
  onSelectedStandardsChange?: (standards: StandardKey[]) => void
}

export function LegalIdentityStep({
  selectedStandards,
  onSelectedStandardsChange,
}: LegalIdentityStepProps) {
  const { t } = useTranslation()
  const { form, update } = useApplicationForm()

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

  const onCountryChange = (country: CountryCode) => {
    if (country === form.country) return
    update('country', country)
    update('city', '')
  }

  const cityOptions = useMemo(() => {
    const names = governorates.map((governorate) => governorate.name)
    return form.city && !names.includes(form.city) ? [form.city, ...names] : names
  }, [governorates, form.city])

  const { fieldProps } = useFieldValidation(form, {
    email: (value) => (!isValidEmailFormat(value) ? t('validation.invalidEmail') : undefined),
    website: (value) => (!isValidWebsite(value) ? t('validation.invalidWebsite') : undefined),
    mobileNumber: (value) =>
      !isValidPhoneNumber(value, form.mobileCountryCode) ? t('validation.invalidMobile') : undefined,
  })

  const standardKeys = selectedStandards ?? form.selectedStandards
  const setStandardKeys =
    onSelectedStandardsChange ??
    ((standards: StandardKey[]) => update('selectedStandards', standards))

  // Standards covered by IAF MD 17:2023 (sections 5, 6 and 7)
  const standardLabel = (key: StandardKey) =>
    t(`accreditation.entityData.field.standardsFull.${key}`)
  const otherOptionLabel = t('accreditation.form.otherStandardOption')
  const standardOptions = [...allStandards.map(standardLabel), otherOptionLabel]
  const standardTags = [
    ...standardKeys.map(standardLabel),
    ...(form.otherStandardSelected ? [otherOptionLabel] : []),
  ]

  const onStandardTagsChange = (labels: string[]) => {
    setStandardKeys(allStandards.filter((key) => labels.includes(standardLabel(key))))
    const otherSelected = labels.includes(otherOptionLabel)
    update('otherStandardSelected', otherSelected)
    // Clear the free-text field once "Other" is deselected so stale text
    // can't be sent if the user re-picks it later without noticing.
    if (!otherSelected) update('otherStandard', '')
  }

  const yesNoOptions = [
    { value: 'yes', label: t('accreditation.form.yes') },
    { value: 'no', label: t('accreditation.form.no') },
  ]

  const orgTypeOptions = [
    { value: 'government', label: t('accreditation.form.governmentSector') },
    { value: 'private', label: t('accreditation.form.privateSector') },
    { value: 'thirdParty', label: t('accreditation.form.thirdParty') },
  ]

  return (
    <div className="flex-1 space-y-5">
      <DashboardTourStep stepId="legal-identity-main-data">
        <SectionHeading title={t('accreditation.form.mainData')} accordion>
        <div className="space-y-5">
          <FormField label={t('accreditation.form.requiredStandard')} required>
            <MultiSelect
              tags={standardTags}
              options={standardOptions}
              onChange={onStandardTagsChange}
            />
          </FormField>

          {form.otherStandardSelected && (
            <FormField label={t('accreditation.form.otherStandard')} required>
              {/* Saved as legalInfo.otherStandard (max 200 characters). */}
              <TextField
                type="text"
                maxLength={200}
                value={form.otherStandard}
                onChange={(e) => update('otherStandard', e.target.value)}
              />
            </FormField>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('accreditation.form.organizationName')} required>
              <TextField
                type="text"
                value={form.organizationName}
                onChange={(e) => update('organizationName', e.target.value)}
              />
            </FormField>

            <FormField label={t('accreditation.form.website')}>
              <div className="relative">
                <TextField
                  type="url"
                  value={form.website}
                  onChange={(e) => update('website', e.target.value)}
                  className="pe-10"
                  {...fieldProps('website')}
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-primary" aria-hidden>
                  <ExternalLinkArrowIcon size={16} />
                </span>
              </div>
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('accreditation.form.headOfficeAddress')} required>
              <Textarea
                value={form.headOfficeAddress}
                onChange={(e) => update('headOfficeAddress', e.target.value)}
                rows={3}
                className="min-h-[60px]"
              />
            </FormField>

            <FormField label={t('accreditation.form.auditPlaceAddress')} required>
              <Textarea
                value={form.auditSiteAddress}
                onChange={(e) => update('auditSiteAddress', e.target.value)}
                rows={3}
                className="min-h-[60px]"
              />
            </FormField>
          </div>
        
          <FormField label={t('accreditation.form.commercialRegistrationNo')} required>
            <TextField
              type="text"
              inputMode="numeric"
              value={form.commercialRegisterNumber}
              onChange={(e) => update('commercialRegisterNumber', e.target.value)}
            />
          </FormField>
        
          <div className="grid gap-5 lg:grid-cols-2">

            <FormField label={t('accreditation.form.productionLinesActive')} required variant="question">
              <RadioGroup
                name="productionActive"
                value={form.allProductionLinesIncluded}
                onChange={(v) => {
                  update('allProductionLinesIncluded', v as '' | 'yes' | 'no')
                  // The reason only applies when the answer is "no"
                  if (v === 'yes') update('excludedReason', '')
                }}
                options={yesNoOptions}
              />
            </FormField>

            {form.allProductionLinesIncluded === 'no' && (
              <FormField label={t('accreditation.form.ifNoStateWhy')} required>
                <TextField
                  type="text"
                  value={form.excludedReason}
                  onChange={(e) => update('excludedReason', e.target.value)}
                />
              </FormField>
            )}
          </div>
        </div>
      </SectionHeading>
      </DashboardTourStep>

      <DashboardTourStep stepId="legal-identity-regulatory-data">
        <SectionHeading title={t('accreditation.form.regulatoryData')} accordion>
        <FormSection>
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('accreditation.form.email')}>
              <TextField
                type="email"
                icon={MailIcon}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                {...fieldProps('email')}
              />
            </FormField>

            <FormField label={t('accreditation.form.country')} required>
              <CountrySelectField value={form.country} onChange={onCountryChange} />
            </FormField>
          </div>

          <FormField label={t('accreditation.form.city')} required>
            {cityOptions.length > 0 ? (
              <SearchableSelect
                value={form.city}
                options={cityOptions.map((name) => ({ value: name, label: name }))}
                onChange={(value) => update('city', value)}
                searchPlaceholder={t('common.search')}
              />
            ) : (
              <TextField
                type="text"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
              />
            )}
          </FormField>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('accreditation.form.representativeName')} required>
              <TextField
                type="text"
                value={form.representativeName}
                onChange={(e) => update('representativeName', e.target.value)}
              />
            </FormField>

            <FormField label={t('accreditation.form.representativeTitle')} required>
              <TextField
                type="text"
                value={form.jobTitle}
                onChange={(e) => update('jobTitle', e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('accreditation.form.mobileNumber')}>
              <PhoneInputRow
                rowClassName="gap-3"
                value={form.mobileCountryCode}
                onChange={(code: CountryCode) => update('mobileCountryCode', code)}
                aria-label={t('accreditation.form.mobileNumber')}
              >
                <div className="min-w-0 flex-1">
                  <TextField
                    type="tel"
                    icon={PhoneIcon}
                    value={form.mobileNumber}
                    onChange={(e) => update('mobileNumber', e.target.value)}
                    {...fieldProps('mobileNumber')}
                  />
                </div>
              </PhoneInputRow>
            </FormField>

            <FormField label={t('accreditation.form.organizationType')}>
              <RadioGroup
                name="orgType"
                value={form.organizationNature}
                onChange={(v) => update('organizationNature', v)}
                options={orgTypeOptions}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('accreditation.form.mainActivity')} required>
              <TextField
                type="text"
                value={form.mainActivity}
                onChange={(e) => update('mainActivity', e.target.value)}
              />
            </FormField>

            <FormField label={t('accreditation.form.requestType')} required>
              <TextField
                type="text"
                readOnly
                value={t('accreditation.form.newGranted')}
                className="cursor-not-allowed bg-neutral-100 text-neutral-900"
              />
            </FormField>
          </div>
        </FormSection>
      </SectionHeading>
      </DashboardTourStep>
    </div>
  )
}
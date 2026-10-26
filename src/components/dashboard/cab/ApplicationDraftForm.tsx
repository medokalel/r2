import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField, SelectField, TextField, Textarea } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { DatePicker } from '@/components/ui/DatePicker'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { AppIcon, BuildingsIcon } from '@/components/icons'
import { useFieldValidation } from '@/hooks/useFieldValidation'
import { isValidEmailFormat, isValidPhoneNumber } from '@/lib/validators'
import type { CountryCode } from '@/lib/countries'
import {
  APPLICATION_TYPE_OPTIONS,
  STANDARD_OPTIONS,
  APPLICABLE_SCHEME_OPTIONS,
  ACCREDITATION_BODY_OPTIONS,
  AUDIT_LANGUAGE_OPTIONS,
  getDraftClientSummary,
  type DraftClientSummary,
} from '@/lib/api/applicationDraftApi'
import type { ApplicationDraftForm as ApplicationDraftFormData } from '@/lib/applicationDraftForm'

interface ApplicationDraftFormProps {
  form: ApplicationDraftFormData
  onPatch: (f: Partial<ApplicationDraftFormData>) => void
  onViewClientDetails?: () => void
}

export function ApplicationDraftForm({ form, onPatch, onViewClientDetails }: ApplicationDraftFormProps) {
  const { t } = useTranslation()
  const [client, setClient] = useState<DraftClientSummary | null>(null)

  useEffect(() => {
    let cancelled = false
    getDraftClientSummary().then((c) => {
      if (!cancelled) setClient(c)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const { fieldProps } = useFieldValidation(form, {
    billingEmail: (value) =>
      value && !isValidEmailFormat(value) ? t('validation.invalidEmail') : undefined,
    billingMobile: (value) =>
      value && !isValidPhoneNumber(value, form.billingMobileCountryCode)
        ? t('validation.invalidMobile')
        : undefined,
  })

  return (
    <div className="flex-1 space-y-5">
      <SectionHeading
        title={t('cab.applicationDraft.sections.clientInformation')}
        accordion
        headerActions={
          <button
            type="button"
            onClick={onViewClientDetails}
            className="text-[14px] font-semibold text-primary underline underline-offset-2"
          >
            {t('cab.applicationDraft.viewClientDetails')}
          </button>
        }
      >
        {client ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-neutral-200 bg-white">
                <AppIcon icon={BuildingsIcon} size={26} className="text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-[17px] font-semibold text-neutral-900">{client.legalEntityName}</p>
                {client.isRegistered && (
                  <span className="inline-flex items-center rounded-[6px] bg-success-25 px-2 py-0.5 text-[12px] font-medium text-success-600">
                    {t('cab.applicationDraft.registeredClient')}
                  </span>
                )}
              </div>
              <div className="ms-auto text-end">
                <p className="text-[13px] text-neutral-500">{t('cab.applicationDraft.clientId')}</p>
                <p className="text-[14px] font-medium text-neutral-900">{client.clientId}</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label={t('cab.applicationDraft.fields.tradingName')}>
                <TextField type="text" value={client.tradingName} disabled />
              </FormField>
              <FormField label={t('cab.applicationDraft.fields.organizationType')}>
                <TextField type="text" value={client.organizationType} disabled />
              </FormField>
              <FormField label={t('cab.applicationDraft.fields.country')}>
                <TextField type="text" value={client.country} disabled />
              </FormField>
              <FormField label={t('cab.applicationDraft.fields.registrationNumber')}>
                <TextField type="text" value={client.registrationNumber} disabled />
              </FormField>
            </div>
          </div>
        ) : (
          <div className="h-24 animate-pulse rounded-[var(--radius-sm)] bg-neutral-100" />
        )}
      </SectionHeading>

      <SectionHeading title={t('cab.applicationDraft.sections.applicationDetails')} accordion>
        <div className="grid gap-5 lg:grid-cols-3">
          <FormField label={t('cab.applicationDraft.fields.applicationType')} required>
            <SelectField
              value={form.applicationType}
              onChange={(value) => onPatch({ applicationType: value })}
              options={APPLICATION_TYPE_OPTIONS}
              placeholder={t('cab.applicationDraft.fields.applicationTypePlaceholder')}
            />
          </FormField>
          <FormField label={t('cab.applicationDraft.fields.primaryStandard')} required>
            <SelectField
              value={form.primaryStandard}
              onChange={(value) => onPatch({ primaryStandard: value })}
              options={STANDARD_OPTIONS}
              placeholder={t('cab.applicationDraft.fields.primaryStandardPlaceholder')}
            />
          </FormField>
          <FormField label={t('cab.applicationDraft.fields.applicationDate')} required>
            <DatePicker
              value={form.applicationDate}
              onChange={(date) => onPatch({ applicationDate: date })}
            />
          </FormField>

          <FormField label={t('cab.applicationDraft.fields.certificationBody')}>
            <TextField
              type="text"
              value={form.certificationBody}
              onChange={(e) => onPatch({ certificationBody: e.target.value })}
              placeholder={t('cab.applicationDraft.fields.certificationBodyPlaceholder')}
            />
          </FormField>
          <FormField label={t('cab.applicationDraft.fields.additionalStandards')}>
            <MultiSelect
              tags={form.additionalStandards}
              options={STANDARD_OPTIONS}
              onChange={(tags) => onPatch({ additionalStandards: tags })}
              placeholder={t('cab.applicationDraft.fields.additionalStandardsPlaceholder')}
            />
          </FormField>
          <FormField label={t('cab.applicationDraft.fields.requestedAuditDate')}>
            <DatePicker
              value={form.requestedAuditDate}
              onChange={(date) => onPatch({ requestedAuditDate: date })}
            />
          </FormField>

          <FormField label={t('cab.applicationDraft.fields.applicableScheme')}>
            <SelectField
              value={form.applicableScheme}
              onChange={(value) => onPatch({ applicableScheme: value })}
              options={APPLICABLE_SCHEME_OPTIONS}
              placeholder={t('cab.applicationDraft.fields.applicableSchemePlaceholder')}
            />
          </FormField>
          <FormField label={t('cab.applicationDraft.fields.accreditationBody')}>
            <SelectField
              value={form.accreditationBody}
              onChange={(value) => onPatch({ accreditationBody: value })}
              options={ACCREDITATION_BODY_OPTIONS}
              placeholder={t('cab.applicationDraft.fields.accreditationBodyPlaceholder')}
            />
          </FormField>
          <FormField label={t('cab.applicationDraft.fields.auditLanguage')}>
            <SelectField
              value={form.auditLanguage}
              onChange={(value) => onPatch({ auditLanguage: value })}
              options={AUDIT_LANGUAGE_OPTIONS}
              placeholder={t('cab.applicationDraft.fields.auditLanguagePlaceholder')}
            />
          </FormField>
        </div>
      </SectionHeading>

      <SectionHeading title={t('cab.applicationDraft.sections.scope')} accordion>
        <FormField label={t('cab.applicationDraft.fields.scopeDescription')} required>
          <Textarea
            rows={4}
            value={form.scopeDescription}
            onChange={(e) => onPatch({ scopeDescription: e.target.value })}
            placeholder={t('cab.applicationDraft.fields.scopeDescriptionPlaceholder')}
          />
        </FormField>
      </SectionHeading>

      <SectionHeading title={t('cab.applicationDraft.sections.billingContact')} accordion defaultOpen={false}>
        <div className="grid gap-5 lg:grid-cols-3">
          <FormField label={t('cab.applicationDraft.fields.fullName')}>
            <TextField
              type="text"
              value={form.billingFullName}
              onChange={(e) => onPatch({ billingFullName: e.target.value })}
              placeholder={t('cab.applicationDraft.fields.fullNamePlaceholder')}
            />
          </FormField>
          <FormField label={t('cab.applicationDraft.fields.email')}>
            <TextField
              type="email"
              value={form.billingEmail}
              onChange={(e) => onPatch({ billingEmail: e.target.value })}
              placeholder={t('cab.applicationDraft.fields.emailPlaceholder')}
              {...fieldProps('billingEmail')}
            />
          </FormField>
          <FormField label={t('cab.applicationDraft.fields.mobileNumber')}>
            <PhoneInputRow
              rowClassName="gap-3"
              value={form.billingMobileCountryCode}
              onChange={(code: CountryCode) => onPatch({ billingMobileCountryCode: code })}
              aria-label={t('cab.applicationDraft.fields.mobileNumber')}
            >
              <div className="min-w-0 flex-1">
                <TextField
                  type="tel"
                  lang="en"
                  dir="ltr"
                  value={form.billingMobile}
                  onChange={(e) => onPatch({ billingMobile: e.target.value })}
                  placeholder={t('ui.phonePlaceholder')}
                  {...fieldProps('billingMobile')}
                />
              </div>
            </PhoneInputRow>
          </FormField>
        </div>
        <div className="mt-5">
          <FormField label={t('cab.applicationDraft.fields.address')}>
            <TextField
              type="text"
              value={form.billingAddress}
              onChange={(e) => onPatch({ billingAddress: e.target.value })}
              placeholder={t('cab.applicationDraft.fields.addressPlaceholder')}
            />
          </FormField>
        </div>
      </SectionHeading>
    </div>
  )
}
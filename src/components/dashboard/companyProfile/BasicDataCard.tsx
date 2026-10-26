import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { DatePicker } from '@/components/ui/DatePicker'
import { FormField, SelectField, TextField } from '@/components/ui'
import { useFieldValidation } from '@/hooks/useFieldValidation'
import { profileCardClassName, STATUS_OPTIONS } from './constants'
import { CardHeader } from './Primitives'
import { useProfileForm } from './ProfileFormContext'
import { basicDataRules } from './validation'

export function BasicDataCard({ identityReadOnly = true }: { identityReadOnly?: boolean }) {
  const { t } = useTranslation()
  const { form, update } = useProfileForm()
  const rules = basicDataRules(t, { identityEditable: !identityReadOnly })
  const { fieldProps } = useFieldValidation(form, rules)
  const registrationDateError = form.registrationDate
    ? rules.registrationDate?.(form.registrationDate, form)
    : undefined

  const statusLabels = useMemo(() => {
    const labels = STATUS_OPTIONS.map((opt) =>
      t(`companyProfile.basicDataCard.statusOptions.${opt.key}`)
    )
    // Preserve values coming from the API that are not in the predefined list
    if (
      form.organizationStatus &&
      !STATUS_OPTIONS.some((opt) => opt.value === form.organizationStatus)
    ) {
      labels.push(enumLabel(t, form.organizationStatus))
    }
    return labels
  }, [t, form.organizationStatus])

  const statusLabelFor = (value: string) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === value)
    return option ? t(`companyProfile.basicDataCard.statusOptions.${option.key}`) : enumLabel(t, value)
  }

  const statusValueFor = (label: string) => {
    const option = STATUS_OPTIONS.find(
      (opt) => t(`companyProfile.basicDataCard.statusOptions.${opt.key}`) === label
    )
    if (option) return option.value
    // A value from the API outside the predefined list is shown translated; keep its raw value.
    if (form.organizationStatus && label === enumLabel(t, form.organizationStatus)) return form.organizationStatus
    return label
  }

  return (
    <div className={profileCardClassName}>
      <CardHeader title={t('companyProfile.basicDataCard.title')} />

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.basicDataCard.companyNameLabel')} required>
            <TextField
              type="text"
              placeholder={t('companyProfile.basicDataCard.companyNamePlaceholder')}
              value={form.organizationName}
              valueKind="mixed"
              onChange={(e) => update('organizationName', e.target.value)}
              {...fieldProps('organizationName')}
            />
          </FormField>
          <FormField label={t('companyProfile.basicDataCard.tradingNameLabel')} required>
            <TextField
              type="text"
              placeholder={t('companyProfile.basicDataCard.tradingNamePlaceholder')}
              value={form.tradeName}
              valueKind="mixed"
              onChange={(e) => update('tradeName', e.target.value)}
              {...fieldProps('tradeName')}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.basicDataCard.commercialRegistryLabel')} required>
            <TextField
              type="text"
              placeholder={t('companyProfile.basicDataCard.commercialRegistryPlaceholder')}
              value={form.commercialRegisterNumber}
              valueKind="mixed"
              onChange={(e) => update('commercialRegisterNumber', e.target.value)}
              {...fieldProps('commercialRegisterNumber')}
            />
          </FormField>
          <FormField label={t('companyProfile.basicDataCard.serialNumberLabel')}>
            <TextField
              type="text"
              placeholder={t('companyProfile.basicDataCard.serialNumberPlaceholder')}
              value={form.unifiedNumber}
              valueKind="mixed"
              onChange={(e) => update('unifiedNumber', e.target.value)}
              {...fieldProps('unifiedNumber')}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.basicDataCard.vatNumberLabel', 'VAT registration number')}>
            <TextField
              type="text"
              dir="ltr"
              inputMode="numeric"
              placeholder="3XXXXXXXXXXXXX3"
              value={form.vatNumber}
              onChange={(e) => update('vatNumber', e.target.value.replace(/\D/g, '').slice(0, 15))}
              {...fieldProps('vatNumber')}
            />
            <p className="text-caption text-neutral-700">
              {t('companyProfile.basicDataCard.vatNumberHint', 'Optional. Printed as the buyer VAT number on tax invoices (ZATCA).')}
            </p>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.basicDataCard.authorizedPersonLabel')} required>
            <TextField
              type="text"
              readOnly={identityReadOnly}
              placeholder={t('companyProfile.basicDataCard.authorizedPersonPlaceholder')}
              className={identityReadOnly ? 'cursor-default border-neutral-100 bg-neutral-25 font-medium text-neutral-800' : undefined}
              value={form.authorizedPersonName}
              valueKind={identityReadOnly ? undefined : 'text'}
              onChange={(e) => update('authorizedPersonName', e.target.value)}
              {...fieldProps('authorizedPersonName')}
            />
          </FormField>
          <FormField label={t('companyProfile.basicDataCard.emailLabel')} required>
            <TextField
              type="email"
              dir="ltr"
              readOnly={identityReadOnly}
              placeholder={t('companyProfile.basicDataCard.emailPlaceholder')}
              className={identityReadOnly ? 'cursor-default border-neutral-100 bg-neutral-25 font-medium text-neutral-800' : undefined}
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              {...fieldProps('email')}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.basicDataCard.phoneLabel')} required>
            <PhoneInputRow
              rowClassName="items-center gap-2"
              value={form.countryCode}
              onChange={(countryCode) => update('countryCode', countryCode)}
              disabled={identityReadOnly}
              aria-label={t('companyProfile.basicDataCard.phoneLabel')}
              className={
                identityReadOnly
                  ? 'h-12 cursor-default rounded-md border border-neutral-100 bg-neutral-25 opacity-100'
                  : 'h-12 rounded-md border border-neutral-300'
              }
            >
              <TextField
                type="tel"
                dir="ltr"
                readOnly={identityReadOnly}
                placeholder={t('companyProfile.basicDataCard.phonePlaceholder')}
                className={
                  identityReadOnly
                    ? 'flex-1 cursor-default border-neutral-100 bg-neutral-25 font-medium text-neutral-800'
                    : 'flex-1'
                }
                value={form.phoneNumber}
                onChange={(e) => update('phoneNumber', e.target.value)}
                {...fieldProps('phoneNumber')}
              />
            </PhoneInputRow>
          </FormField>
          <FormField label={t('companyProfile.basicDataCard.companyStatusLabel')} required>
            <SelectField
              value={form.organizationStatus ? statusLabelFor(form.organizationStatus) : ''}
              options={statusLabels}
              onChange={(label) => update('organizationStatus', statusValueFor(label))}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.basicDataCard.totalEmployeesLabel')} required>
            <TextField
              type="text"
              valueKind="number"
              maxLength={9}
              placeholder={t('companyProfile.basicDataCard.totalEmployeesPlaceholder')}
              value={form.employeeCount}
              onChange={(e) => update('employeeCount', e.target.value)}
              {...fieldProps('employeeCount')}
            />
          </FormField>
          <FormField label={t('companyProfile.basicDataCard.registrationDateLabel')} required>
            <DatePicker
              value={form.registrationDate}
              onChange={(date) => update('registrationDate', date)}
              placeholder={t('companyProfile.basicDataCard.registrationDatePlaceholder')}
            />
            {registrationDateError && (
              <p className="text-caption text-error-700">{registrationDateError}</p>
            )}
          </FormField>
        </div>
      </div>
    </div>
  )
}

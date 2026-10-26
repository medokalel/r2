import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField, SelectField, TextField, Textarea } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { MailIcon, PhoneIcon } from '@/components/icons'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import { LEGAL_CAPACITY_OPTIONS } from '@/lib/api/clientRegistrationApi'
import type { ClientRegistrationForm as ClientRegistrationFormData } from '@/lib/clientRegistrationForm'

type FieldProps = (key: keyof ClientRegistrationFormData) => { error?: string; onBlur: () => void }

interface ClientRegistrationFormProps {
  form: ClientRegistrationFormData
  onPatch: (f: Partial<ClientRegistrationFormData>) => void
  fieldProps: FieldProps
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-caption text-error-700">{message}</p> : null
}

export function ClientRegistrationForm({ form, onPatch, fieldProps }: ClientRegistrationFormProps) {
  const { t, i18n } = useTranslation()

  const countries = useMemo(() => {
    const list = getCountryOptions(i18n.language)
    return list.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }))
  }, [i18n.language])

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

  const cityOptions = useMemo(() => {
    return governorates.map((g) => ({ value: g.name, label: g.name }))
  }, [governorates])

  return (
    <div className="flex-1 space-y-5">
      <DashboardTourStep stepId="client-information">
        <SectionHeading title={t('cab.clientRegistration.sections.clientInformation')} accordion>
          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <FormField label={t('cab.clientRegistration.fields.organizationName')} required>
                <TextField
                  id="client-legal-name"
                  type="text"
                  value={form.organizationName}
                  valueKind="mixed"
                  maxLength={200}
                  onChange={(e) => onPatch({ organizationName: e.target.value })}
                  placeholder={t('cab.clientRegistration.fields.organizationNamePlaceholder')}
                  {...fieldProps('organizationName')}
                />
              </FormField>
              <FormField label={t('cab.clientRegistration.fields.legalCapacity')} required>
                <SelectField
                  id="client-legal-capacity"
                  value={form.legalCapacity}
                  options={LEGAL_CAPACITY_OPTIONS}
                  onChange={(value) => onPatch({ legalCapacity: value })}
                />
                <FieldError message={fieldProps('legalCapacity').error} />
              </FormField>
            </div>

            <FormField label={t('cab.clientRegistration.fields.administrationName')} required>
              <TextField
                type="text"
                value={form.administrationName}
                valueKind="mixed"
                maxLength={200}
                onChange={(e) => onPatch({ administrationName: e.target.value })}
                placeholder={t('cab.clientRegistration.fields.administrationNamePlaceholder')}
                {...fieldProps('administrationName')}
              />
            </FormField>

            <div className="grid gap-5 lg:grid-cols-2">
              <div id="client-country" className="space-y-2">
              <SearchableSelect
                id="client-registration-country"
                label={t('cab.clientRegistration.fields.country')}
                required
                value={form.country}
                onChange={(country) =>
                  onPatch({
                    country: country as CountryCode,
                    city: '',
                    phoneCountryCode: (country as CountryCode) || form.phoneCountryCode,
                  })
                }
                options={countries}
                placeholder={t('register.countryPlaceholder')}
                searchPlaceholder={t('common.search')}
              />
              <FieldError message={fieldProps('country').error} />
              </div>
              <div id="client-city" className="space-y-2">
              <SearchableSelect
                id="client-registration-city"
                label={t('cab.clientRegistration.fields.city')}
                required
                value={form.city}
                onChange={(city) => onPatch({ city })}
                options={cityOptions}
                placeholder={
                  form.country
                    ? t('register.governoratePlaceholder')
                    : t('register.selectCountryFirst')
                }
                searchPlaceholder={t('common.search')}
              />
              <FieldError message={fieldProps('city').error} />
              </div>
            </div>

            <FormField label={t('cab.clientRegistration.fields.activity')} required>
              <Textarea
                id="client-activity"
                value={form.activity}
                onChange={(e) => onPatch({ activity: e.target.value })}
                onBlur={fieldProps('activity').onBlur}
                placeholder={t('cab.clientRegistration.fields.activityPlaceholder')}
                rows={3}
                maxLength={300}
                className="min-h-[80px]"
              />
              <FieldError message={fieldProps('activity').error} />
            </FormField>

            <div className="grid gap-5 lg:grid-cols-2">
              <FormField label={t('cab.clientRegistration.fields.facilityOwnerManager')} required>
                <TextField
                  id="client-contact-name"
                  type="text"
                  value={form.facilityOwnerManager}
                  valueKind="text"
                  maxLength={200}
                  onChange={(e) => onPatch({ facilityOwnerManager: e.target.value })}
                  placeholder={t('cab.clientRegistration.fields.facilityOwnerManagerPlaceholder')}
                  {...fieldProps('facilityOwnerManager')}
                />
              </FormField>
              <FormField label={t('cab.clientRegistration.fields.email')} required>
                <TextField
                  id="client-contact-email"
                  type="email"
                  icon={MailIcon}
                  value={form.email}
                  onChange={(e) => onPatch({ email: e.target.value })}
                  placeholder="client@example.com"
                  {...fieldProps('email')}
                />
              </FormField>
            </div>

            <FormField label={t('cab.clientRegistration.fields.phoneNumber')} required>
              <PhoneInputRow
                rowClassName="gap-3"
                value={form.phoneCountryCode}
                onChange={(code: CountryCode) => onPatch({ phoneCountryCode: code })}
                aria-label={t('cab.clientRegistration.fields.phoneNumber')}
              >
                <div className="min-w-0 flex-1">
                  <TextField
                    id="client-contact-phone"
                    type="tel"
                    icon={PhoneIcon}
                    value={form.phoneNumber}
                    onChange={(e) => onPatch({ phoneNumber: e.target.value })}
                    placeholder="1XXXXXXXXX"
                    {...fieldProps('phoneNumber')}
                  />
                </div>
              </PhoneInputRow>
            </FormField>
          </div>
        </SectionHeading>
      </DashboardTourStep>
    </div>
  )
}

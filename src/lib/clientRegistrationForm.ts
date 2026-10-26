import type { CountryCode } from '@/lib/countries'
import type { TFunction } from 'i18next'
import type { ValidationRules } from '@/hooks/useFieldValidation'
import { emailRule, phoneRule, textRule } from '@/lib/fieldRules'
import type { FieldLabelMap } from '@/lib/errorMessages'

/** Fields accepted by POST /cab-clients. */
export interface ClientRegistrationForm {
  email: string
  organizationName: string
  administrationName: string
  facilityOwnerManager: string
  activity: string
  legalCapacity: string
  country: CountryCode | ''
  city: string
  phoneCountryCode: CountryCode
  phoneNumber: string
}

export const emptyClientRegistrationForm: ClientRegistrationForm = {
  email: '',
  organizationName: '',
  administrationName: '',
  facilityOwnerManager: '',
  activity: '',
  legalCapacity: '',
  country: 'EG',
  city: '',
  phoneCountryCode: 'EG',
  phoneNumber: '',
}

/** Mirrors the backend createClientSchema (POST /cab-clients) limits. */
export function getClientRegistrationRules(
  t: TFunction
): ValidationRules<ClientRegistrationForm> {
  return {
    organizationName: textRule(t, { kind: 'mixed', min: 2, max: 200 }),
    legalCapacity: textRule(t, { min: 2, max: 200 }),
    administrationName: textRule(t, { kind: 'mixed', min: 2, max: 200 }),
    country: (value) => (value ? undefined : t('validation.required')),
    city: textRule(t, { min: 2, max: 100 }),
    activity: textRule(t, { min: 2, max: 300 }),
    facilityOwnerManager: textRule(t, { kind: 'text', min: 2, max: 200 }),
    email: emailRule(t),
    phoneNumber: (value, form) => phoneRule(t, form.phoneCountryCode)(value),
  }
}

/**
 * Readable names for the fields the backend validates (POST /cab-clients and
 * POST /cab-clients/:id/profile), so error lines say "Organization name" instead of "organizationName".
 */
export const CLIENT_REGISTRATION_FIELD_LABELS: FieldLabelMap = {
  email: 'cab.clientRegistration.fields.email',
  organizationName: 'cab.clientRegistration.fields.organizationName',
  administrationName: 'cab.clientRegistration.fields.administrationName',
  facilityOwnerManager: 'cab.clientRegistration.fields.facilityOwnerManager',
  activity: 'cab.clientRegistration.fields.activity',
  legalCapacity: 'cab.clientRegistration.fields.legalCapacity',
  city: 'cab.clientRegistration.fields.city',
  country: 'cab.clientRegistration.fields.country',
  phone: 'cab.clientRegistration.fields.phoneNumber',
  phoneNumber: 'cab.clientRegistration.fields.phoneNumber',
  'profile.organizationName': 'cab.clientRegistration.fields.organizationName',
  'profile.authorizedPersonName': 'cab.clientRegistration.fields.facilityOwnerManager',
  'profile.email': 'cab.clientRegistration.fields.email',
  'profile.phoneNumber': 'cab.clientRegistration.fields.phoneNumber',
  'profile.companySummary': 'cab.clientRegistration.fields.activity',
  'address.city': 'cab.clientRegistration.fields.city',
  'address.country': 'cab.clientRegistration.fields.country',
  'address.street': 'cab.clientRegistration.fields.administrationName',
}

import type { CountryCode } from '@/lib/countries'

export interface ApplicationDraftForm {
  // Application Details
  applicationType: string
  primaryStandard: string
  applicationDate: Date | undefined
  certificationBody: string
  additionalStandards: string[]
  requestedAuditDate: Date | undefined
  applicableScheme: string
  accreditationBody: string
  auditLanguage: string
  // Scope of Certification (Brief)
  scopeDescription: string
  // Billing Contact (if different) — optional section
  billingFullName: string
  billingEmail: string
  billingMobileCountryCode: CountryCode
  billingMobile: string
  billingAddress: string
}

export const emptyApplicationDraftForm: ApplicationDraftForm = {
  applicationType: 'Initial Certification',
  primaryStandard: 'ISO 9001:2015 - Quality Management',
  applicationDate: new Date(),
  certificationBody: 'TÜV Rheinland / Casco',
  additionalStandards: ['ISO 14001:2015 - Environmental Management'],
  requestedAuditDate: new Date(Date.now() + 14 * 86400000),
  applicableScheme: 'IAF MD 22:2023',
  accreditationBody: 'Emirates International',
  auditLanguage: 'English',
  scopeDescription: 'Design, manufacturing, testing, and distribution of industrial automation components and systems.',
  billingFullName: 'Arjun Verma',
  billingEmail: 'arjun.verma@greenleaf.com',
  billingMobileCountryCode: 'EG',
  billingMobile: '1001234567',
  billingAddress: 'Building 4, Industrial Zone, Cairo, Egypt',
}

/** Only the fields marked required (*) in the design gate "Save & Continue" — Billing Contact is optional throughout. */
export function isApplicationDraftComplete(form: ApplicationDraftForm): boolean {
  return Boolean(
    form.applicationType &&
      form.primaryStandard &&
      form.applicationDate &&
      form.scopeDescription.trim()
  )
}
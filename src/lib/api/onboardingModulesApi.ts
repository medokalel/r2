export type OnboardingModuleId =
  | 'APPLICATIONS'
  | 'AUDIT_PLANNING'
  | 'CERTIFICATES'
  | 'NONCONFORMITIES'
  | 'REPORTS_ANALYTICS'
  | 'CERTIFICATION'
  | 'CLIENT_PORTAL'
  | 'COMPETENCE'

export interface OnboardingModuleOption {
  value: OnboardingModuleId
  titleKey: string
  descriptionKey: string
}

export const ONBOARDING_MODULE_OPTIONS: OnboardingModuleOption[] = [
  {
    value: 'APPLICATIONS',
    titleKey: 'onboarding.modules.options.applications.title',
    descriptionKey: 'onboarding.modules.options.applications.description',
  },
  {
    value: 'AUDIT_PLANNING',
    titleKey: 'onboarding.modules.options.auditPlanning.title',
    descriptionKey: 'onboarding.modules.options.auditPlanning.description',
  },
  {
    value: 'CERTIFICATES',
    titleKey: 'onboarding.modules.options.certificates.title',
    descriptionKey: 'onboarding.modules.options.certificates.description',
  },
  {
    value: 'NONCONFORMITIES',
    titleKey: 'onboarding.modules.options.nonconformities.title',
    descriptionKey: 'onboarding.modules.options.nonconformities.description',
  },
  {
    value: 'REPORTS_ANALYTICS',
    titleKey: 'onboarding.modules.options.reportsAnalytics.title',
    descriptionKey: 'onboarding.modules.options.reportsAnalytics.description',
  },
  {
    value: 'CERTIFICATION',
    titleKey: 'onboarding.modules.options.certification.title',
    descriptionKey: 'onboarding.modules.options.certification.description',
  },
  {
    value: 'CLIENT_PORTAL',
    titleKey: 'onboarding.modules.options.clientPortal.title',
    descriptionKey: 'onboarding.modules.options.clientPortal.description',
  },
  {
    value: 'COMPETENCE',
    titleKey: 'onboarding.modules.options.competence.title',
    descriptionKey: 'onboarding.modules.options.competence.description',
  },
]

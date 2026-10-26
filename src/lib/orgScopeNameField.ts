import type { TFunction } from 'i18next'
import type { OrgScopeCategory } from '@/lib/api/onboardingOrgScopeApi'

const ORG_NAME_LABEL_BASE: Record<OrgScopeCategory, string> = {
  ACCREDITATION_BODY: 'onboarding.orgType.orgNameLabels.accreditationBody',
  CONFORMITY_ASSESSMENT_BODY: 'onboarding.orgType.orgNameLabels.conformityAssessmentBody',
  SCHEME_OWNER: 'onboarding.orgType.orgNameLabels.schemeOwner',
  INTERNAL_AUDITS: 'onboarding.orgType.orgNameLabels.internalAudits',
  SUPPLIER_AUDITS: 'onboarding.orgType.orgNameLabels.supplierAudits',
}

export function getOrgScopeNameFieldLabels(
  scopeCategory: OrgScopeCategory | '',
  t: TFunction
): { label: string; placeholder: string } {
  if (!scopeCategory) {
    return {
      label: t('onboarding.orgType.orgNameLabels.default.label'),
      placeholder: t('onboarding.orgType.orgNameLabels.default.placeholder'),
    }
  }

  const base = ORG_NAME_LABEL_BASE[scopeCategory]
  return {
    label: t(`${base}.label`),
    placeholder: t(`${base}.placeholder`),
  }
}

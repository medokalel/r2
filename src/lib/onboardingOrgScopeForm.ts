import type { OrgScopeCategory } from '@/lib/api/onboardingOrgScopeApi'

export interface OrgScopeFormFields {
  scopeCategory: OrgScopeCategory | ''
  scopeAreas: string[]
}

export function isOrgScopeStepComplete(form: OrgScopeFormFields): boolean {
  return Boolean(form.scopeCategory && form.scopeAreas.length > 0)
}

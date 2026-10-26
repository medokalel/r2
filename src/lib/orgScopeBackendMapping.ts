import type { EntityType } from '@/lib/entityTypes'
import type { OrgScopeCategory } from '@/lib/api/onboardingOrgScopeApi'

/** Backend only supports these three organization types — never send UI-only scope values as `type`. */
export const BACKEND_ORGANIZATION_TYPES = [
  'ACCREDITATION_BODY',
  'CERTIFICATION_BODY',
  'CONSULTATION_BODY',
] as const satisfies readonly EntityType[]

/**
 * Maps the onboarding UI org-scope card to the legacy backend organization type.
 * UI-only categories (Scheme Owners, Internal Audits, Supplier Audits) collapse
 * into one of the three backend roles below.
 */
export function mapOrgScopeToBackendType(category: OrgScopeCategory): EntityType {
  switch (category) {
    case 'ACCREDITATION_BODY':
      return 'ACCREDITATION_BODY'
    case 'CONFORMITY_ASSESSMENT_BODY':
      return 'CERTIFICATION_BODY'
    case 'SCHEME_OWNER':
      return 'ACCREDITATION_BODY'
    case 'INTERNAL_AUDITS':
    case 'SUPPLIER_AUDITS':
      return 'CONSULTATION_BODY'
  }
}

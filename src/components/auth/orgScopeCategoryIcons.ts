import type { OrgScopeCategory } from '@/lib/api/onboardingOrgScopeApi'
import {
  AccreditationFieldIcon,
  BuildingsIcon,
  ReportIcon,
  SearchIcon,
  ShieldIcon,
  type AppIconComponent,
} from '@/components/icons'

export const ORG_SCOPE_CATEGORY_ICONS: Record<OrgScopeCategory, AppIconComponent> = {
  ACCREDITATION_BODY: AccreditationFieldIcon,
  CONFORMITY_ASSESSMENT_BODY: ShieldIcon,
  SCHEME_OWNER: ReportIcon,
  INTERNAL_AUDITS: SearchIcon,
  SUPPLIER_AUDITS: BuildingsIcon,
}

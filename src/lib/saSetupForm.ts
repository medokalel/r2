import { isValidRequiredEmail } from '@/lib/authValidation'
import { allowsSiteSpecificSuppliers } from '@/lib/api/saSetupApi'

/**
 * State for the 10-screen Supplier Audit setup wizard
 * (see the Supplier Audit onboarding deck).
 */

export interface SaRoleInvite {
  role: string
  email: string
  status: 'INVITE' | 'ADD_LATER'
}

export interface SaSetupForm {
  // Screen 1 — buying organization profile
  industry: string
  industryOther: string
  primaryContactEmail: string
  supplierCount: string

  // Screen 2 — procurement footprint
  procurementOffices: number
  receivingSites: number
  supplierCountries: number
  approvalModel: string
  centralizedApproval: boolean
  allowSiteSpecificSuppliers: boolean

  // Screen 3 — supplier categories
  categories: string[]
  customCategories: string
  categoryOwner: string

  // Screen 4 — risk criteria
  riskLevels: string
  riskFactors: string[]
  spendThreshold: string
  countryRisk: boolean
  regulatoryRisk: boolean
  automaticRiskScore: boolean
  recalculateAfterIncidents: boolean
  requireApprovalForCritical: boolean

  // Screen 5 — qualification requirements
  qualificationRoute: string
  requiredEvidence: string[]
  requiredLicences: string
  managementCertificates: string
  financialChecks: string
  insuranceEvidence: string
  approvalValidity: string
  blockExpiredDocuments: boolean
  applyConditionalApproval: boolean

  // Screen 6 — audit types and criteria
  auditTypes: string[]
  auditModes: string[]
  auditCriteria: string[]
  additionalStandards: string
  auditFrequency: string

  // Screen 7 — scoring and decisions
  scoreScale: string
  approvalThreshold: number
  conditionalLowerBound: number
  rejectionThreshold: number
  criticalFindingRule: string
  decisionAuthority: string
  requireActionPlan: boolean
  recalculateSupplierStatus: boolean

  // Screen 8 — findings and follow-up
  findingClasses: string
  correctionDueDays: number
  correctiveActionDueDays: number
  evidenceReviewRequired: boolean
  followUpTrigger: string
  escalationOwner: string
  requireRootCause: boolean
  trackEffectivenessReview: boolean

  // Screen 9 — roles
  roleInvites: SaRoleInvite[]
  separateAuditFromApproval: boolean
  useCategoryBasedAccess: boolean
}

export const emptySaSetupForm: SaSetupForm = {
  industry: '',
  industryOther: '',
  primaryContactEmail: '',
  supplierCount: '',

  procurementOffices: 1,
  receivingSites: 1,
  supplierCountries: 1,
  approvalModel: 'CENTRALIZED',
  centralizedApproval: true,
  allowSiteSpecificSuppliers: false,

  categories: [],
  customCategories: '',
  categoryOwner: '',

  riskLevels: 'LOW_MEDIUM_HIGH_CRITICAL',
  riskFactors: ['CRITICALITY', 'SPEND', 'COUNTRY'],
  spendThreshold: '',
  countryRisk: true,
  regulatoryRisk: true,
  automaticRiskScore: true,
  recalculateAfterIncidents: true,
  requireApprovalForCritical: true,

  qualificationRoute: 'QUESTIONNAIRE_AND_DOCUMENTS',
  requiredEvidence: ['LICENCE', 'ISO_CERTIFICATE', 'INSURANCE'],
  requiredLicences: '',
  managementCertificates: '',
  financialChecks: '',
  insuranceEvidence: '',
  approvalValidity: '2',
  blockExpiredDocuments: true,
  applyConditionalApproval: true,

  auditTypes: [],
  auditModes: [],
  auditCriteria: [],
  additionalStandards: '',
  auditFrequency: 'RISK_BASED',

  scoreScale: 'PERCENTAGE',
  approvalThreshold: 80,
  conditionalLowerBound: 60,
  rejectionThreshold: 60,
  criticalFindingRule: 'AUTOMATIC_HOLD',
  decisionAuthority: '',
  requireActionPlan: true,
  recalculateSupplierStatus: true,

  findingClasses: 'CRITICAL_MAJOR_MINOR',
  correctionDueDays: 7,
  correctiveActionDueDays: 30,
  evidenceReviewRequired: true,
  followUpTrigger: 'CRITICAL_OR_REPEATED',
  escalationOwner: '',
  requireRootCause: true,
  trackEffectivenessReview: true,

  roleInvites: [],
  separateAuditFromApproval: true,
  useCategoryBasedAccess: true,
}

// ---------------------------------------------------------------------------
// Per-screen completeness — only the deck's starred fields may block Next.
// ---------------------------------------------------------------------------

export function isSaProfileStepComplete(form: SaSetupForm, legalName: string): boolean {
  if (!legalName.trim() || !form.industry) return false
  if (form.industry === 'OTHER' && !form.industryOther.trim()) return false
  return true
}

export function isSaLocationsStepComplete(
  form: SaSetupForm,
  country: string,
  city: string
): boolean {
  return Boolean(
    country &&
      city.trim() &&
      form.procurementOffices >= 1 &&
      form.receivingSites >= 1 &&
      form.supplierCountries >= 1
  )
}

export function isSaCategoriesStepComplete(form: SaSetupForm): boolean {
  const hasCategory = form.categories.length > 0 || Boolean(form.customCategories.trim())
  return hasCategory && Boolean(form.categoryOwner.trim())
}

export function isSaRiskStepComplete(form: SaSetupForm): boolean {
  return Boolean(form.riskLevels && form.riskFactors.length > 0)
}

export function isSaQualificationStepComplete(form: SaSetupForm): boolean {
  return Boolean(form.qualificationRoute && form.approvalValidity)
}

export function isSaAuditTypesStepComplete(form: SaSetupForm): boolean {
  return Boolean(
    form.auditTypes.length > 0 && form.auditCriteria.length > 0 && form.auditFrequency
  )
}

export function isSaScoringStepComplete(form: SaSetupForm): boolean {
  if (!form.scoreScale || !form.decisionAuthority.trim() || !form.criticalFindingRule) return false
  // Pass/fail has no numeric bands to validate.
  if (form.scoreScale === 'PASS_FAIL') return true
  if (
    form.rejectionThreshold < 0 ||
    form.conditionalLowerBound < 0 ||
    form.approvalThreshold < 0 ||
    form.rejectionThreshold > 100 ||
    form.conditionalLowerBound > 100 ||
    form.approvalThreshold > 100
  ) {
    return false
  }
  // Bands must not overlap: rejection < conditional lower bound < approval.
  return form.rejectionThreshold < form.conditionalLowerBound &&
    form.conditionalLowerBound < form.approvalThreshold
}

export function isSaFindingsStepComplete(form: SaSetupForm): boolean {
  return Boolean(
    form.findingClasses &&
      form.correctionDueDays >= 1 &&
      form.correctiveActionDueDays >= form.correctionDueDays &&
      form.escalationOwner.trim()
  )
}

export function isSaRolesStepComplete(form: SaSetupForm): boolean {
  // Roles never block activation; only a typed-but-malformed address does.
  return form.roleInvites.every(
    (invite) => !invite.email.trim() || isValidRequiredEmail(invite.email)
  )
}

export { allowsSiteSpecificSuppliers }

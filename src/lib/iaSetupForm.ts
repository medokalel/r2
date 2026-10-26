import { isValidRequiredEmail } from '@/lib/authValidation'

/**
 * State for the 10-screen Internal Audit setup wizard
 * (see the Internal Audit onboarding deck). Dates are ISO `yyyy-mm-dd` strings
 * so the form survives the JSON round-trip through the onboarding draft.
 */

export interface IaRoleInvite {
  role: string
  email: string
  /** 'ADD_LATER' / 'IMPORT_LATER' store an incomplete status, not fake data. */
  status: 'INVITE' | 'ADD_LATER' | 'IMPORT_LATER'
}

export interface IaSetupForm {
  // Screen 1 — organization profile
  industry: string
  industryOther: string
  primaryContactEmail: string
  employeeRange: string

  // Screen 2 — structure
  siteCount: number
  departmentCount: number
  singleManagementSystem: boolean
  includeRemoteFunctions: boolean

  // Screen 3 — audit universe
  standards: string[]
  processes: string[]

  // Screen 4 — audit criteria
  programmeName: string
  primaryCriteria: string[]
  internalPoliciesFileName: string
  legalRegister: string
  auditCycle: string
  programmeOwner: string
  allowMultipleCriteria: boolean
  trackClauseFindings: boolean

  // Screen 5 — risk rating
  riskScale: string
  riskFactors: string[]
  previousFindings: string
  useHistoricalLastAuditDate: boolean
  performanceIndicators: string
  automaticPriorityScore: boolean
  prioritizeOverdue: boolean
  increaseFrequencyAfterMajorNc: boolean

  // Screen 6 — annual programme
  programmePeriodStart: string
  programmePeriodEnd: string
  defaultFrequency: string
  highRiskFrequency: string
  planningOwner: string
  approvalAuthority: string
  integratedAudits: boolean
  avoidPeakPeriods: boolean
  notifyProcessOwners: boolean

  // Screen 7 — findings and follow-up
  findingTypes: string
  correctionDueDays: number
  correctiveActionDueDays: number
  verificationMethod: string
  escalationAfterDays: number
  closureAuthority: string
  requireRootCause: boolean
  trackEffectivenessReview: boolean

  // Screen 8 — templates and numbering
  auditNumberFormat: string
  findingNumberFormat: string
  auditPlanTemplate: string
  checklistTemplate: string
  reportLanguage: string
  electronicApproval: boolean
  useControlledTemplates: boolean
  showRevisionHistory: boolean

  // Screen 9 — roles
  roleInvites: IaRoleInvite[]
  enforceAuditorIndependence: boolean
  useRoleBasedPermissions: boolean
}

export const emptyIaSetupForm: IaSetupForm = {
  industry: '',
  industryOther: '',
  primaryContactEmail: '',
  employeeRange: '',

  siteCount: 1,
  departmentCount: 1,
  singleManagementSystem: true,
  includeRemoteFunctions: true,

  standards: [],
  processes: [],

  programmeName: '',
  primaryCriteria: [],
  internalPoliciesFileName: '',
  legalRegister: '',
  auditCycle: 'ANNUAL',
  programmeOwner: '',
  allowMultipleCriteria: true,
  trackClauseFindings: true,

  riskScale: 'LOW_MEDIUM_HIGH',
  riskFactors: ['IMPACT', 'CHANGE', 'COMPLEXITY'],
  previousFindings: 'OPEN_AND_OVERDUE',
  useHistoricalLastAuditDate: true,
  performanceIndicators: '',
  automaticPriorityScore: true,
  prioritizeOverdue: true,
  increaseFrequencyAfterMajorNc: true,

  programmePeriodStart: '',
  programmePeriodEnd: '',
  defaultFrequency: 'ANNUAL',
  highRiskFrequency: 'SEMIANNUAL',
  planningOwner: '',
  approvalAuthority: '',
  integratedAudits: true,
  avoidPeakPeriods: true,
  notifyProcessOwners: true,

  findingTypes: 'MAJOR_MINOR_OFI',
  correctionDueDays: 15,
  correctiveActionDueDays: 30,
  verificationMethod: 'EVIDENCE_AND_FOLLOW_UP',
  escalationAfterDays: 7,
  closureAuthority: '',
  requireRootCause: true,
  trackEffectivenessReview: true,

  auditNumberFormat: 'IA-{YEAR}-{SEQ}',
  findingNumberFormat: 'NC-{AUDIT}-{SEQ}',
  auditPlanTemplate: 'ICASCO_DEFAULT',
  checklistTemplate: 'ICASCO_DEFAULT',
  reportLanguage: 'EN_AR',
  electronicApproval: true,
  useControlledTemplates: true,
  showRevisionHistory: true,

  roleInvites: [],
  enforceAuditorIndependence: true,
  useRoleBasedPermissions: true,
}

// ---------------------------------------------------------------------------
// Per-screen completeness — only the deck's starred fields may block Next.
// ---------------------------------------------------------------------------

export function isIaProfileStepComplete(form: IaSetupForm, legalName: string): boolean {
  if (!legalName.trim() || !form.industry) return false
  if (form.industry === 'OTHER' && !form.industryOther.trim()) return false
  return true
}

export function isIaStructureStepComplete(
  form: IaSetupForm,
  country: string,
  city: string
): boolean {
  // At least one site and one department make up the audit universe.
  return Boolean(country && city.trim() && form.siteCount >= 1 && form.departmentCount >= 1)
}

export function isIaUniverseStepComplete(form: IaSetupForm): boolean {
  return form.standards.length > 0 || form.processes.length > 0
}

export function isIaCriteriaStepComplete(form: IaSetupForm): boolean {
  return Boolean(
    form.programmeName.trim() &&
      form.primaryCriteria.length > 0 &&
      form.auditCycle &&
      form.programmeOwner.trim()
  )
}

export function isIaRiskStepComplete(form: IaSetupForm): boolean {
  return Boolean(form.riskScale && form.previousFindings)
}

export function isIaProgrammeStepComplete(form: IaSetupForm): boolean {
  if (!form.programmePeriodStart || !form.programmePeriodEnd) return false
  // End date must fall after the start date.
  if (form.programmePeriodEnd <= form.programmePeriodStart) return false
  return Boolean(form.defaultFrequency && form.planningOwner.trim())
}

export function isIaFindingsStepComplete(form: IaSetupForm): boolean {
  return Boolean(
    form.findingTypes &&
      form.correctionDueDays >= 1 &&
      form.correctiveActionDueDays >= form.correctionDueDays &&
      form.escalationAfterDays >= 1 &&
      form.closureAuthority.trim()
  )
}

export function isIaTemplatesStepComplete(form: IaSetupForm): boolean {
  // Both identifiers need a sequence token or they can collide.
  return form.auditNumberFormat.includes('{SEQ}') && form.findingNumberFormat.includes('{SEQ}')
}

export function isIaRolesStepComplete(form: IaSetupForm): boolean {
  // Roles never block activation; only a typed-but-malformed address does.
  return form.roleInvites.every(
    (invite) => !invite.email.trim() || isValidRequiredEmail(invite.email)
  )
}

/** Renders the audit-number example shown under the format field. */
export function buildIaNumberExample(format: string, siteCode: string, processCode: string): string {
  return format
    .replace(/\{YEAR\}/g, String(new Date().getFullYear()))
    .replace(/\{SITE\}/g, siteCode || 'HQ')
    .replace(/\{PROCESS\}/g, processCode || 'OPS')
    .replace(/\{SEQ\}/g, '001')
}

/** Renders the finding-number example; `{AUDIT}` expands to a sample audit id. */
export function buildIaFindingExample(format: string, auditNumberFormat: string): string {
  const sampleAudit = buildIaNumberExample(auditNumberFormat, 'HQ', 'OPS')
  return format
    .replace(/\{AUDIT\}/g, sampleAudit)
    .replace(/\{YEAR\}/g, String(new Date().getFullYear()))
    .replace(/\{SEQ\}/g, '01')
}

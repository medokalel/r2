/**
 * Demo copy of GET /cab/certification-applications/:id/quotation/audit-time-context: the suggested
 * classification per standard (IAF codes of the certificates and sites), the multi-site register
 * built from the application branches and the IAF MD 1 criteria. The demo CAB user is the CAB
 * administrator, so overrides are allowed.
 */
import { findApp } from '@/lib/api/demo/records'
import { classifyStandard } from '@/lib/auditTime/classification'
import { iafCodesOf, siteOfBranch, type DraftBranch, type DraftCertificate } from '@/lib/auditTime/quotationDraft'
import { MD1_ELIGIBILITY_CRITERIA } from '@/lib/auditTime/rules'
import { CLASSIFICATION_SOURCES } from '@/lib/auditTime/sectorCategories'
import { canonicalStandardCode } from '@/lib/quotationForm'

/** Roles that may override a suggested classification (same list as the API). */
export const CLASSIFICATION_OVERRIDE_ROLES = ['CAB_ADMIN', 'GENERAL_MANAGER', 'TECHNICAL_MANAGER', 'CERTIFICATION_MANAGER']

export function auditTimeContextFor(applicationId: string) {
  const app = findApp(applicationId)
  if (!app) return null
  const sites = ((app.branches ?? []) as DraftBranch[]).filter((b) => (b.employeesInScope ?? 0) > 0).map(siteOfBranch)
  const seen = new Set<string>()
  const standards = []
  for (const certificate of (app.certificates ?? []) as DraftCertificate[]) {
    const code = canonicalStandardCode(`${certificate.certificateCode ?? ''} ${certificate.certificateName ?? ''}`)
    if (!code || seen.has(code)) continue
    seen.add(code)
    const siteCodes = sites.filter((s) => s.isCentral || !s.standards.length || s.standards.includes(code)).flatMap((s) => s.iafCodes)
    standards.push({ standardCode: code, certificateIafCodes: iafCodesOf(certificate), classification: classifyStandard(code, [...iafCodesOf(certificate), ...siteCodes]) })
  }
  return {
    applicationId: app.id,
    standards,
    sites,
    eligibilityCriteria: MD1_ELIGIBILITY_CRITERIA,
    permissions: { canOverrideClassification: true, role: 'CAB_ADMIN', overrideRoles: CLASSIFICATION_OVERRIDE_ROLES },
    sources: CLASSIFICATION_SOURCES,
  }
}

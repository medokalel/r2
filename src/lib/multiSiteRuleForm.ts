import type { Site } from '@/lib/sitesFacilitiesForm'

export type MultiSiteStructureType = 'SINGLE_SITE' | 'INTEGRATED_MULTI_SITE' | 'SEPARATE_MULTI_SITE'

export const MULTI_SITE_STRUCTURE_OPTIONS: {
  value: MultiSiteStructureType
  labelKey: string
  descriptionKey: string
}[] = [
  {
    value: 'SINGLE_SITE',
    labelKey: 'cab.applicationDraft.sitesFacilities.multiSiteRule.structureOptions.SINGLE_SITE',
    descriptionKey:
      'cab.applicationDraft.sitesFacilities.multiSiteRule.structureOptionDescriptions.SINGLE_SITE',
  },
  {
    value: 'INTEGRATED_MULTI_SITE',
    labelKey: 'cab.applicationDraft.sitesFacilities.multiSiteRule.structureOptions.INTEGRATED_MULTI_SITE',
    descriptionKey:
      'cab.applicationDraft.sitesFacilities.multiSiteRule.structureOptionDescriptions.INTEGRATED_MULTI_SITE',
  },
  {
    value: 'SEPARATE_MULTI_SITE',
    labelKey: 'cab.applicationDraft.sitesFacilities.multiSiteRule.structureOptions.SEPARATE_MULTI_SITE',
    descriptionKey:
      'cab.applicationDraft.sitesFacilities.multiSiteRule.structureOptionDescriptions.SEPARATE_MULTI_SITE',
  },
]

// Central functions a head office can run on behalf of every site — these
// are the activities IAF MD 1 lets an auditor sample once at the head
// office instead of re-checking at each satellite.
export const CENTRAL_FUNCTION_OPTIONS = [
  'Top Management',
  'Policy & Strategy',
  'Internal Audit',
  'Management Review',
  'Finance & HR',
]

export const APPLICABLE_RULE_OPTIONS = [{ value: 'IAF_MD1_2023', label: 'IAF MD 1:2023 (Multi-site Organizations)' }]

export const MANDAYS_MODEL_OPTIONS = [{ value: 'SAMPLING', label: 'Sampling Method' }]

export interface MultiSiteConsiderations {
  /** All sites share the same certification scope, so satellite sites can be sampled instead of each fully audited. */
  sameScopeDevelopment: boolean
  /** Head office's central functions count once instead of being re-checked per site. */
  includeHeadOfficeFunctions: boolean
  /** Lets the √n sampling rule apply between similar satellite sites; off audits every satellite. */
  allowSamplingBetweenSites: boolean
  /** Add mandays for sites that need flights/trains to reach. */
  considerTravelAccess: boolean
  /** Add mandays for sites that require a visitor permit / security clearance. */
  includePermitAccess: boolean
}

export const emptyMultiSiteConsiderations: MultiSiteConsiderations = {
  sameScopeDevelopment: true,
  includeHeadOfficeFunctions: true,
  allowSamplingBetweenSites: true,
  considerTravelAccess: true,
  includePermitAccess: true,
}

export interface MultiSiteRuleForm {
  structureType: MultiSiteStructureType
  headOfficeSiteId: string
  centralFunctions: string[]
  applicableRule: string
  mandaysModel: string
  considerations: MultiSiteConsiderations
  /** Site ids the user has manually excluded from this cycle's calculation via the "Included in Calculation" toggle. */
  excludedSiteIds: string[]
}

export function emptyMultiSiteRuleForm(sites: Site[]): MultiSiteRuleForm {
  return {
    structureType: 'INTEGRATED_MULTI_SITE',
    headOfficeSiteId: sites[0]?.id ?? '',
    centralFunctions: [],
    applicableRule: 'IAF_MD1_2023',
    mandaysModel: 'SAMPLING',
    considerations: emptyMultiSiteConsiderations,
    excludedSiteIds: [],
  }
}

export function isMultiSiteRuleFormComplete(form: MultiSiteRuleForm): boolean {
  return Boolean(form.headOfficeSiteId && form.applicableRule && form.mandaysModel)
}

/** Simplified banding loosely modeled on the mandays-by-headcount tables
 *  used across IAF-aligned certification schemes (e.g. IAF MD 5). This is a
 *  planning estimate for this screen, not a certified audit-duration
 *  calculator — an auditor still has final say on actual mandays. */
function baseMandaysForSite(site: Site): number {
  const employees = site.employees || 0
  if (employees <= 25) return 1
  if (employees <= 45) return 1.5
  if (employees <= 65) return 2
  if (employees <= 85) return 2.5
  if (employees <= 125) return 3
  if (employees <= 175) return 3.5
  if (employees <= 275) return 4
  if (employees <= 425) return 4.5
  if (employees <= 625) return 5
  if (employees <= 875) return 5.5
  return 6
}

/** IAF MD 1's square-root sampling rule: only √n satellite sites need a
 *  physical visit this cycle, rounded up, with at least one always sampled. */
function sampleSize(satelliteCount: number): number {
  if (satelliteCount <= 0) return 0
  return Math.max(1, Math.ceil(Math.sqrt(satelliteCount)))
}

function hasPermitRequirement(site: Site): boolean {
  const permit = site.additionalDetails?.permitAccess
  return Boolean(permit) && permit !== 'Not Required'
}

/** One row of the "Sites Covered" table, with everything already resolved
 *  for display so the page component doesn't recompute it per render. */
export interface MultiSiteRuleSiteRow {
  site: Site
  isHeadOffice: boolean
  role: string
  travelRequirements: string[]
  permitRequired: boolean
  sampledThisCycle: boolean
  /** Weight this site carries in the mandays total — 1.0 for a fully audited site, less for a desk/sampling-only site. */
  samplingFactor: number
  /** Whether the user has this row switched on for calculation (defaults to sampledThisCycle, overridable). */
  included: boolean
}

/** Result of applying the rule — stored on SitesFacilitiesForm once the user
 *  saves, so the Sites & Facilities table can render the summary cards
 *  without recomputing on every render. */
export interface MultiSiteRuleResult {
  form: MultiSiteRuleForm
  rows: MultiSiteRuleSiteRow[]
  sampledSatelliteSiteIds: string[]
  totalBaseMandays: number
  samplingAdjustment: number
  travelAdjustment: number
  permitAdjustment: number
  totalEstimatedMandays: number
}

/** Per-row mandays for the Sites & Sampling Summary preview — the row's own
 *  share of the total (sampled/desk base mandays plus any travel or permit
 *  adjustment counted for it). Excluded rows show 0. Doesn't include the
 *  same-scope-development or head-office-functions adjustments, which apply
 *  to the total rather than a specific site — result.totalEstimatedMandays
 *  remains the authoritative total. */
export function rowMandays(row: MultiSiteRuleSiteRow, form: MultiSiteRuleForm): number {
  if (!row.included) return 0
  let mandays = baseMandaysForSite(row.site) * row.samplingFactor
  if (form.considerations.considerTravelAccess && row.travelRequirements.length > 0) mandays += 0.5
  if (form.considerations.includePermitAccess && row.permitRequired) mandays += 0.5
  return mandays
}

export function calculateMandays(sites: Site[], form: MultiSiteRuleForm): MultiSiteRuleResult {
  const headOffice = sites.find((s) => s.id === form.headOfficeSiteId)
  const satellites = sites.filter((s) => s.id !== form.headOfficeSiteId)

  const totalBaseMandays = sites.reduce((sum, s) => sum + baseMandaysForSite(s), 0)

  // Which satellites actually get visited this cycle: sites the CAB already
  // flagged for sampling (additionalDetails.includeInSampling) take
  // priority; if fewer than the required sample size are flagged, fill the
  // rest in list order so the sample size requirement is still met.
  let sampledSatelliteSiteIds: string[]
  if (form.considerations.allowSamplingBetweenSites && satellites.length > 0) {
    const requiredSampleSize = Math.min(satellites.length, sampleSize(satellites.length))
    const flagged = satellites.filter((s) => s.additionalDetails?.includeInSampling)
    const rest = satellites.filter((s) => !s.additionalDetails?.includeInSampling)
    sampledSatelliteSiteIds = [...flagged, ...rest].slice(0, requiredSampleSize).map((s) => s.id)
  } else {
    sampledSatelliteSiteIds = satellites.map((s) => s.id)
  }

  const isExcluded = (id: string) => form.excludedSiteIds.includes(id)

  const rows: MultiSiteRuleSiteRow[] = sites.map((site) => {
    const isHeadOffice = site.id === form.headOfficeSiteId
    const sampledThisCycle = isHeadOffice || sampledSatelliteSiteIds.includes(site.id)
    return {
      site,
      isHeadOffice,
      role: isHeadOffice
        ? 'cab.applicationDraft.sitesFacilities.multiSiteRule.role.centralFunction'
        : 'cab.applicationDraft.sitesFacilities.multiSiteRule.role.coreSite',
      travelRequirements: site.additionalDetails?.travelRequirements ?? [],
      permitRequired: hasPermitRequirement(site),
      sampledThisCycle,
      samplingFactor: sampledThisCycle ? 1 : 0.3,
      included: !isExcluded(site.id) && sampledThisCycle,
    }
  })

  // Sites not sampled this cycle still get a lighter desk/document review
  // rather than a full visit, credited back at half their base mandays.
  let samplingAdjustment = 0
  if (form.considerations.sameScopeDevelopment) {
    const skipped = rows.filter((row) => !row.included)
    samplingAdjustment = -(skipped.reduce((sum, row) => sum + baseMandaysForSite(row.site), 0) * 0.5)
  }

  // Head office central functions already covered once at the head office
  // don't need re-checking at every included satellite.
  if (form.considerations.includeHeadOfficeFunctions && headOffice && form.centralFunctions.length > 0) {
    const includedSatellites = rows.filter((row) => !row.isHeadOffice && row.included).length
    samplingAdjustment -= 0.5 * includedSatellites
  }

  const visitedRows = rows.filter((row) => row.included)

  let travelAdjustment = 0
  if (form.considerations.considerTravelAccess) {
    travelAdjustment = visitedRows.filter((row) => row.travelRequirements.length > 0).length * 0.5
  }

  let permitAdjustment = 0
  if (form.considerations.includePermitAccess) {
    permitAdjustment = visitedRows.filter((row) => row.permitRequired).length * 0.5
  }

  const totalEstimatedMandays = Math.max(
    0,
    totalBaseMandays + samplingAdjustment + travelAdjustment + permitAdjustment
  )

  return {
    form,
    rows,
    sampledSatelliteSiteIds,
    totalBaseMandays,
    samplingAdjustment,
    travelAdjustment,
    permitAdjustment,
    totalEstimatedMandays,
  }
}
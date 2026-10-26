import type { MultiSiteRuleResult } from '@/lib/multiSiteRuleForm'

export interface SiteContact {
  name: string
  phone: string
  email: string
}

// Everything AddSitePage collects beyond the fields the Sites & Facilities
// table already shows (name/siteType/address/country/activities/employees/
// contact). Parked here as-is until we're told what to surface with it —
// the table intentionally doesn't read this yet.
export interface SiteAdditionalDetails {
  roleInMultiSite: string
  managementSystemType: string
  applicableStandards: string[]
  scopeActivities: string
  travelRequirements: string[]
  permitAccess: string
  estimatedTravelTime: string
  transportationNotes: string
  includeInSampling: boolean
  expectedSamples: string
  typeOfAudit: string
  surveillanceCycle: string
  otherSitesCovered: string[]
  designation: string
}

export interface Site {
  id: string
  name: string
  siteType: string
  address: string
  country: string
  activities: string[]
  employees: number
  contact: SiteContact
  /** Present for sites added via the full AddSitePage; absent for the older modal shape. */
  additionalDetails?: SiteAdditionalDetails
}

export interface SitesFacilitiesForm {
  sites: Site[]
  /** Set once the user applies a rule via ApplyMultiSiteRulePage; drives the summary cards on this step. */
  multiSiteRule?: MultiSiteRuleResult
}

export const emptySitesFacilitiesForm: SitesFacilitiesForm = {
  sites: [
    {
      id: 'site-1',
      name: 'Main HQ & Manufacturing Facility',
      siteType: 'Head Office',
      address: 'Plot 12, Industrial Area, Cairo',
      country: 'Egypt',
      activities: ['Management', 'Design & Development', 'Manufacturing'],
      employees: 120,
      contact: {
        name: 'Ahmed Hassan',
        phone: '+20 100 123 4567',
        email: 'ahmed.hassan@greenleaf.com',
      },
    },
    {
      id: 'site-2',
      name: 'Alexandria Logistics Hub',
      siteType: 'Warehouse',
      address: 'Free Zone, Port Area, Alexandria',
      country: 'Egypt',
      activities: ['Packing', 'Quality Control'],
      employees: 45,
      contact: {
        name: 'Mahmoud Ali',
        phone: '+20 111 987 6543',
        email: 'mahmoud.ali@greenleaf.com',
      },
    },
  ],
}

/** At least one site gates "Save & Continue". */
export function isSitesFacilitiesComplete(form: SitesFacilitiesForm): boolean {
  return form.sites.length > 0
}
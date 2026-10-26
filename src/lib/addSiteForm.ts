/**
 * Shared "add site" form model — every section of the CAB "Add site" page (site & location,
 * management system & scope, travel & access, sampling & surveillance, the IAF MD 1 register,
 * contact person) in one
 * value, with its completeness rule and the mapping to the certification-application branch
 * the API stores (`ApplicationBranch` + `siteDetails`).
 */

import { formatPhoneNumber } from '@/lib/api/authApi'
import type { ApplicationBranch, ApplicationSiteDetails } from '@/lib/api/certificationApplicationApi'
import type { CountryCode } from '@/lib/countries'
import { isValidEmailFormat, isValidPhoneNumber } from '@/lib/validators'

export type ManagementSystemType = NonNullable<ApplicationSiteDetails['managementSystemType']>

export interface AddSiteForm {
  location: {
    name: string
    /** One of SITE_MULTI_SITE_ROLE_OPTIONS */
    role: string
    country: CountryCode | null
    address: string
    /** Employees at the site (the API requires a head count on every branch) */
    employees: string
  }
  managementScope: {
    type: ManagementSystemType
    standards: string[]
    scopeActivities: string
  }
  travel: {
    requirements: string[]
    permitAccess: string
    estimatedTravelTime: string
    notes: string
  }
  sampling: {
    includeInSampling: boolean
    expectedSamples: string
    typeOfAudit: string
    surveillanceCycle: string
    /** Names of other sites of the same application this site's audit covers */
    otherSitesCovered: string[]
  }
  /** Multi-site register (IAF MD 1:2023) for the audit-time calculation. */
  register: {
    iafCodes: string[]
    siteType: 'PERMANENT' | 'TEMPORARY'
    temporaryEmployees: string
    sameProcesses: boolean
    isNewSite: boolean
    auditIndividually: boolean
    individualAuditReason: string
  }
  contact: {
    name: string
    designation: string
    phoneCountryCode: CountryCode
    phone: string
    email: string
  }
}

export type AddSiteSection = keyof AddSiteForm

export function emptyAddSiteForm(country: CountryCode = 'SA'): AddSiteForm {
  return {
    location: { name: '', role: '', country, address: '', employees: '' },
    managementScope: { type: 'INTEGRATED', standards: [], scopeActivities: '' },
    travel: { requirements: [], permitAccess: '', estimatedTravelTime: '', notes: '' },
    sampling: {
      includeInSampling: true,
      expectedSamples: '',
      typeOfAudit: '',
      surveillanceCycle: '',
      otherSitesCovered: [],
    },
    register: { iafCodes: [], siteType: 'PERMANENT', temporaryEmployees: '', sameProcesses: true, isNewSite: false, auditIndividually: false, individualAuditReason: '' },
    contact: { name: '', designation: '', phoneCountryCode: country, phone: '', email: '' },
  }
}

const filled = (value: string) => value.trim().length > 0
const wholeNumber = (value: string) => /^\d{1,6}$/.test(value.trim())

/** The minimum a site needs before it can be stored on the application (its name). */
export function canSaveAddSiteDraft(form: AddSiteForm): boolean {
  return filled(form.location.name) && (!filled(form.location.employees) || wholeNumber(form.location.employees)) && registerValid(form)
}

/** Register fields: temporary personnel a whole number; an individual audit needs a reason. */
const registerValid = (form: AddSiteForm) =>
  (!filled(form.register.temporaryEmployees) || wholeNumber(form.register.temporaryEmployees)) &&
  (!form.register.auditIndividually || form.register.individualAuditReason.trim().length >= 3)

/** Every required (*) field of the page, with valid formats. */
export function isAddSiteFormComplete(form: AddSiteForm): boolean {
  const { location, managementScope, travel, sampling, contact } = form
  return (
    filled(location.name) &&
    Boolean(location.role) &&
    Boolean(location.country) &&
    filled(location.address) &&
    wholeNumber(location.employees) &&
    Boolean(managementScope.type) &&
    managementScope.standards.length > 0 &&
    filled(managementScope.scopeActivities) &&
    Boolean(travel.permitAccess) &&
    Boolean(travel.estimatedTravelTime) &&
    wholeNumber(sampling.expectedSamples) &&
    Boolean(sampling.typeOfAudit) &&
    filled(contact.name) &&
    filled(contact.phone) &&
    isValidPhoneNumber(contact.phone, contact.phoneCountryCode) &&
    filled(contact.email) &&
    isValidEmailFormat(contact.email) &&
    registerValid(form)
  )
}

/** Site names already on the application, except `excludeName` (the site being edited). */
export function otherSiteNames(branches: ApplicationBranch[], excludeName?: string): string[] {
  const exclude = excludeName?.trim().toLowerCase()
  const names = branches
    .map((branch) => branch.branchName?.trim() ?? '')
    .filter((name) => name && name !== 'No Branch' && name.toLowerCase() !== exclude)
  return [...new Set(names)]
}

/** The branch the API stores for this form (core columns + the full `siteDetails`). */
export function addSiteFormToBranch(form: AddSiteForm): ApplicationBranch {
  const { location, managementScope, travel, sampling, contact, register } = form
  const employees = wholeNumber(location.employees) ? Number(location.employees.trim()) : 0
  const siteDetails: ApplicationSiteDetails = {
    roleInMultiSite: location.role,
    country: location.country ?? '',
    managementSystemType: managementScope.type,
    applicableStandards: managementScope.standards,
    travelRequirements: travel.requirements,
    permitAccess: travel.permitAccess,
    estimatedTravelTime: travel.estimatedTravelTime,
    transportationNotes: travel.notes.trim(),
    includeInSampling: sampling.includeInSampling,
    ...(wholeNumber(sampling.expectedSamples) ? { expectedSamples: Number(sampling.expectedSamples.trim()) } : {}),
    typeOfAudit: sampling.typeOfAudit,
    surveillanceCycle: sampling.surveillanceCycle,
    otherSitesCovered: sampling.otherSitesCovered,
    contactName: contact.name.trim(),
    contactDesignation: contact.designation.trim(),
    contactPhone: filled(contact.phone) ? formatPhoneNumber(contact.phoneCountryCode, contact.phone.trim()) : '',
    contactEmail: contact.email.trim(),
    siteType: register.siteType,
    iafCodes: register.iafCodes,
    ...(wholeNumber(register.temporaryEmployees) ? { temporaryEmployees: Number(register.temporaryEmployees.trim()) } : {}),
    sameProcesses: register.sameProcesses,
    isNewSite: register.isNewSite,
    auditIndividually: register.auditIndividually,
    ...(register.auditIndividually ? { individualAuditReason: register.individualAuditReason.trim() } : {}),
  }
  return {
    branchName: location.name.trim(),
    ...(filled(location.address) ? { address: location.address.trim() } : {}),
    employees,
    employeesInScope: employees,
    productionLines: 0,
    integratedSystem: managementScope.type === 'INTEGRATED',
    centralManagement: location.role === 'Central Office',
    ...(filled(managementScope.scopeActivities) ? { activities: managementScope.scopeActivities.trim() } : {}),
    siteDetails,
  }
}

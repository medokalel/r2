import { isDemoMode } from '@/lib/api/demo/demoStore'
import { CLIENTS } from '@/lib/api/demo/dataset'
import { listCabCertificationApplications, clientIdOf } from '@/lib/api/cabCertificationApplicationApi'
import { deriveClientCode, getCabClientProfile } from '@/lib/api/clientRegistrationApi'

/**
 * Option catalogs + the draft being edited for the CAB "Application Draft" form.
 *
 * The draft and its client come from the real API: the CAB's most recent DRAFT application
 * (GET /cab/certification-applications) and its client's profile (GET /cab-clients/:id/profile).
 * In the preview (demo mode) they come from the shared demo dataset. The option catalogs
 * below are still fixed lists (the backend has no lookup endpoints for them yet).
 */

// TODO: replace with a real lookup once the backend defines application types
export const APPLICATION_TYPE_OPTIONS: string[] = [
  'Initial Certification',
  'Recertification',
  'Scope Extension',
  'Transfer Certification',
]

// TODO: replace with a real lookup once the backend defines the standards catalog
export const STANDARD_OPTIONS: string[] = [
  'ISO 9001:2015 - Quality Management',
  'ISO 14001:2015 - Environmental Management',
  'ISO 45001:2018 - Occupational Health & Safety',
  'ISO 27001:2022 - Information Security',
  'ISO 22000:2018 - Food Safety Management',
]

// TODO: replace with a real lookup once the backend defines applicable schemes/programs
export const APPLICABLE_SCHEME_OPTIONS: string[] = ['IAF MD 22:2023', 'IAF MD 1:2018', 'IAF MD 5:2019']

// TODO: replace with GET /organizations?type=ACCREDITATION_BODY (or similar)
// once the backend exposes a way to search registered accreditation bodies
export const ACCREDITATION_BODY_OPTIONS: string[] = [
  'Emirates International',
  'Elsafa Company',
  'Gulf Accreditation Center',
  'National Accreditation Body',
]

// TODO: replace with a real lookup once the backend defines supported audit languages
export const AUDIT_LANGUAGE_OPTIONS: string[] = ['English', 'Arabic', 'French']

export interface DraftClientSummary {
  clientId: string
  legalEntityName: string
  tradingName: string
  organizationType: string
  country: string
  registrationNumber: string
  isRegistered: boolean
}

/** The draft the form is editing: its reference (order number once submitted) and its client. */
export interface DraftApplicationRef {
  id: string
  reference: string
  clientId: string
}

// Demo: the draft APP-0151 belongs to Red Sea Logistics in the shared dataset.
const DEMO_DRAFT_APPLICATION_ID = 'APP-0151'
const DEMO_DRAFT_CLIENT = CLIENTS[4]

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
const countryName = (code?: string | null) => {
  if (!code) return ''
  try {
    return /^[A-Za-z]{2}$/.test(code) ? regionNames.of(code.toUpperCase()) ?? code : code
  } catch {
    return code
  }
}

/** The CAB's most recent DRAFT application, or null when there is none. */
export async function getCurrentDraftApplication(): Promise<DraftApplicationRef | null> {
  if (isDemoMode()) {
    return { id: DEMO_DRAFT_APPLICATION_ID, reference: DEMO_DRAFT_APPLICATION_ID, clientId: DEMO_DRAFT_CLIENT.id }
  }
  const applications = await listCabCertificationApplications()
  const draft = applications
    .filter((a) => a.status === 'DRAFT')
    .sort((a, b) => String(b.updatedAt ?? b.createdAt ?? '').localeCompare(String(a.updatedAt ?? a.createdAt ?? '')))[0]
  if (!draft) return null
  return {
    id: draft.id,
    // Drafts get an order number on submission; until then the short id identifies them.
    reference: draft.orderNumber || draft.id.slice(0, 8).toUpperCase(),
    clientId: clientIdOf(draft),
  }
}

/** Client summary of the draft's client (or of `clientId` when given); null when there is no draft. */
export async function getDraftClientSummary(clientId?: string): Promise<DraftClientSummary | null> {
  if (isDemoMode()) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const c = CLIENTS.find((x) => x.id === clientId) ?? DEMO_DRAFT_CLIENT
    return {
      clientId: c.code,
      legalEntityName: c.name,
      tradingName: c.tradeName,
      organizationType: c.legalCapacity,
      country: c.country,
      registrationNumber: c.crNumber,
      isRegistered: true,
    }
  }
  // The form shows its placeholder while this is null, so a failed lookup resolves to null too.
  const id = clientId ?? (await getCurrentDraftApplication().catch(() => null))?.clientId
  if (!id) return null
  const data = await getCabClientProfile(id).catch(() => null)
  if (!data) return null
  return {
    clientId: deriveClientCode(id),
    legalEntityName: data.profile?.organizationName || data.organizationName || '',
    tradingName: data.profile?.tradeName ?? '',
    organizationType: data.originalRegistrationData?.legalCapacity ?? '',
    country: countryName(data.address?.country),
    registrationNumber: data.profile?.commercialRegisterNumber ?? '',
    isRegistered: (data.status || '').toUpperCase() === 'COMPLETED',
  }
}

export interface StandardSchemaOption {
  value: string
  name: string
  /** e.g. "Quality Management System" — auto-filled once a standard is picked. */
  certificationType: string
}

// TODO: replace with a real lookup once the backend exposes the standards/schemas catalog
export const STANDARD_SCHEMA_OPTIONS: StandardSchemaOption[] = [
  { value: 'ISO_9001_2015', name: 'ISO 9001:2015', certificationType: 'Quality Management System' },
  { value: 'ISO_14001_2015', name: 'ISO 14001:2015', certificationType: 'Environmental Management System' },
  {
    value: 'ISO_45001_2018',
    name: 'ISO 45001:2018',
    certificationType: 'Occupational Health & Safety Management System',
  },
  { value: 'ISO_27001_2022', name: 'ISO 27001:2022', certificationType: 'Information Security Management System' },
  { value: 'ISO_22000_2018', name: 'ISO 22000:2018', certificationType: 'Food Safety Management System' },
]

export interface IhfCodeOption {
  value: string
  /** e.g. "Engineering", "Other Services", "Construction" */
  category: string
}

// TODO: replace with a real lookup once the backend exposes the IHF (IAF/EA) code catalog
export const IHF_CODE_OPTIONS: IhfCodeOption[] = [
  { value: 'GP 34', category: 'Engineering' },
  { value: 'GP 19', category: 'Other Services' },
  { value: 'GP 24', category: 'Construction' },
  { value: 'GP 28', category: 'Health & Social Work' },
  { value: 'GP 33', category: 'Manufacturing' },
]

// TODO: replace with a real lookup once the backend defines site types
export const SITE_TYPE_OPTIONS: string[] = [
  'Head Office',
  'Manufacturing Site',
  'Warehouse',
  'Branch Office',
  'Laboratory',
]

// TODO: replace with a real lookup once the backend defines the activity catalog
export const SITE_ACTIVITY_OPTIONS: string[] = [
  'Management',
  'Sales & Marketing',
  'Design & Development',
  'Packing',
  'Manufacturing',
  'Assembly',
  'Quality Control',
  'Machining',
  'Welding',
  'Human Resources',
  'Testing',
]

// TODO: replace with a real lookup once the backend defines multi-site sampling roles
export const SITE_MULTI_SITE_ROLE_OPTIONS: string[] = [
  'Central Office',
  'Site',
  'Temporary Site',
]

// Fixed set — mirrors the "Site Indicators" legend, so keep the two lists in sync.
export const TRAVEL_REQUIREMENT_OPTIONS: string[] = [
  'Airplane Required',
  'Train Required',
  'Airplane & Train Required',
]

// TODO: replace with a real lookup once the backend defines permit/access types
export const PERMIT_ACCESS_OPTIONS: string[] = [
  'Not Required',
  'Visitor Permit',
  'Security Clearance',
  'Escort Required',
]

// TODO: replace with a real lookup once the backend defines travel time bands
export const ESTIMATED_TRAVEL_TIME_OPTIONS: string[] = [
  'Less than 1 hour',
  '1 - 3 hours',
  '3 - 6 hours',
  'More than 6 hours',
]

// TODO: replace with a real lookup once the backend defines audit types
export const TYPE_OF_AUDIT_OPTIONS: string[] = ['Stage 1', 'Stage 2', 'Surveillance', 'Recertification']

// TODO: replace with a real lookup once the backend defines surveillance cycles
export const SURVEILLANCE_CYCLE_OPTIONS: string[] = ['Annual', 'Semi-Annual', 'Biennial']
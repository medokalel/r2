import { ApiError, apiRequestWithAuth } from '@/lib/api/client'
import { getAuthToken } from '@/lib/authStorage'
import type { ClientRegistrationForm } from '@/lib/clientRegistrationForm'
import { getCountryCallingCode, getCountries, type CountryCode } from 'libphonenumber-js'
import type {
  OrganizationProfileData,
  OrgProfileInput,
  OrgAddressInput,
  OrgBranch,
  OrgBranchInput,
  OrgDocument,
  OrgDocumentType,
  SaveProfileRequest,
  SaveProfileResult,
} from '@/lib/api/organizationProfileApi'
import { notSet } from '@/lib/emptyValue'

export type CabClientStatus = 'DRAFT' | 'REGISTERED' | 'INACTIVE' | 'COMPLETED' | 'ACTIVE'

export interface CabAuditClientOwner {
  id: string
  fullName: string | null
  email: string | null
  phone: string | null
  status: string | null
}

export interface CabAuditClientListItem {
  id: string
  name: string
  tradeName: string | null
  type: string
  status: string
  profileStatus: string
  city: string | null
  address: string | null
  createdAt: string
  owner: CabAuditClientOwner | null
  /** ISO country, industry and site count — shown in the register when the API sends them. */
  countryCode?: string | null
  industry?: string | null
  sitesCount?: number | null
}

export interface CabClientList {
  items: CabAuditClientListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/** Fields from POST /cab-clients (and GET profile original + owner data). */
export interface CabClient {
  id: string
  code: string
  organizationName: string | null
  administrationName: string | null
  facilityOwnerManager: string | null
  activity: string | null
  legalCapacity: string | null
  country?: CountryCode | '' | null
  city: string | null
  email: string | null
  phoneCountryCode: string | null
  phoneNumber: string | null
  status: CabClientStatus
  createdAt: string | null
  logoUrl: string | null
  /** Not returned by the API yet — kept null until the backend adds a "registered by" field. */
  registeredBy: string | null
}

interface CreateClientResponse {
  message: string
  userId: string
  organizationId: string
}

interface SavedClientResponse {
  message: string
  client: CabClient
}

function requireToken(): string {
  const token = getAuthToken()
  if (!token) throw new ApiError('Authentication required', 401)
  return token
}

/** Single source of truth for the short client code shown across the app (register table, details page). */
export function deriveClientCode(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function toDialCode(country: CountryCode | ''): string {
  if (!country) return '+20'
  try {
    return `+${getCountryCallingCode(country)}`
  } catch {
    return '+20'
  }
}

function toPhone(country: CountryCode | '', number: string): string {
  const digits = digitsOnly(number)
  const dial = toDialCode(country).replace(/^\+/, '')
  return `+${dial}${digits}`.slice(0, 20)
}

function countryFromDial(dialOrCode: string | null | undefined): CountryCode {
  if (!dialOrCode) return 'EG'
  const normalized = dialOrCode.replace(/\s/g, '')
  if (/^[A-Z]{2}$/i.test(normalized)) return normalized.toUpperCase() as CountryCode
  const dialDigits = digitsOnly(normalized)
  for (const code of getCountries()) {
    try {
      if (getCountryCallingCode(code) === dialDigits) return code
    } catch {
      // skip invalid codes
    }
  }
  return 'EG'
}

function formFromValues(clientId: string, form: ClientRegistrationForm, status: CabClientStatus): CabClient {
  return {
    id: clientId,
    code: deriveClientCode(clientId),
    organizationName: form.organizationName,
    administrationName: form.administrationName,
    facilityOwnerManager: form.facilityOwnerManager,
    activity: form.activity,
    legalCapacity: form.legalCapacity,
    country: form.country,
    city: form.city,
    email: form.email,
    phoneCountryCode: form.phoneCountryCode,
    phoneNumber: form.phoneNumber,
    status,
    createdAt: null,
    logoUrl: null,
    registeredBy: null,
  }
}

function profileToClient(clientId: string, data: OrganizationProfileData): CabClient {
  const profile = data.profile ?? {}
  const address = data.address ?? {}
  const original = data.originalRegistrationData ?? {}
  const profileStatus = (data.status || 'DRAFT').toUpperCase()
  const status: CabClientStatus =
    profileStatus === 'COMPLETED' ? 'REGISTERED' : (profileStatus as CabClientStatus)

  return {
    id: clientId,
    code: deriveClientCode(clientId),
    organizationName: profile.organizationName ?? data.organizationName ?? null,
    administrationName: original.address ?? address.street ?? null,
    facilityOwnerManager: profile.authorizedPersonName ?? null,
    activity: original.activity ?? profile.companySummary ?? null,
    legalCapacity: original.legalCapacity ?? null,
    country: (address.country as CountryCode) || null,
    city: original.city ?? address.city ?? null,
    email: profile.email ?? null,
    phoneCountryCode: countryFromDial(profile.phoneCountryCode),
    phoneNumber: profile.phoneNumber ?? null,
    status,
    createdAt: profile.registrationDate ?? null,
    logoUrl: profile.logoUrl ?? null,
    registeredBy: null,
  }
}

function toCreatePayload(form: ClientRegistrationForm) {
  return {
    email: form.email.trim(),
    organizationName: form.organizationName.trim(),
    administrationName: form.administrationName.trim(),
    facilityOwnerManager: form.facilityOwnerManager.trim(),
    activity: form.activity.trim(),
    legalCapacity: form.legalCapacity.trim(),
    city: form.city.trim(),
    phone: toPhone(form.phoneCountryCode, form.phoneNumber),
  }
}

function toProfilePayload(form: ClientRegistrationForm): {
  profile: OrgProfileInput
  address: OrgAddressInput
} {
  return {
    profile: {
      organizationName: form.organizationName.trim() || undefined,
      authorizedPersonName: form.facilityOwnerManager.trim() || undefined,
      email: form.email.trim() || undefined,
      phoneCountryCode: toDialCode(form.phoneCountryCode),
      phoneNumber: digitsOnly(form.phoneNumber) || undefined,
      companySummary: form.activity.trim() || undefined,
    },
    address: {
      country: form.country || undefined,
      city: form.city.trim() || undefined,
      street: form.administrationName.trim() || undefined,
    },
  }
}

export function createCabClientAccount(form: ClientRegistrationForm): Promise<CreateClientResponse> {
  const payload = toCreatePayload(form)
  // Same shape the backend (Joi) uses, so the page formats local and server errors the same way.
  const issues: string[] = []
  const requireText = (field: string, value: string) => {
    if (!value) issues.push(`"${field}" is not allowed to be empty`)
    else if (value.length < 2) issues.push(`"${field}" length must be at least 2 characters long`)
  }
  requireText('email', payload.email)
  requireText('organizationName', payload.organizationName)
  requireText('administrationName', payload.administrationName)
  requireText('facilityOwnerManager', payload.facilityOwnerManager)
  requireText('activity', payload.activity)
  requireText('legalCapacity', payload.legalCapacity)
  requireText('city', payload.city)
  const phoneDigits = digitsOnly(form.phoneNumber)
  if (!phoneDigits) issues.push('"phone" is not allowed to be empty')
  else if (payload.phone.length < 7) issues.push('"phone" fails to match the required pattern')

  if (issues.length > 0) {
    throw new ApiError('Validation error', 400, issues)
  }

  return apiRequestWithAuth<CreateClientResponse>('/cab-clients', requireToken(), {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function listAllCabAuditClients(): Promise<CabAuditClientListItem[]> {
  const data = await apiRequestWithAuth<CabAuditClientListItem[]>('/cab-clients', requireToken())
  return Array.isArray(data) ? data : []
}

export interface ClientRegisterEntry {
  id: string
  code: string
  name: string
  countryCode: CountryCode | ''
  contactName: string
  contactEmail: string
  updatedAt: string
  city: string
  industry: string
  sitesCount: number | null
  status: string
}

export function toClientRegisterEntry(client: CabAuditClientListItem): ClientRegisterEntry {
  return {
    id: client.id,
    code: deriveClientCode(client.id),
    name: client.name || client.tradeName || notSet(),
    countryCode: (client.countryCode?.toUpperCase() as CountryCode | undefined) ?? '',
    contactName: client.owner?.fullName ?? '',
    contactEmail: client.owner?.email ?? '',
    updatedAt: client.createdAt,
    city: client.city ?? '',
    industry: client.industry ?? '',
    sitesCount: client.sitesCount ?? null,
    status: client.status ?? '',
  }
}

export function listCabClients(params: {
  page?: number
  limit?: number
  search?: string
  status?: CabClientStatus
} = {}): Promise<CabClientList> {
  const page = params.page ?? 1
  const limit = params.limit ?? 10

  return listAllCabAuditClients().then((clients) => {
    const search = params.search?.trim().toLowerCase() ?? ''
    const filtered = clients.filter((client) => {
      if (params.status) {
        const status = (client.profileStatus || client.status || '').toUpperCase()
        if (params.status === 'REGISTERED' && status !== 'COMPLETED') return false
        if (params.status === 'DRAFT' && status !== 'DRAFT') return false
        if (params.status === 'INACTIVE' && client.status !== 'INACTIVE') return false
      }
      if (!search) return true
      const haystack = [
        client.name,
        client.tradeName,
        client.city,
        client.address,
        client.owner?.fullName,
        client.owner?.email,
        client.owner?.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(search)
    })

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const start = (page - 1) * limit
    return {
      items: filtered.slice(start, start + limit),
      total,
      page,
      limit,
      totalPages,
    }
  })
}

export function getCabClientProfile(clientId: string): Promise<OrganizationProfileData> {
  return apiRequestWithAuth<OrganizationProfileData>(`/cab-clients/${clientId}/profile`, requireToken())
}

export async function getCabClient(clientId: string): Promise<CabClient> {
  const profile = await getCabClientProfile(clientId)
  const client = profileToClient(clientId, profile)
  if (!client.email || !client.facilityOwnerManager) {
    const listed = await listAllCabAuditClients()
    const match = listed.find((item) => item.id === clientId)
    if (match) {
      client.email = client.email || match.owner?.email || null
      client.facilityOwnerManager = client.facilityOwnerManager || match.owner?.fullName || null
      client.phoneNumber = client.phoneNumber || match.owner?.phone || null
      client.organizationName = client.organizationName || match.name || null
      client.city = client.city || match.city || null
      client.administrationName = client.administrationName || match.address || null
      client.createdAt = client.createdAt || match.createdAt || null
    }
  }
  return client
}

export function saveCabClientProfile(
  clientId: string,
  form: ClientRegistrationForm
): Promise<SaveProfileResult> {
  return saveCabClientCompanyProfile(clientId, toProfilePayload(form))
}

export function saveCabClientCompanyProfile(
  clientId: string,
  payload: SaveProfileRequest
): Promise<SaveProfileResult> {
  return apiRequestWithAuth<SaveProfileResult>(`/cab-clients/${clientId}/profile`, requireToken(), {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createCabClientBranch(
  clientId: string,
  payload: OrgBranchInput
): Promise<OrgBranch> {
  return apiRequestWithAuth<OrgBranch>(`/cab-clients/${clientId}/branches`, requireToken(), {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function uploadCabClientDocument(
  clientId: string,
  documentType: OrgDocumentType,
  file: File
): Promise<OrgDocument> {
  const formData = new FormData()
  formData.append('documentType', documentType)
  formData.append('file', file)
  return apiRequestWithAuth<OrgDocument>(`/cab-clients/${clientId}/documents`, requireToken(), {
    method: 'POST',
    body: formData,
  })
}

export function deleteCabClientDocument(
  clientId: string,
  documentId: string
): Promise<{ message: string }> {
  return apiRequestWithAuth<{ message: string }>(
    `/cab-clients/${clientId}/documents/${documentId}`,
    requireToken(),
    { method: 'DELETE' }
  )
}

export function submitCabClientProfile(
  clientId: string
): Promise<{ message: string; grantingAuthoritySerialNumber?: string }> {
  return apiRequestWithAuth<{ message: string; grantingAuthoritySerialNumber?: string }>(
    `/cab-clients/${clientId}/submit`,
    requireToken(),
    { method: 'POST' }
  )
}

export async function createCabClient(form: ClientRegistrationForm): Promise<SavedClientResponse> {
  const created = await createCabClientAccount(form)
  try {
    await saveCabClientProfile(created.organizationId, form)
    try {
      return { message: created.message, client: await getCabClient(created.organizationId) }
    } catch {
      return { message: created.message, client: formFromValues(created.organizationId, form, 'DRAFT') }
    }
  } catch (error) {
    if (error instanceof Error) {
      Object.assign(error, { organizationId: created.organizationId })
    }
    throw error
  }
}

export async function updateCabClient(
  clientId: string,
  form: ClientRegistrationForm
): Promise<SavedClientResponse> {
  await saveCabClientProfile(clientId, form)
  try {
    return { message: 'Client draft saved successfully.', client: await getCabClient(clientId) }
  } catch {
    return { message: 'Client draft saved successfully.', client: formFromValues(clientId, form, 'DRAFT') }
  }
}

export function cabClientToForm(client: CabClient): ClientRegistrationForm {
  return {
    email: client.email ?? '',
    organizationName: client.organizationName ?? '',
    administrationName: client.administrationName ?? '',
    facilityOwnerManager: client.facilityOwnerManager ?? '',
    activity: client.activity ?? '',
    legalCapacity: client.legalCapacity ?? '',
    country: (client.country as CountryCode) || 'EG',
    city: client.city ?? '',
    phoneCountryCode: (client.phoneCountryCode ?? 'EG') as CountryCode,
    phoneNumber: client.phoneNumber ?? '',
  }
}

export const LEGAL_CAPACITY_OPTIONS: string[] = [
  'Private Limited Company',
  'Public Limited Company',
  'Sole Proprietorship',
  'Partnership',
  'Government Entity',
  'Non-Profit Organization',
  'Limited Liability Company',
]

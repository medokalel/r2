import { authorizedRequest } from '@/lib/api/authorizedClient'

export type ProfileStatus = 'DRAFT' | 'COMPLETED'
export type BranchType = 'PERMANENT' | 'TEMPORARY'
export type OrgDocumentType =
  | 'NATIONAL_ADDRESS_CERTIFICATE'
  | 'ACTIVITY_LICENSE'
  | 'TAX_CARD'
  | 'COMMERCIAL_REGISTER'
  | 'OTHER'

export interface NationalAddressInput {
  hasNationalAddress?: boolean | null
  certificateNumber?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  street?: string | null
  buildingNumber?: string | null
  district?: string | null
  additionalNumber?: string | null
  postalCode?: string | null
  city?: string | null
}

export interface OrgProfileInput {
  organizationName?: string | null
  tradeName?: string | null
  commercialRegisterNumber?: string | null
  unifiedNumber?: string | null
  /** VAT registration number (15 digits, 3…3) — buyer VAT on ZATCA standard tax invoices. */
  vatNumber?: string | null
  authorizedPersonName?: string | null
  email?: string | null
  phoneCountryCode?: string | null
  phoneNumber?: string | null
  organizationStatus?: string | null
  registrationDate?: string | null
  employeeCount?: number | null
  industries?: string[] | null
  companySummary?: string | null
  logoUrl?: string | null
  allProductionLinesActive?: boolean | null
  inactiveReason?: string | null
  nationalAddress?: NationalAddressInput | null
}

export interface OrgAddressInput {
  country?: string | null
  city?: string | null
  district?: string | null
  street?: string | null
  buildingNumber?: string | null
  postalCode?: string | null
  additionalNumber?: string | null
  googleMapUrl?: string | null
  latitude?: number | null
  longitude?: number | null
}

export interface OrgBranchInput {
  branchName?: string | null
  commercialRegisterNumber?: string | null
  address?: string | null
  branchManagerName?: string | null
  phoneCountryCode?: string | null
  phoneNumber?: string | null
  employeeCount?: number | null
  industry?: string | null
  branchType?: BranchType | null
  googleMapUrl?: string | null
  latitude?: number | null
  longitude?: number | null
}

export interface OrgBranch extends OrgBranchInput {
  id: string
}

export interface OrgDocument {
  id: string
  documentType: OrgDocumentType
  originalName?: string | null
  fileName?: string | null
  fileUrl?: string | null
  mimeType?: string | null
  fileSize?: number | null
  createdAt?: string | null
}

export interface OriginalRegistrationData {
  activity?: string | null
  legalCapacity?: string | null
  city?: string | null
  address?: string | null
  authorizationLetterUrl?: string | null
}

export interface OrganizationProfileData {
  status: string
  organizationName?: string | null
  originalRegistrationData?: OriginalRegistrationData | null
  profile?: OrgProfileInput | null
  address?: OrgAddressInput | null
  branches?: OrgBranch[] | null
  documents?: OrgDocument[] | null
}

export interface SaveProfileRequest {
  profile?: OrgProfileInput
  address?: OrgAddressInput
}

export interface SaveProfileResult {
  message: string
  status: ProfileStatus
}

export interface PaginatedBranches {
  branches: OrgBranch[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function getOrganizationProfile(): Promise<OrganizationProfileData> {
  return authorizedRequest('/organizations/profile')
}

export function saveOrganizationProfile(
  payload: SaveProfileRequest
): Promise<SaveProfileResult> {
  return authorizedRequest('/organizations/profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function submitOrganizationProfile(): Promise<{ message: string }> {
  return authorizedRequest('/organizations/profile/submit', { method: 'POST' })
}

export function uploadOrganizationLogo(file: File): Promise<{ logoUrl?: string }> {
  const formData = new FormData()
  formData.append('logo', file)
  return authorizedRequest('/organizations/profile/logo', {
    method: 'POST',
    body: formData,
  })
}

export function deleteOrganizationLogo(): Promise<{ message: string }> {
  return authorizedRequest('/organizations/profile/logo', { method: 'DELETE' })
}

function normalizeBranches(data: unknown): OrgBranch[] {
  if (Array.isArray(data)) return data as OrgBranch[]
  if (data && typeof data === 'object' && Array.isArray((data as PaginatedBranches).branches)) {
    return (data as PaginatedBranches).branches
  }
  return []
}

export async function getBranches(): Promise<OrgBranch[]> {
  const data = await authorizedRequest<unknown>('/organizations/profile/branches')
  return normalizeBranches(data)
}

export function getBranchesPaginated(
  page = 1,
  limit = 10
): Promise<PaginatedBranches> {
  return authorizedRequest(
    `/organizations/profile/branches/paginated?page=${page}&limit=${limit}`
  )
}

export function createBranch(input: OrgBranchInput): Promise<OrgBranch> {
  return authorizedRequest('/organizations/profile/branches', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateBranch(id: string, input: OrgBranchInput): Promise<OrgBranch> {
  return authorizedRequest(`/organizations/profile/branches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteBranch(id: string): Promise<{ message: string }> {
  return authorizedRequest(`/organizations/profile/branches/${id}`, {
    method: 'DELETE',
  })
}

function normalizeDocuments(data: unknown): OrgDocument[] {
  if (Array.isArray(data)) return data as OrgDocument[]
  if (data && typeof data === 'object' && Array.isArray((data as { documents?: OrgDocument[] }).documents)) {
    return (data as { documents: OrgDocument[] }).documents
  }
  return []
}

export async function getOrganizationDocuments(): Promise<OrgDocument[]> {
  const data = await authorizedRequest<unknown>('/organizations/profile/documents')
  return normalizeDocuments(data)
}

export function uploadOrganizationDocument(
  documentType: OrgDocumentType,
  file: File
): Promise<OrgDocument> {
  const formData = new FormData()
  formData.append('documentType', documentType)
  formData.append('file', file)
  return authorizedRequest('/organizations/profile/documents/upload', {
    method: 'POST',
    body: formData,
  })
}

export function deleteOrganizationDocument(id: string): Promise<{ message: string }> {
  return authorizedRequest(`/organizations/profile/documents/${id}`, {
    method: 'DELETE',
  })
}

export function getOrganizationByOwner<T = Record<string, unknown>>(): Promise<T> {
  return authorizedRequest('/organizations/owner')
}

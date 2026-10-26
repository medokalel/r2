import { authorizedRequest } from '@/lib/api/authorizedClient'

/** POST /cab-employees — creates a CAB employee (User + CabEmployeeProfile atomically). */
export const CAB_EMPLOYEES_PATH = '/cab-employees'

/** Mirrors backend `CabMemberJobRole` enum. */
export const CAB_PROFESSIONAL_ROLES = [
  { value: 'GENERAL_MANAGER', label: 'General Manager' },
  { value: 'APPLICATIONS_RECEIVER', label: 'Applications Receiver' },
  { value: 'TECHNICAL_MANAGER', label: 'Technical Manager' },
  { value: 'CERTIFICATION_MANAGER', label: 'Certification Manager' },
  { value: 'BUSINESS_DEVELOPMENT_MANAGER', label: 'Business Development Manager' },
  { value: 'LEAD_AUDITOR', label: 'Lead Auditor' },
  { value: 'AUDITOR', label: 'Auditor' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'COMMITTEE_MEMBER', label: 'Committee Member' },
  { value: 'FREELANCE_AUDITOR', label: 'Freelance Auditor' },
] as const

export type CabProfessionalRole = (typeof CAB_PROFESSIONAL_ROLES)[number]['value']

export function getProfessionalRoleLabel(role: string): string {
  return CAB_PROFESSIONAL_ROLES.find((r) => r.value === role)?.label ?? role
}

export function toBackendRole(role?: string): CabProfessionalRole {
  if (!role) return 'AUDITOR'
  const found = CAB_PROFESSIONAL_ROLES.find(
    (r) => r.value === role || r.label.toLowerCase() === role.toLowerCase(),
  )
  if (found) return found.value
  if (role === 'Lead Auditor') return 'LEAD_AUDITOR'
  if (role === 'Technical Expert') return 'FREELANCE_AUDITOR'
  if (role === 'Decision Maker') return 'COMMITTEE_MEMBER'
  if (role === 'Reviewer') return 'APPLICATIONS_RECEIVER'
  return 'AUDITOR'
}

/** Formats IAF codes to the two-digit string format expected by the backend (e.g. '01', '03'). */
export function cleanIafCodes(codes?: string[]): string[] {
  if (!codes) return []
  return codes
    .map((c) => {
      const match = c.match(/(\d+)/)
      return match ? match[1].padStart(2, '0') : c.trim()
    })
    .filter(Boolean)
}

/** Combines phone and countryCode without duplicate dial codes. */
export function formatEmployeePhone(phone?: string | null, countryCode?: string | null): string {
  if (!phone) return ''
  const trimmedPhone = phone.trim()
  const trimmedCode = (countryCode || '').trim()

  if (!trimmedCode) return trimmedPhone
  if (trimmedPhone.startsWith(trimmedCode)) return trimmedPhone
  if (trimmedPhone.startsWith('+')) return trimmedPhone

  return `${trimmedCode} ${trimmedPhone}`.trim()
}

export interface CreateCabEmployeePayload {
  fullName: string
  email: string
  phone?: string
  phoneCountryCode?: string
  professionalRole: CabProfessionalRole
  employmentStartDate?: string
  /** null = still employed ("present"); must be on or after employmentStartDate. */
  employmentEndDate?: string | null
  iafCodes?: string[]
  schemes?: string[]
}

export interface CabEmployee {
  id: string
  userId: string
  cabId: string
  professionalRole: CabProfessionalRole | null
  imageUrl?: string | null
  employmentStartDate?: string | null
  /** null = still employed ("present") */
  employmentEndDate?: string | null
  expiryDate?: string | null
  iafCodes: string[]
  schemes: string[]
  status: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    fullName: string
    email: string
    phone?: string | null
    phoneCountryCode?: string | null
    status: string
  }
}

export interface CreateCabEmployeeResponse {
  message: string
  employee: CabEmployee
}

export function createCabEmployee(
  payload: CreateCabEmployeePayload,
): Promise<CreateCabEmployeeResponse> {
  return authorizedRequest<CreateCabEmployeeResponse>(CAB_EMPLOYEES_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface ListCabEmployeesResponse {
  employees?: CabEmployee[]
  items?: CabEmployee[]
  total?: number
}

export function listCabEmployees(params?: {
  page?: number
  limit?: number
  status?: string
  professionalRole?: string
}): Promise<ListCabEmployeesResponse | CabEmployee[]> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.status) query.set('status', params.status)
  if (params?.professionalRole) query.set('professionalRole', params.professionalRole)
  const qs = query.toString() ? `?${query.toString()}` : ''
  return authorizedRequest<ListCabEmployeesResponse | CabEmployee[]>(
    `${CAB_EMPLOYEES_PATH}${qs}`,
  )
}

export function uploadCabEmployeeImage(
  id: string,
  imageFile: File,
): Promise<{ message: string; employee: CabEmployee }> {
  const formData = new FormData()
  formData.append('image', imageFile)
  return authorizedRequest<{ message: string; employee: CabEmployee }>(
    `/cab-employees/${id}/image`,
    {
      method: 'PATCH',
      body: formData,
    },
  )
}

export interface CabEmployeeQualification {
  id: string
  documentType?: string | null
  fileUrl: string
  fileName?: string | null
  originalName?: string | null
  mimeType?: string | null
  fileSize?: number | null
  uploadedAt: string
}

export interface CabEmployeeDetail extends CabEmployee {
  qualifications?: CabEmployeeQualification[]
}

export function getCabEmployeeDetail(
  id: string,
): Promise<{ employee: CabEmployeeDetail }> {
  return authorizedRequest<{ employee: CabEmployeeDetail }>(
    `${CAB_EMPLOYEES_PATH}/${id}`,
  )
}

export function uploadCabEmployeeQualification(
  employeeId: string,
  file: File,
  documentType?: string,
): Promise<{ message: string; qualification: CabEmployeeQualification }> {
  const formData = new FormData()
  formData.append('document', file)
  if (documentType) {
    formData.append('documentType', documentType)
  }
  return authorizedRequest<{ message: string; qualification: CabEmployeeQualification }>(
    `${CAB_EMPLOYEES_PATH}/${employeeId}/qualifications`,
    {
      method: 'POST',
      body: formData,
    },
  )
}

export function deleteCabEmployeeQualification(
  employeeId: string,
  docId: string,
): Promise<{ message: string }> {
  return authorizedRequest<{ message: string }>(
    `${CAB_EMPLOYEES_PATH}/${employeeId}/qualifications/${docId}`,
    {
      method: 'DELETE',
    },
  )
}

export interface UpdateCabEmployeePayload {
  professionalRole?: CabProfessionalRole
  employmentStartDate?: string
  /** null = still employed ("present"); must be on or after the start date. */
  employmentEndDate?: string | null
  iafCodes?: string[]
  schemes?: string[]
}

export function updateCabEmployee(
  id: string,
  payload: UpdateCabEmployeePayload,
): Promise<{ message: string; employee: CabEmployee }> {
  return authorizedRequest<{ message: string; employee: CabEmployee }>(
    `${CAB_EMPLOYEES_PATH}/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export function updateCabEmployeeStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
): Promise<{ message: string; employee: CabEmployee }> {
  return authorizedRequest<{ message: string; employee: CabEmployee }>(
    `${CAB_EMPLOYEES_PATH}/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  )
}




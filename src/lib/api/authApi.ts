import type { EntityType } from '@/components/auth/EntityTypeOption'
import type { CountryCode } from '@/lib/countries'
import { getCountryCallingCode } from 'libphonenumber-js'
import { apiRequest } from '@/lib/api/client'

export type OrganizationType =
  | 'ACCREDITATION_BODY'
  | 'CERTIFICATION_BODY'
  | 'CONSULTATION_BODY'
  | 'AUDIT_CLIENT'

export interface LoginResponseData {
  token: string
  user: {
    id: string
    email: string
    phone: string | null
    status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
    role?: { id: string; name: string }
  }
  role: { id: string; name: string } | null
  organization: {
    membershipId: string
    status: 'ACTIVE' | 'INVITED' | 'SUSPENDED'
    id: string
    name: string
    type: OrganizationType
    legalCapacity?: string | null
    onboardingStatus?: 'DRAFT' | 'COMPLETED' | null
    onboardingCompleted?: boolean
  } | null
  cab?: {
    id: string
    setupCompleted: boolean
    status: string
  }
}

export interface RegisterPayload {
  entityType: EntityType
  email: string
  organizationName: string
  administrationName: string
  facilityOwnerManager: string
  activity: string
  legalCapacity: string
  city: string
  authorizationLetterUrl?: string
  phone: string
  password: string
  confirmPassword: string
}

export interface UploadAuthorizationLetterResult {
  message: string
  filePath: string
  fileUrl: string
  fileName: string
  mimeType: string
  sizeBytes: number
}

export function formatPhoneNumber(countryCode: CountryCode, mobile: string): string {
  const dialCode = getCountryCallingCode(countryCode)
  const digits = mobile.replace(/\D/g, '')
  return `+${dialCode}${digits}`
}

export async function sendVerificationCode(email: string): Promise<{ message: string }> {
  return apiRequest('/auth/send-verification-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function verifyEmail(
  email: string,
  code: string
): Promise<{ message: string }> {
  return apiRequest('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
}

export async function uploadAuthorizationLetter(
  file: File
): Promise<UploadAuthorizationLetterResult> {
  const formData = new FormData()
  formData.append('authorizationLetter', file)

  return apiRequest('/uploads/authorization-letter', {
    method: 'POST',
    body: formData,
  })
}

export async function register(payload: RegisterPayload): Promise<{
  message: string
  userId: string
  organizationId: string
}> {
  return apiRequest('/auth/register', {
    method: 'POST', 
    body: JSON.stringify({
      type: payload.entityType,
      email: payload.email,
      organizationName: payload.organizationName,
      administrationName: payload.administrationName,
      facilityOwnerManager: payload.facilityOwnerManager,
      activity: payload.activity,
      legalCapacity: payload.legalCapacity,
      city: payload.city,
      authorizationLetterUrl: payload.authorizationLetterUrl,
      phone: payload.phone,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
    }),
  })
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponseData> {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function sendResetCode(email: string): Promise<{ message: string }> {
  return apiRequest('/auth/forgot-password/send-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function verifyResetCode(
  email: string,
  code: string
): Promise<{ verified: boolean }> {
  return apiRequest('/auth/forgot-password/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
}

export async function resetPassword(payload: {
  email: string
  newPassword: string
  confirmNewPassword: string
}): Promise<{ message: string }> {
  return apiRequest('/auth/forgot-password/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function resendResetCode(email: string): Promise<{ message: string }> {
  return apiRequest('/auth/forgot-password/resend-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

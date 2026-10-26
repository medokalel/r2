import { authorizedRequest } from '@/lib/api/authorizedClient'
import { apiRequest } from '@/lib/api/client'
import { uploadOnboardingAsset } from '@/lib/api/uploadsApi'

export type CabOrganizationType =
  | 'CERTIFICATION_BODY'
  | 'INSPECTION_BODY'
  | 'TESTING_LABORATORY'
  | 'CALIBRATION_LABORATORY'

export type CabMarkType = 'CAB_LOGO' | 'ACCREDITATION_MARK' | 'SCHEME_MARK'

export interface CabBranchRecord {
  id?: string
  name: string
  country?: string | null
  city: string
  locationType?: string | null
  activities?: string | null
}

export interface CabAccreditationRecord {
  id?: string
  accreditationBody?: string | null
  accreditationStandard?: string | null
  accreditationNumber?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  status?: string | null
  certificateFileUrl?: string | null
  coveredByMla?: boolean
  setExpiryReminders?: boolean
}

export interface CabSchemeRecord {
  id?: string
  schemeName: string
  accreditationRecordId?: string | null
  location?: string | null
  approvedScopeCodes?: string[]
  scopeListFileUrl?: string | null
  allowApplicationsOnlyWithinScope?: boolean
  requireTechnicalReviewForExceptions?: boolean
  certificateNumberFormat?: string | null
}

export interface CabMarkRecord {
  id?: string
  markType: CabMarkType
  referenceId?: string | null
  fileUrl: string
  markReference?: string | null
  validFrom?: string | null
  validUntil?: string | null
  allowedDocumentUse?: string[]
}

export interface CabCertificateSignatory {
  schemeId: string
  schemeName?: string | null
  certificateNumberFormat?: string | null
  certificateValidity?: string | null
  certificateLanguage?: string | null
  certificateTemplate?: string | null
  signatoryName?: string | null
  signatoryTitle?: string | null
  signatoryImageUrl?: string | null
}

export interface CabCertificateSettings {
  certificateNumberFormat?: string | null
  certificateValidity?: string | null
  certificateLanguage?: string | null
  authorisedSignatory?: string | null
  signatories?: CabCertificateSignatory[]
  certificateTemplate?: string | null
  showCabLogo?: boolean
  showAccreditationMark?: boolean
  showQrCode?: boolean
  customSchemes?: Array<{
    schemeName: string
    owner?: string | null
    normativeDocument?: string | null
    version?: string | null
  }>
}

/** Payload for PATCH /cab-setup/draft — all fields optional for progressive save. */
export interface CabSetupDraftPayload {
  legalEntityName?: string | null
  tradingBrandName?: string | null
  organizationType?: CabOrganizationType | null
  registrationNumber?: string | null
  website?: string | null
  yearEstablished?: number | null
  country?: string | null
  city?: string | null
  mainOfficeAddress?: string | null
  timeZone?: string | null
  operatingLanguages?: string[]
  branches?: CabBranchRecord[]
  logoUrl?: string | null
  showLogoInEmailHeaders?: boolean
  showLogoOnCertificates?: boolean
  primaryColor?: string | null
  secondaryColor?: string | null
  accreditationStatus?: string | null
  numberOfAccreditationRecords?: number | null
  accreditationBody?: string | null
  accreditations?: CabAccreditationRecord[]
  primaryServiceMarket?: string | null
  schemeOwner?: string | null
  selectedServices?: string[]
  schemes?: CabSchemeRecord[]
  applyAccreditationMarkOnlyToAccreditedSchemes?: boolean
  blockMarkUseAfterExpiry?: boolean
  keepMarkUseAuditTrail?: boolean
  marks?: CabMarkRecord[]
  certificateSettings?: CabCertificateSettings | null
  cabActivity?: string[]
  signatoryTitle?: string | null
  signatorySignatureUrl?: string | null
}

export interface CabProfile {
  id: string
  slug: string
  legalEntityName: string | null
  tradingBrandName: string | null
  organizationType: CabOrganizationType | null
  registrationNumber: string | null
  website: string | null
  yearEstablished: number | null
  country: string | null
  city: string | null
  mainOfficeAddress: string | null
  timeZone: string | null
  operatingLanguages: string[]
  accreditationBody: string | null
  accreditationStatus: string | null
  numberOfAccreditationRecords: number | null
  primaryServiceMarket: string | null
  schemeOwner: string | null
  selectedServices: string[]
  logoUrl: string | null
  showLogoInEmailHeaders: boolean
  showLogoOnCertificates: boolean
  primaryColor: string | null
  secondaryColor: string | null
  applyAccreditationMarkOnlyToAccreditedSchemes: boolean
  blockMarkUseAfterExpiry: boolean
  keepMarkUseAuditTrail: boolean
  certificateSettings: CabCertificateSettings | null
  setupCompleted: boolean
  status: string
  branches: CabBranchRecord[]
  accreditations: CabAccreditationRecord[]
  schemes: CabSchemeRecord[]
  marks: CabMarkRecord[]
  cabActivity?: string[]
  signatoryTitle?: string | null
  signatorySignatureUrl?: string | null
}

export interface CabRegisterPayload {
  contactPersonName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

export interface CabRegisterResult {
  message: string
  userId: string
  cabId: string
}

export async function registerCab(payload: CabRegisterPayload): Promise<CabRegisterResult> {
  return apiRequest('/cab-auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getCabProfile(): Promise<{ cab: CabProfile }> {
  return authorizedRequest('/cab-profile')
}

export type CabProfileUpdatePayload = {
  organizationType?: CabOrganizationType
  legalEntityName?: string
  tradingBrandName?: string
  registrationNumber?: string
  website?: string | null
  yearEstablished?: number | null
  country?: string
  city?: string
  mainOfficeAddress?: string
  timeZone?: string
  operatingLanguages?: string[]
  accreditationBody?: string
  logoUrl?: string | null
  showLogoInEmailHeaders?: boolean
  showLogoOnCertificates?: boolean
  primaryColor?: string | null
  secondaryColor?: string | null
  cabActivity?: string[]
  signatoryTitle?: string | null
  signatorySignatureUrl?: string | null
  primaryServiceMarket?: string | null
  schemeOwner?: string | null
  selectedServices?: string[]
  applyAccreditationMarkOnlyToAccreditedSchemes?: boolean
  blockMarkUseAfterExpiry?: boolean
  keepMarkUseAuditTrail?: boolean
  certificateSettings?: {
    templateId?: string
    showQrCode?: boolean
    validityPeriodMonths?: number
  } | null
  accreditationStatus?: string | null
  numberOfAccreditationRecords?: number | null
}

export async function updateCabProfile(
  payload: CabProfileUpdatePayload
): Promise<{ message: string; cab: CabProfile }> {
  return authorizedRequest('/cab-profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function updateCabBranch(
  branchId: string,
  payload: Partial<Omit<CabBranchRecord, 'id'>>
): Promise<{ message: string; branch: CabBranchRecord }> {
  return authorizedRequest(`/cab-branches/${branchId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function updateCabAccreditation(
  accreditationId: string,
  payload: Partial<Omit<CabAccreditationRecord, 'id'>>
): Promise<{ message: string; accreditation: CabAccreditationRecord }> {
  return authorizedRequest(`/cab-accreditations/${accreditationId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function updateCabScheme(
  schemeId: string,
  payload: Partial<Omit<CabSchemeRecord, 'id'>>
): Promise<{ message: string; scheme: CabSchemeRecord }> {
  return authorizedRequest(`/cab-schemes/${schemeId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function saveCabSetupDraft(payload: CabSetupDraftPayload): Promise<{ message: string }> {
  return authorizedRequest('/cab-setup/draft', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function completeCabSetup(): Promise<{ message: string; cab: CabProfile }> {
  return authorizedRequest('/cab-setup/complete', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function uploadCabLogo(file: File): Promise<{ logoUrl?: string }> {
  const uploaded = await uploadOnboardingAsset(file)
  return { logoUrl: uploaded.fileUrl }
}

export async function deleteCabLogo(): Promise<{ message: string }> {
  return { message: 'Logo removed' }
}

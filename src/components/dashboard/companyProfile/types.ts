import type { CountryCode } from '@/components/auth/CountryCodeSelect'
import type { LatLng } from '@/components/maps/LocationPicker'
import type { OrgBranch, OrgDocument } from '@/lib/api/organizationProfileApi'

export type StepKey = 'basicData' | 'address' | 'branches' | 'officialDocs'

export const STEPS: StepKey[] = ['basicData', 'address', 'branches', 'officialDocs']

export const STEP_NUMBERS: Record<StepKey, number> = {
  basicData: 1,
  address: 2,
  branches: 3,
  officialDocs: 4,
}

export interface NationalAddressFormValues {
  hasNationalAddress: boolean
  certificateNumber: string
  issueDate: Date | undefined
  expiryDate: Date | undefined
  street: string
  buildingNumber: string
  district: string
  additionalNumber: string
  postalCode: string
  city: string
}

export const EMPTY_NATIONAL_ADDRESS: NationalAddressFormValues = {
  hasNationalAddress: true,
  certificateNumber: '',
  issueDate: undefined,
  expiryDate: undefined,
  street: '',
  buildingNumber: '',
  district: '',
  additionalNumber: '',
  postalCode: '',
  city: '',
}

export interface ProfileFormValues {
  // Step 1 – header
  companySummary: string
  industries: string[]
  logoUrl: string | null
  // Step 1 – basic data
  organizationName: string
  tradeName: string
  commercialRegisterNumber: string
  unifiedNumber: string
  /** VAT registration number (optional; printed as the buyer VAT on tax invoices). */
  vatNumber: string
  authorizedPersonName: string
  email: string
  countryCode: CountryCode
  phoneNumber: string
  organizationStatus: string
  employeeCount: string
  registrationDate: Date | undefined
  allProductionLinesActive: boolean
  inactiveReason: string
  // Step 2 – address (country is kept as an ISO code; mapped to a name for the API)
  country: CountryCode | null
  city: string
  district: string
  street: string
  buildingNumber: string
  postalCode: string
  additionalNumber: string
  googleMapUrl: string
  location: LatLng | null
  // Step 2 – national address (separate certificate-backed address, distinct from the general address above)
  nationalAddress: NationalAddressFormValues
}

export const EMPTY_PROFILE_FORM: ProfileFormValues = {
  companySummary: '',
  industries: [],
  logoUrl: null,
  organizationName: '',
  tradeName: '',
  commercialRegisterNumber: '',
  unifiedNumber: '',
  vatNumber: '',
  authorizedPersonName: '',
  email: '',
  countryCode: 'SA',
  phoneNumber: '',
  organizationStatus: '',
  employeeCount: '',
  registrationDate: undefined,
  allProductionLinesActive: true,
  inactiveReason: '',
  country: null,
  city: '',
  district: '',
  street: '',
  buildingNumber: '',
  postalCode: '',
  additionalNumber: '',
  googleMapUrl: '',
  location: null,
  nationalAddress: EMPTY_NATIONAL_ADDRESS,
}

export interface BranchFormValues {
  branchName: string
  commercialRegisterNumber: string
  address: string
  googleMapUrl: string
  branchManagerName: string
  countryCode: CountryCode | null
  phoneNumber: string
  sectors: string[]
  employeeCount: string
  branchType: 'permanent' | 'temporary'
  location: LatLng | null
}

export const EMPTY_BRANCH_FORM: BranchFormValues = {
  branchName: '',
  commercialRegisterNumber: '',
  address: '',
  googleMapUrl: '',
  branchManagerName: '',
  countryCode: null,
  phoneNumber: '',
  sectors: [],
  employeeCount: '',
  branchType: 'permanent',
  location: null,
}

export interface ProfileNotification {
  type: 'success' | 'error'
  message: string
}

export interface ProfileStepData {
  form: ProfileFormValues
  branches: OrgBranch[]
  documents: OrgDocument[]
}

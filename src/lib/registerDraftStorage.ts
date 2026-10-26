import type { EntityType } from '@/components/auth/EntityTypeOption'
import { DEFAULT_COUNTRY_CODE, type CountryCode } from '@/lib/countries'

const STORAGE_KEY = 'icasco-register-draft'

export interface RegisterDraft {
  step: number
  codeSent: boolean
  form: {
    entityType: EntityType | null
    governmentAgency: string
    email: string
    otp: string[]
    management: string
    facilityOwner: string
    legalCapacity: string
    authorizationFileName: string
    activity: string
    country: CountryCode
    governorate: string
    mobile: string
    agreePrivacy: boolean
  }
}

export function loadRegisterDraft(): RegisterDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as RegisterDraft & {
      form?: RegisterDraft['form'] & { countryCode?: CountryCode; city?: string }
    }
    if (!parsed?.form || typeof parsed.step !== 'number') return null

    return {
      step: Math.min(Math.max(parsed.step, 1), 4),
      codeSent: Boolean(parsed.codeSent),
      form: {
        entityType: parsed.form.entityType ?? null,
        governmentAgency: parsed.form.governmentAgency ?? '',
        email: parsed.form.email ?? '',
        otp: Array.isArray(parsed.form.otp) ? parsed.form.otp : [],
        management: parsed.form.management ?? '',
        facilityOwner: parsed.form.facilityOwner ?? '',
        legalCapacity: parsed.form.legalCapacity ?? '',
        authorizationFileName: parsed.form.authorizationFileName ?? '',
        activity: parsed.form.activity ?? '',
        country: parsed.form.country ?? parsed.form.countryCode ?? DEFAULT_COUNTRY_CODE,
        governorate: parsed.form.governorate ?? parsed.form.city ?? '',
        mobile: parsed.form.mobile ?? '',
        agreePrivacy: Boolean(parsed.form.agreePrivacy),
      },
    }
  } catch {
    return null
  }
}

export function saveRegisterDraft(draft: RegisterDraft) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // Ignore quota errors
  }
}

export function clearRegisterDraft() {
  localStorage.removeItem(STORAGE_KEY)
}

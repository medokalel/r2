import type { CountryCode } from '@/lib/countries'
import { isValidRequiredEmail, isValidPassword, passwordsMatch } from '@/lib/authValidation'
import { isValidPhoneNumber } from '@/lib/validators'

export interface AuditeeAccountBasicsForm {
  companyName: string
  name: string
  email: string
  mobileCountryCode: CountryCode
  mobile: string
  country: CountryCode
  city: string
  password: string
  confirmPassword: string
  agreePrivacy: boolean
}

export const emptyAuditeeAccountBasicsForm: AuditeeAccountBasicsForm = {
  companyName: '',
  name: '',
  email: '',
  mobileCountryCode: 'EG',
  mobile: '',
  country: '' as CountryCode,
  city: '',
  password: '',
  confirmPassword: '',
  agreePrivacy: false,
}

export function isAuditeeAccountBasicsComplete(form: AuditeeAccountBasicsForm): boolean {
  return Boolean(
    form.companyName.trim() &&
      form.name.trim() &&
      isValidRequiredEmail(form.email) &&
      isValidPhoneNumber(form.mobile, form.mobileCountryCode) &&
      form.country &&
      form.city &&
      isAuditeeAccountSetupComplete(form)
  )
}

export function isAuditeeAccountSetupComplete(form: AuditeeAccountBasicsForm): boolean {
  return Boolean(
    isValidPassword(form.password) &&
      passwordsMatch(form.password, form.confirmPassword) &&
      form.agreePrivacy
  )
}

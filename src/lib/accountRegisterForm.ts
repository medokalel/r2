import type { CountryCode } from '@/lib/countries'
import { isValidRequiredEmail, isValidPassword, passwordsMatch } from '@/lib/authValidation'
import { isValidPhoneNumber } from '@/lib/validators'

export interface AccountRegisterForm {
  fullName: string
  email: string
  mobileCountryCode: CountryCode
  mobile: string
  country: CountryCode
  password: string
  confirmPassword: string
  agreePrivacy: boolean
}

export const emptyAccountRegisterForm: AccountRegisterForm = {
  fullName: '',
  email: '',
  mobileCountryCode: 'EG',
  mobile: '',
  country: '' as CountryCode,
  password: '',
  confirmPassword: '',
  agreePrivacy: false,
}

export function isAccountRegisterComplete(form: AccountRegisterForm): boolean {
  return Boolean(
    form.fullName.trim() &&
      isValidRequiredEmail(form.email) &&
      isValidPhoneNumber(form.mobile, form.mobileCountryCode) &&
      form.country &&
      isValidPassword(form.password) &&
      passwordsMatch(form.password, form.confirmPassword) &&
      form.agreePrivacy
  )
}

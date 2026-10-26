import type { CountryCode } from '@/lib/countries'
import { isValidRequiredEmail, isValidPassword, passwordsMatch } from '@/lib/authValidation'
import { isValidFieldKind, isValidPhoneNumber } from '@/lib/validators'

export interface CabAccountBasicsForm {
  name: string
  email: string
  mobileCountryCode: CountryCode
  mobile: string
  country: CountryCode
  password: string
  confirmPassword: string
  agreePrivacy: boolean
}

export const emptyCabAccountBasicsForm: CabAccountBasicsForm = {
  name: '',
  email: '',
  mobileCountryCode: '' as CountryCode,
  mobile: '',
  country: '' as CountryCode,
  password: '',
  confirmPassword: '',
  agreePrivacy: false,
}

export function isCabAccountBasicsComplete(form: CabAccountBasicsForm): boolean {
  return Boolean(
    form.name.trim() &&
      isValidFieldKind(form.name, 'text') &&
      isValidRequiredEmail(form.email) &&
      form.mobileCountryCode &&
      form.mobile.trim() &&
      isValidPhoneNumber(form.mobile, form.mobileCountryCode) &&
      form.country &&
      isValidPassword(form.password) &&
      passwordsMatch(form.password, form.confirmPassword) &&
      form.agreePrivacy
  )
}

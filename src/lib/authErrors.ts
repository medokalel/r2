import type { TFunction } from 'i18next'
import { ApiError } from '@/lib/api/client'
import { CLIENT_REGISTRATION_FIELD_LABELS } from '@/lib/clientRegistrationForm'
import { getUserErrorMessage, logTechnicalError, type FieldLabelMap } from '@/lib/errorMessages'

export interface RegistrationAuthError {
  message: string
  emailAlreadyRegistered: boolean
}

export interface RegistrationAuthErrorOptions {
  /** Wording for specific HTTP statuses of the endpoint being called. */
  statusMessages?: Partial<Record<number, string>>
  fieldLabels?: FieldLabelMap
}

/** Readable names for the fields the /auth/* endpoints validate. */
export const AUTH_FIELD_LABELS: FieldLabelMap = {
  ...CLIENT_REGISTRATION_FIELD_LABELS,
  email: 'auth.email',
  password: 'auth.password',
  confirmPassword: 'register.confirmPassword',
  confirmNewPassword: 'register.confirmPassword',
}

/** /auth/verify-email and /auth/forgot-password/verify-code: any rejection means a wrong or expired code. */
export const VERIFY_CODE_STATUS_MESSAGES: Partial<Record<number, string>> = {
  400: 'register.invalidCode',
  401: 'register.invalidCode',
  404: 'register.invalidCode',
  410: 'register.invalidCode',
  422: 'register.invalidCode',
  429: 'register.tooManyAttempts',
}

/** /auth/login */
export const LOGIN_STATUS_MESSAGES: Partial<Record<number, string>> = {
  401: 'auth.errors.invalidCredentials',
  403: 'auth.errors.accountInactive',
}

/** /auth/forgot-password/send-code and resend-code */
export const FORGOT_SEND_STATUS_MESSAGES: Partial<Record<number, string>> = {
  404: 'auth.errors.emailNotFound',
}

/** /auth/forgot-password/reset-password */
export const FORGOT_RESET_STATUS_MESSAGES: Partial<Record<number, string>> = {
  403: 'auth.errors.accountInactive',
  404: 'auth.errors.emailNotFound',
}

export function getRegistrationAuthError(
  error: unknown,
  t: TFunction,
  options: RegistrationAuthErrorOptions = {},
): RegistrationAuthError {
  if (error instanceof ApiError && error.status === 409) {
    logTechnicalError(error)
    return { message: t('register.emailAlreadyRegistered'), emailAlreadyRegistered: true }
  }

  return {
    message: getUserErrorMessage(error, t, {
      statusMessages: options.statusMessages,
      fieldLabels: options.fieldLabels ?? AUTH_FIELD_LABELS,
    }),
    emailAlreadyRegistered: false,
  }
}

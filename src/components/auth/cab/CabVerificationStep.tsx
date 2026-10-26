import { useTranslation } from 'react-i18next'
import { FormLabel, TextField, fieldInputTextClassName } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { OtpInput } from '@/components/auth/OtpInput'
import { AppIcon, MailIcon } from '@/components/icons'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { englishDigitsClassName, toEnglishDigits } from '@/lib/englishDigits'
import { cn } from '@/lib/utils'

interface CabVerificationStepProps {
  email: string
  otp: string[]
  codeSent: boolean
  isSendingCode: boolean
  onEmailChange: (email: string) => void
  onOtpChange: (otp: string[]) => void
  onSendCode: () => void
  isVerifyingEmail?: boolean
  /** When false, OTP is sent automatically and the inline verify button is hidden. */
  showSendButton?: boolean
}

export function CabVerificationStep({
  email,
  otp,
  codeSent,
  isSendingCode,
  onEmailChange,
  onOtpChange,
  onSendCode,
  isVerifyingEmail = false,
  showSendButton = true,
}: CabVerificationStepProps) {
  const { t } = useTranslation()
  const emailValid = isValidRequiredEmail(email)
  const emailError = email.trim().length > 0 && !emailValid ? t('validation.invalidEmail') : undefined

  if (!showSendButton) {
    return (
      <div className="w-full space-y-6">
        <TextField
          id="cab-verification-email"
          label={t('auth.email')}
          icon={MailIcon}
          required
          type="email"
          lang="en"
          value={email}
          readOnly
        />

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-body-1-medium text-neutral-900">{t('register.emailVerification')}</p>
            <p className="text-body-2 text-neutral-600">
              {isSendingCode ? t('register.sendingCodeToEmail') : t('register.codeSentPrompt')}
            </p>
          </div>
          <OtpInput
            value={otp}
            onChange={onOtpChange}
            disabled={!codeSent || isSendingCode || isVerifyingEmail}
          />
          {isVerifyingEmail && (
            <p className="text-center text-body-2 text-primary">{t('register.verifyingEmail')}</p>
          )}
          {codeSent && (
            <button
              type="button"
              onClick={onSendCode}
              disabled={isSendingCode}
              className="text-body-2-semibold text-primary underline underline-offset-2 disabled:opacity-50"
            >
              {isSendingCode ? t('register.sendingCode') : t('register.resendCode')}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-3">
        <FormLabel htmlFor="cab-verification-email" required>
          {t('auth.email')}
        </FormLabel>
        <div
          className={cn(
            'flex h-12 items-center gap-3 rounded-md border bg-white ps-4 pe-1.5',
            emailError ? 'border-error-400' : 'border-neutral-300'
          )}
        >
          <AppIcon icon={MailIcon} size={20} className="shrink-0 text-primary" />
          <input
            id="cab-verification-email"
            type="email"
            lang="en"
            placeholder={t('ui.emailPlaceholder')}
            value={email}
            onChange={(e) => onEmailChange(toEnglishDigits(e.target.value))}
            className={cn(
              'min-w-0 flex-1 bg-transparent pe-1 focus:outline-none',
              fieldInputTextClassName,
              englishDigitsClassName
            )}
          />
          <Button
            type="button"
            variant="primary"
            onClick={onSendCode}
            disabled={!emailValid || isSendingCode}
            className={cn(
              'h-10 w-[131px] shrink-0 gap-2.5 rounded-md px-6',
              'text-body-2-semibold lowercase'
            )}
          >
            {isSendingCode ? t('register.sendingCode') : t('register.verify')}
          </Button>
        </div>
        {emailError && <p className="text-caption text-error-700">{emailError}</p>}
      </div>

      {codeSent && (
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-body-1-medium text-neutral-900">{t('register.emailVerification')}</p>
            <p className="text-body-2 text-neutral-600">{t('register.codeSentPrompt')}</p>
          </div>
          <OtpInput
            value={otp}
            onChange={onOtpChange}
            disabled={isVerifyingEmail}
          />
          {isVerifyingEmail && (
            <p className="text-center text-body-2 text-primary">{t('register.verifyingEmail')}</p>
          )}
        </div>
      )}
    </div>
  )
}
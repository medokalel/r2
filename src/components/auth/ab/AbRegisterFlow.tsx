import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppIcon, SuccessCheckIcon } from '@/components/icons'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { AbStepNav } from '@/components/auth/ab/AbStepNav'
import { AbAccountBasicsStep } from '@/components/auth/ab/AbAccountBasicsStep'
import { AbVerificationStep } from '@/components/auth/ab/AbVerificationStep'
import { emptyAbAccountBasicsForm, isAbAccountBasicsComplete, type AbAccountBasicsForm } from '@/lib/abAccountBasicsForm'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { sendVerificationCode, verifyEmail, register, formatPhoneNumber } from '@/lib/api/authApi'
import { ROUTES } from '@/lib/routes'
import { ApiError } from '@/lib/api/client'
import { getCountryOptions } from '@/lib/countries'
import { useAutoVerifyOtp } from '@/hooks/useAutoVerifyOtp'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { cn } from '@/lib/utils'

interface AbRegisterFlowProps {
  /** Lets the user back out to entity-type selection from AB step 1. */
  onBackToEntityType: () => void
  /** Lets the parent page hide chrome (e.g. the "Log in" link) on the final success screen. */
  onSubmittedChange?: (submitted: boolean) => void
}

const emptyOtp = () => Array.from({ length: 6 }, () => '')

export function AbRegisterFlow({ onBackToEntityType, onSubmittedChange }: AbRegisterFlowProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [createAccountError, setCreateAccountError] = useState<string | null>(null)
  const [basicsForm, setBasicsForm] = useState<AbAccountBasicsForm>(emptyAbAccountBasicsForm)
  const [submitted, setSubmitted] = useState(false)

  // Step 2 ("verification") — same email + OTP pattern as RegisterPage.
  const [verificationEmail, setVerificationEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(emptyOtp())
  const [codeSent, setCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const patchBasics = (f: Partial<AbAccountBasicsForm>) =>
    setBasicsForm((prev) => ({ ...prev, ...f }))

  const emailValid = isValidRequiredEmail(verificationEmail)
  const otpComplete = otp.every((digit) => digit.length === 1)

  const handleSendCode = async () => {
    if (!emailValid || isSendingCode) return
    setIsSendingCode(true)
    setVerificationError(null)
    try {
      await sendVerificationCode(verificationEmail.trim())
      setCodeSent(true)
      setEmailVerified(false)
      setOtp(emptyOtp())
    } catch (error) {
      setVerificationError(error instanceof ApiError ? error.message : t('errors.generic'))
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyAndContinue = useCallback(async () => {
    if (!emailValid || !otpComplete || isVerifyingEmail) return
    setIsVerifyingEmail(true)
    setVerificationError(null)
    try {
      await verifyEmail(verificationEmail.trim(), otp.join(''))
      setEmailVerified(true)
    } catch (error) {
      setVerificationError(error instanceof ApiError ? error.message : t('errors.generic'))
      setOtp(emptyOtp())
    } finally {
      setIsVerifyingEmail(false)
    }
  }, [emailValid, otpComplete, isVerifyingEmail, verificationEmail, otp, t])

  useAutoVerifyOtp({
    active: step === 2,
    otp,
    codeSent,
    emailVerified,
    isVerifyingEmail,
    emailValid,
    onVerify: handleVerifyAndContinue,
  })

  const handleBack = () => {
    if (step === 1) {
      onBackToEntityType()
      return
    }
    setStep(1)
  }

  const handleCreateAccount = useCallback(async () => {
    if (isCreatingAccount) return
    setIsCreatingAccount(true)
    setCreateAccountError(null)
    try {
      const countryName =
        getCountryOptions(i18n.language).find((c) => c.code === basicsForm.country)?.name ??
        basicsForm.country

      await register({
        entityType: 'ACCREDITATION_BODY',
        email: verificationEmail,
        organizationName: basicsForm.abName,
        administrationName: basicsForm.abName,
        facilityOwnerManager: basicsForm.abName,
        activity: basicsForm.abName,
        legalCapacity: basicsForm.abName,
        city: countryName,
        phone: formatPhoneNumber(basicsForm.mobileCountryCode, basicsForm.mobile),
        password: basicsForm.password,
        confirmPassword: basicsForm.confirmPassword,
      })

      setSubmitted(true)
      onSubmittedChange?.(true)
    } catch (error) {
      setCreateAccountError(error instanceof ApiError ? error.message : t('errors.generic'))
    } finally {
      setIsCreatingAccount(false)
    }
  }, [
    basicsForm.abName,
    basicsForm.confirmPassword,
    basicsForm.country,
    basicsForm.mobile,
    basicsForm.mobileCountryCode,
    basicsForm.password,
    i18n.language,
    isCreatingAccount,
    onSubmittedChange,
    t,
    verificationEmail,
  ])

  // Once the email is verified on step 2, create the account. The request is
  // started from a promise callback so its loading state is not set
  // synchronously inside the effect.
  useEffect(() => {
    if (step !== 2 || !emailVerified || isCreatingAccount) return
    void Promise.resolve().then(handleCreateAccount)
  }, [step, emailVerified, isCreatingAccount, handleCreateAccount])

  const handleNext = () => {
    if (step === 1) {
      setVerificationEmail(basicsForm.email)
      setStep(2)
    }
  }

  const nextDisabled = step === 1 ? !isAbAccountBasicsComplete(basicsForm) : true

  const nextLabel =
    step === 2 && isCreatingAccount ? t('register.creatingAccount') : t('common.next')

  if (submitted) {
    return (
      <div className="flex min-h-[520px] w-full flex-col items-center justify-center text-center">
        <AppIcon icon={SuccessCheckIcon} size={140} className="mb-6" />
        <h1 className="text-h1 mb-3 text-success-600">{t('register.ab.summary.submittedTitle')}</h1>
        <p className="text-body-2 mb-8 max-w-md text-neutral-600">
          {t('register.ab.summary.submittedDescription')}
        </p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.login)}
          className={cn(buttonVariants({ variant: 'primary', size: 'default' }))}
        >
          {t('register.ab.summary.goToLogin')}
        </button>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-page-title text-text-primary mb-6">{t('register.ab.title')}</h1>

      <p className="text-body-2 text-neutral-600 -mt-4 mb-6">
        {t('register.selectedEntityLabel')}{' '}
        <span className="text-body-2-semibold text-neutral-900">
          {t('register.accreditationBodies')}
        </span>{' '}
        ·{' '}
        <button
          type="button"
          onClick={onBackToEntityType}
          className="text-body-2-semibold text-primary underline underline-offset-2"
        >
          {t('common.change')}
        </button>
      </p>

      <AbStepNav current={step} className="mb-6" />

      {step === 1 && <AbAccountBasicsStep form={basicsForm} onPatch={patchBasics} />}
      {step === 2 && (
        <AbVerificationStep
          email={verificationEmail}
          otp={otp}
          codeSent={codeSent}
          isSendingCode={isSendingCode}
          isVerifyingEmail={isVerifyingEmail}
          onEmailChange={setVerificationEmail}
          onOtpChange={setOtp}
          onSendCode={() => void handleSendCode()}
        />
      )}

      {verificationError && step === 2 && (
        <p className="text-small-light text-error-700 mt-4">{verificationError}</p>
      )}
      {step === 2 && isCreatingAccount && (
        <p className="mt-4 text-center text-body-2 text-primary">{t('register.creatingAccount')}</p>
      )}
      {createAccountError && step === 2 && (
        <p className="text-small-light text-error-700 mt-4">{createAccountError}</p>
      )}

      <AuthStepActions
        className="mt-8"
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={nextLabel}
        nextDisabled={nextDisabled}
        showNext={step === 1}
        showBack
      />
    </>
  )
}

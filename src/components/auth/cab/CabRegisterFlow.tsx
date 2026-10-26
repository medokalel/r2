import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { CabStepNav } from '@/components/auth/cab/CabStepNav'
import { CabAccountBasicsStep } from '@/components/auth/cab/CabAccountBasicsStep'
import { CabVerificationStep } from '@/components/auth/cab/CabVerificationStep'
import { emptyCabAccountBasicsForm, isCabAccountBasicsComplete, type CabAccountBasicsForm } from '@/lib/cabAccountBasicsForm'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { sendVerificationCode, verifyEmail, login, formatPhoneNumber } from '@/lib/api/authApi'
import { registerCab } from '@/lib/api/cabApi'
import { saveAuthSession } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { useAutoVerifyOtp } from '@/hooks/useAutoVerifyOtp'

interface CabRegisterFlowProps {
  /** Lets the user back out to entity-type selection from CAB step 1. */
  onBackToEntityType: () => void
}

const emptyOtp = () => Array.from({ length: 6 }, () => '')

export function CabRegisterFlow({ onBackToEntityType }: CabRegisterFlowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [basicsForm, setBasicsForm] = useState<CabAccountBasicsForm>(emptyCabAccountBasicsForm)

  // Step 2 ("verification") — same email + OTP pattern as RegisterPage.
  const [verificationEmail, setVerificationEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(emptyOtp())
  const [codeSent, setCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)

  const patchBasics = (f: Partial<CabAccountBasicsForm>) =>
    setBasicsForm((prev) => ({ ...prev, ...f }))

  const emailValid = isValidRequiredEmail(verificationEmail)
  const otpComplete = otp.every((digit) => digit.length === 1)

  const handleSendCode = async () => {
    if (!emailValid || isSendingCode) return
    setIsSendingCode(true)
    try {
      await sendVerificationCode(verificationEmail.trim())
      setCodeSent(true)
      setEmailVerified(false)
      setOtp(emptyOtp())
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyAndContinue = useCallback(async () => {
    if (!emailValid || !otpComplete || isVerifyingEmail) return
    setIsVerifyingEmail(true)
    try {
      await verifyEmail(verificationEmail.trim(), otp.join(''))
      setEmailVerified(true)
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
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
    try {
      await registerCab({
        contactPersonName: basicsForm.name.trim(),
        email: verificationEmail.trim(),
        phone: formatPhoneNumber(basicsForm.mobileCountryCode, basicsForm.mobile),
        password: basicsForm.password,
        confirmPassword: basicsForm.confirmPassword,
      })

      const session = await login(verificationEmail.trim(), basicsForm.password)
      saveAuthSession(session, true)
      navigate(ROUTES.onboarding)
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
    } finally {
      setIsCreatingAccount(false)
    }
  }, [
    basicsForm.confirmPassword,
    basicsForm.mobile,
    basicsForm.mobileCountryCode,
    basicsForm.name,
    basicsForm.password,
    isCreatingAccount,
    navigate,
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

  const nextDisabled = step === 1 ? !isCabAccountBasicsComplete(basicsForm) : true

  const nextLabel =
    step === 2 && isCreatingAccount ? t('register.creatingAccount') : t('common.next')

  return (
    <>
      <h1 className="text-page-title text-text-primary mb-6">{t('register.cab.title')}</h1>

      <p className="text-body-2 text-neutral-600 -mt-4 mb-6">
        {t('register.selectedEntityLabel')}{' '}
        <span className="text-body-2-semibold text-neutral-900">
          {t('register.certificationBodies')}
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

      <CabStepNav current={step} className="mb-6" />

      {step === 1 && <CabAccountBasicsStep form={basicsForm} onPatch={patchBasics} />}
      {step === 2 && (
        <CabVerificationStep
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

      {step === 2 && isCreatingAccount && (
        <p className="mt-4 text-center text-body-2 text-primary">{t('register.creatingAccount')}</p>
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

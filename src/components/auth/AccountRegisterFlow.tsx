import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { AccountBasicsStep } from '@/components/auth/AccountBasicsStep'
import { CabVerificationStep } from '@/components/auth/cab/CabVerificationStep'
import {
  emptyAccountRegisterForm,
  isAccountRegisterComplete,
  type AccountRegisterForm,
} from '@/lib/accountRegisterForm'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { sendVerificationCode, verifyEmail, formatPhoneNumber } from '@/lib/api/authApi'
import { getRegistrationAuthError, VERIFY_CODE_STATUS_MESSAGES } from '@/lib/authErrors'
import { toast } from '@/lib/toast'
import { ROUTES } from '@/lib/routes'
import { getCountryOptions } from '@/lib/countries'
import { savePendingRegistration } from '@/lib/pendingRegistrationStorage'
import { useAutoVerifyOtp } from '@/hooks/useAutoVerifyOtp'

interface AccountRegisterFlowProps {
  onBackToRegistrationType?: () => void
  onSubmittedChange?: (submitted: boolean) => void
}

const emptyOtp = () => Array.from({ length: 6 }, () => '')

export function AccountRegisterFlow({
  onBackToRegistrationType,
  onSubmittedChange,
}: AccountRegisterFlowProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [isContinuing, setIsContinuing] = useState(false)
  const [form, setForm] = useState<AccountRegisterForm>(emptyAccountRegisterForm)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(emptyOtp())
  const [codeSent, setCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailAlreadyRegistered, setEmailAlreadyRegistered] = useState(false)

  const sendInFlightRef = useRef(false)

  const patch = (fields: Partial<AccountRegisterForm>) => setForm((prev) => ({ ...prev, ...fields }))

  const emailValid = isValidRequiredEmail(verificationEmail)
  const otpComplete = otp.every((digit) => digit.length === 1)

  const handleSendCode = async (emailOverride?: string): Promise<boolean> => {
    const targetEmail = (emailOverride ?? verificationEmail).trim()
    if (!isValidRequiredEmail(targetEmail) || isSendingCode || sendInFlightRef.current) return false

    sendInFlightRef.current = true
    setIsSendingCode(true)
    setEmailAlreadyRegistered(false)

    try {
      await sendVerificationCode(targetEmail)
      setCodeSent(true)
      setEmailVerified(false)
      setOtp(emptyOtp())
      return true
    } catch (error) {
      const authError = getRegistrationAuthError(error, t)
      toast.error(authError.message)
      setEmailAlreadyRegistered(authError.emailAlreadyRegistered)
      return false
    } finally {
      sendInFlightRef.current = false
      setIsSendingCode(false)
    }
  }

  const handleContinueToOnboarding = useCallback(() => {
    if (isContinuing) return
    setIsContinuing(true)

    const countryName =
      getCountryOptions(i18n.language).find((country) => country.code === form.country)?.name ??
      form.country

    savePendingRegistration({
      email: verificationEmail.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      phone: formatPhoneNumber(form.mobileCountryCode, form.mobile),
      fullName: form.fullName.trim(),
      country: form.country,
      countryName,
    })

    onSubmittedChange?.(true)
    navigate(ROUTES.onboarding)
  }, [
    form.confirmPassword,
    form.country,
    form.fullName,
    form.mobile,
    form.mobileCountryCode,
    form.password,
    i18n.language,
    isContinuing,
    navigate,
    onSubmittedChange,
    verificationEmail,
  ])

  const handleVerifyAndContinue = useCallback(async () => {
    if (!emailValid || !otpComplete || isVerifyingEmail) return
    setIsVerifyingEmail(true)
    setEmailAlreadyRegistered(false)
    try {
      await verifyEmail(verificationEmail.trim(), otp.join(''))
      setEmailVerified(true)
      handleContinueToOnboarding()
    } catch (error) {
      const authError = getRegistrationAuthError(error, t, { statusMessages: VERIFY_CODE_STATUS_MESSAGES })
      toast.error(authError.message)
      setEmailAlreadyRegistered(authError.emailAlreadyRegistered)
      setOtp(emptyOtp())
    } finally {
      setIsVerifyingEmail(false)
    }
  }, [
    emailValid,
    handleContinueToOnboarding,
    isVerifyingEmail,
    otp,
    otpComplete,
    t,
    verificationEmail,
  ])

  useAutoVerifyOtp({
    active: step === 2,
    otp,
    codeSent,
    emailVerified,
    isVerifyingEmail,
    emailValid,
    onVerify: handleVerifyAndContinue,
  })

  const handleBackToBasics = () => {
    setStep(1)
    setCodeSent(false)
    setOtp(emptyOtp())
    setEmailVerified(false)
    setEmailAlreadyRegistered(false)
  }

  const handleNext = () => {
    if (step === 1) {
      if (isSendingCode) return
      const email = form.email.trim()
      setVerificationEmail(email)
      void handleSendCode(email).then((sent) => {
        if (sent) setStep(2)
      })
    }
  }

  const nextDisabled = step === 1 ? !isAccountRegisterComplete(form) || isSendingCode : true

  const nextLabel =
    step === 1 && isSendingCode ? t('register.sendingCode') : t('common.next')

  return (
    <>
      <h1 className="text-page-title text-text-primary mb-6">{t('register.title')}</h1>
      <p className="text-body-2 text-neutral-600 -mt-4 mb-6">{t('register.account.subtitle')}</p>

      {step === 1 && <AccountBasicsStep form={form} onPatch={patch} />}
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
          showSendButton={false}
        />
      )}

      {emailAlreadyRegistered && (
        <p className="mt-4 text-body-2 text-neutral-600">
          <Link to={ROUTES.login} className="text-body-2-semibold text-primary underline underline-offset-2">
            {t('auth.signIn')}
          </Link>
        </p>
      )}
      <AuthStepActions
        className="mt-8"
        onBack={step === 1 ? onBackToRegistrationType : handleBackToBasics}
        onNext={handleNext}
        nextLabel={nextLabel}
        nextDisabled={nextDisabled}
        showNext={step === 1}
        showBack={step === 2 || Boolean(onBackToRegistrationType)}
      />
    </>
  )
}

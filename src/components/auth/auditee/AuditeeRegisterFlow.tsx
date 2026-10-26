import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppIcon, SuccessCheckIcon } from '@/components/icons'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { AuditeeStepNav } from '@/components/auth/auditee/AuditeeStepNav'
import { AuditeeAccountBasicsStep } from '@/components/auth/auditee/AuditeeAccountBasicsStep'
import { AuditeeVerificationStep } from '@/components/auth/auditee/AuditeeVerificationStep'
import {
  emptyAuditeeAccountBasicsForm,
  isAuditeeAccountBasicsComplete,
  type AuditeeAccountBasicsForm,
} from '@/lib/auditeeAccountBasicsForm'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { sendVerificationCode, verifyEmail, register, formatPhoneNumber } from '@/lib/api/authApi'
import { getRegistrationAuthError, VERIFY_CODE_STATUS_MESSAGES } from '@/lib/authErrors'
import { toast } from '@/lib/toast'
import { ROUTES } from '@/lib/routes'
import { getCountryOptions } from '@/lib/countries'
import { useAutoVerifyOtp } from '@/hooks/useAutoVerifyOtp'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { cn } from '@/lib/utils'

interface AuditeeRegisterFlowProps {
  /** Lets the user back out to entity-type selection from step 1. */
  onBackToEntityType: () => void
  /** Lets the parent page hide chrome (e.g. the "Log in" link) on the final success screen. */
  onSubmittedChange?: (submitted: boolean) => void
}

const emptyOtp = () => Array.from({ length: 6 }, () => '')

export function AuditeeRegisterFlow({ onBackToEntityType, onSubmittedChange }: AuditeeRegisterFlowProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [basicsForm, setBasicsForm] = useState<AuditeeAccountBasicsForm>(emptyAuditeeAccountBasicsForm)
  const [submitted, setSubmitted] = useState(false)

  const [verificationEmail, setVerificationEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(emptyOtp())
  const [codeSent, setCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailAlreadyRegistered, setEmailAlreadyRegistered] = useState(false)

  const sendInFlightRef = useRef(false)
  const createInFlightRef = useRef(false)

  const patchBasics = (f: Partial<AuditeeAccountBasicsForm>) =>
    setBasicsForm((prev) => ({ ...prev, ...f }))

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

  const handleCreateAccount = useCallback(async () => {
    if (createInFlightRef.current) return
    createInFlightRef.current = true
    setIsCreatingAccount(true)
    try {
      const countryName =
        getCountryOptions(i18n.language).find((c) => c.code === basicsForm.country)?.name ??
        basicsForm.country

      await register({
        entityType: 'CONSULTATION_BODY',
        email: verificationEmail,
        organizationName: basicsForm.companyName,
        administrationName: basicsForm.name,
        facilityOwnerManager: basicsForm.name,
        activity: basicsForm.companyName,
        legalCapacity: 'Audit Client',
        city: basicsForm.city || countryName,
        phone: formatPhoneNumber(basicsForm.mobileCountryCode, basicsForm.mobile),
        password: basicsForm.password,
        confirmPassword: basicsForm.confirmPassword,
      })

      setSubmitted(true)
      onSubmittedChange?.(true)
    } catch (error) {
      const authError = getRegistrationAuthError(error, t)
      toast.error(authError.message)
      setEmailAlreadyRegistered(authError.emailAlreadyRegistered)
    } finally {
      createInFlightRef.current = false
      setIsCreatingAccount(false)
    }
  }, [basicsForm, i18n.language, onSubmittedChange, t, verificationEmail])

  const handleVerifyAndContinue = useCallback(async () => {
    if (!emailValid || !otpComplete || isVerifyingEmail || isCreatingAccount) return
    setIsVerifyingEmail(true)
    setEmailAlreadyRegistered(false)
    try {
      await verifyEmail(verificationEmail.trim(), otp.join(''))
      setEmailVerified(true)
      await handleCreateAccount()
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
    handleCreateAccount,
    isCreatingAccount,
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
    isVerifyingEmail: isVerifyingEmail || isCreatingAccount,
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
      const email = basicsForm.email.trim()
      setVerificationEmail(email)
      void handleSendCode(email).then((sent) => {
        if (sent) setStep(2)
      })
    }
  }

  const nextDisabled = step === 1 ? !isAuditeeAccountBasicsComplete(basicsForm) || isSendingCode : true
  const nextLabel = step === 1 && isSendingCode ? t('register.sendingCode') : t('common.next')

  if (submitted) {
    return (
      <div className="flex min-h-[520px] w-full flex-col items-center justify-center text-center">
        <AppIcon icon={SuccessCheckIcon} size={140} className="mb-6" />
        <h1 className="text-h1 mb-3 text-success-600">{t('register.auditee.summary.submittedTitle')}</h1>
        <p className="text-body-2 mb-8 max-w-md text-neutral-600">
          {t('register.auditee.summary.submittedDescription')}
        </p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.login)}
          className={cn(buttonVariants({ variant: 'primary', size: 'default' }))}
        >
          {t('register.auditee.summary.goToLogin')}
        </button>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-page-title text-text-primary mb-6">{t('register.auditee.title')}</h1>

      <AuditeeStepNav current={step} className="mb-6" />

      {step === 1 && <AuditeeAccountBasicsStep form={basicsForm} onPatch={patchBasics} />}
      {step === 2 && (
        <AuditeeVerificationStep
          email={verificationEmail}
          otp={otp}
          codeSent={codeSent}
          isSendingCode={isSendingCode}
          isVerifyingEmail={isVerifyingEmail}
          isCreatingAccount={isCreatingAccount}
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
        onBack={step === 1 ? onBackToEntityType : handleBackToBasics}
        onNext={handleNext}
        nextLabel={nextLabel}
        nextDisabled={nextDisabled}
        showNext={step === 1}
        showBack
      />
    </>
  )
}

import { useEffect, useRef } from 'react'

/** Fires `onVerify` once when all 6 OTP digits are entered. */
export function useAutoVerifyOtp({
  active,
  otp,
  codeSent,
  emailVerified,
  isVerifyingEmail,
  emailValid,
  onVerify,
}: {
  active: boolean
  otp: string[]
  codeSent: boolean
  emailVerified: boolean
  isVerifyingEmail: boolean
  emailValid: boolean
  onVerify: () => void | Promise<void>
}) {
  const otpComplete = otp.every((digit) => digit.length === 1)
  const otpValue = otp.join('')
  const attemptedOtpRef = useRef('')

  useEffect(() => {
    attemptedOtpRef.current = ''
  }, [codeSent])

  useEffect(() => {
    if (!otpComplete) {
      attemptedOtpRef.current = ''
    }
  }, [otpComplete])

  useEffect(() => {
    if (!active || !codeSent || emailVerified || isVerifyingEmail || !emailValid || !otpComplete) {
      return
    }
    if (attemptedOtpRef.current === otpValue) return
    attemptedOtpRef.current = otpValue
    void onVerify()
  }, [
    active,
    codeSent,
    emailVerified,
    isVerifyingEmail,
    emailValid,
    otpComplete,
    otpValue,
    onVerify,
  ])
}

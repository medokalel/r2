import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '@/lib/api/authApi'
import { LOGIN_STATUS_MESSAGES, AUTH_FIELD_LABELS } from '@/lib/authErrors'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { getAuthSession, getAuthToken, saveAuthSession, getPostLoginRedirect } from '@/lib/authStorage'
import { clearPendingRegistration } from '@/lib/pendingRegistrationStorage'
import * as Checkbox from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import { TextField } from '@/components/ui'
import { AuthLayout } from '@/components/auth/AuthLayout'
import {
  isValidLoginIdentifier,
  normalizeLoginIdentifier,
} from '@/lib/authValidation'
import { Button } from '@/components/ui/Button'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { AppIcon, EyeIcon, EyeSlashIcon, LockIcon, MailIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { SsoLoginPanel } from '@/components/sso/SsoLoginPanel'
import { ssoPasswordPrecheck } from '@/lib/api/ssoApi'
import { ApiError } from '@/lib/api/client'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Password sign-in answered SSO_REQUIRED: open "Continue with SSO" with a notice.
  const [ssoRequired, setSsoRequired] = useState(false)

  useEffect(() => {
    const session = getAuthSession()
    if (getAuthToken() && session) {
      navigate(getPostLoginRedirect(session), { replace: true })
    }
  }, [navigate])

  const emailError =
    form.email.trim().length > 0 && !isValidLoginIdentifier(form.email)
      ? t('validation.invalidEmail')
      : undefined

  const canSubmit =
    isValidLoginIdentifier(form.email) &&
    form.password.length >= 6 &&
    !isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)

    try {
      await ssoPasswordPrecheck(normalizeLoginIdentifier(form.email))
      const data = await login(normalizeLoginIdentifier(form.email), form.password)
      clearPendingRegistration()
      saveAuthSession(data, rememberMe)
      navigate(getPostLoginRedirect(data), { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'SSO_REQUIRED') {
        setSsoRequired(true)
        return
      }
      toast.error(
        getUserErrorMessage(error, t, {
          statusMessages: LOGIN_STATUS_MESSAGES,
          fieldLabels: AUTH_FIELD_LABELS,
        }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <LanguageToggle variant="icon" className="mb-8" />

      <h1 className="text-page-title text-text-primary mb-2">{t('auth.loginTitle')}</h1>
      <p className="text-body-1 text-neutral-600 mb-6 sm:mb-10">{t('auth.loginSubtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        <TextField
          id="email"
          label={t('auth.email')}
          icon={MailIcon}
          type="text"
          placeholder={t('ui.emailPlaceholder')}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={emailError}
        />

        <TextField
          id="password"
          label={t('auth.password')}
          icon={LockIcon}
          type={showPassword ? 'text' : 'password'}
          placeholder={t('auth.password')}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
              className="text-neutral-500 hover:text-neutral-700"
            >
              <AppIcon icon={showPassword ? EyeIcon : EyeSlashIcon} size={20} />
            </button>
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-2.5">
            <Checkbox.Root
              id="remember"
              checked={rememberMe}
              onCheckedChange={(v) => setRememberMe(Boolean(v))}
              className={cn(
                'h-5 w-5 rounded-sm border border-neutral-300 bg-white',
                'data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                'transition-colors flex items-center justify-center shrink-0'
              )}
            >
              <Checkbox.Indicator>
                <CheckIcon className="text-white w-3.5 h-3.5" />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <label htmlFor="remember" className="text-body-3 text-neutral-600 cursor-pointer select-none">
              {t('auth.rememberMe')}
            </label>
          </div>

          <Link
            to="/forgot-password"
            className="text-body-2-semibold text-primary underline underline-offset-2"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={!canSubmit}
          className="w-full h-12 rounded-md text-body font-medium text-white"
        >
          {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>

      <SsoLoginPanel email={normalizeLoginIdentifier(form.email)} required={ssoRequired} />

      <p className="text-center text-body-2 text-neutral-600 mt-4">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-body-2-semibold text-primary-500 underline underline-offset-2">
          {t('auth.registerNow')}
        </Link>
      </p>
    </AuthLayout>
  )
}
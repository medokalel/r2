import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import * as Checkbox from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { AppIcon, EyeIcon, EyeSlashIcon, LockIcon, MailIcon, PhoneIcon } from '@/components/icons'
import { FormLabel, TextField, fieldHeightClassName, fieldInputClassName } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useIpLocation } from '@/hooks/useIpLocation'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import { englishDigitsClassName, toEnglishDigits } from '@/lib/englishDigits'
import { isValidEmailFormat, isValidPhoneNumber } from '@/lib/validators'
import { isValidPassword, passwordsMatch } from '@/lib/authValidation'
import { cn } from '@/lib/utils'
import { type AbAccountBasicsForm } from '@/lib/abAccountBasicsForm'

export type { AbAccountBasicsForm }

interface AbAccountBasicsStepProps {
  form: AbAccountBasicsForm
  onPatch: (f: Partial<AbAccountBasicsForm>) => void
}

export function AbAccountBasicsStep({ form, onPatch }: AbAccountBasicsStepProps) {
  const { t, i18n } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const countries = useMemo(() => getCountryOptions(i18n.language), [i18n.language])
  const ipLocation = useIpLocation()

  // Pre-fill the dial code and address country from the visitor's IP once it
  // resolves — only for fields the user hasn't already touched, and only if
  // the detected country is one we support.
  useEffect(() => {
    if (!ipLocation) return
    const detected = ipLocation.countryCode as CountryCode
    if (!countries.some((country) => country.code === detected)) return
    if (form.mobileCountryCode && form.country) return

    onPatch({
      ...(form.mobileCountryCode ? {} : { mobileCountryCode: detected }),
      ...(form.country ? {} : { country: detected }),
    })
    // Runs once per resolved IP lookup; form/onPatch identity changes on every
    // keystroke and would otherwise fight the user's own selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipLocation, countries])

  const emailError =
    form.email.trim().length > 0 && !isValidEmailFormat(form.email)
      ? t('validation.invalidEmail')
      : undefined
  const mobileError =
    form.mobile.trim().length > 0 && !isValidPhoneNumber(form.mobile, form.mobileCountryCode)
      ? t('validation.invalidMobile')
      : undefined
  const passwordError =
    form.password.length > 0 && !isValidPassword(form.password)
      ? t('validation.passwordTooShort')
      : undefined
  const confirmError =
    form.confirmPassword.length > 0 && !passwordsMatch(form.password, form.confirmPassword)
      ? t('register.passwordMismatch')
      : undefined

  return (
    <div className="space-y-6 w-full">
      <TextField
        id="ab-name"
        label={t('register.ab.abName')}
        required
        placeholder={t('register.ab.abNamePlaceholder')}
        value={form.abName}
        onChange={(e) => onPatch({ abName: e.target.value })}
      />

      <TextField
        id="ab-email"
        label={t('register.ab.officialEmail')}
        icon={MailIcon}
        required
        type="email"
        lang="en"
        placeholder={t('ui.emailPlaceholder')}
        value={form.email}
        onChange={(e) => onPatch({ email: toEnglishDigits(e.target.value) })}
        error={emailError}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3 sm:col-span-2">
          <FormLabel>{t('register.ab.mobileNumber')}</FormLabel>
          <PhoneInputRow
            rowClassName="gap-3"
            value={form.mobileCountryCode}
            onChange={(code) => onPatch({ mobileCountryCode: code })}
            aria-label={t('register.countryCode')}
            className="border border-neutral-300"
          >
            <div className="relative flex-1">
              <span className="absolute inset-y-0 start-3 flex items-center text-primary-500 pointer-events-none">
                <AppIcon icon={PhoneIcon} size={20} />
              </span>
              <input
                id="ab-mobile"
                type="tel"
                lang="en"
                dir="ltr"
                placeholder={t('ui.phonePlaceholder')}
                value={form.mobile}
                onChange={(e) => onPatch({ mobile: toEnglishDigits(e.target.value) })}
                className={cn(
                  fieldInputClassName,
                  fieldHeightClassName,
                  englishDigitsClassName,
                  'ps-12',
                  mobileError && 'border-error-400 focus:ring-error-400 focus:border-error-400'
                )}
              />
            </div>
          </PhoneInputRow>
          {mobileError && <p className="text-caption text-error-700">{mobileError}</p>}
        </div>
      </div>

      <SearchableSelect
        id="ab-country"
        label={t('register.ab.abCountry')}
        required
        value={form.country}
        placeholder={t('register.ab.abCountryPlaceholder')}
        onChange={(value) => onPatch({ country: value as CountryCode })}
        options={countries.map((country) => ({
          value: country.code,
          label: `${country.flag} ${country.name}`,
        }))}
        searchPlaceholder={t('common.search')}
      />

      <TextField
        id="ab-password"
        label={t('auth.password')}
        icon={LockIcon}
        type={showPassword ? 'text' : 'password'}
        placeholder={t('auth.password')}
        value={form.password}
        onChange={(e) => onPatch({ password: e.target.value })}
        error={passwordError}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-neutral-500 hover:text-neutral-700"
            aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
          >
            <AppIcon icon={showPassword ? EyeIcon : EyeSlashIcon} size={20} />
          </button>
        }
      />

      <TextField
        id="ab-confirm-password"
        label={t('register.confirmPassword')}
        icon={LockIcon}
        type={showConfirm ? 'text' : 'password'}
        placeholder={t('register.confirmPasswordPlaceholder')}
        value={form.confirmPassword}
        onChange={(e) => onPatch({ confirmPassword: e.target.value })}
        error={confirmError}
        trailing={
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="text-neutral-500 hover:text-neutral-700"
            aria-label={showConfirm ? t('common.hidePassword') : t('common.showPassword')}
          >
            <AppIcon icon={showConfirm ? EyeIcon : EyeSlashIcon} size={20} />
          </button>
        }
      />

      <div className="flex items-center gap-2 justify-start">
        <Checkbox.Root
          id="ab-privacy"
          checked={form.agreePrivacy}
          onCheckedChange={(v) => onPatch({ agreePrivacy: Boolean(v) })}
          className={cn(
            'h-5 w-5 rounded-sm border border-neutral-300 bg-white',
            'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
            'flex items-center justify-center shrink-0'
          )}
        >
          <Checkbox.Indicator>
            <CheckIcon className="text-white w-3.5 h-3.5" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label htmlFor="ab-privacy" className="text-body-2-medium text-primary cursor-pointer">
          {t('register.agreePrivacyLead')}{' '}
        </label>
        <Link
          to="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-body-2-medium text-primary underline hover:opacity-80"
        >
          {t('register.privacyPolicy')}
        </Link>
      </div>
    </div>
  )
}
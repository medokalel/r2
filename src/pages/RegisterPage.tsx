import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AccountRegisterFlow } from '@/components/auth/AccountRegisterFlow'
import { AuditeeRegisterFlow } from '@/components/auth/auditee/AuditeeRegisterFlow'
import { EntityTypeIcon } from '@/components/auth/EntityTypeIcon'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

type RegistrationType = 'ORGANIZATION' | 'AUDIT_CLIENT'

export function RegisterPage() {
  const { t } = useTranslation()
  const [submitted, setSubmitted] = useState(false)
  const [registrationType, setRegistrationType] = useState<RegistrationType | null>(null)

  const backToRegistrationType = () => {
    setSubmitted(false)
    setRegistrationType(null)
  }

  const registrationFlow =
    registrationType === 'ORGANIZATION' ? (
      <AccountRegisterFlow
        onBackToRegistrationType={backToRegistrationType}
        onSubmittedChange={setSubmitted}
      />
    ) : registrationType === 'AUDIT_CLIENT' ? (
      <AuditeeRegisterFlow
        onBackToEntityType={backToRegistrationType}
        onSubmittedChange={setSubmitted}
      />
    ) : (
      <div className="w-full">
        <div className="mb-8 space-y-2">
          <h1 className="text-page-title text-text-primary">{t('register.title')}</h1>
          <p className="text-body-2 text-neutral-600">{t('register.chooseRegistrationType')}</p>
        </div>
        <div className="flex w-full flex-col gap-4">
          {([
            { type: 'AUDIT_CLIENT', label: t('register.auditClients') },
            { type: 'ORGANIZATION', label: t('register.organizations') },
          ] as const).map(({ type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => setRegistrationType(type)}
              className="flex w-full items-center gap-4 rounded-md border border-neutral-300 bg-white px-4 py-4 text-start transition-colors hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary-subtle">
                <EntityTypeIcon className="text-primary" />
              </div>
              <span className="text-body-1 text-neutral-900">{label}</span>
            </button>
          ))}
        </div>
      </div>
    )

  return (
    <AuthLayout reverse contentClassName="!max-w-[780px]">
      <LanguageToggle variant="icon" className="mb-10" />
      {registrationFlow}
      {!submitted && (
        <p className="text-center text-body-2-medium text-neutral-600 mt-8">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-body-2-semibold text-primary underline underline-offset-2">
            {t('auth.signIn')}
          </Link>
        </p>
      )}
    </AuthLayout>
  )
}

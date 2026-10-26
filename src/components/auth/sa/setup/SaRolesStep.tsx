import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import {
  SetupNote,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { SA_ROLE_INVITE_OPTIONS, type SaRoleRequirement } from '@/lib/api/saSetupApi'
import { isValidEmailFormat } from '@/lib/validators'
import { cn } from '@/lib/utils'
import type { SaRoleInvite } from '@/lib/saSetupForm'
import type { SaSetupStepProps } from '@/components/auth/sa/setup/types'

const REQUIREMENT_STYLES: Record<SaRoleRequirement, string> = {
  REQUIRED: 'bg-error-50 text-error-500',
  RECOMMENDED: 'bg-[var(--cab-subtle)] text-[var(--cab-primary)]',
  OPTIONAL: 'bg-neutral-100 text-[var(--cab-muted)]',
}

export function SaRolesStep({ form, onPatchSetup }: SaSetupStepProps) {
  const { t } = useTranslation()
  const { roleInvites } = form.saSetup

  useEffect(() => {
    if (roleInvites.length > 0) return

    onPatchSetup({
      roleInvites: SA_ROLE_INVITE_OPTIONS.map<SaRoleInvite>((option) => ({
        role: option.value,
        email: '',
        status: option.requirement === 'OPTIONAL' ? 'ADD_LATER' : 'INVITE',
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateInvite = (role: string, fields: Partial<SaRoleInvite>) => {
    onPatchSetup({
      roleInvites: roleInvites.map((invite) =>
        invite.role === role ? { ...invite, ...fields } : invite
      ),
    })
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-3">
        {SA_ROLE_INVITE_OPTIONS.map((option) => {
          const invite = roleInvites.find((item) => item.role === option.value)
          if (!invite) return null

          const emailError =
            invite.status === 'INVITE' && invite.email.trim() && !isValidEmailFormat(invite.email)
              ? t('validation.invalidEmail')
              : undefined

          return (
            <SetupSection key={option.value}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-body font-bold text-[var(--cab-ink)]">{t(option.labelKey)}</p>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-caption font-bold',
                    REQUIREMENT_STYLES[option.requirement]
                  )}
                >
                  {t(`sa.setup.roles.requirement.${option.requirement}`)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={invite.status === 'INVITE'}
                    onClick={() => updateInvite(option.value, { status: 'INVITE' })}
                    className={cn(
                      'rounded-full border px-5 py-1.5 text-caption font-bold transition-colors',
                      invite.status === 'INVITE'
                        ? 'border-[var(--cab-primary)] bg-[var(--cab-subtle)] text-[var(--cab-primary)]'
                        : 'border-[var(--cab-border)] bg-white text-[var(--cab-muted)]'
                    )}
                  >
                    {t('sa.setup.roles.inviteByEmail')}
                  </button>
                  <button
                    type="button"
                    aria-pressed={invite.status === 'ADD_LATER'}
                    onClick={() => updateInvite(option.value, { status: 'ADD_LATER', email: '' })}
                    className={cn(
                      'rounded-full border px-5 py-1.5 text-caption font-bold transition-colors',
                      invite.status === 'ADD_LATER'
                        ? 'border-[var(--cab-primary)] bg-[var(--cab-subtle)] text-[var(--cab-primary)]'
                        : 'border-[var(--cab-border)] bg-white text-[var(--cab-muted)]'
                    )}
                  >
                    {t('sa.setup.roles.addLater')}
                  </button>
                </div>

                {invite.status === 'INVITE' && (
                  <TextField
                    id={`sa-setup-role-email-${option.value}`}
                    type="email"
                    lang="en"
                    dir="ltr"
                    value={invite.email}
                    placeholder={t('sa.setup.roles.emailPlaceholder')}
                    onChange={(event) => updateInvite(option.value, { email: event.target.value })}
                    error={emailError}
                  />
                )}
              </div>
            </SetupSection>
          )
        })}
      </div>

      <SetupSection>
        <SetupToggleRow
          label={t('sa.setup.roles.separateAuditFromApproval')}
          checked={form.saSetup.separateAuditFromApproval}
          onChange={(separateAuditFromApproval) => onPatchSetup({ separateAuditFromApproval })}
        />
        <SetupToggleRow
          label={t('sa.setup.roles.categoryBasedAccess')}
          checked={form.saSetup.useCategoryBasedAccess}
          onChange={(useCategoryBasedAccess) => onPatchSetup({ useCategoryBasedAccess })}
        />
      </SetupSection>

      <SetupNote>{t('sa.setup.roles.independenceNote')}</SetupNote>
    </div>
  )
}

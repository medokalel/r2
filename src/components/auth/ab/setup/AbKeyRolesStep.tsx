import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import {
  SetupNote,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { AB_ROLE_INVITE_OPTIONS, type AbRoleRequirement } from '@/lib/api/abSetupApi'
import { getAuthSession } from '@/lib/authStorage'
import { isValidEmailFormat } from '@/lib/validators'
import { cn } from '@/lib/utils'
import type { AbRoleInvite } from '@/lib/abSetupForm'
import type { AbSetupStepProps } from '@/components/auth/ab/setup/types'

const REQUIREMENT_STYLES: Record<AbRoleRequirement, string> = {
  OWNER: 'bg-success-50 text-success-600',
  REQUIRED: 'bg-error-50 text-error-500',
  RECOMMENDED: 'bg-[var(--cab-subtle)] text-[var(--cab-primary)]',
  OPTIONAL: 'bg-neutral-100 text-[var(--cab-muted)]',
}

export function AbKeyRolesStep({ form, onPatchSetup }: AbSetupStepProps) {
  const { t } = useTranslation()
  const { roleInvites } = form.abSetup

  const ownerEmail = useMemo(() => getAuthSession()?.user?.email ?? '', [])

  // Seed one row per default role the first time this screen opens.
  useEffect(() => {
    if (roleInvites.length > 0) return

    onPatchSetup({
      roleInvites: AB_ROLE_INVITE_OPTIONS.map<AbRoleInvite>((option) => ({
        role: option.value,
        email: option.requirement === 'OWNER' ? ownerEmail : '',
        status:
          option.requirement === 'OWNER'
            ? 'ACTIVE'
            : option.requirement === 'RECOMMENDED'
              ? 'ADD_LATER'
              : 'INVITE',
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateInvite = (role: string, fields: Partial<AbRoleInvite>) => {
    onPatchSetup({
      roleInvites: roleInvites.map((invite) =>
        invite.role === role ? { ...invite, ...fields } : invite
      ),
    })
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-3">
        {AB_ROLE_INVITE_OPTIONS.map((option) => {
          const invite = roleInvites.find((item) => item.role === option.value)
          if (!invite) return null

          const isOwner = option.requirement === 'OWNER'
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
                  {t(`ab.setup.roles.requirement.${option.requirement}`)}
                </span>
              </div>

              {isOwner ? (
                <p className="text-caption text-[var(--cab-muted)]" lang="en" dir="ltr">
                  {invite.email || ownerEmail || t('ab.setup.roles.ownerFallback')}
                </p>
              ) : (
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
                      {t('ab.setup.roles.inviteByEmail')}
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
                      {t('ab.setup.roles.addLater')}
                    </button>
                  </div>

                  {invite.status === 'INVITE' && (
                    <TextField
                      id={`ab-setup-role-email-${option.value}`}
                      type="email"
                      lang="en"
                      dir="ltr"
                      value={invite.email}
                      placeholder={t('ab.setup.roles.emailPlaceholder')}
                      onChange={(event) => updateInvite(option.value, { email: event.target.value })}
                      error={emailError}
                    />
                  )}
                </div>
              )}
            </SetupSection>
          )
        })}
      </div>

      <SetupSection>
        <SetupToggleRow
          label={t('ab.setup.roles.sendInvitations')}
          checked={form.abSetup.sendInvitationsOnComplete}
          onChange={(sendInvitationsOnComplete) => onPatchSetup({ sendInvitationsOnComplete })}
        />
        <SetupToggleRow
          label={t('ab.setup.roles.roleBasedAccess')}
          checked={form.abSetup.useRoleBasedAccess}
          onChange={(useRoleBasedAccess) => onPatchSetup({ useRoleBasedAccess })}
        />
      </SetupSection>

      <SetupNote>{t('ab.setup.roles.importLaterNote')}</SetupNote>
    </div>
  )
}

import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import {
  SetupNote,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { CAB_ROLE_INVITE_OPTIONS, type RoleRequirement } from '@/lib/api/cabSetupApi'
import { getAuthSession } from '@/lib/authStorage'
import { isValidEmailFormat } from '@/lib/validators'
import { cn } from '@/lib/utils'
import type { CabRoleInvite } from '@/lib/cabSetupForm'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'

const REQUIREMENT_STYLES: Record<RoleRequirement, string> = {
  OWNER: 'bg-success-50 text-success-600',
  REQUIRED: 'bg-error-50 text-error-500',
  RECOMMENDED: 'bg-primary-subtle text-primary',
  OPTIONAL: 'bg-neutral-100 text-neutral-700',
}

export function CabKeyRolesStep({ form, onPatchSetup }: CabSetupStepProps) {
  const { t } = useTranslation()
  const { roleInvites } = form.cabSetup

  const ownerEmail = useMemo(() => getAuthSession()?.user?.email ?? '', [])

  // Seed one row per default role the first time this screen opens.
  useEffect(() => {
    if (roleInvites.length > 0) return

    onPatchSetup({
      roleInvites: CAB_ROLE_INVITE_OPTIONS.map<CabRoleInvite>((option) => ({
        role: option.value,
        email: option.requirement === 'OWNER' ? ownerEmail : '',
        status: option.requirement === 'OWNER' ? 'ACTIVE' : option.requirement === 'OPTIONAL' ? 'ADD_LATER' : 'INVITE',
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateInvite = (role: string, fields: Partial<CabRoleInvite>) => {
    onPatchSetup({
      roleInvites: roleInvites.map((invite) =>
        invite.role === role ? { ...invite, ...fields } : invite
      ),
    })
  }

  return (
    <div className="w-full space-y-6">

      <div className="space-y-3">
        {CAB_ROLE_INVITE_OPTIONS.map((option) => {
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
                    'rounded-full px-3 py-1 text-caption font-medium',
                    REQUIREMENT_STYLES[option.requirement]
                  )}
                >
                  {t(`cab.setup.roles.requirement.${option.requirement}`)}
                </span>
              </div>

              {isOwner ? (
                <p className="text-caption text-[var(--cab-muted)]" lang="en" dir="ltr">
                  {invite.email || ownerEmail || t('cab.setup.roles.ownerFallback')}
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-pressed={invite.status === 'INVITE'}
                      onClick={() => updateInvite(option.value, { status: 'INVITE' })}
                      className={cn(
                        'rounded-full border px-4 py-1.5 text-body-3-medium transition-colors',
                        invite.status === 'INVITE'
                          ? 'border-primary bg-primary-subtle text-primary'
                          : 'border-neutral-300 bg-white text-neutral-700'
                      )}
                    >
                      {t('cab.setup.roles.inviteByEmail')}
                    </button>
                    <button
                      type="button"
                      aria-pressed={invite.status === 'ADD_LATER'}
                      onClick={() => updateInvite(option.value, { status: 'ADD_LATER', email: '' })}
                      className={cn(
                        'rounded-full border px-4 py-1.5 text-body-3-medium transition-colors',
                        invite.status === 'ADD_LATER'
                          ? 'border-primary bg-primary-subtle text-primary'
                          : 'border-neutral-300 bg-white text-neutral-700'
                      )}
                    >
                      {t('cab.setup.roles.addLater')}
                    </button>
                  </div>

                  {invite.status === 'INVITE' && (
                    <TextField
                      id={`cab-setup-role-email-${option.value}`}
                      type="email"
                      lang="en"
                      dir="ltr"
                      value={invite.email}
                      placeholder={t('cab.setup.roles.emailPlaceholder')}
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
          label={t('cab.setup.roles.sendInvitations')}
          checked={form.cabSetup.sendInvitationsOnComplete}
          onChange={(sendInvitationsOnComplete) => onPatchSetup({ sendInvitationsOnComplete })}
        />
        <SetupToggleRow
          label={t('cab.setup.roles.roleBasedAccess')}
          checked={form.cabSetup.useRoleBasedAccess}
          onChange={(useRoleBasedAccess) => onPatchSetup({ useRoleBasedAccess })}
        />
      </SetupSection>

      <SetupNote>{t('cab.setup.roles.importLaterNote')}</SetupNote>
    </div>
  )
}

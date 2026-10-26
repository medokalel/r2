import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import {
  SetupNote,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { IA_ROLE_INVITE_OPTIONS, type IaRoleRequirement } from '@/lib/api/iaSetupApi'
import { isValidEmailFormat } from '@/lib/validators'
import { cn } from '@/lib/utils'
import type { IaRoleInvite } from '@/lib/iaSetupForm'
import type { IaSetupStepProps } from '@/components/auth/ia/setup/types'

const REQUIREMENT_STYLES: Record<IaRoleRequirement, string> = {
  REQUIRED: 'bg-error-50 text-error-500',
  RECOMMENDED: 'bg-[var(--cab-subtle)] text-[var(--cab-primary)]',
  OPTIONAL: 'bg-neutral-100 text-[var(--cab-muted)]',
}

export function IaRolesStep({ form, onPatchSetup }: IaSetupStepProps) {
  const { t } = useTranslation()
  const { roleInvites } = form.iaSetup

  // Seed one row per role the first time this screen opens.
  useEffect(() => {
    if (roleInvites.length > 0) return

    onPatchSetup({
      roleInvites: IA_ROLE_INVITE_OPTIONS.map<IaRoleInvite>((option) => ({
        role: option.value,
        email: '',
        status: option.bulkImport
          ? 'IMPORT_LATER'
          : option.requirement === 'REQUIRED'
            ? 'INVITE'
            : 'ADD_LATER',
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateInvite = (role: string, fields: Partial<IaRoleInvite>) => {
    onPatchSetup({
      roleInvites: roleInvites.map((invite) =>
        invite.role === role ? { ...invite, ...fields } : invite
      ),
    })
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-3">
        {IA_ROLE_INVITE_OPTIONS.map((option) => {
          const invite = roleInvites.find((item) => item.role === option.value)
          if (!invite) return null

          const emailError =
            invite.status === 'INVITE' && invite.email.trim() && !isValidEmailFormat(invite.email)
              ? t('validation.invalidEmail')
              : undefined

          // Process owners arrive by bulk import, so they get no invite field.
          const deferredStatus: IaRoleInvite['status'] = option.bulkImport
            ? 'IMPORT_LATER'
            : 'ADD_LATER'

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
                  {t(`ia.setup.roles.requirement.${option.requirement}`)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {!option.bulkImport && (
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
                      {t('ia.setup.roles.inviteByEmail')}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-pressed={invite.status !== 'INVITE'}
                    onClick={() => updateInvite(option.value, { status: deferredStatus, email: '' })}
                    className={cn(
                      'rounded-full border px-5 py-1.5 text-caption font-bold transition-colors',
                      invite.status !== 'INVITE'
                        ? 'border-[var(--cab-primary)] bg-[var(--cab-subtle)] text-[var(--cab-primary)]'
                        : 'border-[var(--cab-border)] bg-white text-[var(--cab-muted)]'
                    )}
                  >
                    {option.bulkImport ? t('ia.setup.roles.importLater') : t('ia.setup.roles.addLater')}
                  </button>
                </div>

                {invite.status === 'INVITE' && (
                  <TextField
                    id={`ia-setup-role-email-${option.value}`}
                    type="email"
                    lang="en"
                    dir="ltr"
                    value={invite.email}
                    placeholder={t('ia.setup.roles.emailPlaceholder')}
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
          label={t('ia.setup.roles.enforceIndependence')}
          checked={form.iaSetup.enforceAuditorIndependence}
          onChange={(enforceAuditorIndependence) => onPatchSetup({ enforceAuditorIndependence })}
        />
        <SetupToggleRow
          label={t('ia.setup.roles.roleBasedPermissions')}
          checked={form.iaSetup.useRoleBasedPermissions}
          onChange={(useRoleBasedPermissions) => onPatchSetup({ useRoleBasedPermissions })}
        />
      </SetupSection>

      <SetupNote>{t('ia.setup.roles.independenceNote')}</SetupNote>
    </div>
  )
}

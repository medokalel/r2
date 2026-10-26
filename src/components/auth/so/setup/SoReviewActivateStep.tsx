import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SetupNote } from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  isSoActivitiesStepComplete,
  isSoApprovalStepComplete,
  isSoLocationStepComplete,
  isSoMarksStepComplete,
  isSoProfileStepComplete,
  isSoRolesStepComplete,
  isSoSchemesStepComplete,
  isSoScopeStepComplete,
} from '@/lib/soSetupForm'
import { cn } from '@/lib/utils'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

type RowStatus = 'READY' | 'REVIEW' | 'MISSING'

interface SoReviewActivateStepProps {
  form: UnifiedOnboardingForm
  /** Jumps back to the step a row belongs to. */
  onGoToStep: (step: number) => void
}

const STATUS_STYLES: Record<RowStatus, string> = {
  READY: 'bg-success-50 text-success-600',
  REVIEW: 'bg-warning-50 text-warning-700',
  MISSING: 'bg-error-50 text-error-500',
}

export function SoReviewActivateStep({ form, onGoToStep }: SoReviewActivateStepProps) {
  const { t } = useTranslation()
  const setup = form.soSetup

  const rows = useMemo(() => {
    const profileReady = isSoProfileStepComplete(setup, form.legalEntityName)
    const locationReady = isSoLocationStepComplete(setup, form.country, form.city, form.address)
    const schemesReady = isSoSchemesStepComplete(setup)
    const activitiesReady = isSoActivitiesStepComplete(setup)
    const scopeReady = isSoScopeStepComplete(setup)
    const approvalReady = isSoApprovalStepComplete(setup)
    const marksReady = isSoMarksStepComplete(setup)
    const rolesReady = isSoRolesStepComplete(setup)

    const activeSchemes = setup.schemes.filter((scheme) => scheme.status === 'ACTIVE').length
    const pendingInvites = setup.roleInvites.filter((invite) => invite.status === 'INVITE').length

    return [
      {
        key: 'identity',
        label: t('so.setup.review.rows.identity'),
        detail: form.legalEntityName.trim() || t('so.setup.review.notProvided'),
        status: (profileReady && locationReady ? 'READY' : 'MISSING') as RowStatus,
        step: 2,
      },
      {
        key: 'schemes',
        label: t('so.setup.review.rows.schemes'),
        detail: t('so.setup.review.activeSchemes', { count: activeSchemes }),
        status: (schemesReady ? 'READY' : 'MISSING') as RowStatus,
        step: 5,
      },
      {
        key: 'scope',
        label: t('so.setup.review.rows.scope'),
        detail:
          activitiesReady && scopeReady
            ? t('so.setup.review.configured')
            : t('so.setup.review.needsAttention'),
        status: (activitiesReady && scopeReady ? 'READY' : 'MISSING') as RowStatus,
        step: 7,
      },
      {
        key: 'approval',
        label: t('so.setup.review.rows.approval'),
        detail: approvalReady
          ? t('so.setup.review.configured')
          : t('so.setup.review.needsAttention'),
        status: (approvalReady ? 'READY' : 'MISSING') as RowStatus,
        step: 8,
      },
      {
        key: 'marks',
        label: t('so.setup.review.rows.marks'),
        // The mark artwork itself is optional to activate, so a gap is only a review.
        detail: setup.schemeMarkUrl
          ? t('so.setup.review.ready')
          : t('so.setup.review.markMissing'),
        status: (!marksReady ? 'MISSING' : setup.schemeMarkUrl ? 'READY' : 'REVIEW') as RowStatus,
        step: 9,
      },
      {
        key: 'roles',
        label: t('so.setup.review.rows.roles'),
        detail:
          pendingInvites > 0
            ? t('so.setup.review.rolesDetail', { count: pendingInvites })
            : t('so.setup.review.rolesNone'),
        status: (!rolesReady ? 'MISSING' : pendingInvites > 0 ? 'REVIEW' : 'READY') as RowStatus,
        step: 10,
      },
    ]
  }, [form.address, form.city, form.country, form.legalEntityName, setup, t])

  return (
    <div className="w-full space-y-6">
      <div className="overflow-hidden rounded-md border border-[var(--cab-border)] bg-white">
        {rows.map((row) => (
          <button
            key={row.key}
            type="button"
            onClick={() => onGoToStep(row.step)}
            className="flex w-full items-center justify-between gap-4 border-b border-[var(--cab-border)] px-5 py-4 text-start transition-colors last:border-b-0 hover:bg-[var(--cab-panel)]"
          >
            <div className="min-w-0">
              <p className="text-body font-bold text-[var(--cab-ink)]">{row.label}</p>
              <p className="truncate text-caption text-[var(--cab-muted)]">{row.detail}</p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-4 py-1 text-caption font-bold',
                STATUS_STYLES[row.status]
              )}
            >
              {t(`so.setup.review.status.${row.status}`)}
            </span>
          </button>
        ))}
      </div>

      <SetupNote>{t('so.setup.review.nextStepNote')}</SetupNote>
    </div>
  )
}

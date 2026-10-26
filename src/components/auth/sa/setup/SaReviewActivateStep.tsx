import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SetupNote } from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  isSaAuditTypesStepComplete,
  isSaCategoriesStepComplete,
  isSaFindingsStepComplete,
  isSaLocationsStepComplete,
  isSaProfileStepComplete,
  isSaQualificationStepComplete,
  isSaRiskStepComplete,
  isSaRolesStepComplete,
  isSaScoringStepComplete,
} from '@/lib/saSetupForm'
import { cn } from '@/lib/utils'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

type RowStatus = 'READY' | 'REVIEW' | 'MISSING'

interface SaReviewActivateStepProps {
  form: UnifiedOnboardingForm
  /** Jumps back to the step a row belongs to. */
  onGoToStep: (step: number) => void
}

const STATUS_STYLES: Record<RowStatus, string> = {
  READY: 'bg-success-50 text-success-600',
  REVIEW: 'bg-warning-50 text-warning-700',
  MISSING: 'bg-error-50 text-error-500',
}

export function SaReviewActivateStep({ form, onGoToStep }: SaReviewActivateStepProps) {
  const { t } = useTranslation()
  const setup = form.saSetup

  const rows = useMemo(() => {
    const profileReady = isSaProfileStepComplete(setup, form.legalEntityName)
    const locationsReady = isSaLocationsStepComplete(setup, form.country, form.city)
    const categoriesReady = isSaCategoriesStepComplete(setup)
    const riskReady = isSaRiskStepComplete(setup)
    const qualificationReady = isSaQualificationStepComplete(setup)
    const auditTypesReady = isSaAuditTypesStepComplete(setup)
    const scoringReady = isSaScoringStepComplete(setup)
    const findingsReady = isSaFindingsStepComplete(setup)
    const rolesReady = isSaRolesStepComplete(setup)

    const categoryCount =
      setup.categories.length + (setup.customCategories.trim() ? 1 : 0)
    const pendingInvites = setup.roleInvites.filter((invite) => invite.status === 'INVITE').length

    return [
      {
        key: 'profile',
        label: t('sa.setup.review.rows.profile'),
        detail: form.legalEntityName.trim() || t('sa.setup.review.notProvided'),
        status: (profileReady && locationsReady ? 'READY' : 'MISSING') as RowStatus,
        step: 2,
      },
      {
        key: 'categories',
        label: t('sa.setup.review.rows.categories'),
        detail: t('sa.setup.review.categoriesCount', { count: categoryCount }),
        status: (categoriesReady ? 'READY' : 'MISSING') as RowStatus,
        step: 4,
      },
      {
        key: 'risk',
        label: t('sa.setup.review.rows.risk'),
        detail:
          riskReady && qualificationReady
            ? t('sa.setup.review.configured')
            : t('sa.setup.review.needsAttention'),
        status: (riskReady && qualificationReady ? 'READY' : 'MISSING') as RowStatus,
        step: 5,
      },
      {
        key: 'audits',
        label: t('sa.setup.review.rows.audits'),
        detail: auditTypesReady
          ? t('sa.setup.review.configured')
          : t('sa.setup.review.needsAttention'),
        status: (auditTypesReady ? 'READY' : 'MISSING') as RowStatus,
        step: 7,
      },
      {
        key: 'scoring',
        label: t('sa.setup.review.rows.scoring'),
        detail:
          scoringReady && findingsReady
            ? t('sa.setup.review.configured')
            : t('sa.setup.review.needsAttention'),
        status: (!scoringReady ? 'MISSING' : findingsReady ? 'READY' : 'REVIEW') as RowStatus,
        step: 8,
      },
      {
        key: 'roles',
        label: t('sa.setup.review.rows.roles'),
        detail:
          pendingInvites > 0
            ? t('sa.setup.review.rolesDetail', { count: pendingInvites })
            : t('sa.setup.review.rolesNone'),
        status: (!rolesReady ? 'MISSING' : pendingInvites > 0 ? 'REVIEW' : 'READY') as RowStatus,
        step: 10,
      },
    ]
  }, [form.city, form.country, form.legalEntityName, setup, t])

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
              {t(`sa.setup.review.status.${row.status}`)}
            </span>
          </button>
        ))}
      </div>

      <SetupNote>{t('sa.setup.review.nextStepNote')}</SetupNote>
    </div>
  )
}

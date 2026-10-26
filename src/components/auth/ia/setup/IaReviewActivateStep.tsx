import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SetupNote } from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  isIaCriteriaStepComplete,
  isIaFindingsStepComplete,
  isIaProgrammeStepComplete,
  isIaRiskStepComplete,
  isIaRolesStepComplete,
  isIaStructureStepComplete,
  isIaTemplatesStepComplete,
  isIaUniverseStepComplete,
} from '@/lib/iaSetupForm'
import { cn } from '@/lib/utils'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

type RowStatus = 'READY' | 'REVIEW' | 'MISSING'

interface IaReviewActivateStepProps {
  form: UnifiedOnboardingForm
  /** Jumps back to the step a row belongs to. */
  onGoToStep: (step: number) => void
}

const STATUS_STYLES: Record<RowStatus, string> = {
  READY: 'bg-success-50 text-success-600',
  REVIEW: 'bg-warning-50 text-warning-700',
  MISSING: 'bg-error-50 text-error-500',
}

export function IaReviewActivateStep({ form, onGoToStep }: IaReviewActivateStepProps) {
  const { t } = useTranslation()
  const setup = form.iaSetup

  const rows = useMemo(() => {
    const structureReady = isIaStructureStepComplete(setup, form.country, form.city)
    const universeReady = isIaUniverseStepComplete(setup)
    const criteriaReady = isIaCriteriaStepComplete(setup)
    const riskReady = isIaRiskStepComplete(setup)
    const programmeReady = isIaProgrammeStepComplete(setup)
    const findingsReady = isIaFindingsStepComplete(setup)
    const templatesReady = isIaTemplatesStepComplete(setup)
    const rolesReady = isIaRolesStepComplete(setup)

    const areaCount = setup.standards.length + setup.processes.length
    const pendingInvites = setup.roleInvites.filter((invite) => invite.status === 'INVITE').length

    return [
      {
        key: 'structure',
        label: t('ia.setup.review.rows.structure'),
        detail: [
          t('ia.setup.review.sitesCount', { count: setup.siteCount }),
          t('ia.setup.review.departmentsCount', { count: setup.departmentCount }),
        ].join(' • '),
        status: (structureReady ? 'READY' : 'MISSING') as RowStatus,
        step: 3,
      },
      {
        key: 'universe',
        label: t('ia.setup.review.rows.universe'),
        detail: t('ia.setup.review.areasCount', { count: areaCount }),
        status: (universeReady ? 'READY' : 'MISSING') as RowStatus,
        step: 4,
      },
      {
        key: 'criteria',
        label: t('ia.setup.review.rows.criteria'),
        detail:
          criteriaReady && riskReady
            ? t('ia.setup.review.configured')
            : t('ia.setup.review.needsAttention'),
        status: (criteriaReady && riskReady ? 'READY' : 'MISSING') as RowStatus,
        step: 5,
      },
      {
        key: 'programme',
        label: t('ia.setup.review.rows.programme'),
        detail: programmeReady ? t('ia.setup.review.draftReady') : t('ia.setup.review.needsAttention'),
        status: (programmeReady ? 'READY' : 'MISSING') as RowStatus,
        step: 7,
      },
      {
        key: 'findings',
        label: t('ia.setup.review.rows.findings'),
        detail:
          findingsReady && templatesReady
            ? t('ia.setup.review.configured')
            : t('ia.setup.review.needsAttention'),
        // The finding workflow gates activation; templates alone only warrant a review.
        status: (!findingsReady ? 'MISSING' : templatesReady ? 'READY' : 'REVIEW') as RowStatus,
        step: 8,
      },
      {
        key: 'roles',
        label: t('ia.setup.review.rows.roles'),
        detail:
          pendingInvites > 0
            ? t('ia.setup.review.rolesDetail', { count: pendingInvites })
            : t('ia.setup.review.rolesNone'),
        status: (!rolesReady ? 'MISSING' : pendingInvites > 0 ? 'REVIEW' : 'READY') as RowStatus,
        step: 10,
      },
    ]
  }, [form.city, form.country, setup, t])

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
              {t(`ia.setup.review.status.${row.status}`)}
            </span>
          </button>
        ))}
      </div>

      <SetupNote>{t('ia.setup.review.nextStepNote')}</SetupNote>
    </div>
  )
}

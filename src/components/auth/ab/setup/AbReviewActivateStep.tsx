import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SetupNote } from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  isAbCertificateStepComplete,
  isAbKeyRolesStepComplete,
  isAbLocationsStepComplete,
  isAbProfileStepComplete,
  isAbProgrammesStepComplete,
  isAbRecognitionRecordsStepComplete,
  isAbScopeStepComplete,
  isAbSymbolsStepComplete,
  requiresRecognitionRecords,
} from '@/lib/abSetupForm'
import { cn } from '@/lib/utils'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

type RowStatus = 'READY' | 'REVIEW' | 'MISSING'

interface AbReviewActivateStepProps {
  form: UnifiedOnboardingForm
  /** Jumps back to the step a row belongs to. */
  onGoToStep: (step: number) => void
}

const STATUS_STYLES: Record<RowStatus, string> = {
  READY: 'bg-success-50 text-success-600',
  REVIEW: 'bg-warning-50 text-warning-700',
  MISSING: 'bg-error-50 text-error-500',
}

export function AbReviewActivateStep({ form, onGoToStep }: AbReviewActivateStepProps) {
  const { t } = useTranslation()
  const setup = form.abSetup

  const rows = useMemo(() => {
    const profileReady = isAbProfileStepComplete(setup, form.legalEntityName)
    const locationsReady = isAbLocationsStepComplete(
      setup,
      form.country,
      form.city,
      form.address,
      form.languages
    )
    const recordsReady = isAbRecognitionRecordsStepComplete(setup)
    const programmesReady = isAbProgrammesStepComplete(setup)
    const scopeReady = isAbScopeStepComplete(setup)
    const symbolsReady = isAbSymbolsStepComplete(setup)
    const certificateReady = isAbCertificateStepComplete(setup)
    const rolesReady = isAbKeyRolesStepComplete(setup)

    const officeCount = setup.hasAdditionalOffices ? setup.offices.length : 0
    const programmeCount =
      setup.programmes.length + setup.customProgrammes.filter((p) => p.name.trim()).length
    const pendingInvites = setup.roleInvites.filter((invite) => invite.status === 'INVITE').length

    return [
      {
        key: 'identity',
        label: t('ab.setup.review.rows.identity'),
        detail: form.legalEntityName.trim() || t('ab.setup.review.notProvided'),
        status: (profileReady ? 'READY' : 'MISSING') as RowStatus,
        step: 2,
      },
      {
        key: 'locations',
        label: t('ab.setup.review.rows.locations'),
        detail: t('ab.setup.review.locationsDetail', { count: officeCount }),
        status: (locationsReady ? 'READY' : 'MISSING') as RowStatus,
        step: 3,
      },
      {
        key: 'recognition',
        label: t('ab.setup.review.rows.recognition'),
        detail: requiresRecognitionRecords(setup)
          ? t('ab.setup.review.recognitionDetail', { count: setup.recognitionRecords.length })
          : t('ab.setup.review.notSignatory'),
        status: (recordsReady ? 'READY' : 'MISSING') as RowStatus,
        step: 5,
      },
      {
        key: 'programmes',
        label: t('ab.setup.review.rows.programmes'),
        detail: [
          t('ab.setup.review.programmesCount', { count: programmeCount }),
          t('ab.setup.review.scopesCount', { count: setup.scopes.length }),
        ].join(' • '),
        // Programmes gate activation; unmapped scopes only warrant a review.
        status: (!programmesReady ? 'MISSING' : scopeReady ? 'READY' : 'REVIEW') as RowStatus,
        step: 6,
      },
      {
        key: 'symbols',
        label: t('ab.setup.review.rows.symbols'),
        detail:
          symbolsReady && certificateReady
            ? t('ab.setup.review.configured')
            : t('ab.setup.review.needsAttention'),
        status: (symbolsReady && certificateReady ? 'READY' : 'REVIEW') as RowStatus,
        step: 8,
      },
      {
        key: 'roles',
        label: t('ab.setup.review.rows.roles'),
        detail:
          pendingInvites > 0
            ? t('ab.setup.review.rolesDetail', { count: pendingInvites })
            : t('ab.setup.review.rolesNone'),
        status: (!rolesReady ? 'MISSING' : pendingInvites > 0 ? 'REVIEW' : 'READY') as RowStatus,
        step: 10,
      },
    ]
  }, [form.address, form.city, form.country, form.languages, form.legalEntityName, setup, t])

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
              {t(`ab.setup.review.status.${row.status}`)}
            </span>
          </button>
        ))}
      </div>

      <SetupNote>{t('ab.setup.review.nextStepNote')}</SetupNote>
    </div>
  )
}

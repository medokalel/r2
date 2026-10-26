import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupSection, SetupToggleRow } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { SA_FINDING_CLASS_OPTIONS, SA_FOLLOW_UP_TRIGGER_OPTIONS } from '@/lib/api/saSetupApi'
import type { SaSetupStepProps } from '@/components/auth/sa/setup/types'

function toDays(raw: string, max = 365): number {
  const parsed = Number(raw.replace(/\D/g, ''))
  return Math.min(Math.max(Number.isNaN(parsed) ? 0 : parsed, 0), max)
}

export function SaFindingsStep({ form, onPatchSetup }: SaSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.saSetup

  const classOptions = useMemo(
    () => SA_FINDING_CLASS_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const triggerOptions = useMemo(
    () => SA_FOLLOW_UP_TRIGGER_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <SearchableSelect
          id="sa-setup-finding-classes"
          label={t('sa.setup.findings.findingClasses')}
          required
          value={setup.findingClasses}
          onChange={(findingClasses) => onPatchSetup({ findingClasses })}
          options={classOptions}
          placeholder={t('sa.setup.findings.findingClassesPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <TextField
          id="sa-setup-correction-due"
          label={t('sa.setup.findings.correctionDue')}
          type="text"
          inputMode="numeric"
          value={String(setup.correctionDueDays)}
          onChange={(event) => onPatchSetup({ correctionDueDays: toDays(event.target.value) })}
        />
        <TextField
          id="sa-setup-corrective-action-due"
          label={t('sa.setup.findings.correctiveActionDue')}
          required
          type="text"
          inputMode="numeric"
          value={String(setup.correctiveActionDueDays)}
          onChange={(event) => onPatchSetup({ correctiveActionDueDays: toDays(event.target.value) })}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="sa-setup-follow-up-trigger"
          label={t('sa.setup.findings.followUpTrigger')}
          value={setup.followUpTrigger}
          onChange={(followUpTrigger) => onPatchSetup({ followUpTrigger })}
          options={triggerOptions}
          placeholder={t('sa.setup.findings.followUpTriggerPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <TextField
          id="sa-setup-escalation-owner"
          label={t('sa.setup.findings.escalationOwner')}
          required
          type="text"
          value={setup.escalationOwner}
          placeholder={t('sa.setup.findings.escalationOwnerPlaceholder')}
          onChange={(event) => onPatchSetup({ escalationOwner: event.target.value })}
        />
      </div>

      <SetupSection title={t('sa.setup.findings.workflowRules')}>
        <SetupToggleRow
          label={t('sa.setup.findings.evidenceReview')}
          checked={setup.evidenceReviewRequired}
          onChange={(evidenceReviewRequired) => onPatchSetup({ evidenceReviewRequired })}
        />
        <SetupToggleRow
          label={t('sa.setup.findings.requireRootCause')}
          checked={setup.requireRootCause}
          onChange={(requireRootCause) => onPatchSetup({ requireRootCause })}
        />
        <SetupToggleRow
          label={t('sa.setup.findings.trackEffectivenessReview')}
          checked={setup.trackEffectivenessReview}
          onChange={(trackEffectivenessReview) => onPatchSetup({ trackEffectivenessReview })}
        />
      </SetupSection>
    </div>
  )
}

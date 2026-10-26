import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupSection, SetupToggleRow } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { IA_FINDING_TYPE_OPTIONS, IA_VERIFICATION_OPTIONS } from '@/lib/api/iaSetupApi'
import type { IaSetupStepProps } from '@/components/auth/ia/setup/types'

/** Day inputs stay within a sensible planning horizon. */
function toDays(raw: string, max = 365): number {
  const parsed = Number(raw.replace(/\D/g, ''))
  return Math.min(Math.max(Number.isNaN(parsed) ? 0 : parsed, 0), max)
}

export function IaFindingsStep({ form, onPatchSetup }: IaSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.iaSetup

  const findingTypeOptions = useMemo(
    () => IA_FINDING_TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const verificationOptions = useMemo(
    () => IA_VERIFICATION_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <SearchableSelect
          id="ia-setup-finding-types"
          label={t('ia.setup.findings.findingTypes')}
          required
          value={setup.findingTypes}
          onChange={(findingTypes) => onPatchSetup({ findingTypes })}
          options={findingTypeOptions}
          placeholder={t('ia.setup.findings.findingTypesPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <TextField
          id="ia-setup-correction-due"
          label={t('ia.setup.findings.correctionDue')}
          type="text"
          inputMode="numeric"
          value={String(setup.correctionDueDays)}
          onChange={(event) => onPatchSetup({ correctionDueDays: toDays(event.target.value) })}
        />
        <TextField
          id="ia-setup-corrective-action-due"
          label={t('ia.setup.findings.correctiveActionDue')}
          required
          type="text"
          inputMode="numeric"
          value={String(setup.correctiveActionDueDays)}
          onChange={(event) => onPatchSetup({ correctiveActionDueDays: toDays(event.target.value) })}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <SearchableSelect
          id="ia-setup-verification"
          label={t('ia.setup.findings.verificationMethod')}
          value={setup.verificationMethod}
          onChange={(verificationMethod) => onPatchSetup({ verificationMethod })}
          options={verificationOptions}
          placeholder={t('ia.setup.findings.verificationMethodPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <TextField
          id="ia-setup-escalation"
          label={t('ia.setup.findings.escalationAfter')}
          type="text"
          inputMode="numeric"
          value={String(setup.escalationAfterDays)}
          onChange={(event) => onPatchSetup({ escalationAfterDays: toDays(event.target.value, 90) })}
        />
        <TextField
          id="ia-setup-closure-authority"
          label={t('ia.setup.findings.closureAuthority')}
          required
          type="text"
          value={setup.closureAuthority}
          placeholder={t('ia.setup.findings.closureAuthorityPlaceholder')}
          onChange={(event) => onPatchSetup({ closureAuthority: event.target.value })}
        />
      </div>

      <SetupSection title={t('ia.setup.findings.workflowRules')}>
        <SetupToggleRow
          label={t('ia.setup.findings.requireRootCause')}
          checked={setup.requireRootCause}
          onChange={(requireRootCause) => onPatchSetup({ requireRootCause })}
        />
        <SetupToggleRow
          label={t('ia.setup.findings.trackEffectivenessReview')}
          checked={setup.trackEffectivenessReview}
          onChange={(trackEffectivenessReview) => onPatchSetup({ trackEffectivenessReview })}
        />
      </SetupSection>
    </div>
  )
}

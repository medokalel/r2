import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupSection, SetupToggleRow } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { IA_FREQUENCY_OPTIONS } from '@/lib/api/iaSetupApi'
import type { IaSetupStepProps } from '@/components/auth/ia/setup/types'

export function IaProgrammeStep({ form, onPatchSetup }: IaSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.iaSetup

  const frequencyOptions = useMemo(
    () => IA_FREQUENCY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  const periodInvalid =
    Boolean(setup.programmePeriodStart && setup.programmePeriodEnd) &&
    setup.programmePeriodEnd <= setup.programmePeriodStart

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="ia-setup-period-start"
          label={t('ia.setup.programme.periodStart')}
          required
          type="date"
          lang="en"
          dir="ltr"
          value={setup.programmePeriodStart}
          onChange={(event) => onPatchSetup({ programmePeriodStart: event.target.value })}
        />
        <TextField
          id="ia-setup-period-end"
          label={t('ia.setup.programme.periodEnd')}
          required
          type="date"
          lang="en"
          dir="ltr"
          value={setup.programmePeriodEnd}
          onChange={(event) => onPatchSetup({ programmePeriodEnd: event.target.value })}
          error={periodInvalid ? t('ia.setup.programme.endAfterStart') : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="ia-setup-default-frequency"
          label={t('ia.setup.programme.defaultFrequency')}
          required
          value={setup.defaultFrequency}
          onChange={(defaultFrequency) => onPatchSetup({ defaultFrequency })}
          options={frequencyOptions}
          placeholder={t('ia.setup.programme.frequencyPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="ia-setup-high-risk-frequency"
          label={t('ia.setup.programme.highRiskFrequency')}
          value={setup.highRiskFrequency}
          onChange={(highRiskFrequency) => onPatchSetup({ highRiskFrequency })}
          options={frequencyOptions}
          placeholder={t('ia.setup.programme.frequencyPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="ia-setup-planning-owner"
          label={t('ia.setup.programme.planningOwner')}
          required
          type="text"
          value={setup.planningOwner}
          placeholder={t('ia.setup.programme.planningOwnerPlaceholder')}
          onChange={(event) => onPatchSetup({ planningOwner: event.target.value })}
        />
        <TextField
          id="ia-setup-approval-authority"
          label={t('ia.setup.programme.approvalAuthority')}
          type="text"
          value={setup.approvalAuthority}
          placeholder={t('ia.setup.programme.approvalAuthorityPlaceholder')}
          onChange={(event) => onPatchSetup({ approvalAuthority: event.target.value })}
        />
      </div>

      <SetupSection title={t('ia.setup.programme.planningRules')}>
        <SetupToggleRow
          label={t('ia.setup.programme.integratedAudits')}
          checked={setup.integratedAudits}
          onChange={(integratedAudits) => onPatchSetup({ integratedAudits })}
        />
        <SetupToggleRow
          label={t('ia.setup.programme.avoidPeakPeriods')}
          checked={setup.avoidPeakPeriods}
          onChange={(avoidPeakPeriods) => onPatchSetup({ avoidPeakPeriods })}
        />
        <SetupToggleRow
          label={t('ia.setup.programme.notifyProcessOwners')}
          checked={setup.notifyProcessOwners}
          onChange={(notifyProcessOwners) => onPatchSetup({ notifyProcessOwners })}
        />
      </SetupSection>
    </div>
  )
}

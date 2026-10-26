import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupSection, SetupToggleRow } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { SA_RISK_FACTOR_OPTIONS, SA_RISK_LEVEL_OPTIONS } from '@/lib/api/saSetupApi'
import type { SaSetupStepProps } from '@/components/auth/sa/setup/types'

export function SaRiskStep({ form, onPatchSetup }: SaSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.saSetup

  const levelOptions = useMemo(
    () => SA_RISK_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const factorOptions = useMemo(
    () => SA_RISK_FACTOR_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="sa-setup-risk-levels"
          label={t('sa.setup.risk.riskLevels')}
          required
          value={setup.riskLevels}
          onChange={(riskLevels) => onPatchSetup({ riskLevels })}
          options={levelOptions}
          placeholder={t('sa.setup.risk.riskLevelsPlaceholder')}
          searchPlaceholder={t('common.search')}
        />

        <div className="space-y-2">
          <FormLabel required>{t('sa.setup.risk.riskFactors')}</FormLabel>
          <MultiSelect
            tags={setup.riskFactors}
            options={factorOptions}
            onChange={(riskFactors) => onPatchSetup({ riskFactors })}
            layout="stacked"
            searchable
            placeholder={t('sa.setup.risk.riskFactorsPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
        </div>
      </div>

      <TextField
        id="sa-setup-spend-threshold"
        label={t('sa.setup.risk.spendThreshold')}
        type="text"
        value={setup.spendThreshold}
        placeholder={t('sa.setup.risk.spendThresholdPlaceholder')}
        onChange={(event) => onPatchSetup({ spendThreshold: event.target.value })}
      />

      <SetupSection title={t('sa.setup.risk.scoringRules')}>
        <SetupToggleRow
          label={t('sa.setup.risk.countryRisk')}
          checked={setup.countryRisk}
          onChange={(countryRisk) => onPatchSetup({ countryRisk })}
        />
        <SetupToggleRow
          label={t('sa.setup.risk.regulatoryRisk')}
          checked={setup.regulatoryRisk}
          onChange={(regulatoryRisk) => onPatchSetup({ regulatoryRisk })}
        />
        <SetupToggleRow
          label={t('sa.setup.risk.automaticRiskScore')}
          checked={setup.automaticRiskScore}
          onChange={(automaticRiskScore) => onPatchSetup({ automaticRiskScore })}
        />
        <SetupToggleRow
          label={t('sa.setup.risk.recalculateAfterIncidents')}
          checked={setup.recalculateAfterIncidents}
          onChange={(recalculateAfterIncidents) => onPatchSetup({ recalculateAfterIncidents })}
        />
        <SetupToggleRow
          label={t('sa.setup.risk.requireApprovalForCritical')}
          checked={setup.requireApprovalForCritical}
          onChange={(requireApprovalForCritical) => onPatchSetup({ requireApprovalForCritical })}
        />
      </SetupSection>
    </div>
  )
}

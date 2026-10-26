import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupSection, SetupToggleRow } from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  IA_PREVIOUS_FINDINGS_OPTIONS,
  IA_RISK_FACTOR_OPTIONS,
  IA_RISK_SCALE_OPTIONS,
} from '@/lib/api/iaSetupApi'
import type { IaSetupStepProps } from '@/components/auth/ia/setup/types'

export function IaRiskStep({ form, onPatchSetup }: IaSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.iaSetup

  const scaleOptions = useMemo(
    () => IA_RISK_SCALE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const factorOptions = useMemo(
    () => IA_RISK_FACTOR_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const findingsOptions = useMemo(
    () => IA_PREVIOUS_FINDINGS_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="ia-setup-risk-scale"
          label={t('ia.setup.risk.riskScale')}
          required
          value={setup.riskScale}
          onChange={(riskScale) => onPatchSetup({ riskScale })}
          options={scaleOptions}
          placeholder={t('ia.setup.risk.riskScalePlaceholder')}
          searchPlaceholder={t('common.search')}
        />

        <div className="space-y-2">
          <FormLabel>{t('ia.setup.risk.riskFactors')}</FormLabel>
          <MultiSelect
            tags={setup.riskFactors}
            options={factorOptions}
            onChange={(riskFactors) => onPatchSetup({ riskFactors })}
            layout="stacked"
            searchable
            placeholder={t('ia.setup.risk.riskFactorsPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="ia-setup-previous-findings"
          label={t('ia.setup.risk.previousFindings')}
          required
          value={setup.previousFindings}
          onChange={(previousFindings) => onPatchSetup({ previousFindings })}
          options={findingsOptions}
          placeholder={t('ia.setup.risk.previousFindingsPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <TextField
          id="ia-setup-kpis"
          label={t('ia.setup.risk.performanceIndicators')}
          type="text"
          value={setup.performanceIndicators}
          placeholder={t('ia.setup.risk.performanceIndicatorsPlaceholder')}
          onChange={(event) => onPatchSetup({ performanceIndicators: event.target.value })}
        />
      </div>

      <SetupSection title={t('ia.setup.risk.scoringRules')}>
        <SetupToggleRow
          label={t('ia.setup.risk.useHistoricalLastAuditDate')}
          checked={setup.useHistoricalLastAuditDate}
          onChange={(useHistoricalLastAuditDate) => onPatchSetup({ useHistoricalLastAuditDate })}
        />
        <SetupToggleRow
          label={t('ia.setup.risk.automaticPriorityScore')}
          checked={setup.automaticPriorityScore}
          onChange={(automaticPriorityScore) => onPatchSetup({ automaticPriorityScore })}
        />
        <SetupToggleRow
          label={t('ia.setup.risk.prioritizeOverdue')}
          checked={setup.prioritizeOverdue}
          onChange={(prioritizeOverdue) => onPatchSetup({ prioritizeOverdue })}
        />
        <SetupToggleRow
          label={t('ia.setup.risk.increaseFrequencyAfterMajorNc')}
          checked={setup.increaseFrequencyAfterMajorNc}
          onChange={(increaseFrequencyAfterMajorNc) => onPatchSetup({ increaseFrequencyAfterMajorNc })}
        />
      </SetupSection>
    </div>
  )
}

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import {
  SetupNote,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { SA_CRITICAL_RULE_OPTIONS, SA_SCORE_SCALE_OPTIONS } from '@/lib/api/saSetupApi'
import type { SaSetupStepProps } from '@/components/auth/sa/setup/types'

function toScore(raw: string): number {
  const parsed = Number(raw.replace(/\D/g, ''))
  return Math.min(Math.max(Number.isNaN(parsed) ? 0 : parsed, 0), 100)
}

export function SaScoringStep({ form, onPatchSetup }: SaSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.saSetup

  const scaleOptions = useMemo(
    () => SA_SCORE_SCALE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const criticalOptions = useMemo(
    () => SA_CRITICAL_RULE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  const usesBands = setup.scoreScale !== 'PASS_FAIL'
  const bandsOverlap =
    usesBands &&
    !(setup.rejectionThreshold <= setup.conditionalLowerBound &&
      setup.conditionalLowerBound < setup.approvalThreshold)

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="sa-setup-score-scale"
          label={t('sa.setup.scoring.scoreScale')}
          required
          value={setup.scoreScale}
          onChange={(scoreScale) => onPatchSetup({ scoreScale })}
          options={scaleOptions}
          placeholder={t('sa.setup.scoring.scoreScalePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="sa-setup-critical-rule"
          label={t('sa.setup.scoring.criticalRule')}
          required
          value={setup.criticalFindingRule}
          onChange={(criticalFindingRule) => onPatchSetup({ criticalFindingRule })}
          options={criticalOptions}
          placeholder={t('sa.setup.scoring.criticalRulePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      {/* Pass/fail has no numeric bands to configure. */}
      {usesBands && (
        <>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <TextField
              id="sa-setup-approval-threshold"
              label={t('sa.setup.scoring.approvalThreshold')}
              required
              type="text"
              inputMode="numeric"
              value={String(setup.approvalThreshold)}
              onChange={(event) => onPatchSetup({ approvalThreshold: toScore(event.target.value) })}
            />
            <TextField
              id="sa-setup-conditional-lower"
              label={t('sa.setup.scoring.conditionalLowerBound')}
              type="text"
              inputMode="numeric"
              value={String(setup.conditionalLowerBound)}
              onChange={(event) =>
                onPatchSetup({ conditionalLowerBound: toScore(event.target.value) })
              }
            />
            <TextField
              id="sa-setup-rejection-threshold"
              label={t('sa.setup.scoring.rejectionThreshold')}
              type="text"
              inputMode="numeric"
              value={String(setup.rejectionThreshold)}
              onChange={(event) => onPatchSetup({ rejectionThreshold: toScore(event.target.value) })}
            />
          </div>

          {bandsOverlap && <SetupNote tone="warning">{t('sa.setup.scoring.bandsOverlap')}</SetupNote>}
        </>
      )}

      <TextField
        id="sa-setup-decision-authority"
        label={t('sa.setup.scoring.decisionAuthority')}
        required
        type="text"
        value={setup.decisionAuthority}
        placeholder={t('sa.setup.scoring.decisionAuthorityPlaceholder')}
        onChange={(event) => onPatchSetup({ decisionAuthority: event.target.value })}
      />

      <SetupSection title={t('sa.setup.scoring.decisionRules')}>
        <SetupToggleRow
          label={t('sa.setup.scoring.requireActionPlan')}
          checked={setup.requireActionPlan}
          onChange={(requireActionPlan) => onPatchSetup({ requireActionPlan })}
        />
        <SetupToggleRow
          label={t('sa.setup.scoring.recalculateStatus')}
          checked={setup.recalculateSupplierStatus}
          onChange={(recalculateSupplierStatus) => onPatchSetup({ recalculateSupplierStatus })}
        />
      </SetupSection>
    </div>
  )
}

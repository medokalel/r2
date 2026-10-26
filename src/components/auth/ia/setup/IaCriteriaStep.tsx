import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import {
  SetupFileInput,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  IA_FREQUENCY_OPTIONS,
  IA_PROCESS_OPTIONS,
  IA_STANDARD_OPTIONS,
} from '@/lib/api/iaSetupApi'
import type { IaSetupStepProps } from '@/components/auth/ia/setup/types'

export function IaCriteriaStep({ form, onPatchSetup }: IaSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.iaSetup

  /** Criteria are drawn from whatever the audit universe screen selected. */
  const criteriaOptions = useMemo(() => {
    const standards = IA_STANDARD_OPTIONS.filter((s) => setup.standards.includes(s.value))
    const processes = IA_PROCESS_OPTIONS.filter((p) => setup.processes.includes(p.value)).map((p) => ({
      value: p.value,
      label: t(p.labelKey),
    }))
    return [...standards, ...processes]
  }, [setup.processes, setup.standards, t])

  const cycleOptions = useMemo(
    () => IA_FREQUENCY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="ia-setup-programme-name"
          label={t('ia.setup.criteria.programmeName')}
          required
          type="text"
          value={setup.programmeName}
          placeholder={t('ia.setup.criteria.programmeNamePlaceholder')}
          onChange={(event) => onPatchSetup({ programmeName: event.target.value })}
        />

        <div className="space-y-2">
          <FormLabel required>{t('ia.setup.criteria.primaryCriteria')}</FormLabel>
          <MultiSelect
            tags={setup.primaryCriteria}
            options={criteriaOptions}
            onChange={(primaryCriteria) => onPatchSetup({ primaryCriteria })}
            layout="stacked"
            searchable
            placeholder={
              criteriaOptions.length > 0
                ? t('ia.setup.criteria.primaryCriteriaPlaceholder')
                : t('ia.setup.criteria.noUniverseSelected')
            }
            searchPlaceholder={t('common.search')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="space-y-2">
          <FormLabel>{t('ia.setup.criteria.internalPolicies')}</FormLabel>
          <SetupFileInput
            id="ia-setup-policies-file"
            accept=".pdf,.doc,.docx,.xlsx"
            fileName={setup.internalPoliciesFileName}
            onFileNameChange={(internalPoliciesFileName) => onPatchSetup({ internalPoliciesFileName })}
            selectLabel={t('ia.setup.criteria.uploadOrSelect')}
            changeLabel={t('companyProfile.profileHeader.changeFile')}
            removeLabel={t('common.delete')}
          />
        </div>
        <TextField
          id="ia-setup-legal-register"
          label={t('ia.setup.criteria.legalRegister')}
          type="text"
          value={setup.legalRegister}
          placeholder={t('ia.setup.criteria.legalRegisterPlaceholder')}
          onChange={(event) => onPatchSetup({ legalRegister: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="ia-setup-audit-cycle"
          label={t('ia.setup.criteria.auditCycle')}
          required
          value={setup.auditCycle}
          onChange={(auditCycle) => onPatchSetup({ auditCycle })}
          options={cycleOptions}
          placeholder={t('ia.setup.criteria.auditCyclePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <TextField
          id="ia-setup-programme-owner"
          label={t('ia.setup.criteria.programmeOwner')}
          required
          type="text"
          value={setup.programmeOwner}
          placeholder={t('ia.setup.criteria.programmeOwnerPlaceholder')}
          onChange={(event) => onPatchSetup({ programmeOwner: event.target.value })}
        />
      </div>

      <SetupSection>
        <SetupToggleRow
          label={t('ia.setup.criteria.allowMultipleCriteria')}
          checked={setup.allowMultipleCriteria}
          onChange={(allowMultipleCriteria) => onPatchSetup({ allowMultipleCriteria })}
        />
        <SetupToggleRow
          label={t('ia.setup.criteria.trackClauseFindings')}
          checked={setup.trackClauseFindings}
          onChange={(trackClauseFindings) => onPatchSetup({ trackClauseFindings })}
        />
      </SetupSection>
    </div>
  )
}

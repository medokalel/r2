import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupChipGroup, SetupSection } from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  SA_AUDIT_CRITERIA_OPTIONS,
  SA_AUDIT_FREQUENCY_OPTIONS,
  SA_AUDIT_MODE_OPTIONS,
  SA_AUDIT_TYPE_OPTIONS,
} from '@/lib/api/saSetupApi'
import type { SaSetupStepProps } from '@/components/auth/sa/setup/types'

export function SaAuditTypesStep({ form, onPatchSetup }: SaSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.saSetup

  const typeOptions = useMemo(
    () => SA_AUDIT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const modeOptions = useMemo(
    () => SA_AUDIT_MODE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const criteriaOptions = useMemo(
    () => SA_AUDIT_CRITERIA_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const frequencyOptions = useMemo(
    () => SA_AUDIT_FREQUENCY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  const toggle = (key: 'auditTypes' | 'auditModes', value: string) => {
    const current = setup[key]
    onPatchSetup({
      [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    })
  }

  return (
    <div className="w-full space-y-6">
      <SetupSection title={t('sa.setup.auditTypes.typesLabel')}>
        <SetupChipGroup
          options={typeOptions}
          selected={setup.auditTypes}
          onToggle={(value) => toggle('auditTypes', value)}
        />
      </SetupSection>

      <SetupSection title={t('sa.setup.auditTypes.modesLabel')}>
        <SetupChipGroup
          options={modeOptions}
          selected={setup.auditModes}
          onToggle={(value) => toggle('auditModes', value)}
        />
      </SetupSection>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="space-y-2">
          <FormLabel required>{t('sa.setup.auditTypes.criteria')}</FormLabel>
          <MultiSelect
            tags={setup.auditCriteria}
            options={criteriaOptions}
            onChange={(auditCriteria) => onPatchSetup({ auditCriteria })}
            layout="stacked"
            searchable
            placeholder={t('sa.setup.auditTypes.criteriaPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
        </div>

        <div className="space-y-6">
          <SearchableSelect
            id="sa-setup-audit-frequency"
            label={t('sa.setup.auditTypes.frequency')}
            required
            value={setup.auditFrequency}
            onChange={(auditFrequency) => onPatchSetup({ auditFrequency })}
            options={frequencyOptions}
            placeholder={t('sa.setup.auditTypes.frequencyPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
          <TextField
            id="sa-setup-additional-standards"
            label={t('sa.setup.auditTypes.additionalStandards')}
            type="text"
            value={setup.additionalStandards}
            placeholder={t('sa.setup.auditTypes.additionalStandardsPlaceholder')}
            onChange={(event) => onPatchSetup({ additionalStandards: event.target.value })}
          />
        </div>
      </div>
    </div>
  )
}

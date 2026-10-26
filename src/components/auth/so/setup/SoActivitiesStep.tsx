import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupChipGroup, SetupSection } from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  SO_ASSESSMENT_ACTIVITY_OPTIONS,
  SO_CYCLE_OPTIONS,
  SO_OUTCOME_OPTIONS,
  getCabStandardOptions,
} from '@/lib/api/soSetupApi'
import type { SoSetupStepProps } from '@/components/auth/so/setup/types'

export function SoActivitiesStep({ form, onPatchSetup }: SoSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.soSetup

  const activityOptions = useMemo(
    () => SO_ASSESSMENT_ACTIVITY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const outcomeOptions = useMemo(
    () => SO_OUTCOME_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const cycleOptions = useMemo(
    () => SO_CYCLE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  // The governing CAB standard depends on which activities the scheme authorizes.
  const standardOptions = useMemo(
    () => getCabStandardOptions(setup.assessmentActivities),
    [setup.assessmentActivities]
  )

  const toggleActivity = (value: string) => {
    onPatchSetup({
      assessmentActivities: setup.assessmentActivities.includes(value)
        ? setup.assessmentActivities.filter((item) => item !== value)
        : [...setup.assessmentActivities, value],
    })
  }

  return (
    <div className="w-full space-y-6">
      <SetupSection title={t('so.setup.activities.activitiesLabel')}>
        <SetupChipGroup
          options={activityOptions}
          selected={setup.assessmentActivities}
          onToggle={toggleActivity}
        />
      </SetupSection>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <SearchableSelect
          id="so-setup-cab-standard"
          label={t('so.setup.activities.cabStandard')}
          required
          value={setup.cabStandard}
          onChange={(cabStandard) => onPatchSetup({ cabStandard })}
          options={standardOptions}
          placeholder={t('so.setup.activities.cabStandardPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="so-setup-outcome"
          label={t('so.setup.activities.outcome')}
          required
          value={setup.assessmentOutcome}
          onChange={(assessmentOutcome) => onPatchSetup({ assessmentOutcome })}
          options={outcomeOptions}
          placeholder={t('so.setup.activities.outcomePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="so-setup-certification-cycle"
          label={t('so.setup.activities.certificationCycle')}
          value={setup.certificationCycle}
          onChange={(certificationCycle) => onPatchSetup({ certificationCycle })}
          options={cycleOptions}
          placeholder={t('so.setup.activities.certificationCyclePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>
    </div>
  )
}

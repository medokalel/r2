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
  SO_APPLICANT_TYPE_OPTIONS,
  SO_GEOGRAPHY_OPTIONS,
  SO_SCOPE_CLASSIFICATION_OPTIONS,
} from '@/lib/api/soSetupApi'
import { getCountryOptions } from '@/lib/countries'
import type { SoSetupStepProps } from '@/components/auth/so/setup/types'

export function SoScopeStep({ form, onPatchSetup }: SoSetupStepProps) {
  const { t, i18n } = useTranslation()
  const setup = form.soSetup

  const classificationOptions = useMemo(
    () => SO_SCOPE_CLASSIFICATION_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const applicantOptions = useMemo(
    () => SO_APPLICANT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const geographyOptions = useMemo(
    () => SO_GEOGRAPHY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const countries = useMemo(
    () =>
      getCountryOptions(i18n.language).map((country) => ({
        value: country.code,
        label: `${country.flag} ${country.name}`,
      })),
    [i18n.language]
  )

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="space-y-2">
          <FormLabel required>{t('so.setup.scope.classification')}</FormLabel>
          <MultiSelect
            tags={setup.scopeClassifications}
            options={classificationOptions}
            onChange={(scopeClassifications) => onPatchSetup({ scopeClassifications })}
            layout="stacked"
            searchable
            placeholder={t('so.setup.scope.classificationPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
        </div>

        <div className="space-y-2">
          <FormLabel required>{t('so.setup.scope.eligibleApplicants')}</FormLabel>
          <MultiSelect
            tags={setup.eligibleApplicants}
            options={applicantOptions}
            onChange={(eligibleApplicants) => onPatchSetup({ eligibleApplicants })}
            layout="stacked"
            searchable
            placeholder={t('so.setup.scope.eligibleApplicantsPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="so-setup-geography"
          label={t('so.setup.scope.geographicLimits')}
          value={setup.geographicLimits}
          onChange={(geographicLimits) => onPatchSetup({ geographicLimits, geographicCountries: [] })}
          options={geographyOptions}
          placeholder={t('so.setup.scope.geographicLimitsPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <TextField
          id="so-setup-exclusions"
          label={t('so.setup.scope.excludedActivities')}
          type="text"
          value={setup.excludedActivities}
          placeholder={t('so.setup.scope.excludedActivitiesPlaceholder')}
          onChange={(event) => onPatchSetup({ excludedActivities: event.target.value })}
        />
      </div>

      {setup.geographicLimits === 'SELECTED_COUNTRIES' && (
        <div className="space-y-2">
          <FormLabel required>{t('so.setup.scope.geographicCountries')}</FormLabel>
          <MultiSelect
            tags={setup.geographicCountries}
            options={countries}
            onChange={(geographicCountries) => onPatchSetup({ geographicCountries })}
            layout="stacked"
            searchable
            placeholder={t('so.setup.scope.geographicCountriesPlaceholder')}
            searchPlaceholder={t('common.search')}
          />
        </div>
      )}

      <SetupSection title={t('so.setup.scope.normativeRequirements')}>
        <SetupFileInput
          id="so-setup-requirements-file"
          accept=".pdf,.doc,.docx"
          fileName={setup.normativeRequirementsFileName}
          onFileNameChange={(normativeRequirementsFileName) =>
            onPatchSetup({ normativeRequirementsFileName })
          }
          selectLabel={t('so.setup.scope.uploadRequirements')}
          changeLabel={t('companyProfile.profileHeader.changeFile')}
          removeLabel={t('common.delete')}
        />
      </SetupSection>

      <SetupSection title={t('so.setup.scope.scopeRules')}>
        <SetupToggleRow
          label={t('so.setup.scope.publicScopeList')}
          checked={setup.publicScopeList}
          onChange={(publicScopeList) => onPatchSetup({ publicScopeList })}
        />
        <SetupToggleRow
          label={t('so.setup.scope.blockOutsideScope')}
          checked={setup.blockOutsideScope}
          onChange={(blockOutsideScope) => onPatchSetup({ blockOutsideScope })}
        />
        <SetupToggleRow
          label={t('so.setup.scope.requireEligibilityReview')}
          checked={setup.requireEligibilityReview}
          onChange={(requireEligibilityReview) => onPatchSetup({ requireEligibilityReview })}
        />
      </SetupSection>
    </div>
  )
}

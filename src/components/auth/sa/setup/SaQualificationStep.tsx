import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupSection, SetupToggleRow } from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  SA_EVIDENCE_OPTIONS,
  SA_QUALIFICATION_ROUTE_OPTIONS,
  SA_VALIDITY_OPTIONS,
} from '@/lib/api/saSetupApi'
import type { SaSetupStepProps } from '@/components/auth/sa/setup/types'

export function SaQualificationStep({ form, onPatchSetup }: SaSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.saSetup

  const routeOptions = useMemo(
    () => SA_QUALIFICATION_ROUTE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const evidenceOptions = useMemo(
    () => SA_EVIDENCE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const validityOptions = useMemo(
    () => SA_VALIDITY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="sa-setup-qualification-route"
          label={t('sa.setup.qualification.route')}
          required
          value={setup.qualificationRoute}
          onChange={(qualificationRoute) => onPatchSetup({ qualificationRoute })}
          options={routeOptions}
          placeholder={t('sa.setup.qualification.routePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="sa-setup-approval-validity"
          label={t('sa.setup.qualification.approvalValidity')}
          required
          value={setup.approvalValidity}
          onChange={(approvalValidity) => onPatchSetup({ approvalValidity })}
          options={validityOptions}
          placeholder={t('sa.setup.qualification.approvalValidityPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>{t('sa.setup.qualification.requiredEvidence')}</FormLabel>
        <MultiSelect
          tags={setup.requiredEvidence}
          options={evidenceOptions}
          onChange={(requiredEvidence) => onPatchSetup({ requiredEvidence })}
          layout="stacked"
          searchable
          placeholder={t('sa.setup.qualification.requiredEvidencePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="sa-setup-required-licences"
          label={t('sa.setup.qualification.requiredLicences')}
          type="text"
          value={setup.requiredLicences}
          placeholder={t('sa.setup.qualification.requiredLicencesPlaceholder')}
          onChange={(event) => onPatchSetup({ requiredLicences: event.target.value })}
        />
        <TextField
          id="sa-setup-management-certificates"
          label={t('sa.setup.qualification.managementCertificates')}
          type="text"
          value={setup.managementCertificates}
          placeholder={t('sa.setup.qualification.managementCertificatesPlaceholder')}
          onChange={(event) => onPatchSetup({ managementCertificates: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="sa-setup-financial-checks"
          label={t('sa.setup.qualification.financialChecks')}
          type="text"
          value={setup.financialChecks}
          placeholder={t('sa.setup.qualification.financialChecksPlaceholder')}
          onChange={(event) => onPatchSetup({ financialChecks: event.target.value })}
        />
        <TextField
          id="sa-setup-insurance-evidence"
          label={t('sa.setup.qualification.insuranceEvidence')}
          type="text"
          value={setup.insuranceEvidence}
          placeholder={t('sa.setup.qualification.insuranceEvidencePlaceholder')}
          onChange={(event) => onPatchSetup({ insuranceEvidence: event.target.value })}
        />
      </div>

      <SetupSection title={t('sa.setup.qualification.documentRules')}>
        <SetupToggleRow
          label={t('sa.setup.qualification.blockExpiredDocuments')}
          checked={setup.blockExpiredDocuments}
          onChange={(blockExpiredDocuments) => onPatchSetup({ blockExpiredDocuments })}
        />
        <SetupToggleRow
          label={t('sa.setup.qualification.applyConditionalApproval')}
          checked={setup.applyConditionalApproval}
          onChange={(applyConditionalApproval) => onPatchSetup({ applyConditionalApproval })}
        />
      </SetupSection>
    </div>
  )
}

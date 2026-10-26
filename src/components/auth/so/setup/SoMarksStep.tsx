import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import {
  SetupFileInput,
  SetupMarkUpload,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { SO_MARK_USE_OPTIONS } from '@/lib/api/soSetupApi'
import type { SoSetupStepProps } from '@/components/auth/so/setup/types'

export function SoMarksStep({ form, onPatchSetup }: SoSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.soSetup

  const useOptions = useMemo(
    () => SO_MARK_USE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-[1fr_1.2fr]">
        <SetupMarkUpload
          id="so-setup-scheme-mark"
          label={t('so.setup.marks.schemeMark')}
          caption={t('so.setup.marks.schemeMarkCaption')}
          imageUrl={setup.schemeMarkUrl}
          onImageUrlChange={(schemeMarkUrl) => onPatchSetup({ schemeMarkUrl })}
          uploadLabel={t('so.setup.marks.upload')}
          removeLabel={t('common.delete')}
        />

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <TextField
              id="so-setup-artwork-version"
              label={t('so.setup.marks.artworkVersion')}
              type="text"
              value={setup.artworkVersion}
              placeholder={t('so.setup.marks.artworkVersionPlaceholder')}
              onChange={(event) => onPatchSetup({ artworkVersion: event.target.value })}
            />
            <TextField
              id="so-setup-approval-reference"
              label={t('so.setup.marks.approvalReference')}
              type="text"
              value={setup.approvalReference}
              placeholder={t('so.setup.marks.approvalReferencePlaceholder')}
              onChange={(event) => onPatchSetup({ approvalReference: event.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <TextField
              id="so-setup-mark-from"
              label={t('so.setup.marks.validFrom')}
              type="date"
              lang="en"
              dir="ltr"
              value={setup.markValidFrom}
              onChange={(event) => onPatchSetup({ markValidFrom: event.target.value })}
            />
            <TextField
              id="so-setup-mark-until"
              label={t('so.setup.marks.validUntil')}
              type="date"
              lang="en"
              dir="ltr"
              value={setup.markValidUntil}
              onChange={(event) => onPatchSetup({ markValidUntil: event.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <FormLabel required>{t('so.setup.marks.permittedUse')}</FormLabel>
        <MultiSelect
          tags={setup.permittedUse}
          options={useOptions}
          onChange={(permittedUse) => onPatchSetup({ permittedUse })}
          searchable
          placeholder={t('so.setup.marks.permittedUsePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <SetupSection title={t('so.setup.marks.usageGuide')}>
        <SetupFileInput
          id="so-setup-usage-guide"
          fileName={setup.usageGuideFileName}
          onFileNameChange={(usageGuideFileName) => onPatchSetup({ usageGuideFileName })}
          selectLabel={t('so.setup.marks.uploadPdf')}
          changeLabel={t('companyProfile.profileHeader.changeFile')}
          removeLabel={t('common.delete')}
        />
      </SetupSection>

      <SetupSection title={t('so.setup.marks.usageRules')}>
        <SetupToggleRow
          label={t('so.setup.marks.blockAfterSuspension')}
          checked={setup.blockUseAfterSuspension}
          onChange={(blockUseAfterSuspension) => onPatchSetup({ blockUseAfterSuspension })}
        />
        <SetupToggleRow
          label={t('so.setup.marks.keepAuditTrail')}
          checked={setup.keepMarkAuditTrail}
          onChange={(keepMarkAuditTrail) => onPatchSetup({ keepMarkAuditTrail })}
        />
      </SetupSection>
    </div>
  )
}

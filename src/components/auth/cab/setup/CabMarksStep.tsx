import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { DatePicker } from '@/components/ui/DatePicker'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { OnboardingLogoUpload } from '@/components/auth/OnboardingLogoUpload'
import {
  SetupMarkUpload,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { ALLOWED_DOCUMENT_USE_OPTIONS } from '@/lib/api/cabSetupApi'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function fromIsoDate(value: string): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export function CabMarksStep({ form, onPatch, onPatchSetup }: CabSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.cabSetup

  const documentUseOptions = useMemo(
    () =>
      ALLOWED_DOCUMENT_USE_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t]
  )

  /** Marks inherit the record they are governed by, so surface that link as a caption. */
  const accreditationCaption = useMemo(() => {
    const record = setup.accreditationRecords.find((item) => item.body)
    if (!record) return t('cab.setup.marks.accreditationMarkUnlinked')
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        {t('cab.setup.marks.linkedToLabel')}
        <span dir="ltr" className="rounded-full bg-[var(--cab-subtle)] px-2 py-0.5 text-caption font-bold text-[var(--cab-primary)]">
          {record.number.trim() ? `${record.body} · ${record.number}` : record.body}
        </span>
      </span>
    )
  }, [setup.accreditationRecords, t])

  return (
    <div className="w-full space-y-6">

      <OnboardingLogoUpload
        target="cab"
        title={t('cab.setup.marks.cabLogo')}
        caption={t('cab.setup.marks.cabLogoCaption')}
        inputId="cab-setup-logo"
        logoUrl={form.logoUrl}
        onLogoUrlChange={(logoUrl) => onPatch({ logoUrl })}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <SetupMarkUpload
          id="cab-setup-accreditation-mark"
          label={t('cab.setup.marks.accreditationMark')}
          caption={accreditationCaption}
          imageUrl={setup.accreditationMarkUrl}
          onImageUrlChange={(accreditationMarkUrl) => onPatchSetup({ accreditationMarkUrl })}
          uploadLabel={t('cab.setup.marks.upload')}
          removeLabel={t('common.delete')}
        />
        <SetupMarkUpload
          id="cab-setup-scheme-mark"
          label={t('cab.setup.marks.schemeMark')}
          caption={t('cab.setup.marks.schemeMarkCaption')}
          imageUrl={setup.schemeMarkUrl}
          onImageUrlChange={(schemeMarkUrl) => onPatchSetup({ schemeMarkUrl })}
          uploadLabel={t('cab.setup.marks.upload')}
          removeLabel={t('common.delete')}
        />
      </div>

      <div className="grid grid-cols-1 items-end gap-8 sm:grid-cols-3">
        <TextField
          id="cab-setup-mark-reference"
          label={t('cab.setup.marks.markReference')}
          type="text"
          value={setup.markReference}
          placeholder={t('cab.setup.marks.markReferencePlaceholder')}
          valueKind="mixed"
          onChange={(event) => onPatchSetup({ markReference: event.target.value })}
        />
        <div className="space-y-2">
          <FormLabel htmlFor="cab-setup-mark-valid-from">{t('cab.setup.marks.validFrom')}</FormLabel>
          <DatePicker
            value={fromIsoDate(setup.markValidFrom)}
            onChange={(date) => onPatchSetup({ markValidFrom: toIsoDate(date) })}
          />
        </div>
        <div id="cab-setup-mark-valid-until" className="space-y-2">
          <FormLabel htmlFor="cab-setup-mark-valid-until">{t('cab.setup.marks.validUntil')}</FormLabel>
          <DatePicker
            value={fromIsoDate(setup.markValidUntil)}
            onChange={(date) => onPatchSetup({ markValidUntil: toIsoDate(date) })}
          />
          {setup.markValidFrom && setup.markValidUntil && setup.markValidUntil <= setup.markValidFrom && (
            <p className="text-caption text-error-700">{t('validation.untilAfterFrom')}</p>
          )}
        </div>
      </div>

      <div id="cab-setup-document-use" className="space-y-2">
        <FormLabel required>{t('cab.setup.marks.allowedUse')}</FormLabel>
        <MultiSelect
          tags={setup.allowedDocumentUse}
          options={documentUseOptions}
          onChange={(allowedDocumentUse) => onPatchSetup({ allowedDocumentUse })}
          searchable
          placeholder={t('cab.setup.marks.allowedUsePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <SetupSection title={t('cab.setup.marks.usageRules')}>
        <SetupToggleRow
          label={t('cab.setup.marks.applyOnlyToAccredited')}
          checked={setup.applyMarkOnlyToAccredited}
          onChange={(applyMarkOnlyToAccredited) => onPatchSetup({ applyMarkOnlyToAccredited })}
        />
        <SetupToggleRow
          label={t('cab.setup.marks.blockAfterExpiry')}
          checked={setup.blockMarkAfterExpiry}
          onChange={(blockMarkAfterExpiry) => onPatchSetup({ blockMarkAfterExpiry })}
        />
        <SetupToggleRow
          label={t('cab.setup.marks.keepAuditTrail')}
          checked={setup.keepMarkAuditTrail}
          onChange={(keepMarkAuditTrail) => onPatchSetup({ keepMarkAuditTrail })}
        />
      </SetupSection>
    </div>
  )
}

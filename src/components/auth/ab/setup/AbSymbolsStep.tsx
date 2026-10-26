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
import { AB_COOPERATION_BODY_OPTIONS, AB_PERMITTED_USE_OPTIONS } from '@/lib/api/abSetupApi'
import type { AbSetupStepProps } from '@/components/auth/ab/setup/types'

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

export function AbSymbolsStep({ form, onPatch, onPatchSetup }: AbSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.abSetup

  const permittedUseOptions = useMemo(
    () => AB_PERMITTED_USE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  /** The recognition mark is governed by an active arrangement — surface which. */
  const recognitionCaption = useMemo(() => {
    const record = setup.recognitionRecords.find((item) => item.cooperationBody)
    if (!record) return t('ab.setup.symbols.recognitionMarkUnlinked')
    const body = AB_COOPERATION_BODY_OPTIONS.find(
      (option) => option.value === record.cooperationBody
    )
    return t('ab.setup.symbols.linkedTo', { target: body?.value ?? record.cooperationBody })
  }, [setup.recognitionRecords, t])

  return (
    <div className="w-full space-y-6">
      <SetupSection title={t('ab.setup.symbols.abLogo')}>
        <p className="mb-3 text-caption text-[var(--cab-muted)]">{t('ab.setup.symbols.abLogoCaption')}</p>
        <OnboardingLogoUpload logoUrl={form.logoUrl} onLogoUrlChange={(logoUrl) => onPatch({ logoUrl })} />
      </SetupSection>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SetupMarkUpload
          id="ab-setup-accreditation-symbol"
          label={t('ab.setup.symbols.accreditationSymbol')}
          caption={t('ab.setup.symbols.accreditationSymbolCaption')}
          imageUrl={setup.accreditationSymbolUrl}
          onImageUrlChange={(accreditationSymbolUrl) => onPatchSetup({ accreditationSymbolUrl })}
          uploadLabel={t('ab.setup.symbols.upload')}
          removeLabel={t('common.delete')}
        />
        <SetupMarkUpload
          id="ab-setup-recognition-mark"
          label={t('ab.setup.symbols.recognitionMark')}
          caption={recognitionCaption}
          imageUrl={setup.recognitionMarkUrl}
          onImageUrlChange={(recognitionMarkUrl) => onPatchSetup({ recognitionMarkUrl })}
          uploadLabel={t('ab.setup.symbols.upload')}
          removeLabel={t('common.delete')}
        />
      </div>

      <div className="grid grid-cols-1 items-end gap-8 sm:grid-cols-3">
        <TextField
          id="ab-setup-symbol-reference"
          label={t('ab.setup.symbols.symbolReference')}
          type="text"
          value={setup.symbolReference}
          placeholder={t('ab.setup.symbols.symbolReferencePlaceholder')}
          onChange={(event) => onPatchSetup({ symbolReference: event.target.value })}
        />
        <div className="space-y-2">
          <FormLabel htmlFor="ab-setup-symbol-from">{t('ab.setup.symbols.validFrom')}</FormLabel>
          <DatePicker
            value={fromIsoDate(setup.symbolValidFrom)}
            onChange={(date) => onPatchSetup({ symbolValidFrom: toIsoDate(date) })}
          />
        </div>
        <div className="space-y-2">
          <FormLabel htmlFor="ab-setup-symbol-until">{t('ab.setup.symbols.validUntil')}</FormLabel>
          <DatePicker
            value={fromIsoDate(setup.symbolValidUntil)}
            onChange={(date) => onPatchSetup({ symbolValidUntil: toIsoDate(date) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <FormLabel required>{t('ab.setup.symbols.permittedUse')}</FormLabel>
        <MultiSelect
          tags={setup.permittedUse}
          options={permittedUseOptions}
          onChange={(permittedUse) => onPatchSetup({ permittedUse })}
          searchable
          placeholder={t('ab.setup.symbols.permittedUsePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <SetupSection title={t('ab.setup.symbols.usageRules')}>
        <SetupToggleRow
          label={t('ab.setup.symbols.issueOnlyForGranted')}
          checked={setup.issueOnlyForGrantedScopes}
          onChange={(issueOnlyForGrantedScopes) => onPatchSetup({ issueOnlyForGrantedScopes })}
        />
        <SetupToggleRow
          label={t('ab.setup.symbols.blockAfterSuspension')}
          checked={setup.blockAfterSuspension}
          onChange={(blockAfterSuspension) => onPatchSetup({ blockAfterSuspension })}
        />
        <SetupToggleRow
          label={t('ab.setup.symbols.keepAuditTrail')}
          checked={setup.keepSymbolAuditTrail}
          onChange={(keepSymbolAuditTrail) => onPatchSetup({ keepSymbolAuditTrail })}
        />
      </SetupSection>
    </div>
  )
}

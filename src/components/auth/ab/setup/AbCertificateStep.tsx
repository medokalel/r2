import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import {
  SetupNote,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  AB_CYCLE_OPTIONS,
  AB_DOCUMENT_LANGUAGE_OPTIONS,
  AB_NUMBER_TOKENS,
  AB_PROGRAMME_OPTIONS,
  AB_TEMPLATE_OPTIONS,
} from '@/lib/api/abSetupApi'
import { buildAbNumberExample } from '@/lib/abSetupForm'
import type { AbSetupStepProps } from '@/components/auth/ab/setup/types'

export function AbCertificateStep({ form, onPatchSetup }: AbSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.abSetup

  const cycleOptions = useMemo(
    () => AB_CYCLE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const languageOptions = useMemo(
    () => AB_DOCUMENT_LANGUAGE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const templateOptions = useMemo(
    () => AB_TEMPLATE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  /** Preview the number using the AB's first selected programme. */
  const exampleNumber = useMemo(() => {
    const first = AB_PROGRAMME_OPTIONS.find((programme) => setup.programmes.includes(programme.value))
    return buildAbNumberExample(
      setup.numberFormat,
      form.tradingName || form.legalEntityName,
      first?.shortCode ?? 'CB'
    )
  }, [form.legalEntityName, form.tradingName, setup.numberFormat, setup.programmes])

  const missingSeq = !setup.numberFormat.includes('{SEQ}')

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <TextField
          id="ab-setup-number-format"
          label={t('ab.setup.certificate.numberFormat')}
          required
          type="text"
          lang="en"
          dir="ltr"
          value={setup.numberFormat}
          placeholder="{AB}-{PROGRAMME}-{YEAR}-{SEQ}"
          onChange={(event) => onPatchSetup({ numberFormat: event.target.value })}
          error={missingSeq ? t('ab.setup.certificate.seqRequired') : undefined}
        />

        <p className="text-caption text-[var(--cab-muted)]" lang="en" dir="ltr">
          {t('ab.setup.certificate.example')}:{' '}
          <span className="text-[var(--cab-ink)]">{exampleNumber}</span>
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {AB_NUMBER_TOKENS.map((token) => (
            <button
              key={token}
              type="button"
              onClick={() => onPatchSetup({ numberFormat: `${setup.numberFormat}${token}` })}
              className="rounded-full border border-[var(--cab-border)] bg-white px-3 py-1 font-mono text-caption text-[var(--cab-primary)] hover:border-[var(--cab-primary)] hover:bg-[var(--cab-subtle)]"
              lang="en"
              dir="ltr"
            >
              {token}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="ab-setup-cycle"
          label={t('ab.setup.certificate.cycle')}
          required
          value={setup.accreditationCycle}
          onChange={(accreditationCycle) => onPatchSetup({ accreditationCycle })}
          options={cycleOptions}
          placeholder={t('ab.setup.certificate.cyclePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="ab-setup-doc-language"
          label={t('ab.setup.certificate.language')}
          required
          value={setup.documentLanguage}
          onChange={(documentLanguage) => onPatchSetup({ documentLanguage })}
          options={languageOptions}
          placeholder={t('ab.setup.certificate.languagePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="ab-setup-signatory"
          label={t('ab.setup.certificate.signatory')}
          type="text"
          value={setup.decisionSignatory}
          placeholder={t('ab.setup.certificate.signatoryPlaceholder')}
          onChange={(event) => onPatchSetup({ decisionSignatory: event.target.value })}
        />
        <SearchableSelect
          id="ab-setup-template"
          label={t('ab.setup.certificate.template')}
          required
          value={setup.template}
          onChange={(template) => onPatchSetup({ template })}
          options={templateOptions}
          placeholder={t('ab.setup.certificate.templatePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <SetupSection title={t('ab.setup.certificate.displayRules')}>
        <SetupToggleRow
          label={t('ab.setup.certificate.showAbLogo')}
          checked={setup.showAbLogo}
          onChange={(showAbLogo) => onPatchSetup({ showAbLogo })}
        />
        <SetupToggleRow
          label={t('ab.setup.certificate.showRecognitionMark')}
          checked={setup.showRecognitionMark}
          onChange={(showRecognitionMark) => onPatchSetup({ showRecognitionMark })}
        />
        <SetupToggleRow
          label={t('ab.setup.certificate.showQrCode')}
          checked={setup.showQrCode}
          onChange={(showQrCode) => onPatchSetup({ showQrCode })}
        />
      </SetupSection>

      <SetupNote>{t('ab.setup.certificate.validationNote')}</SetupNote>
    </div>
  )
}

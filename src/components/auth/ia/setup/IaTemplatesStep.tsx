import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SetupSection, SetupToggleRow } from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  IA_FINDING_TOKENS,
  IA_NUMBER_TOKENS,
  IA_REPORT_LANGUAGE_OPTIONS,
  IA_TEMPLATE_OPTIONS,
} from '@/lib/api/iaSetupApi'
import { buildIaFindingExample, buildIaNumberExample } from '@/lib/iaSetupForm'
import type { IaSetupStepProps } from '@/components/auth/ia/setup/types'

/** Row of clickable tokens that append to a format field. */
function TokenRow({
  tokens,
  onAppend,
}: {
  tokens: readonly string[]
  onAppend: (token: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {tokens.map((token) => (
        <button
          key={token}
          type="button"
          onClick={() => onAppend(token)}
          className="rounded-full border border-[var(--cab-border)] bg-white px-3 py-1 font-mono text-caption text-[var(--cab-primary)] hover:border-[var(--cab-primary)] hover:bg-[var(--cab-subtle)]"
          lang="en"
          dir="ltr"
        >
          {token}
        </button>
      ))}
    </div>
  )
}

export function IaTemplatesStep({ form, onPatchSetup }: IaSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.iaSetup

  const templateOptions = useMemo(
    () => IA_TEMPLATE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const languageOptions = useMemo(
    () => IA_REPORT_LANGUAGE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  const auditExample = buildIaNumberExample(setup.auditNumberFormat, 'HQ', 'OPS')
  const findingExample = buildIaFindingExample(setup.findingNumberFormat, setup.auditNumberFormat)

  const auditMissingSeq = !setup.auditNumberFormat.includes('{SEQ}')
  const findingMissingSeq = !setup.findingNumberFormat.includes('{SEQ}')

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="space-y-2">
          <TextField
            id="ia-setup-audit-number"
            label={t('ia.setup.templates.auditNumberFormat')}
            required
            type="text"
            lang="en"
            dir="ltr"
            value={setup.auditNumberFormat}
            placeholder="IA-{YEAR}-{SEQ}"
            onChange={(event) => onPatchSetup({ auditNumberFormat: event.target.value })}
            error={auditMissingSeq ? t('ia.setup.templates.seqRequired') : undefined}
          />
          <p className="text-caption text-[var(--cab-muted)]" lang="en" dir="ltr">
            {t('ia.setup.templates.example')}:{' '}
            <span className="text-[var(--cab-ink)]">{auditExample}</span>
          </p>
          <TokenRow
            tokens={IA_NUMBER_TOKENS}
            onAppend={(token) =>
              onPatchSetup({ auditNumberFormat: `${setup.auditNumberFormat}${token}` })
            }
          />
        </div>

        <div className="space-y-2">
          <TextField
            id="ia-setup-finding-number"
            label={t('ia.setup.templates.findingNumberFormat')}
            required
            type="text"
            lang="en"
            dir="ltr"
            value={setup.findingNumberFormat}
            placeholder="NC-{AUDIT}-{SEQ}"
            onChange={(event) => onPatchSetup({ findingNumberFormat: event.target.value })}
            error={findingMissingSeq ? t('ia.setup.templates.seqRequired') : undefined}
          />
          <p className="text-caption text-[var(--cab-muted)]" lang="en" dir="ltr">
            {t('ia.setup.templates.example')}:{' '}
            <span className="text-[var(--cab-ink)]">{findingExample}</span>
          </p>
          <TokenRow
            tokens={IA_FINDING_TOKENS}
            onAppend={(token) =>
              onPatchSetup({ findingNumberFormat: `${setup.findingNumberFormat}${token}` })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <SearchableSelect
          id="ia-setup-plan-template"
          label={t('ia.setup.templates.auditPlanTemplate')}
          value={setup.auditPlanTemplate}
          onChange={(auditPlanTemplate) => onPatchSetup({ auditPlanTemplate })}
          options={templateOptions}
          placeholder={t('ia.setup.templates.templatePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="ia-setup-checklist-template"
          label={t('ia.setup.templates.checklistTemplate')}
          value={setup.checklistTemplate}
          onChange={(checklistTemplate) => onPatchSetup({ checklistTemplate })}
          options={templateOptions}
          placeholder={t('ia.setup.templates.templatePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="ia-setup-report-language"
          label={t('ia.setup.templates.reportLanguage')}
          value={setup.reportLanguage}
          onChange={(reportLanguage) => onPatchSetup({ reportLanguage })}
          options={languageOptions}
          placeholder={t('ia.setup.templates.reportLanguagePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <SetupSection title={t('ia.setup.templates.documentRules')}>
        <SetupToggleRow
          label={t('ia.setup.templates.electronicApproval')}
          checked={setup.electronicApproval}
          onChange={(electronicApproval) => onPatchSetup({ electronicApproval })}
        />
        <SetupToggleRow
          label={t('ia.setup.templates.useControlledTemplates')}
          checked={setup.useControlledTemplates}
          onChange={(useControlledTemplates) => onPatchSetup({ useControlledTemplates })}
        />
        <SetupToggleRow
          label={t('ia.setup.templates.showRevisionHistory')}
          checked={setup.showRevisionHistory}
          onChange={(showRevisionHistory) => onPatchSetup({ showRevisionHistory })}
        />
      </SetupSection>
    </div>
  )
}

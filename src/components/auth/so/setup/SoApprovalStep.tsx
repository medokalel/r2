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
  SO_APPROVAL_ROUTE_OPTIONS,
  SO_CYCLE_OPTIONS,
  SO_LICENCE_TOKENS,
  SO_SURVEILLANCE_OPTIONS,
  approvalRouteNeedsAccreditation,
} from '@/lib/api/soSetupApi'
import { buildSoLicenceExample } from '@/lib/soSetupForm'
import type { SoSetupStepProps } from '@/components/auth/so/setup/types'

export function SoApprovalStep({ form, onPatchSetup }: SoSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.soSetup

  const routeOptions = useMemo(
    () => SO_APPROVAL_ROUTE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const validityOptions = useMemo(
    () => SO_CYCLE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const surveillanceOptions = useMemo(
    () => SO_SURVEILLANCE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  const firstSchemeCode = setup.schemes.find((scheme) => scheme.code.trim())?.code.trim() ?? ''
  const licenceExample = buildSoLicenceExample(setup.licenceNumberFormat, firstSchemeCode)
  const missingSeq = !setup.licenceNumberFormat.includes('{SEQ}')
  const needsAccreditation = approvalRouteNeedsAccreditation(setup.approvalRoute)

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <SearchableSelect
          id="so-setup-approval-route"
          label={t('so.setup.approval.route')}
          required
          value={setup.approvalRoute}
          onChange={(approvalRoute) => onPatchSetup({ approvalRoute })}
          options={routeOptions}
          placeholder={t('so.setup.approval.routePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="so-setup-approval-validity"
          label={t('so.setup.approval.validity')}
          required
          value={setup.approvalValidity}
          onChange={(approvalValidity) => onPatchSetup({ approvalValidity })}
          options={validityOptions}
          placeholder={t('so.setup.approval.validityPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="so-setup-surveillance"
          label={t('so.setup.approval.surveillance')}
          required
          value={setup.surveillanceFrequency}
          onChange={(surveillanceFrequency) => onPatchSetup({ surveillanceFrequency })}
          options={surveillanceOptions}
          placeholder={t('so.setup.approval.surveillancePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <div className="space-y-2">
        <TextField
          id="so-setup-licence-format"
          label={t('so.setup.approval.licenceFormat')}
          required
          type="text"
          lang="en"
          dir="ltr"
          value={setup.licenceNumberFormat}
          placeholder="{SCHEME}-CAB-{SEQ}"
          onChange={(event) => onPatchSetup({ licenceNumberFormat: event.target.value })}
          error={missingSeq ? t('so.setup.approval.seqRequired') : undefined}
        />
        <p className="text-caption text-[var(--cab-muted)]" lang="en" dir="ltr">
          {t('so.setup.approval.example')}:{' '}
          <span className="text-[var(--cab-ink)]">{licenceExample}</span>
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {SO_LICENCE_TOKENS.map((token) => (
            <button
              key={token}
              type="button"
              onClick={() =>
                onPatchSetup({ licenceNumberFormat: `${setup.licenceNumberFormat}${token}` })
              }
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
        <TextField
          id="so-setup-renewal-rule"
          label={t('so.setup.approval.renewalRule')}
          type="text"
          value={setup.renewalRule}
          placeholder={t('so.setup.approval.renewalRulePlaceholder')}
          onChange={(event) => onPatchSetup({ renewalRule: event.target.value })}
        />
        <TextField
          id="so-setup-suspension-rule"
          label={t('so.setup.approval.suspensionRule')}
          type="text"
          value={setup.suspensionRule}
          placeholder={t('so.setup.approval.suspensionRulePlaceholder')}
          onChange={(event) => onPatchSetup({ suspensionRule: event.target.value })}
        />
      </div>

      <SetupSection title={t('so.setup.approval.licensingRules')}>
        <SetupToggleRow
          label={t('so.setup.approval.requireActiveAccreditation')}
          checked={setup.requireActiveAccreditation}
          onChange={(requireActiveAccreditation) => onPatchSetup({ requireActiveAccreditation })}
        />
        <SetupToggleRow
          label={t('so.setup.approval.publishDirectory')}
          checked={setup.publishApprovedCabDirectory}
          onChange={(publishApprovedCabDirectory) => onPatchSetup({ publishApprovedCabDirectory })}
        />
      </SetupSection>

      {needsAccreditation && !setup.requireActiveAccreditation && (
        <SetupNote tone="warning">{t('so.setup.approval.recognitionNote')}</SetupNote>
      )}
    </div>
  )
}

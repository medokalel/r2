import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import { SetupOptionCard, SetupSection } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { ACCREDITATION_STATUS_OPTIONS } from '@/lib/api/cabSetupApi'
import { ensureAccreditationRecords, getDefaultAccreditationRecordStatus, requiresAccreditationRecords } from '@/lib/cabSetupForm'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'

export function CabAccreditationStatusStep({ form, onPatchSetup }: CabSetupStepProps) {
  const { t } = useTranslation()
  const { accreditationStatuses, accreditationRecordCount, accreditationRecords } = form.cabSetup

  const selectStatus = (value: string) => {
    if (accreditationStatuses.includes(value)) {
      onPatchSetup({ accreditationStatuses: [], accreditationRecords: [], accreditationRecordCount: 1 })
      return
    }

    const nextStatuses = [value]
    const needsRecords = value === 'ACCREDITED' || value === 'APPLICANT'
    const nextSetup = { ...form.cabSetup, accreditationStatuses: nextStatuses }
    onPatchSetup({
      accreditationStatuses: nextStatuses,
      ...(needsRecords
        ? {
            accreditationRecords: ensureAccreditationRecords(
              accreditationRecordCount,
              accreditationRecords,
              getDefaultAccreditationRecordStatus(nextSetup)
            ),
          }
        : { accreditationRecords: [] }),
    })
  }

  const showRecordCount = requiresAccreditationRecords(form.cabSetup)

  /** Keep the record list in step with the requested count so screen 4 opens ready. */
  const setRecordCount = (rawValue: string) => {
    const parsed = Number(rawValue.replace(/\D/g, ''))
    const count = Math.min(Math.max(Number.isNaN(parsed) ? 1 : parsed, 1), 20)

    onPatchSetup({
      accreditationRecordCount: count,
      accreditationRecords: ensureAccreditationRecords(
        count,
        accreditationRecords,
        getDefaultAccreditationRecordStatus(form.cabSetup)
      ),
    })
  }

  return (
    <div className="w-full space-y-6">

      <div id="cab-setup-accreditation-status" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ACCREDITATION_STATUS_OPTIONS.map((option) => (
          <SetupOptionCard
            key={option.value}
            title={t(option.labelKey)}
            description={t(`cab.setup.accreditationStatus.descriptions.${option.value}`)}
            selected={accreditationStatuses.includes(option.value)}
            onSelect={() => selectStatus(option.value)}
          />
        ))}
      </div>

      {showRecordCount && (
        <div className="space-y-2">
          <TextField
            id="cab-setup-record-count"
            label={t('cab.setup.accreditationStatus.recordCount')}
            required
            type="text"
            lang="en"
            dir="ltr"
            inputMode="numeric"
            valueKind="number"
            value={String(accreditationRecordCount)}
            onChange={(event) => setRecordCount(event.target.value)}
          />
          <p className="text-caption text-[var(--cab-muted)]">
            {t('cab.setup.accreditationStatus.recordCountHint')}
          </p>
        </div>
      )}

      <SetupSection title={t('cab.setup.accreditationStatus.whySeparateTitle')}>
        <p className="text-caption text-[var(--cab-muted)]">
          {t('cab.setup.accreditationStatus.whySeparateBody')}
        </p>
      </SetupSection>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import {
  SetupNote,
  SetupOptionCard,
  SetupSection,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { AB_RECOGNITION_STATUS_OPTIONS } from '@/lib/api/abSetupApi'
import { createAbRecognitionRecord, requiresRecognitionRecords } from '@/lib/abSetupForm'
import type { AbSetupStepProps } from '@/components/auth/ab/setup/types'

export function AbRecognitionStatusStep({ form, onPatchSetup }: AbSetupStepProps) {
  const { t } = useTranslation()
  const { recognitionStatuses, recognitionRecordCount, recognitionRecords } = form.abSetup

  const toggleStatus = (value: string) => {
    onPatchSetup({
      recognitionStatuses: recognitionStatuses.includes(value)
        ? recognitionStatuses.filter((status) => status !== value)
        : [...recognitionStatuses, value],
    })
  }

  /** Keep the arrangement list in step with the requested count. */
  const setRecordCount = (rawValue: string) => {
    const parsed = Number(rawValue.replace(/\D/g, ''))
    const count = Math.min(Math.max(Number.isNaN(parsed) ? 1 : parsed, 1), 20)

    const records = [...recognitionRecords]
    while (records.length < count) records.push(createAbRecognitionRecord())
    records.length = count

    onPatchSetup({ recognitionRecordCount: count, recognitionRecords: records })
  }

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {AB_RECOGNITION_STATUS_OPTIONS.map((option) => (
          <SetupOptionCard
            key={option.value}
            title={t(option.labelKey)}
            description={t(`ab.setup.recognitionStatus.descriptions.${option.value}`)}
            selected={recognitionStatuses.includes(option.value)}
            onSelect={() => toggleStatus(option.value)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-[345px_1fr]">
        {requiresRecognitionRecords(form.abSetup) ? (
          <div className="space-y-2">
            <TextField
              id="ab-setup-record-count"
              label={t('ab.setup.recognitionStatus.recordCount')}
              required
              type="text"
              lang="en"
              dir="ltr"
              inputMode="numeric"
              value={String(recognitionRecordCount)}
              onChange={(event) => setRecordCount(event.target.value)}
            />
            <p className="text-caption text-[var(--cab-muted)]">
              {t('ab.setup.recognitionStatus.recordCountHint')}
            </p>
          </div>
        ) : (
          <div />
        )}

        <SetupSection title={t('ab.setup.recognitionStatus.whySeparateTitle')}>
          <p className="text-body-sm leading-[1.6] text-[var(--cab-muted)]">
            {t('ab.setup.recognitionStatus.whySeparateBody')}
          </p>
        </SetupSection>
      </div>

      {recognitionStatuses.length > 1 && (
        <SetupNote tone="warning">{t('ab.setup.recognitionStatus.multiStatusNote')}</SetupNote>
      )}
    </div>
  )
}

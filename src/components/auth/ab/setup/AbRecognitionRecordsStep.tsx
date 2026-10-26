import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  SetupAddLink,
  SetupFileInput,
  SetupNote,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  AB_ARRANGEMENT_STATUS_OPTIONS,
  AB_COOPERATION_BODY_OPTIONS,
  getArrangementOptions,
} from '@/lib/api/abSetupApi'
import {
  createAbRecognitionRecord,
  isAbApplicantRecord,
  type AbRecognitionRecord,
} from '@/lib/abSetupForm'
import { cn } from '@/lib/utils'
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

function RecordDateField({
  id,
  label,
  required,
  value,
  onChange,
}: {
  id: string
  label: string
  required?: boolean
  value: string
  onChange: (isoDate: string) => void
}) {
  return (
    <div className="space-y-2">
      <FormLabel htmlFor={id} required={required}>
        {label}
      </FormLabel>
      <DatePicker value={fromIsoDate(value)} onChange={(date) => onChange(toIsoDate(date))} />
    </div>
  )
}

export function AbRecognitionRecordsStep({ form, onPatchSetup }: AbSetupStepProps) {
  const { t } = useTranslation()
  const records = form.abSetup.recognitionRecords
  const [activeIndex, setActiveIndex] = useState(0)

  const statusOptions = useMemo(
    () => AB_ARRANGEMENT_STATUS_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  const activeRecord = records[Math.min(activeIndex, Math.max(records.length - 1, 0))]

  const updateRecord = (id: string, fields: Partial<AbRecognitionRecord>) => {
    onPatchSetup({
      recognitionRecords: records.map((record) =>
        record.id === id ? { ...record, ...fields } : record
      ),
    })
  }

  const addRecord = () => {
    onPatchSetup({
      recognitionRecords: [...records, createAbRecognitionRecord()],
      recognitionRecordCount: records.length + 1,
    })
    setActiveIndex(records.length)
  }

  if (!activeRecord) {
    return (
      <div className="w-full">
        <SetupAddLink label={t('ab.setup.recognitionRecords.addAnother')} onClick={addRecord} />
      </div>
    )
  }

  // Levels offered depend on the chosen cooperation body.
  const arrangementOptions = getArrangementOptions(activeRecord.cooperationBody)
  const isApplicant = isAbApplicantRecord(activeRecord)
  const datesInvalid =
    Boolean(activeRecord.signatorySince && activeRecord.nextPeerEvaluation) &&
    activeRecord.nextPeerEvaluation <= activeRecord.signatorySince

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {records.map((record, index) => (
          <button
            key={record.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              'rounded-full border px-5 py-2 text-caption font-bold transition-colors',
              index === activeIndex
                ? 'border-[var(--cab-primary)] bg-[var(--cab-subtle)] text-[var(--cab-primary)]'
                : 'border-[var(--cab-border)] bg-white text-[var(--cab-muted)] hover:border-primary-100'
            )}
          >
            {t('ab.setup.recognitionRecords.recordTab', { index: index + 1 })}
          </button>
        ))}
        <SetupAddLink label={t('ab.setup.recognitionRecords.addAnother')} onClick={addRecord} />
      </div>

      <SetupSection
        title={t('ab.setup.recognitionRecords.recordTab', { index: activeIndex + 1 })}
        action={
          records.length > 1 ? (
            <button
              type="button"
              onClick={() => {
                const next = records.filter((record) => record.id !== activeRecord.id)
                onPatchSetup({
                  recognitionRecords: next,
                  recognitionRecordCount: Math.max(next.length, 1),
                })
                setActiveIndex(0)
              }}
              className="rounded-md px-2 py-1 text-caption font-bold text-error-500 hover:bg-error-50"
            >
              {t('common.delete')}
            </button>
          ) : null
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <SearchableSelect
              id={`ab-setup-rec-body-${activeRecord.id}`}
              label={t('ab.setup.recognitionRecords.cooperationBody')}
              required
              value={activeRecord.cooperationBody}
              onChange={(cooperationBody) =>
                updateRecord(activeRecord.id, { cooperationBody, arrangement: '' })
              }
              options={AB_COOPERATION_BODY_OPTIONS}
              placeholder={t('ab.setup.recognitionRecords.cooperationBodyPlaceholder')}
              searchPlaceholder={t('common.search')}
            />
            <SearchableSelect
              id={`ab-setup-rec-arrangement-${activeRecord.id}`}
              label={t('ab.setup.recognitionRecords.arrangement')}
              required
              value={activeRecord.arrangement}
              onChange={(arrangement) => updateRecord(activeRecord.id, { arrangement })}
              options={arrangementOptions}
              placeholder={t('ab.setup.recognitionRecords.arrangementPlaceholder')}
              searchPlaceholder={t('common.search')}
            />
          </div>

          {activeRecord.cooperationBody === 'OTHER' && (
            <TextField
              id={`ab-setup-rec-body-other-${activeRecord.id}`}
              label={t('ab.setup.recognitionRecords.cooperationBodyOther')}
              required
              type="text"
              value={activeRecord.cooperationBodyOther}
              placeholder={t('ab.setup.recognitionRecords.cooperationBodyOtherPlaceholder')}
              onChange={(event) =>
                updateRecord(activeRecord.id, { cooperationBodyOther: event.target.value })
              }
            />
          )}

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <TextField
              id={`ab-setup-rec-reference-${activeRecord.id}`}
              label={t('ab.setup.recognitionRecords.reference')}
              type="text"
              value={activeRecord.reference}
              placeholder={t('ab.setup.recognitionRecords.referencePlaceholder')}
              onChange={(event) => updateRecord(activeRecord.id, { reference: event.target.value })}
            />
            <SearchableSelect
              id={`ab-setup-rec-status-${activeRecord.id}`}
              label={t('ab.setup.recognitionRecords.status')}
              required
              value={activeRecord.status}
              onChange={(status) => updateRecord(activeRecord.id, { status })}
              options={statusOptions}
              placeholder={t('ab.setup.recognitionRecords.statusPlaceholder')}
              searchPlaceholder={t('common.search')}
            />
          </div>

          {isApplicant ? (
            <TextField
              id={`ab-setup-rec-application-${activeRecord.id}`}
              label={t('ab.setup.recognitionRecords.applicationReference')}
              required
              type="text"
              value={activeRecord.applicationReference}
              placeholder={t('ab.setup.recognitionRecords.applicationReferencePlaceholder')}
              onChange={(event) =>
                updateRecord(activeRecord.id, { applicationReference: event.target.value })
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <RecordDateField
                  id={`ab-setup-rec-since-${activeRecord.id}`}
                  label={t('ab.setup.recognitionRecords.signatorySince')}
                  required
                  value={activeRecord.signatorySince}
                  onChange={(signatorySince) => updateRecord(activeRecord.id, { signatorySince })}
                />
                <RecordDateField
                  id={`ab-setup-rec-peer-${activeRecord.id}`}
                  label={t('ab.setup.recognitionRecords.nextPeerEvaluation')}
                  value={activeRecord.nextPeerEvaluation}
                  onChange={(nextPeerEvaluation) =>
                    updateRecord(activeRecord.id, { nextPeerEvaluation })
                  }
                />
              </div>
              {datesInvalid && (
                <p className="text-caption text-error-700">
                  {t('ab.setup.recognitionRecords.peerAfterSignatory')}
                </p>
              )}
            </>
          )}

          <div className="space-y-2">
            <FormLabel>{t('ab.setup.recognitionRecords.decisionFile')}</FormLabel>
            <SetupFileInput
              id={`ab-setup-rec-file-${activeRecord.id}`}
              fileName={activeRecord.fileName}
              onFileNameChange={(fileName) => updateRecord(activeRecord.id, { fileName })}
              selectLabel={t('ab.setup.recognitionRecords.uploadPdf')}
              changeLabel={t('companyProfile.profileHeader.changeFile')}
              removeLabel={t('common.delete')}
            />
          </div>

          <div className="border-t border-[var(--cab-border)] pt-2">
            <SetupToggleRow
              label={t('ab.setup.recognitionRecords.displayOnPublicProfile')}
              checked={activeRecord.displayOnPublicProfile}
              onChange={(displayOnPublicProfile) =>
                updateRecord(activeRecord.id, { displayOnPublicProfile })
              }
            />
            <SetupToggleRow
              label={t('ab.setup.recognitionRecords.peerEvaluationReminders')}
              checked={activeRecord.peerEvaluationReminders}
              onChange={(peerEvaluationReminders) =>
                updateRecord(activeRecord.id, { peerEvaluationReminders })
              }
            />
          </div>
        </div>
      </SetupSection>

      <SetupNote>{t('ab.setup.recognitionRecords.applicantNote')}</SetupNote>
    </div>
  )
}

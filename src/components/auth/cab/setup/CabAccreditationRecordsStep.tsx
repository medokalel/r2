import { useEffect, useMemo, useState } from 'react'
import { REVEAL_FIELD_EVENT } from '@/lib/fieldNavigation'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  SetupFileInput,
  SetupNote,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { AccreditationBodyBadge } from '@/components/accreditation/AccreditationBodyBadge'
import { useAccreditationBodyOptions } from '@/hooks/useAccreditationBodyOptions'
import { findAccreditationBody } from '@/lib/accreditationBodies'
import {
  ACCREDITATION_RECORD_STATUS_OPTIONS,
  getAccreditationStandardOptions,
} from '@/lib/api/cabSetupApi'
import {
  createAccreditationRecord,
  ensureAccreditationRecords,
  getAccreditationRecordMissingFields,
  getDefaultAccreditationRecordStatus,
  isAccreditationRecordComplete,
  isAccreditationRecordsStepComplete,
  isApplicantRecord,
  requiresAccreditationRecords,
  type AccreditationRecordMissingField,
  type CabAccreditationRecord,
} from '@/lib/cabSetupForm'
import { cn } from '@/lib/utils'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'

/** ISO `yyyy-mm-dd` <-> Date, so the draft stays JSON-safe. */
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

const MISSING_FIELD_LABEL_KEYS: Record<AccreditationRecordMissingField, string> = {
  body: 'cab.setup.accreditationRecords.body',
  bodyOther: 'cab.setup.accreditationRecords.bodyOther',
  standard: 'cab.setup.accreditationRecords.standard',
  applicationReference: 'cab.setup.accreditationRecords.applicationReference',
  number: 'cab.setup.accreditationRecords.number',
  issueDate: 'cab.setup.accreditationRecords.issueDate',
  expiryDate: 'cab.setup.accreditationRecords.expiryDate',
  expiryAfterIssue: 'cab.setup.accreditationRecords.expiryAfterIssue',
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
      <DatePicker
        value={fromIsoDate(value)}
        onChange={(date) => onChange(toIsoDate(date))}
      />
    </div>
  )
}

export function CabAccreditationRecordsStep({ form, onPatchSetup }: CabSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.cabSetup
  const bodyOptions = useAccreditationBodyOptions(form.country)
  const { accreditationRecords: records, accreditationRecordCount } = setup
  const [activeIndex, setActiveIndex] = useState(0)
  const defaultRecordStatus = getDefaultAccreditationRecordStatus(setup)
  const recordsToValidate = records.slice(0, Math.max(accreditationRecordCount, 1))
  const stepComplete = isAccreditationRecordsStepComplete(setup)

  // Open with record cards ready — seeded on the status step, but guard if the user skipped that.
  useEffect(() => {
    if (records.length > 0 || !requiresAccreditationRecords(setup)) return
    onPatchSetup({
      accreditationRecords: ensureAccreditationRecords(accreditationRecordCount, [], defaultRecordStatus),
    })
  }, [records.length, accreditationRecordCount, setup, onPatchSetup, defaultRecordStatus])

  const standardOptions = useMemo(
    () => getAccreditationStandardOptions(form.cabSetup.activities),
    [form.cabSetup.activities]
  )
  const statusOptions = useMemo(
    () =>
      ACCREDITATION_RECORD_STATUS_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t]
  )

  // An error link to a field of another record opens that record's tab first.
  useEffect(() => {
    const reveal = (event: Event) => {
      const fieldId = (event as CustomEvent<{ fieldId?: string }>).detail?.fieldId ?? ''
      const index = records.findIndex((record) => fieldId.endsWith(`-${record.id}`))
      if (index >= 0) setActiveIndex(index)
    }
    window.addEventListener(REVEAL_FIELD_EVENT, reveal)
    return () => window.removeEventListener(REVEAL_FIELD_EVENT, reveal)
  }, [records])

  // The status screen seeds the list; guard against an empty array anyway.
  const activeRecord = records[Math.min(activeIndex, Math.max(records.length - 1, 0))]

  const updateRecord = (id: string, fields: Partial<CabAccreditationRecord>) => {
    onPatchSetup({
      accreditationRecords: records.map((record) =>
        record.id === id ? { ...record, ...fields } : record
      ),
    })
  }

  const addRecord = () => {
    onPatchSetup({
      accreditationRecords: [...records, createAccreditationRecord(defaultRecordStatus)],
      accreditationRecordCount: records.length + 1,
    })
    setActiveIndex(records.length)
  }

  const removeRecord = (id: string) => {
    const next = records.filter((record) => record.id !== id)
    onPatchSetup({
      accreditationRecords: next,
      accreditationRecordCount: Math.max(next.length, 1),
    })
    setActiveIndex(0)
  }

  if (!activeRecord) {
    return (
      <div className="w-full space-y-6">
        <button
          type="button"
          onClick={addRecord}
          className="text-caption font-bold text-[var(--cab-primary)] hover:underline"
        >
          {t('cab.setup.accreditationRecords.addAnother')}
        </button>
      </div>
    )
  }

  const isApplicant = isApplicantRecord(activeRecord)
  const datesInvalid =
    Boolean(activeRecord.issueDate && activeRecord.expiryDate) &&
    activeRecord.expiryDate <= activeRecord.issueDate

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {records.map((record, index) => {
          const incomplete =
            index < recordsToValidate.length && !isAccreditationRecordComplete(record)
          return (
          <button
            key={record.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              'rounded-full border px-4 py-2 text-body-3-medium transition-colors',
              index === activeIndex
                ? 'border-primary bg-primary-subtle text-primary'
                : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400',
              incomplete && index !== activeIndex && 'border-warning-400 text-warning-700'
            )}
          >
            {t('cab.setup.accreditationRecords.recordTab', { index: index + 1 })}
            {incomplete ? ' •' : ''}
          </button>
        )})}
        <button
          type="button"
          onClick={addRecord}
          className="text-caption font-bold text-[var(--cab-primary)] hover:underline"
        >
          {t('cab.setup.accreditationRecords.addAnother')}
        </button>
      </div>

      <SetupSection
        title={t('cab.setup.accreditationRecords.recordTab', { index: activeIndex + 1 })}
        action={
          records.length > 1 ? (
            <button
              type="button"
              onClick={() => removeRecord(activeRecord.id)}
              className="rounded-md px-2 py-1 text-body-3-medium text-error-500 hover:bg-error-50"
            >
              {t('common.delete')}
            </button>
          ) : null
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <SearchableSelect
              id={`cab-setup-acc-body-${activeRecord.id}`}
              label={t('cab.setup.accreditationRecords.body')}
              required
              value={activeRecord.body}
              onChange={(body) => updateRecord(activeRecord.id, { body })}
              options={bodyOptions}
              renderOptionIcon={(value) => {
                const body = findAccreditationBody(value)
                return body ? <AccreditationBodyBadge body={body} /> : null
              }}
              placeholder={t('cab.setup.accreditationRecords.bodyPlaceholder')}
              searchPlaceholder={t('common.search')}
            />
            <SearchableSelect
              id={`cab-setup-acc-standard-${activeRecord.id}`}
              label={t('cab.setup.accreditationRecords.standard')}
              required
              value={activeRecord.standard}
              onChange={(standard) => updateRecord(activeRecord.id, { standard })}
              options={standardOptions}
              placeholder={t('cab.setup.accreditationRecords.standardPlaceholder')}
              searchPlaceholder={t('common.search')}
            />
          </div>

          {activeRecord.body === 'OTHER' && (
            <TextField
              id={`cab-setup-acc-body-other-${activeRecord.id}`}
              label={t('cab.setup.accreditationRecords.bodyOther')}
              required
              type="text"
              value={activeRecord.bodyOther}
              placeholder={t('cab.setup.accreditationRecords.bodyOtherPlaceholder')}
              valueKind="text"
              onChange={(event) => updateRecord(activeRecord.id, { bodyOther: event.target.value })}
            />
          )}

          <SearchableSelect
            id={`cab-setup-acc-status-${activeRecord.id}`}
            label={t('cab.setup.accreditationRecords.status')}
            required
            value={activeRecord.status}
            onChange={(status) => updateRecord(activeRecord.id, { status })}
            options={statusOptions}
            placeholder={t('cab.setup.accreditationRecords.statusPlaceholder')}
            searchPlaceholder={t('common.search')}
          />

          {isApplicant ? (
            <TextField
              id={`cab-setup-acc-application-${activeRecord.id}`}
              label={t('cab.setup.accreditationRecords.applicationReference')}
              required
              type="text"
              value={activeRecord.applicationReference}
              placeholder={t('cab.setup.accreditationRecords.applicationReferencePlaceholder')}
              valueKind="mixed"
              onChange={(event) =>
                updateRecord(activeRecord.id, { applicationReference: event.target.value })
              }
            />
          ) : (
            <>
              <TextField
                id={`cab-setup-acc-number-${activeRecord.id}`}
                label={t('cab.setup.accreditationRecords.number')}
                required
                type="text"
                value={activeRecord.number}
                placeholder={t('cab.setup.accreditationRecords.numberPlaceholder')}
                valueKind="mixed"
                onChange={(event) => updateRecord(activeRecord.id, { number: event.target.value })}
              />

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <RecordDateField
                  id={`cab-setup-acc-issue-${activeRecord.id}`}
                  label={t('cab.setup.accreditationRecords.issueDate')}
                  required
                  value={activeRecord.issueDate}
                  onChange={(issueDate) => updateRecord(activeRecord.id, { issueDate })}
                />
                <RecordDateField
                  id={`cab-setup-acc-expiry-${activeRecord.id}`}
                  label={t('cab.setup.accreditationRecords.expiryDate')}
                  required
                  value={activeRecord.expiryDate}
                  onChange={(expiryDate) => updateRecord(activeRecord.id, { expiryDate })}
                />
              </div>

              {datesInvalid && (
                <p className="text-caption text-error-700">
                  {t('cab.setup.accreditationRecords.expiryAfterIssue')}
                </p>
              )}
            </>
          )}

          <div className="space-y-2">
            <FormLabel>{t('cab.setup.accreditationRecords.certificateFile')}</FormLabel>
            <SetupFileInput
              id={`cab-setup-acc-file-${activeRecord.id}`}
              fileName={activeRecord.fileName}
              onFileNameChange={(fileName) => updateRecord(activeRecord.id, { fileName })}
              selectLabel={t('cab.setup.accreditationRecords.uploadPdf')}
              changeLabel={t('companyProfile.profileHeader.changeFile')}
              removeLabel={t('common.delete')}
            />
          </div>

          <div className="border-t border-neutral-300 pt-2">
            <SetupToggleRow
              label={t('cab.setup.accreditationRecords.coveredByMla')}
              checked={activeRecord.coveredByMla}
              onChange={(coveredByMla) => updateRecord(activeRecord.id, { coveredByMla })}
            />
            <SetupToggleRow
              label={t('cab.setup.accreditationRecords.expiryReminders')}
              checked={activeRecord.expiryReminders}
              onChange={(expiryReminders) => updateRecord(activeRecord.id, { expiryReminders })}
            />
          </div>
        </div>
      </SetupSection>

      {!stepComplete && (
        <div className="rounded-md border border-warning-200 bg-warning-50 px-4 py-3 text-caption text-warning-800">
          <p className="font-semibold">{t('cab.setup.accreditationRecords.incompleteRecordsHint')}</p>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            {recordsToValidate.map((record, index) => {
              const missing = getAccreditationRecordMissingFields(record)
              if (missing.length === 0) return null
              const fields = missing.map((field) => t(MISSING_FIELD_LABEL_KEYS[field])).join(', ')
              return (
                <li key={record.id}>
                  {t('cab.setup.accreditationRecords.incompleteRecord', {
                    index: index + 1,
                    fields,
                  })}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <SetupNote>{t('cab.setup.accreditationRecords.applicantNote')}</SetupNote>
    </div>
  )
}

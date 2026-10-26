import { useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { AppIcon, DownloadIcon, ExcelFileIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { createCabEmployee } from '@/lib/api/cabEmployeesApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import {
  downloadPersonnelImportTemplate,
  parsePersonnelImport,
  type PersonnelImportRow,
} from '@/lib/personnelImport'
import { cn } from '@/lib/utils'

interface PersonnelImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Emails already in the register, to catch duplicates before saving. */
  existingEmails: string[]
  /** Called after at least one person was created. */
  onImported: () => void
}

type Step = 'pick' | 'review' | 'done'

/** Bulk-add personnel from an Excel file: template → upload → review → import. */
export function PersonnelImportModal({ open, onOpenChange, existingEmails, onImported }: PersonnelImportModalProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('pick')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<PersonnelImportRow[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ created: number; failed: { line: number; message: string }[] } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const reset = () => {
    setStep('pick')
    setFileName('')
    setRows([])
    setError('')
    setBusy(false)
    setProgress(0)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const close = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const readFile = async (file?: File) => {
    if (!file) return
    if (!/\.xlsx$/i.test(file.name)) {
      setError(t('cab.competence.import.onlyXlsx', 'Please choose an Excel file (.xlsx).'))
      return
    }
    setBusy(true)
    setError('')
    setFileName(file.name)
    try {
      const parsed = await parsePersonnelImport(file, existingEmails)
      if (!parsed.length) {
        setError(t('cab.competence.import.empty', 'The file has no rows to import.'))
        return
      }
      setRows(parsed)
      setStep('review')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : ''
      setError(
        message.startsWith('MISSING_COLUMNS:')
          ? t('cab.competence.import.missingColumns', {
              columns: message.slice('MISSING_COLUMNS:'.length),
              defaultValue: 'These columns are missing: {{columns}}. Use the template.',
            })
          : t('cab.competence.import.unreadable', 'The file could not be read. Use the template and try again.')
      )
    } finally {
      setBusy(false)
    }
  }

  const valid = rows.filter((r) => !r.errors.length)
  const invalid = rows.filter((r) => r.errors.length)

  const runImport = async () => {
    setBusy(true)
    setProgress(0)
    let created = 0
    const failed: { line: number; message: string }[] = []
    for (const [index, row] of valid.entries()) {
      try {
        await createCabEmployee({
          fullName: row.fullName,
          email: row.email,
          professionalRole: row.role!,
          ...(row.phone ? { phone: row.phone, phoneCountryCode: row.phoneCountryCode } : {}),
          ...(row.employmentStartDate ? { employmentStartDate: `${row.employmentStartDate}T00:00:00.000Z` } : {}),
          iafCodes: row.iafCodes,
          schemes: row.schemes,
        })
        created += 1
      } catch (caught) {
        failed.push({ line: row.line, message: getUserErrorMessage(caught, t) })
      }
      setProgress(index + 1)
    }
    setResult({ created, failed })
    setStep('done')
    setBusy(false)
    if (created) onImported()
  }

  const errorText = (code: string) =>
    ({
      fullName: t('cab.competence.import.errors.fullName', 'Full name is required'),
      emailRequired: t('cab.competence.import.errors.emailRequired', 'Email is required'),
      emailInvalid: t('cab.competence.import.errors.emailInvalid', 'Email is not valid'),
      emailDuplicate: t('cab.competence.import.errors.emailDuplicate', 'Email already exists'),
      roleRequired: t('cab.competence.import.errors.roleRequired', 'Role is required'),
      roleUnknown: t('cab.competence.import.errors.roleUnknown', 'Role is not on the list'),
      phoneInvalid: t('cab.competence.import.errors.phoneInvalid', 'Phone needs the country code, e.g. +966…'),
      dateInvalid: t('cab.competence.import.errors.dateInvalid', 'Date must be YYYY-MM-DD'),
      iafInvalid: t('cab.competence.import.errors.iafInvalid', 'IAF codes must be 01–39'),
    })[code] ?? code

  return (
    <Dialog.Root open={open} onOpenChange={close}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(920px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-card)] focus:outline-none rtl:translate-x-1/2">
          <div className="flex items-start justify-between gap-4 border-b border-alabaster-150 p-5">
            <div>
              <Dialog.Title className="text-h3-semi text-text-primary">
                {t('cab.competence.import.title', 'Import personnel from Excel')}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-body-3 text-text-secondary">
                {t('cab.competence.import.subtitle', 'Add many people at once instead of entering each one by hand.')}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-[var(--radius-sm)] px-2 py-1 text-[20px] leading-none text-alabaster-600 hover:bg-neutral-25" aria-label={t('common.close', 'Close')}>
              ×
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {step === 'pick' && (
              <ol className="flex flex-col gap-5">
                <li className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-alabaster-150 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-body-2-semibold text-text-primary">1. {t('cab.competence.import.step1', 'Download the template')}</p>
                    <p className="text-body-3 text-text-secondary">
                      {t('cab.competence.import.step1Hint', 'One person per row. Required: full name, email and role. The file includes the list of roles and short instructions.')}
                    </p>
                  </div>
                  <Button type="button" variant="outline" icon={<AppIcon icon={DownloadIcon} size={20} />} onClick={downloadPersonnelImportTemplate}>
                    {t('cab.competence.import.template', 'Template (.xlsx)')}
                  </Button>
                </li>
                <li>
                  <p className="mb-2 text-body-2-semibold text-text-primary">2. {t('cab.competence.import.step2', 'Upload the filled file')}</p>
                  <label
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOver(false)
                      void readFile(e.dataTransfer.files?.[0])
                    }}
                    className={cn(
                      'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed px-6 py-10 text-center transition-colors',
                      dragOver ? 'border-primary bg-primary-25' : 'border-primary/30 hover:bg-primary-25'
                    )}
                  >
                    <ExcelFileIcon size={40} />
                    <span className="text-body-2-medium text-primary">
                      {busy ? t('common.loading', 'Loading…') : t('cab.competence.import.drop', 'Drop the Excel file here or click to choose')}
                    </span>
                    <span className="text-body-3 text-text-secondary">.xlsx</span>
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      className="sr-only"
                      onChange={(e) => void readFile(e.target.files?.[0])}
                    />
                  </label>
                </li>
              </ol>
            )}

            {step === 'review' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2 text-body-3">
                  <span className="text-text-secondary">{fileName}</span>
                  <span className="rounded-[var(--radius-xs)] bg-success-50 px-2 py-0.5 font-medium text-success-700">
                    {t('cab.competence.import.readyCount', { count: valid.length, defaultValue: '{{count}} ready' })}
                  </span>
                  {invalid.length > 0 && (
                    <span className="rounded-[var(--radius-xs)] bg-error-50 px-2 py-0.5 font-medium text-error-600">
                      {t('cab.competence.import.errorCount', { count: invalid.length, defaultValue: '{{count}} with errors' })}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-alabaster-150">
                  <table className="w-full min-w-[720px] border-collapse text-body-3">
                    <thead className="bg-primary text-white">
                      <tr>
                        <th className="px-3 py-3 text-start font-medium">#</th>
                        <th className="px-3 py-3 text-start font-medium">{t('cab.competence.import.columns.person', 'Person')}</th>
                        <th className="px-3 py-3 text-start font-medium">{t('cab.competence.columns.role', 'Role')}</th>
                        <th className="px-3 py-3 text-start font-medium">{t('cab.competence.import.columns.codes', 'IAF codes')}</th>
                        <th className="px-3 py-3 text-start font-medium">{t('cab.competence.import.columns.check', 'Check')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={row.line} className={cn('border-b border-alabaster-100 align-top', row.errors.length ? 'bg-error-50/50' : i % 2 === 1 && 'bg-neutral-25')}>
                          <td className="px-3 py-2.5 text-text-secondary tabular-nums">{row.line}</td>
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-text-primary">{row.fullName || '—'}</p>
                            <p className="text-[12px] text-text-secondary" dir="ltr">{row.email || '—'}</p>
                          </td>
                          <td className="px-3 py-2.5 text-text-primary">{row.roleLabel || '—'}</td>
                          <td className="px-3 py-2.5">
                            <span className="tabular-nums text-text-primary" dir="ltr">{row.iafCodes.join(', ') || '—'}</span>
                            {row.heldCriticalCodes.length > 0 && (
                              <p className="mt-0.5 text-[12px] text-warning-700">
                                {t('cab.competence.import.heldCritical', {
                                  codes: row.heldCriticalCodes.join(', '),
                                  defaultValue: 'Critical {{codes}}: added after the exam',
                                })}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.errors.length ? (
                              <ul className="list-disc ps-4 text-[12px] text-error-600">
                                {row.errors.map((code) => (
                                  <li key={code}>{errorText(code)}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-[12px] font-medium text-success-700">{t('cab.competence.import.ok', 'Ready')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {invalid.length > 0 && (
                  <p className="text-body-3 text-text-secondary">
                    {t('cab.competence.import.skipNote', 'Rows with errors are skipped. Fix them in the file and import it again.')}
                  </p>
                )}
                {busy && (
                  <p className="text-body-3 text-primary" role="status">
                    {t('cab.competence.import.progress', { done: progress, total: valid.length, defaultValue: 'Importing {{done}} of {{total}}…' })}
                  </p>
                )}
              </div>
            )}

            {step === 'done' && result && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-h3-semi text-success-700">
                  {t('cab.competence.import.created', { count: result.created, defaultValue: '{{count}} people added' })}
                </p>
                {result.failed.length > 0 && (
                  <ul className="w-full max-w-lg text-start text-body-3 text-error-600">
                    {result.failed.map((f) => (
                      <li key={f.line}>
                        {t('cab.competence.import.rowFailed', { line: f.line, defaultValue: 'Row {{line}}' })}: {f.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {error && (
              <p role="alert" className="mt-4 rounded-[var(--radius-sm)] border border-error-100 bg-error-50 px-4 py-3 text-body-3 text-error-700">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-alabaster-150 p-5">
            {step === 'review' && (
              <>
                <Button type="button" variant="outline" onClick={reset} disabled={busy}>
                  {t('cab.competence.import.chooseAnother', 'Choose another file')}
                </Button>
                <Button type="button" onClick={runImport} disabled={busy || !valid.length}>
                  {t('cab.competence.import.importN', { count: valid.length, defaultValue: 'Import {{count}} people' })}
                </Button>
              </>
            )}
            {step !== 'review' && (
              <Button type="button" variant={step === 'done' ? 'primary' : 'outline'} onClick={() => close(false)}>
                {step === 'done' ? t('common.done', 'Done') : t('common.cancel', 'Cancel')}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

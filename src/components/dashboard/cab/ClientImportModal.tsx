import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { AppIcon, DownloadIcon, ExcelFileIcon, UploadOutlineIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { getUserErrorMessage } from '@/lib/errorMessages'
import {
  confirmCabClientImport,
  downloadAuditClientImportTemplate,
  previewCabClientImport,
  type CabClientImportPreview,
} from '@/lib/api/cabClientImportApi'
import { cn } from '@/lib/utils'

interface ClientImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}

export function ClientImportModal({ open, onOpenChange, onImported }: ClientImportModalProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CabClientImportPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  const reset = () => {
    setFile(null)
    setPreview(null)
    setBusy(false)
    setError('')
    setResult('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const close = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const runPreview = async (nextFile: File) => {
    setBusy(true)
    setError('')
    setResult('')
    setPreview(null)
    try {
      setPreview(await previewCabClientImport(nextFile))
    } catch (caught) {
      setError(getUserErrorMessage(caught, t))
    } finally {
      setBusy(false)
    }
  }

  const onFile = (nextFile: File | undefined) => {
    if (!nextFile) return
    setFile(nextFile)
    void runPreview(nextFile)
  }

  const confirm = async () => {
    if (!preview?.importId) return
    setBusy(true)
    setError('')
    setResult('')
    try {
      const confirmed = await confirmCabClientImport(preview.importId)
      const message =
        confirmed.message ||
        t('cab.clientRegister.import.confirmed', {
          created: confirmed.created,
          failed: confirmed.failed,
        })
      setResult(message)
      onImported()
    } catch (caught) {
      setError(getUserErrorMessage(caught, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={close}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(860px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-card)] focus:outline-none rtl:translate-x-1/2"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-alabaster-150 px-6 py-5">
            <div>
              <Dialog.Title className="text-[22px] font-bold text-neutral-900">
                {t('cab.clientRegister.import.title')}
              </Dialog.Title>
              <p className="mt-1 text-[14px] text-neutral-500">{t('cab.clientRegister.import.subtitle')}</p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-neutral-900 text-neutral-900 hover:bg-neutral-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                icon={<AppIcon icon={DownloadIcon} size={18} />}
                onClick={() => downloadAuditClientImportTemplate()}
              >
                {t('cab.clientRegister.import.downloadTemplate')}
              </Button>
              <Button
                type="button"
                variant="primary"
                icon={<AppIcon icon={UploadOutlineIcon} size={18} />}
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                {t('cab.clientRegister.import.chooseFile')}
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={(event) => onFile(event.target.files?.[0])}
              />
            </div>

            {file && (
              <p className="flex items-center gap-2 text-[13px] text-neutral-600">
                <AppIcon icon={ExcelFileIcon} size={18} />
                {file.name}
              </p>
            )}

            {error && (
              <p role="alert" className="text-[14px] text-error-500">
                {error}
              </p>
            )}
            {result && (
              <p role="status" className="text-[14px] font-medium text-success-600">
                {result}
              </p>
            )}

            {busy && !preview && <p className="text-[14px] text-neutral-500">{t('common.loading')}</p>}

            {preview && (
              <div className="space-y-3">
                <p className="text-[14px] text-neutral-700">
                  {t('cab.clientRegister.import.summary', {
                    total: preview.totalRows,
                    valid: preview.validRows,
                    invalid: preview.invalidRows,
                  })}
                </p>
                <div className="max-h-[360px] overflow-auto rounded-[12px] border border-alabaster-150">
                  <table className="w-full min-w-[640px] border-collapse text-start text-[13px]">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="px-3 py-2 font-medium">{t('cab.clientRegister.import.row')}</th>
                        <th className="px-3 py-2 font-medium">{t('cab.clientRegister.table.client')}</th>
                        <th className="px-3 py-2 font-medium">{t('cab.clientRegister.import.email')}</th>
                        <th className="px-3 py-2 font-medium">{t('cab.clientRegister.import.branches')}</th>
                        <th className="px-3 py-2 font-medium">{t('cab.clientRegister.import.status')}</th>
                        <th className="px-3 py-2 font-medium">{t('cab.clientRegister.import.issues')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-neutral-500">
                            {t('cab.clientRegister.import.emptyPreview')}
                          </td>
                        </tr>
                      ) : (
                        preview.rows.map((row) => (
                          <tr key={`${row.rowNumber}-${row.values.email}`} className="border-t border-alabaster-150">
                            <td className="px-3 py-2 text-neutral-500">{row.rowNumber}</td>
                            <td className="px-3 py-2 font-medium text-neutral-900">
                              {row.values.organizationName || '—'}
                            </td>
                            <td className="px-3 py-2" dir="ltr">
                              {row.values.email || '—'}
                            </td>
                            <td className="px-3 py-2 text-neutral-700">{row.branchCount}</td>
                            <td className="px-3 py-2">
                              <span
                                className={cn(
                                  'inline-flex rounded-[8px] px-2 py-1 text-[12px] font-medium',
                                  row.valid ? 'bg-[#d0fae5] text-[#007a55]' : 'bg-error-100 text-[#b42318]',
                                )}
                              >
                                {row.valid
                                  ? t('cab.clientRegister.import.valid')
                                  : t('cab.clientRegister.import.invalid')}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-error-500">{row.errors.join(' · ') || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-alabaster-150 px-6 py-4">
            <Dialog.Close asChild>
              <Button type="button" variant="outline">
                {t('common.close')}
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              variant="primary"
              disabled={busy || !preview?.importId || preview.validRows === 0}
              onClick={() => void confirm()}
            >
              {busy ? t('common.loading') : t('cab.clientRegister.import.confirm')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

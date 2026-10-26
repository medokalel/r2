import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { AppIcon, DownloadIcon, MoreIcon, TrashIcon } from '@/components/icons'
import { FormLabel } from '@/components/ui/FormField'
import type { EvidenceFile } from '@/lib/api/cabNonconformityResponseApi'
import { cn } from '@/lib/utils'

/**
 * Drag-and-drop evidence uploader with a versioned file list.
 *
 * Deliberately separate from `DocumentUploadField`: that component models a
 * single named requirement (one titled slot, "waiting / uploaded" state, a
 * select-file button). This one models an open-ended evidence bucket where the
 * drop target is the primary affordance and each row carries its own version
 * and row menu. Neither shape can be expressed by the other without breaking
 * its existing call sites.
 */

const EXTENSION_STYLES: Record<string, { label: string; className: string }> = {
  pdf: { label: 'PDF', className: 'bg-error-50 text-error-600' },
  doc: { label: 'DOC', className: 'bg-primary-50 text-primary' },
  docx: { label: 'DOC', className: 'bg-primary-50 text-primary' },
  xls: { label: 'XLS', className: 'bg-success-50 text-success-600' },
  xlsx: { label: 'XLS', className: 'bg-success-50 text-success-600' },
  jpg: { label: 'JPG', className: 'bg-primary-25 text-indigo-600' },
  jpeg: { label: 'JPG', className: 'bg-primary-25 text-indigo-600' },
  png: { label: 'PNG', className: 'bg-primary-25 text-indigo-600' },
}

const FALLBACK_STYLE = { label: 'FILE', className: 'bg-neutral-50 text-neutral-700' }

function fileExtension(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function fileBadge(name: string) {
  return EXTENSION_STYLES[fileExtension(name)] ?? FALLBACK_STYLE
}

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])

/** How a file can be previewed: images inline (thumbnail + full view), PDFs in a new tab. */
function previewKind(file: EvidenceFile): 'image' | 'pdf' | null {
  if (!file.url) return null
  const extension = fileExtension(file.name)
  if (IMAGE_EXTENSIONS.has(extension)) return 'image'
  if (extension === 'pdf') return 'pdf'
  return null
}

/** Full-size view of an image evidence file. */
function ImagePreviewDialog({ file, onClose }: { file: EvidenceFile | null; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <Dialog.Root open={Boolean(file)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[92vh] w-[min(960px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2"
        >
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
            <Dialog.Title className="min-w-0 truncate text-body font-semibold text-neutral-900">
              {file?.name}
            </Dialog.Title>
            <div className="flex shrink-0 items-center gap-2">
              {file?.url && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-primary px-3 py-1.5 text-body-sm font-medium text-primary hover:bg-primary-50"
                >
                  {t('cab.nonconformityResponse.evidence.openNewTab')}
                </a>
              )}
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label={t('common.close')}
                  className="flex size-9 items-center justify-center rounded-full border-2 border-text-primary text-text-primary"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-neutral-25 p-4">
            {file?.url && (
              <img src={file.url} alt={file.name} className="max-h-[78vh] max-w-full rounded-md object-contain" />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface EvidenceUploadFieldProps {
  label: string
  required?: boolean
  files: EvidenceFile[]
  accept: string
  maxSizeBytes: number
  hint: string
  disabled?: boolean
  error?: string
  onSelectFiles: (files: File[]) => void
  onDeleteFile: (id: string) => void
  onOpenFile?: (file: EvidenceFile) => void
  className?: string
}

function EvidenceRow({
  file,
  disabled,
  onDelete,
  onOpen,
  onPreviewImage,
}: {
  file: EvidenceFile
  disabled?: boolean
  onDelete: (id: string) => void
  onOpen?: (file: EvidenceFile) => void
  onPreviewImage: (file: EvidenceFile) => void
}) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const badge = fileBadge(file.name)
  const preview = previewKind(file)

  return (
    <li className="relative flex flex-wrap items-center gap-3 rounded-md bg-neutral-25 px-3 py-2.5 sm:flex-nowrap">
      {preview === 'image' && file.url ? (
        <button
          type="button"
          onClick={() => onPreviewImage(file)}
          aria-label={t('cab.nonconformityResponse.evidence.previewImage', { name: file.name })}
          className="size-12 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-white focus-visible:outline-2 focus-visible:outline-primary"
        >
          <img src={file.url} alt="" loading="lazy" className="size-full object-cover" />
        </button>
      ) : (
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-md text-overline font-bold',
            badge.className,
          )}
          aria-hidden
        >
          {badge.label}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-medium text-neutral-900">{file.name}</p>
        <p className="mt-0.5 text-caption text-neutral-600">
          {t('cab.nonconformityResponse.evidence.version', { version: file.version })}
          <span className="mx-2 text-neutral-400">|</span>
          {file.uploadedAt}
          <span className="mx-2 text-neutral-400">|</span>
          {file.sizeLabel}
        </p>
      </div>

      {preview === 'image' && (
        <button
          type="button"
          onClick={() => onPreviewImage(file)}
          className="shrink-0 rounded-md border border-primary px-3 py-1 text-caption font-medium text-primary transition-colors hover:bg-primary-50"
        >
          {t('cab.nonconformityResponse.evidence.preview')}
        </button>
      )}
      {preview === 'pdf' && file.url && (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md border border-primary px-3 py-1 text-caption font-medium text-primary transition-colors hover:bg-primary-50"
          aria-label={t('cab.nonconformityResponse.evidence.openPdf', { name: file.name })}
        >
          {t('cab.nonconformityResponse.evidence.openNewTab')}
        </a>
      )}

      <button
        type="button"
        // Read-only rows keep the menu for downloading; only "Delete" is hidden.
        disabled={disabled && !(onOpen && file.url)}
        onClick={() => setMenuOpen((open) => !open)}
        onBlur={() => window.setTimeout(() => setMenuOpen(false), 120)}
        aria-expanded={menuOpen}
        aria-label={t('cab.nonconformityResponse.evidence.rowActions', { name: file.name })}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <AppIcon icon={MoreIcon} size={18} />
      </button>

      {menuOpen && (
        <div className="absolute end-3 top-[calc(100%-6px)] z-10 min-w-[160px] overflow-hidden rounded-md border border-neutral-100 bg-white py-1 shadow-lg">
          {onOpen && file.url && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onOpen(file)
                setMenuOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-start text-body-sm text-neutral-800 transition-colors hover:bg-neutral-25"
            >
              <AppIcon icon={DownloadIcon} size={16} className="text-neutral-500" />
              {t('cab.nonconformityResponse.evidence.download')}
            </button>
          )}
          {!disabled && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onDelete(file.id)
                setMenuOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-start text-body-sm text-error-600 transition-colors hover:bg-error-50"
            >
              <AppIcon icon={TrashIcon} size={16} />
              {t('common.delete')}
            </button>
          )}
        </div>
      )}
    </li>
  )
}

export function EvidenceUploadField({
  label,
  required,
  files,
  accept,
  maxSizeBytes,
  hint,
  disabled,
  error,
  onSelectFiles,
  onDeleteFile,
  onOpenFile,
  className,
}: EvidenceUploadFieldProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const [dragging, setDragging] = useState(false)
  const [previewFile, setPreviewFile] = useState<EvidenceFile | null>(null)

  const accept_ = accept.split(',').map((item) => item.trim().toLowerCase())

  const acceptFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const valid = Array.from(incoming).filter((file) => {
      const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
      return accept_.includes(extension) && file.size <= maxSizeBytes
    })
    if (valid.length > 0) onSelectFiles(valid)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <FormLabel htmlFor={inputId} required={required}>
        {label}
      </FormLabel>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (disabled) return
          acceptFiles(event.dataTransfer.files)
        }}
        className={cn(
          'rounded-md border border-dashed bg-white px-4 py-6 transition-colors',
          dragging ? 'border-primary bg-primary-25' : 'border-neutral-300',
          disabled && 'opacity-60',
        )}
      >
        <div className="flex items-center justify-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5M4 14v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="text-center sm:text-start">
            <p className="text-body-sm text-neutral-700">
              {t('cab.nonconformityResponse.evidence.dropHint')}{' '}
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline"
              >
                {t('cab.nonconformityResponse.evidence.browse')}
              </button>
            </p>
            <p className="mt-0.5 text-caption text-neutral-500">{hint}</p>
          </div>
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={accept}
          disabled={disabled}
          className="hidden"
          onChange={(event) => {
            acceptFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <EvidenceRow
              key={file.id}
              file={file}
              disabled={disabled}
              onDelete={onDeleteFile}
              onOpen={onOpenFile}
              onPreviewImage={setPreviewFile}
            />
          ))}
        </ul>
      )}

      <ImagePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />

      {error && <p className="text-caption text-error-700">{error}</p>}
    </div>
  )
}
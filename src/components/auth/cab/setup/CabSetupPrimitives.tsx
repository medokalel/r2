import { type ReactNode, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, CheckIcon, TrashIcon, UploadOutlineIcon } from '@/components/icons'
import { uploadOnboardingAsset } from '@/lib/api/uploadsApi'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { AssetUploadTile } from '@/components/ui/AssetUploadTile'
import { isAcceptedImage } from '@/lib/fileValidation'

/** Tinted info panel from the deck (#F5F8FF on a #D9E2F0 hairline). */
export function SetupSection({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-md border border-[var(--cab-border)] bg-[var(--cab-panel)] p-4 sm:p-5',
        className
      )}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <p className="text-body font-bold text-[var(--cab-ink)]">{title}</p>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/** Single/multi-select card — deck spec: 8px radius, #E8EEFF + primary border when picked. */
export function SetupOptionCard({
  title,
  description,
  selected,
  onSelect,
}: {
  title: string
  description: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'flex min-h-[105px] w-full flex-col items-start justify-center gap-2 rounded-md border px-6 text-start transition-colors',
        selected
          ? 'border-[var(--cab-primary)] bg-[var(--cab-subtle)]'
          : 'border-[var(--cab-border)] bg-white hover:border-primary-100'
      )}
    >
      <span
        className={cn(
          'text-body font-bold leading-[1.3]',
          selected ? 'text-[var(--cab-primary)]' : 'text-[var(--cab-ink)]'
        )}
      >
        {title}
      </span>
      <span className="text-caption leading-[1.5] text-[var(--cab-muted)]">{description}</span>
    </button>
  )
}

/** Rounded grey pill used for secondary row actions ("Edit"). */
export function SetupPill({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[var(--cab-border)] bg-[var(--cab-chip)] px-5 py-1.5 text-caption font-bold text-[var(--cab-muted)] hover:bg-white"
    >
      {label}
    </button>
  )
}

/** Text-only primary action ("+ Add location", "+ Add another"). */
export function SetupAddLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-caption font-bold text-[var(--cab-primary)] hover:underline"
    >
      {label}
    </button>
  )
}

/** The pill switch used for every "rule" toggle in the deck. */
export function SetupSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-neutral-300'
      )}
    >
      <span
        className={cn(
          'inline-block size-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
        )}
      />
    </button>
  )
}

/** Label + switch row, e.g. "Block mark use after expiry". */
export function SetupToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-body-sm text-[var(--cab-ink)]">{label}</p>
        {description && <p className="mt-0.5 text-caption text-[var(--cab-muted)]">{description}</p>}
      </div>
      <SetupSwitch checked={checked} onChange={onChange} ariaLabel={label} />
    </div>
  )
}

/**
 * Inline note. The deck sets these as plain coloured text (primary for hints,
 * amber for cautions) rather than a filled callout.
 */
export function SetupNote({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  return (
    <p
      className={cn(
        'text-caption font-bold',
        tone === 'warning' ? 'text-warning-700' : 'text-[var(--cab-primary)]'
      )}
    >
      {children}
    </p>
  )
}

/** A repeatable record (location, accreditation, scope) with a remove control. */
export function SetupRecordCard({
  title,
  onRemove,
  removeLabel,
  children,
  className,
}: {
  title: string
  onRemove?: () => void
  removeLabel?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-md border border-[var(--cab-border)] bg-[var(--cab-panel)] p-4 sm:p-5', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-body-sm font-bold text-[var(--cab-primary)]">{title}</p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-caption font-bold text-error-500 hover:bg-error-50"
          >
            <AppIcon icon={TrashIcon} size={14} />
            {removeLabel}
          </button>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

export function SetupFileInput({
  id,
  fileName,
  onFileNameChange,
  accept = '.pdf',
  selectLabel,
  changeLabel,
  removeLabel,
}: {
  id: string
  fileName: string
  onFileNameChange: (fileName: string) => void
  accept?: string
  selectLabel: string
  changeLabel: string
  removeLabel: string
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError(t('validation.fileTooLarge', { size: 10 }))
      return
    }

    setUploading(true)
    setError(null)
    try {
      const uploaded = await uploadOnboardingAsset(file)
      setDisplayName(uploaded.fileName)
      onFileNameChange(uploaded.fileUrl)
    } catch (uploadError) {
      toast.error(getUserErrorMessage(uploadError, t))
    } finally {
      setUploading(false)
    }
  }

  const persistedName = fileName.split('/').pop() || fileName

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {fileName ? (
          <>
            <a
              href={resolvePublicAssetUrl(fileName)}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-[220px] truncate rounded-md bg-primary-subtle px-3 py-2 text-body-3 text-primary"
            >
              {displayName || persistedName}
            </a>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-md border border-neutral-300 px-3 py-2 text-body-3-medium text-primary hover:bg-neutral-50 disabled:opacity-50"
            >
              {uploading ? t('common.loading') : changeLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                setDisplayName('')
                onFileNameChange('')
              }}
              disabled={uploading}
              className="rounded-md px-3 py-2 text-body-3-medium text-error-500 hover:bg-error-50 disabled:opacity-50"
            >
              {removeLabel}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-md border border-dashed border-primary-300 px-4 py-2 text-body-3-medium text-primary hover:bg-primary-subtle disabled:opacity-50"
          >
            <AppIcon icon={UploadOutlineIcon} size={18} />
            {uploading ? t('common.loading') : selectLabel}
          </button>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => void handleSelect(event)}
        />
      </div>
      {error && <p className="text-caption text-error-700">{error}</p>}
    </div>
  )
}

/**
 * Accreditation / scheme mark tile: the shared AssetUploadTile (drop zone, formats and size,
 * checkerboard preview, Replace / Remove). `uploadLabel` and `removeLabel` are kept for callers.
 */
export function SetupMarkUpload({
  id,
  label,
  caption,
  imageUrl,
  onImageUrlChange,
}: {
  id: string
  label: string
  caption: ReactNode
  imageUrl: string | null
  onImageUrlChange: (url: string | null) => void
  uploadLabel?: string
  removeLabel?: string
}) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    if (!isAcceptedImage(file)) {
      setError(t('ui.upload.invalidType'))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(t('validation.fileTooLarge', { size: 10 }))
      return
    }

    setUploading(true)
    setError(null)
    try {
      const uploaded = await uploadOnboardingAsset(file)
      onImageUrlChange(uploaded.fileUrl)
    } catch (uploadError) {
      toast.error(getUserErrorMessage(uploadError, t))
    } finally {
      setUploading(false)
    }
  }

  return (
    <AssetUploadTile
      inputId={id}
      title={label}
      caption={caption}
      imageUrl={imageUrl ? resolvePublicAssetUrl(imageUrl) : null}
      onFile={(file) => void handleFile(file)}
      onRemove={() => onImageUrlChange(null)}
      uploading={uploading}
      error={error}
      accept="image/svg+xml,image/png,image/webp,image/jpeg"
      formats={t('ui.upload.imageFormats')}
      maxSizeMb={10}
    />
  )
}

/** Multi-select rendered as a wrapping row of toggleable chips (services, document use). */
export function SetupChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-caption font-bold transition-colors',
              isSelected
                ? 'border-[var(--cab-primary)] bg-[var(--cab-subtle)] text-[var(--cab-primary)]'
                : 'border-[var(--cab-border)] bg-white text-[var(--cab-muted)] hover:border-primary-100'
            )}
          >
            <span
              aria-hidden
              className={cn(
                'flex size-4 items-center justify-center rounded-full border transition-colors',
                isSelected ? 'border-[var(--cab-primary)] bg-[var(--cab-primary)] text-white' : 'border-[var(--cab-border)] bg-white'
              )}
            >
              {isSelected && <AppIcon icon={CheckIcon} size={10} />}
            </span>
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

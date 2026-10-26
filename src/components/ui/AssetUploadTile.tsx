import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, TrashIcon, UploadOutlineIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

interface AssetUploadTileProps {
  /** Tile heading (e.g. "CAB logo", "Accreditation mark"). */
  title: string
  /** One line under the heading (what it is used for, what it is linked to). */
  caption?: ReactNode
  /** Current image (already resolved to a displayable URL), or null for the empty state. */
  imageUrl: string | null
  /** Called with the picked or dropped file; the caller validates, uploads and updates `imageUrl`. */
  onFile: (file: File) => void
  onRemove: () => void
  uploading?: boolean
  error?: string | null
  accept: string
  /** Shown in the empty state, e.g. "SVG, PNG, WEBP or JPG". */
  formats: string
  maxSizeMb: number
  /** Id of the hidden file input (stable target for "go to field" links). */
  inputId?: string
  /** 'wide' puts the preview beside the actions on larger screens; 'tile' stacks everything. */
  layout?: 'wide' | 'tile'
  className?: string
}

/** True when the visible pixels of an image are mostly white (needs a dark backdrop to be seen). */
function isMostlyLight(img: HTMLImageElement): boolean {
  try {
    const size = 32
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (!context) return false
    context.drawImage(img, 0, 0, size, size)
    const { data } = context.getImageData(0, 0, size, size)
    let total = 0
    let count = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 40) continue
      total += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255
      count += 1
    }
    return count > 0 && total / count > 0.86
  } catch {
    // Cross-origin images without CORS cannot be read; keep the light backdrop.
    return false
  }
}

/**
 * Calm upload tile for logos and marks: a dashed drop zone with icon, accepted formats and size
 * when empty; a preview on a neutral checkerboard (so white or transparent artwork stays visible)
 * with Replace / Remove actions once a file is set. Drag and drop or click to browse.
 */
export function AssetUploadTile({
  title,
  caption,
  imageUrl,
  onFile,
  onRemove,
  uploading = false,
  error,
  accept,
  formats,
  maxSizeMb,
  inputId,
  layout = 'tile',
  className,
}: AssetUploadTileProps) {
  const { t } = useTranslation()
  const fallbackId = useId()
  const id = inputId ?? `asset-${fallbackId}`
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  // Preview backdrop: picked by the user, otherwise dark when the artwork is mostly white.
  const [backdrop, setBackdrop] = useState<'light' | 'dark' | null>(null)
  const [autoDark, setAutoDark] = useState(false)
  const dark = backdrop ? backdrop === 'dark' : autoDark
  const wide = layout === 'wide'

  const browse = () => inputRef.current?.click()
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file && !uploading) onFile(file)
  }
  const dragProps = {
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      if (!dragging) setDragging(true)
    },
    onDragLeave: () => setDragging(false),
    onDrop,
  }

  return (
    <div className={cn('flex flex-col rounded-lg border border-neutral-200 bg-white p-4 sm:p-5', className)}>
      <div className="mb-3 min-w-0">
        <p className="text-body-sm font-bold text-slate-900">{title}</p>
        {caption && <div className="mt-0.5 text-caption leading-[1.5] text-slate-500">{caption}</div>}
      </div>

      {imageUrl ? (
        <div className={cn('flex flex-col gap-3', wide && 'sm:flex-row sm:items-center sm:gap-5')} {...dragProps}>
          <div
            className={cn(
              'relative flex h-[132px] items-center justify-center overflow-hidden rounded-md border p-4 transition-colors',
              dark ? 'asset-checkerboard-dark border-slate-800' : 'asset-checkerboard border-slate-200',
              wide && 'sm:h-[120px] sm:w-[260px] sm:shrink-0',
              dragging && 'border-primary ring-2 ring-primary/20',
            )}
          >
            <img
              src={imageUrl}
              alt={title}
              onLoad={(event) => {
                if (backdrop === null) setAutoDark(isMostlyLight(event.currentTarget))
              }}
              className="max-h-full max-w-full object-contain"
            />
            <button
              type="button"
              onClick={() => setBackdrop(dark ? 'light' : 'dark')}
              aria-pressed={dark}
              aria-label={t('ui.upload.toggleBackdrop')}
              title={t('ui.upload.toggleBackdrop')}
              className={cn(
                'absolute end-1.5 top-1.5 flex size-7 items-center justify-center rounded-full border text-body-sm transition-colors',
                dark ? 'border-white/20 bg-white/10 text-white hover:bg-white/20' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900',
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 3.5v17a8.5 8.5 0 000-17z" fill="currentColor" />
              </svg>
            </button>
          </div>
          <div className={cn('flex flex-col gap-2', wide && 'sm:flex-1')}>
            {wide && <p className="hidden text-caption text-slate-500 sm:block">{t('ui.upload.replaceHint', { formats, size: maxSizeMb })}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={browse}
                disabled={uploading}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 text-body-sm font-semibold text-primary transition-colors hover:border-primary disabled:opacity-50"
              >
                <AppIcon icon={UploadOutlineIcon} size={16} />
                {uploading ? t('ui.upload.uploading') : t('ui.upload.replace')}
              </button>
              <button
                type="button"
                onClick={onRemove}
                disabled={uploading}
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-body-sm font-semibold text-error-600 transition-colors hover:bg-error-50 disabled:opacity-50"
              >
                <AppIcon icon={TrashIcon} size={16} />
                {t('ui.upload.remove')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-describedby={`${id}-hint`}
          onClick={browse}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              browse()
            }
          }}
          {...dragProps}
          className={cn(
            'flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-[1.5px] border-dashed px-4 py-6 text-center transition-colors',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            dragging ? 'border-primary bg-primary-50' : 'border-slate-300 bg-slate-50 hover:border-primary hover:bg-primary-25',
            uploading && 'pointer-events-none opacity-70',
          )}
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-white text-primary shadow-[0_1px_2px_rgba(15,23,42,0.08),inset_0_0_0_1px_#d9e2f0]">
            <AppIcon icon={UploadOutlineIcon} size={20} />
          </span>
          <p className="text-body-sm font-semibold text-slate-900">
            {uploading ? (
              t('ui.upload.uploading')
            ) : (
              <>
                {t('ui.upload.dropOr')}{' '}
                <span className="text-primary underline decoration-primary/30 underline-offset-2">{t('ui.upload.browse')}</span>
              </>
            )}
          </p>
          <p id={`${id}-hint`} className="text-caption text-slate-500">
            {t('ui.upload.formats', { formats, size: maxSizeMb })}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) onFile(file)
        }}
      />
      {error && <p role="alert" className="mt-2 text-caption text-error-700">{error}</p>}
    </div>
  )
}

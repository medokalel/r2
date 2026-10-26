import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, EditIcon, UploadOutlineIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

type Mode = 'draw' | 'type' | 'upload'

const WIDTH = 600
const HEIGHT = 200
const INK = '#0f2e8a'
const MAX_UPLOAD = 1024 * 1024
/** Largest signature image the API stores (backend declaration-signature.helper.js). */
const MAX_SIGNATURE_BYTES = 300 * 1024

const dataUrlBytes = (dataUrl: string) => Math.floor(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4)

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Unreadable image'))
    img.src = src
  })
}

/**
 * Keeps a signature within the size the API accepts: images over the limit are scaled down
 * (at most 1200×400) and re-encoded as PNG, or as JPEG on white when PNG is still too big.
 */
async function fitSignature(dataUrl: string): Promise<string> {
  if (dataUrlBytes(dataUrl) <= MAX_SIGNATURE_BYTES) return dataUrl
  const img = await loadImage(dataUrl)
  let fallback = dataUrl
  for (const maxWidth of [1200, 900, 600]) {
    const scale = Math.min(1, maxWidth / img.naturalWidth, maxWidth / 3 / img.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) break
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const png = canvas.toDataURL('image/png')
    if (dataUrlBytes(png) <= MAX_SIGNATURE_BYTES) return png
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    fallback = canvas.toDataURL('image/jpeg', 0.85)
    if (dataUrlBytes(fallback) <= MAX_SIGNATURE_BYTES) return fallback
  }
  return fallback
}

/** Renders a typed name as a handwriting-style signature image (PNG data URL). */
// eslint-disable-next-line react-refresh/only-export-components -- shared with applicationSampleFill
export function typedSignatureDataUrl(name: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx || !name.trim()) return ''
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let size = 72
  do {
    ctx.font = `italic ${size}px "Segoe Script", "Brush Script MT", "Snell Roundhand", "Apple Chancery", cursive`
    size -= 4
  } while (ctx.measureText(name).width > WIDTH - 60 && size > 24)
  ctx.fillText(name.trim(), WIDTH / 2, HEIGHT / 2 + 6)
  return canvas.toDataURL('image/png')
}

interface SignaturePadProps {
  /** PNG/JPEG data URL of the signature, or '' when not signed. */
  value: string
  onChange: (dataUrl: string) => void
  /** Pre-fills the "Type" tab. */
  signerName?: string
  /** Shown under the signature line. */
  caption?: string
  invalid?: boolean
  /** Called with how the signature was made each time one is applied (typed name, drawn or uploaded image). */
  onCommit?: (info: { method: 'typed' | 'drawn' | 'uploaded'; typedName?: string }) => void
}

/**
 * Signature field: draw with a finger, pen or mouse, type a name, or upload a
 * scanned signature. The result is one image the declaration keeps.
 */
export function SignaturePad({ value, onChange, signerName = '', caption, invalid, onCommit }: SignaturePadProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>('draw')
  const [editing, setEditing] = useState(!value)
  const [typed, setTyped] = useState(signerName)
  const [hasInk, setHasInk] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  // Adjust state when the props change (while rendering, not in an effect).
  const [prevValue, setPrevValue] = useState(value)
  if (prevValue !== value) {
    setPrevValue(value)
    if (!value) setEditing(true)
  }
  if (!typed && signerName) setTyped(signerName)

  // Fresh, crisp canvas whenever the draw tab opens.
  useEffect(() => {
    if (!editing || mode !== 'draw') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    canvas.width = WIDTH * ratio
    canvas.height = HEIGHT * ratio
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = INK
    ctx.lineWidth = 2.6
    setHasInk(false)
  }, [editing, mode])

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: ((event.clientX - rect.left) / rect.width) * WIDTH, y: ((event.clientY - rect.top) / rect.height) * HEIGHT }
  }

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drawing.current = true
    last.current = point(event)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && last.current) {
      ctx.beginPath()
      ctx.arc(last.current.x, last.current.y, 1.2, 0, Math.PI * 2)
      ctx.fillStyle = INK
      ctx.fill()
    }
  }

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const p = point(event)
    const pressure = event.pointerType === 'pen' && event.pressure > 0 ? event.pressure : 0.5
    ctx.lineWidth = 1.6 + pressure * 2.4
    const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 }
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    if (!hasInk) setHasInk(true)
  }

  const end = () => {
    drawing.current = false
    last.current = null
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
    }
    setHasInk(false)
  }

  const apply = async () => {
    let dataUrl = ''
    if (mode === 'draw' && hasInk) dataUrl = canvasRef.current?.toDataURL('image/png') ?? ''
    if (mode === 'type') dataUrl = typedSignatureDataUrl(typed)
    if (!dataUrl) return
    onChange(await fitSignature(dataUrl).catch(() => dataUrl))
    onCommit?.(mode === 'type' ? { method: 'typed', typedName: typed.trim() } : { method: 'drawn' })
    setEditing(false)
  }

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setUploadError('')
    if (!file) return
    if (!/^image\/(png|jpeg)$/.test(file.type)) return setUploadError(t('signature.errType', 'Use a PNG or JPG image.'))
    if (file.size > MAX_UPLOAD) return setUploadError(t('signature.errSize', 'The image must be 1 MB or smaller.'))
    const reader = new FileReader()
    reader.onload = () => {
      fitSignature(String(reader.result))
        .then((dataUrl) => {
          onChange(dataUrl)
          onCommit?.({ method: 'uploaded' })
          setEditing(false)
        })
        .catch(() => setUploadError(t('signature.errType', 'Use a PNG or JPG image.')))
    }
    reader.readAsDataURL(file)
  }

  const tabs: Array<{ key: Mode; label: string }> = [
    { key: 'draw', label: t('signature.draw', 'Draw') },
    { key: 'type', label: t('signature.type', 'Type') },
    { key: 'upload', label: t('signature.upload', 'Upload') },
  ]

  const frame = cn(
    'relative overflow-hidden rounded-lg border-2 bg-white',
    invalid && !value ? 'border-error-500' : 'border-dashed border-primary-100',
  )

  if (!editing && value) {
    return (
      <div className="flex flex-col gap-2">
        <div className={cn(frame, 'border-solid border-neutral-100')}>
          <img src={value} alt={t('signature.alt', 'Signature')} className="mx-auto h-[140px] w-full max-w-[600px] object-contain" />
          <div className="mx-6 mb-3 border-t border-neutral-400 pt-1.5 text-center text-caption text-text-secondary">{caption}</div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm">
          <span className="flex items-center gap-1.5 font-medium text-success-700">
            <span className="size-2 rounded-full bg-success-500" aria-hidden />
            {t('signature.signed', 'Signed')}
          </span>
          <div className="flex gap-3">
            <button type="button" onClick={() => setEditing(true)} className="font-semibold text-primary hover:underline">
              {t('signature.change', 'Change signature')}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange('')
                setEditing(true)
              }}
              className="font-semibold text-error-600 hover:underline"
            >
              {t('signature.remove', 'Remove')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label={t('signature.how', 'How to sign')} className="inline-flex w-fit rounded-md bg-neutral-25 p-1 ring-1 ring-neutral-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={mode === tab.key}
            onClick={() => setMode(tab.key)}
            className={cn(
              'rounded-md px-4 py-2 text-body-sm font-semibold transition-colors',
              mode === tab.key ? 'bg-white text-primary shadow-card' : 'text-text-secondary hover:text-primary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'draw' && (
        <div className={frame}>
          <canvas
            ref={canvasRef}
            aria-label={t('signature.drawHint', 'Sign here with your finger, pen or mouse')}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            onPointerCancel={end}
            className="block aspect-[3/1] w-full cursor-crosshair touch-none"
          />
          {!hasInk && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-body-sm text-text-secondary">
              <AppIcon icon={EditIcon} size={16} className="me-2" />
              {t('signature.drawHint', 'Sign here with your finger, pen or mouse')}
            </p>
          )}
          <div className="pointer-events-none absolute inset-x-6 bottom-8 border-t border-neutral-400" aria-hidden />
          {caption && <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-caption text-text-secondary">{caption}</p>}
        </div>
      )}

      {mode === 'type' && (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder={t('signature.typePlaceholder', 'Type your full name')}
            aria-label={t('signature.typePlaceholder', 'Type your full name')}
            className="h-14 rounded-md border border-border-strong px-4 text-body focus:border-border-focus focus:outline-none"
          />
          <div className={cn(frame, 'flex aspect-[3/1] items-center justify-center')}>
            <span
              className="px-4 text-center text-[clamp(28px,6vw,52px)] italic leading-none text-primary-active"
              style={{ fontFamily: '"Segoe Script", "Brush Script MT", "Snell Roundhand", "Apple Chancery", cursive' }}
            >
              {typed || notSet()}
            </span>
            <div className="pointer-events-none absolute inset-x-6 bottom-8 border-t border-neutral-400" aria-hidden />
            {caption && <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-caption text-text-secondary">{caption}</p>}
          </div>
        </div>
      )}

      {mode === 'upload' && (
        <label className={cn(frame, 'flex aspect-[3/1] cursor-pointer flex-col items-center justify-center gap-2 text-center hover:bg-primary-25')}>
          <AppIcon icon={UploadOutlineIcon} size={28} className="text-primary" />
          <span className="text-body-sm font-semibold text-primary">{t('signature.uploadCta', 'Choose a scanned signature')}</span>
          <span className="text-caption text-text-secondary">{t('signature.uploadHint', 'PNG or JPG, up to 1 MB, on a white background')}</span>
          <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={upload} />
        </label>
      )}
      {uploadError && <p role="alert" className="text-body-sm text-error-600">{uploadError}</p>}

      {mode !== 'upload' && (
        <div className="flex flex-wrap justify-end gap-3">
          {mode === 'draw' && (
            <button type="button" onClick={clearCanvas} disabled={!hasInk} className="h-11 rounded-md px-4 text-body-sm font-semibold text-text-secondary hover:bg-neutral-25 disabled:opacity-50">
              {t('signature.clear', 'Clear')}
            </button>
          )}
          {value && (
            <button type="button" onClick={() => setEditing(false)} className="h-11 rounded-md px-4 text-body-sm font-semibold text-text-secondary hover:bg-neutral-25">
              {t('common.cancel', 'Cancel')}
            </button>
          )}
          <button
            type="button"
            onClick={() => void apply()}
            disabled={mode === 'draw' ? !hasInk : !typed.trim()}
            className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
          >
            {t('signature.apply', 'Use this signature')}
          </button>
        </div>
      )}
    </div>
  )
}

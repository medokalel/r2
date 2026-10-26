import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Textarea, TextField } from '@/components/ui/TextField'
import { SelectField } from '@/components/ui/Select'
import { EXTRA_CATEGORIES, type TravelCategory, type TravelEstimate, type TravelLine } from '@/lib/api/travelApi'
import { categoryLabel, formatMoney, travelErrorMessage } from '@/components/travel/travelHelpers'

interface ShellProps {
  open: boolean
  title: string
  description?: string
  submitLabel: string
  canSubmit: boolean
  wide?: boolean
  onClose: () => void
  onSubmit: () => Promise<void>
  extraAction?: React.ReactNode
  children: React.ReactNode
}

/** Dialog shell of the travel panel: form body, error inside the dialog, cancel / submit footer. */
export function TravelDialog(props: ShellProps) {
  return (
    <Dialog.Root open={props.open} onOpenChange={(next) => !next && props.onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={props.description ? 'travel-dialog-description' : undefined}
          className={`fixed start-1/2 top-1/2 z-50 flex max-h-[92vh] ${props.wide ? 'w-[min(760px,calc(100vw-32px))]' : 'w-[min(520px,calc(100vw-32px))]'} -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2`}
        >
          {props.open ? <ShellBody {...props} /> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ShellBody({ title, description, submitLabel, canSubmit, onClose, onSubmit, extraAction, children }: ShellProps) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submit = async () => {
    if (!canSubmit || busy) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit()
      onClose()
    } catch (err) {
      setError(travelErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form
      className="flex min-h-0 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <div className="flex flex-col gap-4 overflow-y-auto p-5 sm:p-6">
        <Dialog.Title className="text-body-lg font-semibold leading-[1.4] text-neutral-900">{title}</Dialog.Title>
        {description && (
          <Dialog.Description id="travel-dialog-description" className="-mt-2 text-body-sm leading-[1.6] text-neutral-700">
            {description}
          </Dialog.Description>
        )}
        {children}
        {error && (
          <p role="alert" className="rounded-md border border-error-100 bg-error-50 px-3 py-2 text-body-sm text-error-700">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-100 px-5 py-4 sm:px-6">
        {extraAction && <div className="me-auto">{extraAction}</div>}
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
          {t('travel.common.cancel')}
        </Button>
        <Button type="submit" size="sm" disabled={busy || !canSubmit} aria-busy={busy || undefined}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

const MIN_JUSTIFICATION = 10

/** Manual adjustment of one line (quantity / unit amount + justification), or reset to the calculated price. */
export function AdjustLineDialog({
  line,
  currency,
  threshold,
  onClose,
  onAdjust,
  onReset,
}: {
  line: TravelLine | null
  currency: string
  threshold: number | null
  onClose: () => void
  onAdjust: (body: { quantity: number; unitAmount: number; justification: string }) => Promise<void>
  onReset: () => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [why, setWhy] = useState('')
  const [lineId, setLineId] = useState<string | null>(null)
  if (line && line.id !== lineId) {
    setLineId(line.id)
    setQuantity(String(line.quantity))
    setUnit(String(line.unitAmount))
    setWhy('')
  }
  const q = Number(quantity)
  const u = Number(unit)
  const valid = quantity !== '' && unit !== '' && q >= 0 && u >= 0 && why.trim().length >= MIN_JUSTIFICATION
  const newAmount = Math.round(q * u * 100) / 100
  const baseline = line ? (line.calculatedAmount ?? line.amount) : 0
  const needsApproval = threshold !== null && Math.abs(newAmount - baseline) > threshold
  return (
    <TravelDialog
      open={Boolean(line)}
      title={t('travel.adjust.title')}
      description={line?.label}
      submitLabel={t('travel.adjust.submit')}
      canSubmit={valid}
      onClose={onClose}
      onSubmit={() => onAdjust({ quantity: q, unitAmount: u, justification: why.trim() })}
      extraAction={
        line?.adjusted ? (
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            onClick={() => {
              void onReset().then(onClose)
            }}
          >
            {t('travel.adjust.reset')}
          </Button>
        ) : null
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="travel-adjust-quantity" label={t('travel.table.quantity')} type="number" min="0" step="0.5" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <TextField id="travel-adjust-unit" label={`${t('travel.table.unitAmount')} (${currency})`} type="number" min="0" step="0.01" value={unit} onChange={(e) => setUnit(e.target.value)} />
      </div>
      <p className="text-body-sm text-neutral-700">
        {t('travel.adjust.newAmount', { amount: formatMoney(newAmount, currency, i18n.language), calculated: formatMoney(baseline, currency, i18n.language) })}
      </p>
      <div className="space-y-2">
        <label htmlFor="travel-adjust-why" className="text-body-sm font-medium">
          {t('travel.common.justification')} <span className="text-error-500">*</span>
        </label>
        <Textarea id="travel-adjust-why" rows={3} maxLength={1000} value={why} onChange={(e) => setWhy(e.target.value)} placeholder={t('travel.adjust.placeholder')} />
        <p className="text-caption text-text-secondary">{t('travel.common.justificationHint', { count: MIN_JUSTIFICATION })}</p>
      </div>
      {needsApproval && <p className="rounded-md bg-warning-50 px-3 py-2 text-body-sm text-warning-800">{t('travel.adjust.needsApproval')}</p>}
    </TravelDialog>
  )
}

/** Documented extra cost (MANUAL line). */
export function AddLineDialog({ open, currency, onClose, onAdd }: { open: boolean; currency: string; onClose: () => void; onAdd: (body: { category: TravelCategory; label: string; quantity: number; unitAmount: number; justification: string; documentRef?: string }) => Promise<void> }) {
  const { t } = useTranslation()
  const [category, setCategory] = useState<TravelCategory>('OTHER')
  const [label, setLabel] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('')
  const [why, setWhy] = useState('')
  const [doc, setDoc] = useState('')
  const valid = label.trim().length >= 2 && Number(quantity) > 0 && unit !== '' && Number(unit) >= 0 && why.trim().length >= MIN_JUSTIFICATION
  const close = () => {
    setLabel('')
    setUnit('')
    setWhy('')
    setDoc('')
    setQuantity('1')
    setCategory('OTHER')
    onClose()
  }
  return (
    <TravelDialog
      open={open}
      title={t('travel.addLine.title')}
      description={t('travel.addLine.description')}
      submitLabel={t('travel.addLine.submit')}
      canSubmit={valid}
      onClose={close}
      onSubmit={() => onAdd({ category, label: label.trim(), quantity: Number(quantity), unitAmount: Number(unit), justification: why.trim(), documentRef: doc.trim() || undefined })}
    >
      <SelectField
        id="travel-add-category"
        label={t('travel.table.category')}
        value={category}
        onChange={(v) => setCategory(v as TravelCategory)}
        options={EXTRA_CATEGORIES.map((c) => ({ value: c, label: categoryLabel(t, c) }))}
      />
      <TextField id="travel-add-label" label={t('travel.table.description')} required maxLength={300} value={label} onChange={(e) => setLabel(e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="travel-add-quantity" label={t('travel.table.quantity')} type="number" min="0" step="0.5" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <TextField id="travel-add-unit" label={`${t('travel.table.unitAmount')} (${currency})`} required type="number" min="0" step="0.01" value={unit} onChange={(e) => setUnit(e.target.value)} />
      </div>
      <TextField id="travel-add-doc" label={t('travel.addLine.documentRef')} maxLength={300} value={doc} onChange={(e) => setDoc(e.target.value)} />
      <div className="space-y-2">
        <label htmlFor="travel-add-why" className="text-body-sm font-medium">
          {t('travel.common.justification')} <span className="text-error-500">*</span>
        </label>
        <Textarea id="travel-add-why" rows={3} maxLength={1000} value={why} onChange={(e) => setWhy(e.target.value)} />
        <p className="text-caption text-text-secondary">{t('travel.common.justificationHint', { count: MIN_JUSTIFICATION })}</p>
      </div>
    </TravelDialog>
  )
}

/** Actual cost per line (receipts), for the variance against the estimate. */
export function ActualsDialog({ estimate, open, onClose, onSave }: { estimate: TravelEstimate; open: boolean; onClose: () => void; onSave: (lines: Array<{ lineId: string; actualAmount: number | null; note?: string }>) => Promise<void> }) {
  const { t, i18n } = useTranslation()
  const initial = () => Object.fromEntries(estimate.lines.map((l) => [l.id, { amount: l.actualAmount === null ? '' : String(l.actualAmount), note: l.actualNote ?? '' }]))
  const [rows, setRows] = useState<Record<string, { amount: string; note: string }>>(initial)
  const [openedFor, setOpenedFor] = useState<string | null>(null)
  if (open && openedFor !== estimate.updatedAt) {
    setOpenedFor(estimate.updatedAt)
    setRows(initial())
  }
  const changed = estimate.lines.filter((l) => {
    const row = rows[l.id]
    if (!row) return false
    const before = l.actualAmount === null ? '' : String(l.actualAmount)
    return row.amount !== before || row.note !== (l.actualNote ?? '')
  })
  const valid = changed.length > 0 && changed.every((l) => rows[l.id].amount === '' || Number(rows[l.id].amount) >= 0)
  return (
    <TravelDialog
      open={open}
      wide
      title={t('travel.actuals.title')}
      description={t('travel.actuals.description')}
      submitLabel={t('travel.actuals.submit')}
      canSubmit={valid}
      onClose={onClose}
      onSubmit={() => onSave(changed.map((l) => ({ lineId: l.id, actualAmount: rows[l.id].amount === '' ? null : Number(rows[l.id].amount), note: rows[l.id].note.trim() || undefined })))}
    >
      <ul className="divide-y divide-neutral-100">
        {estimate.lines.map((l) => (
          <li key={l.id} className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)] sm:items-end">
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-neutral-900">{l.label}</p>
              <p className="text-caption text-text-secondary">{t('travel.actuals.estimated', { amount: formatMoney(l.amount, estimate.currency, i18n.language) })}</p>
            </div>
            <TextField
              id={`travel-actual-${l.id}`}
              aria-label={`${t('travel.table.actual')} ${l.label}`}
              type="number"
              min="0"
              step="0.01"
              value={rows[l.id]?.amount ?? ''}
              onChange={(e) => setRows((r) => ({ ...r, [l.id]: { ...r[l.id], amount: e.target.value } }))}
            />
            <TextField
              id={`travel-actual-note-${l.id}`}
              aria-label={`${t('travel.actuals.note')} ${l.label}`}
              placeholder={t('travel.actuals.note')}
              maxLength={500}
              value={rows[l.id]?.note ?? ''}
              onChange={(e) => setRows((r) => ({ ...r, [l.id]: { ...r[l.id], note: e.target.value } }))}
            />
          </li>
        ))}
      </ul>
    </TravelDialog>
  )
}

/** Remove a documented extra cost (justification kept in the audit trail). */
export function RemoveLineDialog({ line, onClose, onRemove }: { line: TravelLine | null; onClose: () => void; onRemove: (justification: string) => Promise<void> }) {
  const { t } = useTranslation()
  const [why, setWhy] = useState('')
  return (
    <TravelDialog
      open={Boolean(line)}
      title={t('travel.remove.title')}
      description={line?.label}
      submitLabel={t('travel.remove.submit')}
      canSubmit={why.trim().length >= MIN_JUSTIFICATION}
      onClose={() => {
        setWhy('')
        onClose()
      }}
      onSubmit={() => onRemove(why.trim())}
    >
      <div className="space-y-2">
        <label htmlFor="travel-remove-why" className="text-body-sm font-medium">
          {t('travel.common.justification')} <span className="text-error-500">*</span>
        </label>
        <Textarea id="travel-remove-why" rows={3} maxLength={1000} value={why} onChange={(e) => setWhy(e.target.value)} />
        <p className="text-caption text-text-secondary">{t('travel.common.justificationHint', { count: MIN_JUSTIFICATION })}</p>
      </div>
    </TravelDialog>
  )
}

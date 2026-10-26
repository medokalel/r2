import { useState, useEffect, useEffectEvent, useRef, type ChangeEvent } from 'react'
import { toast } from '@/lib/toast'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AddInvoiceItemModal } from '@/components/dashboard/AddInvoiceItemModal'
import { FeeCatalogManagerDialog } from '@/components/dashboard/FeeCatalogManagerDialog'
import type { InvoiceLineItem } from '@/components/dashboard/InteractiveInvoiceModal'
import { useValuesChanged } from '@/hooks/useValuesChanged'
import { useDeepLinkField } from '@/hooks/useDeepLinkField'
import { ReturnToBanner } from '@/components/ui/ReturnToBanner'
import { enumLabel } from '@/lib/enumLabel'
import { CabOrPortalLayout } from '@/components/layout/CabOrPortalLayout'
import { usePortalMode } from '@/hooks/usePortalMode'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useInvoiceDetailsTourSteps } from '@/config/invoiceDetailsTourSteps'
import { ROUTES } from '@/lib/routes'
import {
  getCabInvoiceById,
  getInvoiceIssueGate,
  issueInvoice,
  saveInvoiceDraft,
  updateInvoiceTax,
  recordPayment,
  type CabInvoiceItem,
} from '@/lib/api/cabInvoiceRegisterApi'
import { cn } from '@/lib/utils'
import { ZatcaPanel } from '@/components/dashboard/invoices/ZatcaPanel'
import {
  ATTACHMENT_ACCEPT,
  INVOICE_CURRENCIES,
  applyClientAddress,
  downloadAttachment,
  removeInvoiceAttachment,
  saveInvoiceHeader,
  uploadInvoiceAttachment,
  type InvoiceAttachment,
} from '@/lib/api/cabInvoiceDetailsApi'
import { demoCabTaxProfile } from '@/lib/api/cabTaxProfileApi'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

export function CabInvoiceDetailsPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const tourSteps = useInvoiceDetailsTourSteps()
  // Portal mode (/portal/invoices/:id or a client session): read-only view in the portal shell.
  const portal = usePortalMode()
  const registerPath = portal ? ROUTES.portalInvoices : ROUTES.cabInvoices
  const [invoice, setInvoice] = useState<CabInvoiceItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [issuing, setIssuing] = useState(false)

  // Line items from the fee catalog (drafts only) and the catalog manager
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [savingItems, setSavingItems] = useState(false)

  // Active tab state
  const [activeTab, setActiveTab] = useState<'items' | 'installments' | 'attachments' | 'moreDetails'>('items')

  // Tax configuration modal
  const [showTaxModal, setShowTaxModal] = useState(false)
  const [selectedTax, setSelectedTax] = useState('vat15')

  // Record payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('500.00')
  const [paymentDate, setPaymentDate] = useState('2024-03-20')
  const [paymentMethod, setPaymentMethod] = useState('Bank transfer')
  const [paymentReference, setPaymentReference] = useState('TRX-12345')

  // Toast/Feedback
  const [taxWarning, setTaxWarning] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Header fields saved with "Save draft" (PO reference, currency)
  const [poReference, setPoReference] = useState('')
  const [currency, setCurrency] = useState('SAR')
  // Bill-to and attachments
  const [applyingAddress, setApplyingAddress] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [attachmentMenu, setAttachmentMenu] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Close the attachment menu on any outside click or Escape.
  useEffect(() => {
    if (!attachmentMenu) return
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return
      if (event instanceof MouseEvent && (event.target as HTMLElement | null)?.closest('[data-attachment-menu]')) return
      setAttachmentMenu(null)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [attachmentMenu])

  // Requests the invoice; state is only set once the request settles.
  const requestInvoice = (): Promise<void> =>
    getCabInvoiceById(invoiceId || 'inv-0024')
      .then((data) => {
        setInvoice(data)
        setPoReference(data?.poReference ?? '')
        setCurrency(data?.currency ?? 'SAR')
      })
      .catch(() => {
        setLoadError(t('common.loadFailed', 'Failed to load. Please try again.'))
      })
      .finally(() => {
        setLoading(false)
      })

  const loadInvoice = () => {
    setLoading(true)
    setLoadError(null)
    return requestInvoice()
  }

  // A different invoice id shows the loader in that same render; the effect
  // below then runs the request (`loading` starts as true on mount).
  const invoiceIdChanged = useValuesChanged([invoiceId])
  if (invoiceIdChanged) {
    setLoading(true)
    setLoadError(null)
  }

  const onInvoiceIdChange = useEffectEvent(() => {
    requestInvoice()
  })
  useEffect(() => {
    onInvoiceIdChange()
  }, [invoiceId])

  // "Complete" from the import wizard focuses the tax action (?field=invoice-configure-tax).
  useDeepLinkField(!loading && Boolean(invoice))

  if (loading || !invoice) {
    return (
      <CabOrPortalLayout portal={portal} sidebarVariant="invoices">
        <CabHeader title={portal ? t('portal.invoices.title', 'Invoices') : t('invoices.details.breadcrumb')} notificationCount={3} />
        <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
          {!loading && !invoice && !loadError ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-neutral-700">{t('portal.invoices.notFound', 'This invoice could not be found.')}</p>
              <button
                type="button"
                onClick={() => navigate(registerPath)}
                className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
              >
                {t('portal.invoices.backToList', 'Back to invoices')}
              </button>
            </div>
          ) : loadError ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-error-600">{loadError}</p>
              <button
                type="button"
                onClick={loadInvoice}
                className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
              >
                {t('common.retry', 'Retry')}
              </button>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-neutral-600">{t('common.loading')}</div>
          )}
        </main>
      </CabOrPortalLayout>
    )
  }

  const isFinalized = invoice.status === 'Issued' || invoice.status === 'Paid' || invoice.status === 'Partially paid'
  const isDraft = invoice.status === 'Draft' || (!isFinalized && invoice.status === 'Unpaid')

  const subtotal = invoice.items.reduce((acc, it) => acc + it.amount, 0)
  const taxAmount = invoice.taxRate ? (subtotal * invoice.taxRate.percentage) / 100 : 0
  const total = subtotal + taxAmount
  const balanceDue = Math.max(0, total - invoice.paidAmount)

  const handleConfigureTax = async (e: React.FormEvent) => {
    e.preventDefault()
    let rateObj = { id: 'vat15', label: 'VAT 15% (Saudi Arabia)', percentage: 15 }
    if (selectedTax === 'notax') {
      rateObj = { id: 'notax', label: 'No tax (0%)', percentage: 0 }
    } else if (selectedTax === 'vat5') {
      rateObj = { id: 'vat5', label: 'VAT 5%', percentage: 5 }
    } else if (selectedTax === 'gst10') {
      rateObj = { id: 'gst10', label: 'GST 10%', percentage: 10 }
    }

    setActionError(null)
    try {
      await updateInvoiceTax(invoice.id, rateObj)
      setShowTaxModal(false)
      setTaxWarning(false)
      toast.success(t('invoices.details.taxSuccessToast'))
      loadInvoice()
    } catch (err) {
      setActionError(
        err instanceof Error && err.message === 'INVOICE_IMMUTABLE'
          ? t('invoices.details.immutableError', 'Finalized invoices cannot be changed.')
          : t('common.saveFailed', 'Save failed. Your values were preserved. Please try again.')
      )
    }
  }

  const handleSaveDraft = async () => {
    setActionError(null)
    setSavingDraft(true)
    try {
      await saveInvoiceHeader(invoice, { poReference: poReference.trim(), currency })
      toast.success(t('invoices.details.draftSavedToast'))
      loadInvoice()
    } catch (err) {
      setActionError(
        err instanceof Error && err.message === 'INVOICE_IMMUTABLE'
          ? t('invoices.details.immutableError', 'Finalized invoices cannot be changed.')
          : t('common.saveFailed', 'Save failed. Your values were preserved. Please try again.')
      )
    } finally {
      setSavingDraft(false)
    }
  }

  /** Replaces the draft's line items (server recomputes amounts and totals). */
  const saveItems = async (items: CabInvoiceItem['items'], toastKey: string, toastFallback: string) => {
    setActionError(null)
    setSavingItems(true)
    try {
      await saveInvoiceDraft(invoice.id, { items })
      toast.success(t(toastKey, toastFallback))
      loadInvoice()
    } catch (err) {
      setActionError(
        err instanceof Error && err.message === 'INVOICE_IMMUTABLE'
          ? t('invoices.details.immutableError', 'Finalized invoices cannot be changed.')
          : t('common.saveFailed', 'Save failed. Your values were preserved. Please try again.')
      )
    } finally {
      setSavingItems(false)
    }
  }

  const handleAddCatalogItem = (line: InvoiceLineItem) => {
    const name = line.description ?? t(line.descriptionKey)
    void saveItems(
      [
        ...invoice.items,
        {
          id: line.id,
          name,
          description: line.unit ?? '',
          qty: line.quantity,
          unitPrice: line.amount,
          amount: Math.round(line.quantity * line.amount * 100) / 100,
        },
      ],
      'invoices.details.itemAddedToast',
      'Item added to the invoice.'
    )
  }

  const handleRemoveItem = (itemId: string) => {
    void saveItems(
      invoice.items.filter((item) => item.id !== itemId),
      'invoices.details.itemRemovedToast',
      'Item removed from the invoice.'
    )
  }

  const flash = (message: string) => {
    toast.success(message)
  }

  /** "Use client address": copies the client's registered address into the draft bill-to. */
  const handleUseClientAddress = async () => {
    setActionError(null)
    setApplyingAddress(true)
    try {
      setInvoice(await applyClientAddress(invoice))
      flash(t('invoices.details.clientAddressApplied', "The client's address was copied to Bill-to."))
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setActionError(
        code === 'CLIENT_ADDRESS_MISSING'
          ? t('invoices.details.clientAddressMissing', 'The client has no registered address yet. Add it on the client profile first.')
          : code === 'INVOICE_IMMUTABLE'
            ? t('invoices.details.immutableError', 'Finalized invoices cannot be changed.')
            : t('common.saveFailed', 'Save failed. Your values were preserved. Please try again.')
      )
    } finally {
      setApplyingAddress(false)
    }
  }

  const attachmentError = (code: string) =>
    code === 'ATTACHMENT_TYPE'
      ? t('invoices.details.attachments.typeError', 'Use a PDF, image, Word or Excel file.')
      : code === 'ATTACHMENT_TOO_LARGE'
        ? t('invoices.details.attachments.sizeError', 'The file is too large (10 MB maximum; 2 MB in the preview).')
        : code === 'ATTACHMENT_LIMIT'
          ? t('invoices.details.attachments.limitError', 'An invoice can hold up to 20 attachments.')
          : t('invoices.details.attachments.failed', 'The attachment could not be saved. Try again.')

  const handlePickAttachment = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setActionError(null)
    setUploading(true)
    try {
      setInvoice(await uploadInvoiceAttachment(invoice, file))
      flash(t('invoices.details.attachments.uploaded', 'Attachment uploaded.'))
    } catch (err) {
      setActionError(attachmentError(err instanceof Error ? err.message : ''))
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAttachment = async (attachment: InvoiceAttachment) => {
    setAttachmentMenu(null)
    if (!window.confirm(t('invoices.details.attachments.confirmRemove', 'Remove "{{name}}" from this invoice?', { name: attachment.name }))) return
    setActionError(null)
    try {
      setInvoice(await removeInvoiceAttachment(invoice, attachment.id))
      flash(t('invoices.details.attachments.removed', 'Attachment removed.'))
    } catch (err) {
      setActionError(attachmentError(err instanceof Error ? err.message : ''))
    }
  }

  const handleDownloadAttachment = (attachment: InvoiceAttachment) => {
    setAttachmentMenu(null)
    if (!downloadAttachment(attachment)) {
      setActionError(t('invoices.details.attachments.noFile', 'This attachment has no file to download.'))
    }
  }

  const handleIssueInvoice = async () => {
    // Preview: the demo CAB is in Saudi Arabia, so issuing needs its VAT number (as on the server).
    if (isDemoMode() && !demoCabTaxProfile().vatNumber) {
      setActionError(t('invoices.details.vatRequired', 'Add the CAB VAT number in the CAB profile before issuing invoices (ZATCA).'))
      return
    }
    const gate = getInvoiceIssueGate(invoice)
    if (!gate.ok) {
      setTaxWarning(true)
      setActionError(
        gate.missingBilling
          ? t('invoices.details.billingRequired', 'Billing details are required before issuing.')
          : t('invoices.details.taxWarning')
      )
      return
    }
    setActionError(null)
    setIssuing(true)
    try {
      await issueInvoice(invoice.id)
      toast.success(t('invoices.details.issuedToast'))
      loadInvoice()
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setActionError(
        code.startsWith('VAT_NUMBER_REQUIRED')
          ? t('invoices.details.vatRequired', 'Add the CAB VAT number in the CAB profile before issuing invoices (ZATCA).')
          : code === 'BILLING_REQUIRED'
          ? t('invoices.details.billingRequired', 'Billing details are required before issuing.')
          : code === 'TAX_REQUIRED'
            ? t('invoices.details.taxWarning')
            : code === 'INVOICE_IMMUTABLE'
              ? t('invoices.details.immutableError', 'Finalized invoices cannot be changed.')
              : t('common.saveFailed', 'Save failed. Your values were preserved. Please try again.')
      )
    } finally {
      setIssuing(false)
    }
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(paymentAmount) || 0
    if (amt <= 0) {
      setPaymentError(t('invoices.register.amountPositiveError', 'Amount must be greater than zero.'))
      return
    }
    if (invoice && amt - invoice.balance > 0.009) {
      setPaymentError(
        t('invoices.register.amountExceedsError', 'Amount cannot exceed the remaining balance ({{balance}} {{currency}}).', {
          balance: invoice.balance.toFixed(2),
          currency: invoice.currency,
        })
      )
      return
    }

    setPaymentError(null)
    try {
      await recordPayment(invoice.id, {
        amount: amt,
        date: paymentDate,
        method: paymentMethod,
        reference: paymentReference,
      })

      setShowPaymentModal(false)
      toast.success(t('invoices.details.paymentSuccessToast'))
      loadInvoice()
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setPaymentError(
        code === 'AMOUNT_EXCEEDS_BALANCE'
          ? t('invoices.register.amountExceedsError', 'Amount cannot exceed the remaining balance ({{balance}} {{currency}}).', {
              balance: invoice.balance.toFixed(2),
              currency: invoice.currency,
            })
          : code === 'INVOICE_SETTLED'
            ? t('invoices.register.settledError', 'This invoice is already settled.')
            : t('common.saveFailed', 'Save failed. Your values were preserved. Please try again.')
      )
    }
  }

  return (
    <CabOrPortalLayout portal={portal} sidebarVariant="invoices" tourId="invoice-details-tour" tourSteps={tourSteps}>
      <CabHeader
        title={invoice.invoiceNumber}
        subtitle={portal ? t('portal.invoices.title', 'Invoices') : `${t('invoices.details.client')} ${invoice.clientCode} · ${invoice.clientName}`}
        notificationCount={3}
      />

      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        {!portal && <ReturnToBanner />}
        {actionError && (
          <div role="alert" className="p-3.5 bg-error-50 border border-error-200 rounded-md text-body-sm font-medium text-error-700">
            {actionError}
          </div>
        )}

        {/* Top Header Bar & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CabTourStep steps={tourSteps} stepId="inv-details-header">
            <div>
              <nav className="mb-1 flex items-center gap-2 text-body-sm text-neutral-500">
                <span
                  onClick={() => navigate(registerPath)}
                  className="cursor-pointer hover:underline text-neutral-600 font-medium"
                >
                  {portal ? t('portal.invoices.title', 'Invoices') : t('invoices.details.breadcrumb')}
                </span>
                <span>›</span>
                <span className="font-semibold text-primary">{invoice.invoiceNumber}</span>
              </nav>

              <div className="flex items-center gap-3">
                <h1 className="text-section-title text-text-primary">
                  {invoice.invoiceNumber}
                </h1>
                <span
                  className={cn(
                    'inline-flex min-w-[110px] items-center justify-center rounded-full px-3.5 py-1 text-caption font-bold',
                    invoice.status.toLowerCase() === 'paid' && 'bg-success-100 text-success-700 border border-success-200',
                    invoice.status.toLowerCase() === 'partially paid' && 'bg-primary-subtle text-primary border border-primary-100',
                    invoice.status.toLowerCase() === 'unpaid' && 'bg-error-100 text-error-600 border border-error-200',
                    invoice.status.toLowerCase() === 'draft' && 'bg-neutral-50 text-slate-600 border border-neutral-100',
                    invoice.status.toLowerCase() === 'issued' && 'bg-info-50 text-info-700 border border-info-100'
                  )}
                >
                  {enumLabel(t, invoice.status)}
                </span>
              </div>

              <p className="text-body-sm text-neutral-600 mt-1 flex flex-wrap items-center gap-2">
                {invoice.relatedOrder ? (
                  <>
                    <span>{t('invoices.details.fromOrder')}</span>
                    <span className="text-primary font-semibold hover:underline cursor-pointer">
                      {invoice.relatedOrder}
                    </span>
                  </>
                ) : null}
                <span className="inline-flex rounded-full bg-success-50 px-2.5 py-0.5 text-caption font-medium text-success-600">
                  {enumLabel(t, invoice.orderStatus)}
                </span>
                {portal ? null : (
                  <>
                    <span className="text-neutral-400">|</span>
                    <span>{t('invoices.details.client')}</span>
                    <span className="text-primary font-semibold hover:underline cursor-pointer">
                      {invoice.clientCode} · {invoice.clientName}
                    </span>
                  </>
                )}
              </p>
            </div>
          </CabTourStep>

          {portal ? null : (
          <CabTourStep steps={tourSteps} stepId="inv-details-actions">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={!isDraft || savingDraft}
                title={isFinalized ? t('invoices.details.immutableHint', 'Finalized invoices cannot be changed.') : undefined}
                className="h-11 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                {savingDraft ? t('common.saving', 'Saving...') : t('invoices.details.saveDraft')}
              </button>

              <button
                type="button"
                id="invoice-tax-percent"
                onClick={() => !isFinalized && setShowTaxModal(true)}
                disabled={isFinalized}
                title={isFinalized ? t('invoices.details.immutableHint', 'Finalized invoices cannot be changed.') : undefined}
                className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
              >
                {t('invoices.details.configureTax')}
              </button>

              <button
                type="button"
                onClick={handleIssueInvoice}
                disabled={isFinalized || issuing}
                title={isFinalized ? t('invoices.details.immutableHint', 'Finalized invoices cannot be changed.') : undefined}
                className={cn(
                  'h-11 rounded-md px-4 text-body-sm font-medium transition-colors disabled:cursor-not-allowed',
                  invoice.taxRate
                    ? 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'
                    : 'bg-neutral-100 text-neutral-500 border border-neutral-100'
                )}
              >
                {issuing ? t('common.saving', 'Saving...') : t('invoices.details.issueInvoice')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentError(null)
                  setPaymentAmount(invoice.balance > 0 ? (invoice.balance >= 500 ? '500.00' : invoice.balance.toFixed(2)) : '0.00')
                  setShowPaymentModal(true)
                }}
                disabled={invoice.balance <= 0}
                className="h-11 w-11 flex items-center justify-center rounded-md border border-neutral-100 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-40"
                title={t('invoices.register.recordPayment')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </CabTourStep>
          )}
        </div>

        {taxWarning && !portal && (
          <div className="p-3.5 bg-orange-50 border border-warning-100 rounded-md flex items-center justify-between text-body-sm text-orange-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-semibold">{t('invoices.details.taxWarning')}</span>
            </div>
            <button
              type="button"
              onClick={() => !isFinalized && setShowTaxModal(true)}
              disabled={isFinalized}
              className="px-3 py-1.5 bg-orange-600 text-white rounded-sm font-medium text-caption hover:bg-orange-700 disabled:opacity-50"
            >
              {t('invoices.details.configureNow')}
            </button>
          </div>
        )}
        {isFinalized && !portal && (
          <div className="p-3.5 bg-primary-50 border border-primary-100 rounded-md text-body-sm font-semibold text-primary">
            {t('invoices.details.immutableHint', 'Finalized invoices cannot be changed.')}
          </div>
        )}

        {/* Top 3-Column Info Card */}
        <CabTourStep steps={tourSteps} stepId="inv-details-info-grid">
          <div className="rounded-lg border border-neutral-100 bg-white p-5 shadow-none grid grid-cols-1 md:grid-cols-3 gap-6 text-body-sm">
            {/* Column 1: Dates & Numbers */}
            <div className="space-y-3 md:border-r border-neutral-100 md:pe-6">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">{t('invoices.details.invoiceNumber')}</span>
                <span className="font-bold text-neutral-900">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">{t('invoices.details.issueDate')}</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 border border-neutral-100 rounded-md text-neutral-800">
                  <span>{invoice.issuedDate}</span>
                  <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">{t('invoices.details.dueDate')}</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 border border-neutral-100 rounded-md text-neutral-800">
                  <span>{invoice.dueDate}</span>
                  <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">{t('invoices.details.status')}</span>
                <span className="inline-flex rounded-full px-2.5 py-0.5 text-caption font-medium bg-primary-50 text-primary">
                  {enumLabel(t, invoice.status)}
                </span>
              </div>
            </div>

            {/* Column 2: Client Details */}
            <div className="space-y-3 md:border-r border-neutral-100 md:pe-6">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">{t('invoices.details.clientLabel')}</span>
                <span className="font-semibold text-primary hover:underline cursor-pointer">
                  {invoice.clientCode} · {invoice.clientName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">{t('invoices.details.country')}</span>
                <span className="font-medium text-neutral-800">{displayCountry(invoice.country)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">{t('invoices.details.primaryContact')}</span>
                <span className="font-medium text-neutral-800">{invoice.primaryContact}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">{t('invoices.details.email')}</span>
                <span className="text-primary hover:underline cursor-pointer">{invoice.contactEmail}</span>
              </div>
            </div>

            {/* Column 3: Order, App, Currency */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">{t('invoices.details.relatedOrder')}</span>
                <span className="font-semibold text-primary hover:underline cursor-pointer">
                  {invoice.relatedOrder}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">{t('invoices.details.application')}</span>
                <span className="font-semibold text-primary hover:underline cursor-pointer">
                  {invoice.relatedApplication}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">{t('invoices.details.poReference')}</span>
                {portal ? (
                  <span className="font-medium text-neutral-800">{invoice.poReference || notSet()}</span>
                ) : (
                  <input
                    type="text"
                    value={poReference}
                    maxLength={100}
                    onChange={(e) => setPoReference(e.target.value)}
                    disabled={!isDraft}
                    placeholder="PO-0000"
                    aria-label={t('invoices.details.poReference')}
                    title={isDraft ? t('invoices.details.savedWithDraft', 'Saved with "Save draft".') : t('invoices.details.immutableHint', 'Finalized invoices cannot be changed.')}
                    className="w-32 rounded-md border border-neutral-100 bg-neutral-50 px-2.5 py-1 text-body-sm text-neutral-800 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">{t('invoices.details.currency')}</span>
                {portal || !isDraft ? (
                  <span className="font-semibold text-neutral-800">{invoice.currency}</span>
                ) : (
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    aria-label={t('invoices.details.currency')}
                    title={t('invoices.details.savedWithDraft', 'Saved with "Save draft".')}
                    className="rounded-md border border-neutral-100 bg-white px-2.5 py-1 text-body-sm font-semibold text-neutral-800 focus:border-primary focus:outline-none"
                  >
                    {INVOICE_CURRENCIES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        </CabTourStep>

        {/* Middle Section: Bill-to & Amounts Cards */}
        <CabTourStep steps={tourSteps} stepId="inv-details-amounts">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Bill-to Card */}
            <div className="lg:col-span-7 rounded-lg border border-neutral-100 bg-white p-5 shadow-none space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-body font-bold text-neutral-900">Bill-to</h3>
                {portal ? null : (
                  <button
                    type="button"
                    onClick={() => void handleUseClientAddress()}
                    disabled={!isDraft || applyingAddress}
                    title={isDraft ? undefined : t('invoices.details.immutableHint', 'Finalized invoices cannot be changed.')}
                    className="rounded-md border border-neutral-100 bg-white px-3.5 py-1.5 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {applyingAddress ? t('common.saving', 'Saving...') : t('ui.useClientAddress')}
                  </button>
                )}
              </div>
              <div className="space-y-1 text-body-sm text-neutral-800">
                <div className="font-bold text-neutral-900">{invoice.billingAddress.name}</div>
                <div>{invoice.billingAddress.line1}</div>
                <div>{invoice.billingAddress.cityArea}</div>
                <div>{displayCountry(invoice.billingAddress.country)}</div>
              </div>
              <div className="p-3.5 bg-primary-50 border border-primary-100 rounded-md flex items-start gap-2.5 text-body-sm text-primary font-medium">
                <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t('ui.invoiceAddressSnapshot')}</span>
              </div>
            </div>

            {/* Amounts Summary Box */}
            <div className="lg:col-span-5 rounded-lg border border-neutral-100 bg-white p-5 shadow-none space-y-3.5">
              <h3 className="text-body font-bold text-neutral-900 border-b border-neutral-100 pb-3">
                {t('ui.amountsParen')}{invoice.currency})
              </h3>
              <div className="flex justify-between items-center text-body-sm text-neutral-700">
                <span>{t('invoices.details.subtotal')}</span>
                <span className="font-bold text-neutral-900">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-body-sm text-neutral-700">
                <div className="flex items-center gap-1.5">
                  <span>{t('ui.tax')}</span>
                  {invoice.taxRate ? (
                    <span className="inline-flex rounded-full bg-success-50 px-2.5 py-0.5 text-caption font-semibold text-success-600">
                      {invoice.taxRate.label}
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-overline font-medium text-neutral-600 italic">
                      {t('invoices.details.noTax')}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-neutral-800">
                  {invoice.taxRate ? `${taxAmount.toFixed(2)}` : notSet()}
                </span>
              </div>
              <div className="border-t border-neutral-100 pt-3 flex justify-between items-center text-body font-bold text-neutral-900">
                <span>{t('invoices.details.total')}</span>
                <span className="text-body text-neutral-900">{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-body-sm text-neutral-700">
                <span>{t('invoices.details.amountPaid')}</span>
                <span className="font-semibold text-neutral-900">{invoice.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-neutral-100 pt-2 flex justify-between items-center text-body font-bold text-primary">
                <span>{t('invoices.details.balanceDue')}</span>
                <span className="text-body-lg font-bold text-primary">{balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </CabTourStep>

        {/* ZATCA e-invoice: QR, status, XML (CAB) — QR and status in the client portal */}
        <ZatcaPanel invoice={invoice} portal={portal} />

        {/* Tab Navigation Section */}
        <CabTourStep steps={tourSteps} stepId="inv-details-tabs-breakdown">
          <div className="space-y-4">
            <div className="border-b border-neutral-100 flex items-center gap-6 text-body-sm">
              {[
                { key: 'items', label: t('invoices.details.tabItems') },
                { key: 'installments', label: t('invoices.details.tabInstallments') },
                { key: 'attachments', label: t('invoices.details.tabAttachments') },
                { key: 'moreDetails', label: t('invoices.details.tabMoreDetails') },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={cn(
                    'pb-3 transition-colors border-b-2 font-medium',
                    activeTab === tab.key
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          {/* Tab 1: Invoice items table */}
          {activeTab === 'items' && (
            <div className="overflow-hidden rounded-md border border-neutral-100 bg-white shadow-none">
              {!portal && (
                <div className="flex flex-wrap items-center justify-end gap-2 border-b border-neutral-100 p-3">
                  <button
                    type="button"
                    onClick={() => setCatalogOpen(true)}
                    className="rounded-md border border-primary px-3.5 py-1.5 text-body-sm font-semibold text-primary hover:bg-primary-50"
                  >
                    {t('feeCatalog.manage', 'Manage catalog')}
                  </button>
                  {isDraft && (
                    <button
                      type="button"
                      disabled={savingItems}
                      onClick={() => setAddItemOpen(true)}
                      className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
                    >
                      {t('invoices.details.addItem', '+ Add item')}
                    </button>
                  )}
                </div>
              )}
              <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-start text-body-sm">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="w-12 p-5 text-center text-body-sm font-medium">#</th>
                    <th className="p-5 text-start text-body-sm font-medium">{t('ui.itemService')}</th>
                    <th className="p-5 text-start text-body-sm font-medium">{t('invoices.details.colDescription')}</th>
                    <th className="p-5 text-center text-body-sm font-medium">{t('invoices.details.colQty')}</th>
                    <th className="p-5 text-end text-body-sm font-medium">{t('invoices.details.colUnit')} ({invoice.currency})</th>
                    <th className="p-5 text-end text-body-sm font-medium">{t('invoices.details.colAmount')} ({invoice.currency})</th>
                    {!portal && isDraft && (
                      <th className="w-16 p-5">
                        <span className="sr-only">{t('invoices.details.colActions', 'Actions')}</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id} className={cn('hover:bg-primary-50/50 transition-colors', index % 2 === 1 ? 'bg-neutral-25' : '')}>
                      <td className="px-4 py-3.5 text-center text-body-sm text-neutral-600">{index + 1}</td>
                      <td className="px-4 py-3.5 text-body font-medium text-neutral-900">{item.name}</td>
                      <td className="px-4 py-3.5 text-body-sm text-neutral-700">{item.description}</td>
                      <td className="px-4 py-3.5 text-center text-body-sm text-neutral-800 font-medium">{item.qty}</td>
                      <td className="px-4 py-3.5 text-end text-body-sm text-neutral-800 font-medium">
                        {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-end text-body font-bold text-neutral-900">
                        {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      {!portal && isDraft && (
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            disabled={savingItems || invoice.items.length <= 1}
                            onClick={() => handleRemoveItem(item.id)}
                            aria-label={t('invoices.details.removeItem', { name: item.name, defaultValue: 'Remove {{name}}' })}
                            className="rounded-sm px-2 py-1 text-caption font-semibold text-error-600 hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {t('common.delete')}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="p-4 bg-neutral-25 border-t border-neutral-100 flex justify-end gap-6 text-body-sm font-bold text-neutral-900">
                <span>{t('invoices.details.subtotal')} ({invoice.currency})</span>
                <span className="text-primary">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          {/* Bottom Side-by-Side Cards: Installments & Attachments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
            {/* Installments Card */}
            <div className="rounded-lg border border-neutral-100 bg-white p-5 shadow-none space-y-3">
              <h3 className="text-body font-bold text-neutral-900 border-b border-neutral-100 pb-3">
                {t('invoices.details.tabInstallments')}
              </h3>
              <div className="overflow-hidden rounded-md border border-neutral-100 bg-white">
                <table className="w-full border-collapse text-start text-body-sm">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="w-10 p-3.5 text-center text-body-sm font-medium">#</th>
                      <th className="p-3.5 text-start text-body-sm font-medium">{t('invoices.details.dueDate')}</th>
                      <th className="p-3.5 text-end text-body-sm font-medium">{t('invoices.details.colAmount')} ({invoice.currency})</th>
                      <th className="p-3.5 text-center text-body-sm font-medium">{t('invoices.details.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.installments.map((inst, index) => (
                      <tr key={inst.id} className={cn('hover:bg-primary-50/50 transition-colors', index % 2 === 1 ? 'bg-neutral-25' : '')}>
                        <td className="px-3.5 py-3 text-center text-body-sm text-neutral-500">{index + 1}</td>
                        <td className="px-3.5 py-3 text-body-sm font-medium text-neutral-800">{inst.dueDate}</td>
                        <td className="px-3.5 py-3 text-end text-body-sm font-bold text-neutral-900">
                          {inst.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-0.5 text-caption font-medium text-primary">
                            {enumLabel(t, inst.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attachments Card */}
            <div className="rounded-lg border border-neutral-100 bg-white p-5 shadow-none space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-body font-bold text-neutral-900">{t('invoices.details.tabAttachments')}</h3>
                {portal ? null : (
                <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary hover:bg-primary/20 border border-primary/30 text-body-sm font-semibold rounded-md transition-colors disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span>{uploading ? t('invoices.details.attachments.uploading', 'Uploading…') : t('ui.addFile')}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ATTACHMENT_ACCEPT}
                  className="hidden"
                  onChange={(e) => void handlePickAttachment(e)}
                  aria-label={t('ui.addFile')}
                />
                </>
                )}
              </div>
              {/* No overflow clipping here: the row menu opens below its row. */}
              <div className="rounded-md border border-neutral-100 bg-white">
                <table className="w-full border-collapse text-start text-body-sm">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="rounded-ss-md p-3.5 text-start text-body-sm font-medium">{t('ui.fileName')}</th>
                      <th className="hidden p-3.5 text-start text-body-sm font-medium sm:table-cell">{t('ui.type')}</th>
                      <th className="p-3.5 text-start text-body-sm font-medium">{t('ui.size')}</th>
                      <th className="hidden p-3.5 text-start text-body-sm font-medium sm:table-cell">{t('ui.uploadedOn')}</th>
                      <th className="w-8 rounded-se-md p-3.5 text-center text-body-sm font-medium">
                        <span className="sr-only">{t('invoices.details.attachments.actions', 'Attachment actions')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.attachments.map((att, index) => (
                      <tr key={att.id} className={cn('hover:bg-primary-50/50 transition-colors', index % 2 === 1 ? 'bg-neutral-25' : '')}>
                        <td className="px-3.5 py-3 text-body-sm font-semibold text-error-600 flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-error-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="min-w-0 break-all">{att.name}</span>
                        </td>
                        <td className="hidden px-3.5 py-3 text-body-sm text-neutral-700 sm:table-cell">{enumLabel(t, att.type)}</td>
                        <td className="px-3.5 py-3 text-body-sm text-neutral-700">{att.size}</td>
                        <td className="hidden px-3.5 py-3 text-body-sm text-neutral-700 sm:table-cell">{att.uploadedOn}</td>
                        <td className="relative px-3.5 py-3 text-center text-neutral-500" data-attachment-menu>
                          <button
                            type="button"
                            onClick={() => setAttachmentMenu((open) => (open === att.id ? null : att.id))}
                            aria-haspopup="menu"
                            aria-expanded={attachmentMenu === att.id}
                            aria-label={t('invoices.details.attachments.actions', 'Attachment actions')}
                            className="rounded px-2 hover:text-neutral-800"
                          >
                            ⋮
                          </button>
                          {attachmentMenu === att.id && (
                            <div role="menu" className="absolute end-2 top-full z-20 min-w-[150px] overflow-hidden rounded-md border border-neutral-100 bg-white py-1 text-start shadow-card">
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => handleDownloadAttachment(att as InvoiceAttachment)}
                                className="block w-full px-3.5 py-2 text-start text-body-sm text-neutral-800 hover:bg-primary-25"
                              >
                                {t('invoices.details.attachments.download', 'Download')}
                              </button>
                              {portal ? null : (
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => void handleRemoveAttachment(att as InvoiceAttachment)}
                                  className="block w-full px-3.5 py-2 text-start text-body-sm text-error-600 hover:bg-error-50"
                                >
                                  {t('invoices.details.attachments.remove', 'Remove')}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {invoice.attachments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3.5 py-5 text-center text-body-sm text-neutral-600">
                          {t('invoices.details.attachments.empty', 'No attachments yet.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          </div>
        </CabTourStep>

        {/* Configure Tax Modal */}
        {showTaxModal && (
          <div className="fixed inset-0 bg-surface-overlay/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-neutral-100 w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="text-body font-bold text-neutral-900">{t('invoices.details.taxModalTitle')}</h3>
                <button
                  type="button"
                  onClick={() => setShowTaxModal(false)}
                  className="text-neutral-500 hover:text-neutral-700 text-body-lg font-bold"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleConfigureTax} className="p-4 space-y-4 text-body-sm">
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">{t('invoices.details.taxModalSubtitle')}</label>
                  <div className="relative">
                    <select
                      value={selectedTax}
                      onChange={(e) => setSelectedTax(e.target.value)}
                      className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 pe-8 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="vat15">{t('ui.vat15')}</option>
                      <option value="vat5">{t('ui.vat5')}</option>
                      <option value="gst10">{t('ui.gst10')}</option>
                      <option value="notax">{t('ui.noTax')}</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setShowTaxModal(false)}
                    className="h-11 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    {t('invoices.register.cancel')}
                  </button>
                  <button
                    type="submit"
                    className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                  >
                    {t('invoices.details.applyTax')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Record Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-surface-overlay/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-neutral-100 w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="text-body font-bold text-neutral-900">
                  {t('invoices.details.recordPaymentTitle', { invoiceNumber: invoice.invoiceNumber })}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-neutral-500 hover:text-neutral-700 text-body-lg font-bold"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSavePayment} className="p-5 space-y-4 text-body-sm">
                {paymentError && (
                  <div role="alert" className="p-2.5 bg-error-50 border border-error-200 rounded-md font-medium text-error-700 text-body-sm">
                    {paymentError}
                  </div>
                )}
                <div className="p-3 bg-primary-50 border border-primary-100 rounded-md text-primary text-body-sm font-medium">
                  <span className="font-bold">
                    {t(
                      'invoices.register.allocationPreview',
                      'Allocation: {{amount}} {{currency}}. Remaining: {{remaining}} {{currency}}.',
                      {
                        amount: (parseFloat(paymentAmount) || 0).toFixed(2),
                        currency: invoice.currency,
                        remaining: Math.max(0, invoice.balance - (parseFloat(paymentAmount) || 0)).toFixed(2),
                      }
                    )}
                  </span>{' '}
                  {t('invoices.register.paymentInfoNote')}
                </div>
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('invoices.register.amountLabel', { currency: invoice.currency })}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">{t('invoices.register.paymentDateLabel')}</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">{t('invoices.register.paymentMethodLabel')}</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Bank transfer">{t('invoices.register.bankTransfer')}</option>
                    <option value="Credit Card">{t('invoices.register.creditCard')}</option>
                    <option value="Cheque">{t('invoices.register.cheque')}</option>
                    <option value="Cash">{t('invoices.register.cash')}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">{t('invoices.register.referenceLabel')}</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="h-11 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    {t('invoices.register.cancel')}
                  </button>
                  <button
                    type="submit"
                    className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                  >
                    {t('invoices.register.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      {!portal && (
        <>
          <AddInvoiceItemModal
            open={addItemOpen}
            onOpenChange={setAddItemOpen}
            onAdd={handleAddCatalogItem}
            currency={invoice.currency}
            title={t('invoices.details.addItemTitle', 'Add invoice item')}
          />
          <FeeCatalogManagerDialog open={catalogOpen} onOpenChange={setCatalogOpen} />
        </>
      )}
    </CabOrPortalLayout>
  )
}

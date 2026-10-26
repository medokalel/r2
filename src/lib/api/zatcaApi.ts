/**
 * ZATCA (Fatoora) e-invoicing data of a CAB → client invoice.
 *
 * CAB:    GET  /cab/invoices/:id/zatca          → InvoiceZatcaInfo
 *         GET  /cab/invoices/:id/zatca/xml      → { fileName, contentType, xml }
 *         POST /cab/invoices/:id/zatca/submit   generate if missing, sign, report / clear
 * Client: GET  /billing/cab-invoices/:id/zatca  → QR + status only
 *
 * The server generates, for every invoice issued by a Saudi CAB, the Phase 1 QR (base64 TLV) and
 * the Phase 2 UBL 2.1 XML (hash, previous-invoice hash, counter), and reports / clears it once
 * ZATCA credentials are configured. In the preview (demo mode) the QR and XML are built here
 * from the demo invoice and the status is kept in the demo store.
 */
import { ApiError } from '@/lib/api/client'
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode, loadState, saveState } from '@/lib/api/demo/demoStore'
import { DEMO_CAB } from '@/lib/api/demo/dataset'
import { demoCabTaxProfile } from '@/lib/api/cabTaxProfileApi'
import type { CabInvoiceItem } from '@/lib/api/cabInvoiceRegisterApi'
import { isAuditClientSession } from '@/lib/authStorage'

export type ZatcaStatus = 'NOT_REQUIRED' | 'PENDING' | 'REPORTED' | 'CLEARED' | 'REJECTED'

export interface ZatcaMessage {
  code: string
  category: string
  message: string
}

export interface InvoiceZatcaInfo {
  required: boolean
  status: ZatcaStatus
  /** QR + XML exist (false for drafts and when generation is waiting on data). */
  generated: boolean
  kind: 'STANDARD' | 'SIMPLIFIED' | null
  /** Base64 TLV payload to render as a QR code. */
  qrCode: string | null
  submittedAt: string | null
  // CAB view only
  uuid?: string | null
  icv?: number | null
  invoiceHash?: string | null
  previousInvoiceHash?: string | null
  signed?: boolean
  xmlAvailable?: boolean
  submissionEnabled?: boolean
  environment?: 'sandbox' | 'simulation' | 'production'
  errors?: ZatcaMessage[]
  warnings?: ZatcaMessage[]
}

export interface ZatcaXmlFile {
  fileName: string
  contentType: string
  xml: string
}

const ERROR_CODES = ['INVOICE_NOT_FOUND', 'ZATCA_XML_NOT_AVAILABLE', 'ZATCA_NOT_REQUIRED', 'INVOICE_NOT_ISSUED', 'ZATCA_ALREADY_SUBMITTED']

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await authorizedRequest<T>(path, init)
  } catch (err) {
    if (err instanceof ApiError) {
      const code = ERROR_CODES.find((c) => err.message.startsWith(c))
      if (code) throw new Error(code, { cause: err })
    }
    throw err
  }
}

const cabPath = (id: string, suffix = '') => `/cab/invoices/${encodeURIComponent(id)}/zatca${suffix}`

// ── Demo (preview) ───────────────────────────────────────────────────────────

/** VAT number of the demo CAB as saved on its company profile. */
const demoVat = () => demoCabTaxProfile().vatNumber || '310122393500003'
const DEMO_KEY = 'zatca-status'
const INITIAL_PIH = 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ=='

type DemoStatusMap = Record<string, { status: ZatcaStatus; submittedAt: string }>
const demoStatuses = () => loadState<DemoStatusMap>(DEMO_KEY, () => ({}))

const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2)

function tlvBase64(values: string[]): string {
  const encoder = new TextEncoder()
  const bytes: number[] = []
  values.forEach((value, i) => {
    const b = encoder.encode(value)
    bytes.push(i + 1, b.length, ...b)
  })
  return btoa(String.fromCharCode(...bytes))
}

/** "24 Oct 2026" → "2026-10-24" (UTC). */
function isoDay(display: string): string {
  const d = new Date(`${display} UTC`)
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10)
}

function demoTotals(invoice: CabInvoiceItem) {
  const net = invoice.items.reduce((s, it) => s + it.amount, 0)
  const tax = Math.round(net * (invoice.taxRate?.percentage ?? 0)) / 100
  return { net, tax, gross: net + tax }
}

function demoQr(invoice: CabInvoiceItem): string {
  const { tax, gross } = demoTotals(invoice)
  return tlvBase64([DEMO_CAB.legalName, demoVat(), `${isoDay(invoice.issuedDate)}T10:00:00`, money(gross), money(tax)])
}

/** Sequence of the demo invoice among issued ones → ICV. */
const demoIcv = (invoice: CabInvoiceItem) => Number(invoice.invoiceNumber.replace(/\D/g, '').slice(-4)) || 1

const escapeXml = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function sha256Base64(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
}

function demoXml(invoice: CabInvoiceItem, qr: string): string {
  const { net, tax, gross } = demoTotals(invoice)
  const cur = invoice.currency
  const pct = money(invoice.taxRate?.percentage ?? 0)
  const lines = invoice.items
    .map(
      (it, i) =>
        `<cac:InvoiceLine><cbc:ID>${i + 1}</cbc:ID><cbc:InvoicedQuantity unitCode="PCE">${it.qty.toFixed(6)}</cbc:InvoicedQuantity>` +
        `<cbc:LineExtensionAmount currencyID="${cur}">${money(it.amount)}</cbc:LineExtensionAmount>` +
        `<cac:Item><cbc:Name>${escapeXml(it.name)}</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>${pct}</cbc:Percent>` +
        `<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item>` +
        `<cac:Price><cbc:PriceAmount currencyID="${cur}">${money(it.unitPrice)}</cbc:PriceAmount></cac:Price></cac:InvoiceLine>`,
    )
    .join('')
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">' +
    `<cbc:ProfileID>reporting:1.0</cbc:ProfileID><cbc:ID>${escapeXml(invoice.invoiceNumber)}</cbc:ID><cbc:UUID>${invoice.id}</cbc:UUID>` +
    `<cbc:IssueDate>${isoDay(invoice.issuedDate)}</cbc:IssueDate><cbc:IssueTime>10:00:00</cbc:IssueTime>` +
    `<cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode><cbc:DocumentCurrencyCode>${cur}</cbc:DocumentCurrencyCode><cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>` +
    `<cac:AdditionalDocumentReference><cbc:ID>ICV</cbc:ID><cbc:UUID>${demoIcv(invoice)}</cbc:UUID></cac:AdditionalDocumentReference>` +
    `<cac:AdditionalDocumentReference><cbc:ID>PIH</cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${INITIAL_PIH}</cbc:EmbeddedDocumentBinaryObject></cac:Attachment></cac:AdditionalDocumentReference>` +
    `<cac:AdditionalDocumentReference><cbc:ID>QR</cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${qr}</cbc:EmbeddedDocumentBinaryObject></cac:Attachment></cac:AdditionalDocumentReference>` +
    `<cac:AccountingSupplierParty><cac:Party><cac:PostalAddress><cbc:CityName>${DEMO_CAB.city}</cbc:CityName><cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country></cac:PostalAddress>` +
    `<cac:PartyTaxScheme><cbc:CompanyID>${demoVat()}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme><cac:PartyLegalEntity><cbc:RegistrationName>${escapeXml(DEMO_CAB.legalName)}</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party></cac:AccountingSupplierParty>` +
    `<cac:AccountingCustomerParty><cac:Party><cac:PostalAddress><cbc:StreetName>${escapeXml(invoice.billingAddress.line1)}</cbc:StreetName><cbc:CityName>${escapeXml(invoice.billingAddress.cityArea)}</cbc:CityName><cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country></cac:PostalAddress>` +
    `<cac:PartyLegalEntity><cbc:RegistrationName>${escapeXml(invoice.billingAddress.name || invoice.clientName)}</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party></cac:AccountingCustomerParty>` +
    `<cac:TaxTotal><cbc:TaxAmount currencyID="${cur}">${money(tax)}</cbc:TaxAmount></cac:TaxTotal>` +
    `<cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="${cur}">${money(net)}</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="${cur}">${money(net)}</cbc:TaxExclusiveAmount>` +
    `<cbc:TaxInclusiveAmount currencyID="${cur}">${money(gross)}</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="${cur}">${money(gross)}</cbc:PayableAmount></cac:LegalMonetaryTotal>` +
    lines +
    '</Invoice>'
  )
}

async function demoInfo(invoice: CabInvoiceItem): Promise<InvoiceZatcaInfo> {
  const issued = invoice.status !== 'Draft'
  const forClient = isAuditClientSession()
  if (!issued) {
    return { required: true, status: 'PENDING', generated: false, kind: 'STANDARD', qrCode: null, submittedAt: null, ...(forClient ? {} : { xmlAvailable: false, submissionEnabled: true, environment: 'simulation', errors: [], warnings: [] }) }
  }
  const saved = demoStatuses()[invoice.id]
  const status: ZatcaStatus = saved?.status ?? (invoice.status === 'Paid' ? 'CLEARED' : 'PENDING')
  const qrCode = demoQr(invoice)
  const base: InvoiceZatcaInfo = {
    required: true,
    status,
    generated: true,
    kind: 'STANDARD',
    qrCode,
    submittedAt: status === 'PENDING' ? null : (saved?.submittedAt ?? new Date(`${isoDay(invoice.issuedDate)}T10:05:00Z`).toISOString()),
  }
  if (forClient) return base
  const xml = demoXml(invoice, qrCode)
  return {
    ...base,
    uuid: invoice.id,
    icv: demoIcv(invoice),
    invoiceHash: await sha256Base64(xml.replace(/<cac:AdditionalDocumentReference><cbc:ID>QR<\/cbc:ID>.*?<\/cac:AdditionalDocumentReference>/, '')),
    previousInvoiceHash: INITIAL_PIH,
    signed: status !== 'PENDING',
    xmlAvailable: true,
    submissionEnabled: true,
    environment: 'simulation',
    errors: [],
    warnings: [],
  }
}

// ── API ──────────────────────────────────────────────────────────────────────

/** ZATCA data of an invoice (CAB view, or the client's QR + status in the portal). */
export async function getInvoiceZatca(invoice: CabInvoiceItem): Promise<InvoiceZatcaInfo> {
  if (!isDemoMode()) {
    return isAuditClientSession()
      ? call<InvoiceZatcaInfo>(`/billing/cab-invoices/${encodeURIComponent(invoice.id)}/zatca`)
      : call<InvoiceZatcaInfo>(cabPath(invoice.id))
  }
  await new Promise((resolve) => setTimeout(resolve, 150))
  return demoInfo(invoice)
}

/** The UBL 2.1 XML of the e-invoice (the stamped XML once cleared). */
export async function getInvoiceZatcaXml(invoice: CabInvoiceItem): Promise<ZatcaXmlFile> {
  if (!isDemoMode()) return call<ZatcaXmlFile>(cabPath(invoice.id, '/xml'))
  if (invoice.status === 'Draft') throw new Error('ZATCA_XML_NOT_AVAILABLE')
  return { fileName: `${invoice.invoiceNumber}.xml`, contentType: 'application/xml', xml: demoXml(invoice, demoQr(invoice)) }
}

/** Generate (if missing), sign and report / clear the e-invoice now. */
export async function submitInvoiceZatca(invoice: CabInvoiceItem): Promise<InvoiceZatcaInfo> {
  if (!isDemoMode()) return call<InvoiceZatcaInfo>(cabPath(invoice.id, '/submit'), { method: 'POST' })
  await new Promise((resolve) => setTimeout(resolve, 600))
  if (invoice.status === 'Draft') throw new Error('INVOICE_NOT_ISSUED')
  const map = demoStatuses()
  map[invoice.id] = { status: 'CLEARED', submittedAt: new Date().toISOString() }
  saveState(DEMO_KEY, map)
  return demoInfo(invoice)
}

/** Save an XML file through the browser. */
export function saveXmlFile(file: ZatcaXmlFile): void {
  const url = URL.createObjectURL(new Blob([file.xml], { type: file.contentType || 'application/xml' }))
  const a = document.createElement('a')
  a.href = url
  a.download = file.fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

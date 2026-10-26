/**
 * Offers API.
 *
 * CAB register:  GET /cab/offers, GET /cab/offers/:id, POST /cab/offers,
 *                PATCH /cab/offers/:id/status, GET /cab/offers/applications,
 *                PATCH /cab/offers/:id (revise a hand-made offer → new revision in draft),
 *                POST /cab/offers/:id/approve (another CAB user than the preparer, or the admin),
 *                POST /cab/offers/:id/issue (notifies the client `offer_awaiting_acceptance`)
 * Client portal: GET /billing/offers, POST /billing/offers/:id/accept, POST /billing/offers/:id/reject
 *                (the CAB is notified: `offer_accepted` / `offer_rejected`)
 * The offer PDF is generated in the browser (lib/offers/offerPdf.ts).
 *
 * The register page is shared by CAB staff and the client portal (/portal/offers); the
 * signed-in session decides which endpoints are called. Offers raised from a quotation follow
 * it on the server (created → pending approval, issued → issued, accepted → history entry,
 * rejected → rejected, cancelled → void). In the preview (demo mode) offers live in the
 * shared demo store (lib/api/demo/records.ts).
 */

import { ApiError } from '@/lib/api/client'
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { APPLICATIONS, CLIENTS, standardLabel } from '@/lib/api/demo/dataset'
import { findApp, notify, offers, offerStatusLabel, quotations, saveOffers, scopeToSession, transitionQuotationRecord } from '@/lib/api/demo/records'
import { isAuditClientSession } from '@/lib/authStorage'
import { generateForAcceptedOffer } from '@/lib/api/demo/agreementsDemo'

export interface OfferFeeItem {
  id: string
  description: string
  amount: number
}

export type OfferStatus = 'draft' | 'pending_approval' | 'approved' | 'issued' | 'rejected' | 'void'

export interface OfferItem {
  id: string
  offerNumber: string
  clientName: string
  clientCode: string
  country: string
  primaryContact: string
  contactEmail: string
  relatedApplication: string
  applicationStandard: string
  applicationScope: string
  currency: string
  validUntil: string
  paymentTerms: string
  notes?: string
  fees: OfferFeeItem[]
  travelCosts: 'Included' | 'Excluded' | 'Reimbursed'
  optionalDiscount: number
  termsAttachmentName?: string
  approvalRoute: string
  status: OfferStatus
  statusLabel: string
  /** 1 for the first version; +1 on every revision (real API). */
  revision?: number
  /** Linked application / quotation (real API); a quotation offer is revised through its quotation. */
  applicationId?: string | null
  quotationId?: string | null
  issuedAt?: string | null
  acceptedAt?: string | null
  approvedAt?: string | null
  createdAt: string
  history?: Array<{
    action: string
    by: string
    date: string
  }>
}

export interface OfferFilterParams {
  searchQuery?: string
  startDate?: string
  endDate?: string
  country?: string
  status?: string
}

/** An application an offer can be prepared for, with the client details the create screen shows. */
export interface OfferApplicationOption {
  applicationId: string
  applicationNumber: string
  applicationStatus: string
  standard: string
  scope: string
  clientId: string
  clientName: string
  clientCode: string
  country: string
  primaryContact: string
  contactEmail: string
  /** Default currency of the client (demo data only). */
  currency?: string
}

export type CreateOfferInput = Omit<OfferItem, 'id' | 'offerNumber' | 'createdAt' | 'statusLabel'> & {
  /** Required by the API; client details are read from the application's organization. */
  applicationId?: string
}

const store = () => offers()

function offerQuery(params?: OfferFilterParams): string {
  const qs = new URLSearchParams()
  const add = (key: string, value?: string) => {
    if (value && value !== 'all') qs.set(key, value)
  }
  add('search', params?.searchQuery?.trim())
  add('country', params?.country)
  add('status', params?.status)
  add('startDate', params?.startDate)
  add('endDate', params?.endDate)
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export function getOffers(params?: OfferFilterParams): Promise<OfferItem[]> {
  if (!isDemoMode()) {
    const base = isAuditClientSession() ? '/billing/offers' : '/cab/offers'
    return authorizedRequest<OfferItem[]>(`${base}${offerQuery(params)}`)
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      let result = scopeToSession([...store()], (o) => o.clientName)
      // Like GET /billing/offers, clients never see offers the CAB has not sent yet.
      if (isAuditClientSession()) result = result.filter((o) => o.status !== 'draft' && o.status !== 'pending_approval')
      if (params?.searchQuery) {
        const q = params.searchQuery.toLowerCase().trim()
        result = result.filter(
          (o) =>
            o.offerNumber.toLowerCase().includes(q) ||
            o.clientName.toLowerCase().includes(q) ||
            o.relatedApplication.toLowerCase().includes(q) ||
            o.primaryContact.toLowerCase().includes(q)
        )
      }
      if (params?.country && params.country !== 'all') {
        result = result.filter((o) => o.country.toLowerCase() === params.country?.toLowerCase())
      }
      if (params?.status && params.status !== 'all') {
        result = result.filter((o) => o.status === params.status)
      }
      resolve(result)
    }, 200)
  })
}

export async function getOfferById(id: string): Promise<OfferItem | null> {
  if (!isDemoMode()) {
    if (isAuditClientSession()) {
      const list = await authorizedRequest<OfferItem[]>('/billing/offers')
      return list.find((o) => o.id === id || o.offerNumber.toLowerCase() === id.toLowerCase()) ?? null
    }
    try {
      return await authorizedRequest<OfferItem>(`/cab/offers/${encodeURIComponent(id)}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = store().find((o) => o.id === id || o.offerNumber.toLowerCase() === id.toLowerCase())
      resolve(found || null)
    }, 150)
  })
}

/** Applications an offer can be prepared for (create-offer screen). */
export function getOfferApplicationOptions(): Promise<OfferApplicationOption[]> {
  if (!isDemoMode()) return authorizedRequest<OfferApplicationOption[]>('/cab/offers/applications')
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        APPLICATIONS.filter((a) => a.status !== 'DRAFT' && a.status !== 'REJECTED').map((a) => {
          const c = CLIENTS.find((x) => x.id === a.clientId)!
          const pc = c.contacts.find((x) => x.isPrimary) ?? c.contacts[0]
          return {
            applicationId: a.id,
            applicationNumber: a.orderNumber,
            applicationStatus: a.status,
            standard: standardLabel(a.standard),
            scope: a.scope,
            clientId: c.id,
            clientName: c.name,
            clientCode: c.code,
            country: c.country,
            primaryContact: `${pc.firstName} ${pc.lastName}`,
            contactEmail: pc.email,
            currency: c.currency,
          }
        })
      )
    }, 120)
  })
}

export function createOffer(data: CreateOfferInput): Promise<OfferItem> {
  if (!isDemoMode()) {
    if (!data.applicationId) return Promise.reject(new Error('APPLICATION_REQUIRED'))
    return authorizedRequest<OfferItem>('/cab/offers', {
      method: 'POST',
      body: JSON.stringify({
        applicationId: data.applicationId,
        currency: data.currency,
        validUntil: data.validUntil,
        paymentTerms: data.paymentTerms,
        notes: data.notes ?? '',
        fees: data.fees.map((f) => ({ id: f.id, description: f.description, amount: Number(f.amount) || 0 })),
        travelCosts: data.travelCosts,
        optionalDiscount: data.optionalDiscount,
        termsAttachmentName: data.termsAttachmentName ?? '',
        approvalRoute: data.approvalRoute,
        status: data.status === 'pending_approval' ? 'pending_approval' : 'draft',
      }),
    })
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      const nextNum = data.relatedApplication && !store().some((o) => o.relatedApplication === data.relatedApplication)
        ? `OF-${data.relatedApplication.replace(/^APP-/, '')}`
        : `OF-${String(Date.now()).slice(-4)}`
      const offerData = { ...data }
      delete offerData.applicationId
      const newOffer: OfferItem = {
        ...offerData,
        id: nextNum.toLowerCase(),
        offerNumber: nextNum,
        createdAt: new Date().toISOString().split('T')[0],
        statusLabel: offerStatusLabel(data.status),
        history: [{ action: 'Created', by: 'CAB Admin', date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }],
      }
      store().unshift(newOffer)
      saveOffers()
      resolve(newOffer)
    }, 250)
  })
}

export async function updateOfferStatus(id: string, newStatus: OfferStatus): Promise<boolean> {
  if (!isDemoMode()) {
    try {
      await authorizedRequest<OfferItem>(`/cab/offers/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      return true
    } catch (err) {
      // Not found, or a transition the offer does not allow (e.g. voiding an accepted offer).
      if (err instanceof ApiError && (err.status === 404 || err.status === 409)) return false
      throw err
    }
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      const list = store()
      const index = list.findIndex((o) => o.id === id || o.offerNumber === id)
      if (index !== -1) {
        list[index].status = newStatus
        list[index].statusLabel = offerStatusLabel(newStatus)
        list[index].history = [
          ...(list[index].history ?? []),
          { action: offerStatusLabel(newStatus), by: 'CAB Admin', date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
        ]
        saveOffers()
        resolve(true)
      } else {
        resolve(false)
      }
    }, 200)
  })
}

/** Demo: answer an offer the way the server does — through its quotation when there is one. */
function respondDemo(id: string, action: 'accept' | 'reject'): OfferItem {
  const offer = store().find((o) => o.id === id || o.offerNumber === id)
  if (!offer || offer.status !== 'issued') throw new Error('OFFER_NOT_AWAITING_RESPONSE')
  const app = findApp(offer.relatedApplication)
  const quotation = app ? quotations().find((q) => q.applicationId === app.id && q.status === 'ISSUED') : undefined
  if (quotation) {
    transitionQuotationRecord(quotation.id, action)
  } else {
    if (action === 'reject') {
      offer.status = 'rejected'
      offer.statusLabel = offerStatusLabel('rejected')
    }
    offer.history = [
      ...(offer.history ?? []),
      { action: action === 'accept' ? 'Accepted by client' : 'Rejected by client', by: offer.primaryContact, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
    ]
    saveOffers()
  }
  return store().find((o) => o.offerNumber === offer.offerNumber) ?? offer
}

/** Client portal: accept an issued offer (the quotation is accepted and the advance invoice raised). */
export async function acceptOffer(id: string, note?: string): Promise<OfferItem> {
  if (!isDemoMode()) {
    return authorizedRequest<OfferItem>(`/billing/offers/${encodeURIComponent(id)}/accept`, {
      method: 'POST',
      body: JSON.stringify(note ? { note } : {}),
    })
  }
  const offer = respondDemo(id, 'accept')
  notifyCabOfOfferAnswer(offer, 'accept')
  // Like the server: the accepted offer drafts the certification agreement for the CAB to send.
  generateForAcceptedOffer(offer)
  return offer
}

/** Client portal: reject an issued offer. */
export async function rejectOffer(id: string, note?: string): Promise<OfferItem> {
  if (!isDemoMode()) {
    return authorizedRequest<OfferItem>(`/billing/offers/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: JSON.stringify(note ? { note } : {}),
    })
  }
  const offer = respondDemo(id, 'reject')
  notifyCabOfOfferAnswer(offer, 'reject')
  return offer
}

/* ───────────── Revise / approve / issue (CAB) ───────────── */

/** Terms a revision may change (the application and client stay). */
export type ReviseOfferInput = Pick<
  OfferItem,
  'currency' | 'validUntil' | 'paymentTerms' | 'notes' | 'fees' | 'travelCosts' | 'optionalDiscount' | 'termsAttachmentName' | 'approvalRoute'
> & { status: 'draft' | 'pending_approval' }

const todayLabel = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

function demoOffer(id: string): OfferItem {
  const offer = store().find((o) => o.id === id || o.offerNumber === id)
  if (!offer) throw new Error('Offer not found.')
  return offer
}

function demoClientId(offer: OfferItem): string | undefined {
  return CLIENTS.find((c) => c.name === offer.clientName || c.code === offer.clientCode)?.id
}

/** True when the offer mirrors a quotation (it is revised and approved through the quotation). */
export function isQuotationOffer(offer: OfferItem): boolean {
  if (offer.quotationId !== undefined) return Boolean(offer.quotationId)
  return offer.approvalRoute === 'Commercial Approval'
}

/** Revise a hand-made offer: new revision, back to draft (or pending approval). */
export async function reviseOffer(id: string, input: ReviseOfferInput): Promise<OfferItem> {
  if (!isDemoMode()) {
    return authorizedRequest<OfferItem>(`/cab/offers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        currency: input.currency,
        validUntil: input.validUntil,
        paymentTerms: input.paymentTerms,
        notes: input.notes ?? '',
        fees: input.fees.map((f) => ({ id: f.id, description: f.description, amount: Number(f.amount) || 0 })),
        travelCosts: input.travelCosts,
        optionalDiscount: input.optionalDiscount,
        termsAttachmentName: input.termsAttachmentName ?? '',
        approvalRoute: input.approvalRoute,
        status: input.status,
      }),
    })
  }
  await new Promise((resolve) => setTimeout(resolve, 200))
  const offer = demoOffer(id)
  if (offer.acceptedAt || offer.status === 'void') throw new Error('OFFER_NOT_REVISABLE: accepted or void offers cannot be revised.')
  const revision = (offer.revision ?? 1) + 1
  Object.assign(offer, {
    ...input,
    revision,
    statusLabel: offerStatusLabel(input.status),
    issuedAt: null,
    approvedAt: null,
    history: [
      ...(offer.history ?? []),
      { action: `Revised (rev ${revision})`, by: 'CAB Admin', date: todayLabel() },
      ...(input.status === 'pending_approval' ? [{ action: offerStatusLabel('pending_approval'), by: 'CAB Admin', date: todayLabel() }] : []),
    ],
  })
  saveOffers()
  return { ...offer }
}

async function demoTransition(id: string, to: OfferStatus, allowedFrom: OfferStatus[]): Promise<OfferItem> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  const offer = demoOffer(id)
  if (!allowedFrom.includes(offer.status)) throw new Error(`OFFER_INVALID_TRANSITION: ${offer.status} → ${to}`)
  offer.status = to
  offer.statusLabel = offerStatusLabel(to)
  if (to === 'approved') offer.approvedAt = new Date().toISOString()
  if (to === 'issued') offer.issuedAt = new Date().toISOString()
  offer.history = [...(offer.history ?? []), { action: to === 'issued' ? 'Issued to client' : offerStatusLabel(to), by: 'CAB Admin', date: todayLabel() }]
  saveOffers()
  if (to === 'issued') notify('client', 'offer_awaiting_acceptance', { ref: offer.offerNumber }, '/portal/offers', demoClientId(offer))
  return { ...offer }
}

/** Send a draft offer for internal approval. */
export async function submitOfferForApproval(id: string): Promise<OfferItem> {
  if (!isDemoMode()) {
    return authorizedRequest<OfferItem>(`/cab/offers/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'pending_approval' }),
    })
  }
  return demoTransition(id, 'pending_approval', ['draft'])
}

/** Internal approval (403 APPROVAL_SEPARATION when the preparer approves their own offer). */
export async function approveOffer(id: string): Promise<OfferItem> {
  if (!isDemoMode()) return authorizedRequest<OfferItem>(`/cab/offers/${encodeURIComponent(id)}/approve`, { method: 'POST' })
  return demoTransition(id, 'approved', ['pending_approval'])
}

/** Issue an approved offer to the client. */
export async function issueOffer(id: string): Promise<OfferItem> {
  if (!isDemoMode()) return authorizedRequest<OfferItem>(`/cab/offers/${encodeURIComponent(id)}/issue`, { method: 'POST' })
  const offer = demoOffer(id)
  const app = findApp(offer.relatedApplication)
  const quotation = app ? quotations().find((q) => q.applicationId === app.id && (q.status === 'CREATED' || q.status === 'DRAFT')) : undefined
  if (quotation && offer.status === 'approved') {
    // A quotation offer is issued through its quotation, like on the server.
    transitionQuotationRecord(quotation.id, 'issue')
    return { ...demoOffer(offer.offerNumber) }
  }
  return demoTransition(id, 'issued', ['approved'])
}

/** The CAB is told when the client answers an offer (demo; the server does it itself). */
export function notifyCabOfOfferAnswer(offer: OfferItem, action: 'accept' | 'reject'): void {
  if (!isDemoMode()) return
  notify(
    'cab',
    action === 'accept' ? 'offer_accepted' : 'offer_rejected',
    { ref: offer.offerNumber, client: offer.clientName },
    `/cab/offers?offer=${encodeURIComponent(offer.offerNumber)}`
  )
}


/**
 * Application receipt view — GET /cab/certification-applications/:id/receipt → CabApplicationReceipt.
 * Acknowledgement e-mail: GET  /cab/certification-applications/:id/receipt/acknowledgements
 *                         POST /cab/certification-applications/:id/receipt/acknowledgement (re-send, logged)
 * The receipt PDF is generated in the browser (lib/pdf/receiptPdf.ts).
 *
 * `:id` is the application id or its order number; the server builds the view from the
 * submitted application, its client, status history and information requests (CAB in the JWT).
 * In the preview (demo mode), and when no application is selected (the guided tour), the
 * receipt is built from the shared demo dataset.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode, loadState, saveState } from '@/lib/api/demo/demoStore'
import { CLIENTS } from '@/lib/api/demo/dataset'
import { notSet } from '@/lib/emptyValue'

export type WorkflowStepStatus = 'completed' | 'inProgress' | 'pending'

export interface CabApplicationReceipt {
  applicationId: string
  status: 'received'
  clientName: string
  applicationType: string
  certificationBody: string
  receivedBy: string
  receivedByInitials: string
  receivedOnDate: string
  receivedOnTime: string
  receivedOn: string
  primaryStandards: string[]
  requestedCertificationDate: string
  accreditationBody: string
  numberOfSites: number
  auditLanguage: string
  applicationDate: string
  applicationReceivedDate: string
  referenceNo: string
  client: {
    name: string
    logoUrl?: string
    clientId: string
    organizationType: string
    country: string
    countryCode: string
    legalEntityName: string
    registrationLicenseNo: string
    industry: string
  }
  scopeSummary: string
  nextSteps: Array<{
    key: string
    status: WorkflowStepStatus
  }>
  workflowSteps: Array<{
    key: string
    status: WorkflowStepStatus
  }>
  documents: {
    total: number
    uploaded: number
    pending: number
    rejected: number
  }
  confirmationEmails: string[]
}

const MOCK_RECEIPT: CabApplicationReceipt = {
  applicationId: 'APP-0149',
  status: 'received',
  clientName: 'Al Noor Food Industries',
  applicationType: 'Initial Certification',
  certificationBody: 'CASCO',
  receivedBy: 'Ahmed Saeed',
  receivedByInitials: 'AS',
  receivedOnDate: '20 Oct 2026',
  receivedOnTime: '10:12',
  receivedOn: '20 Oct 2026, 10:12',
  primaryStandards: ['ISO 9001:2015'],
  requestedCertificationDate: '15 Feb 2027',
  accreditationBody: 'SAAC',
  numberOfSites: 2,
  auditLanguage: 'English',
  applicationDate: '20 Oct 2026',
  applicationReceivedDate: '20 Oct 2026 10:12',
  referenceNo: 'RCPT/2026/10/000149',
  client: {
    name: 'Al Noor Food Industries',
    clientId: 'C1A00001',
    organizationType: 'Limited Liability Company',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    legalEntityName: 'Al Noor Food Industries',
    registrationLicenseNo: '4030219874',
    industry: 'Food Manufacturing',
  },
  scopeSummary:
    'Production and distribution of dairy desserts, juices and bakery products.',
  nextSteps: [
    { key: 'applicationReview', status: 'inProgress' },
    { key: 'informationRequired', status: 'pending' },
    { key: 'technicalFeasibility', status: 'pending' },
    { key: 'proceedToQuotation', status: 'pending' },
  ],
  workflowSteps: [
    { key: 'application', status: 'completed' },
    { key: 'applicationReview', status: 'pending' },
    { key: 'quotation', status: 'pending' },
    { key: 'applicationReceipt', status: 'inProgress' },
    { key: 'quotationApproval', status: 'pending' },
    { key: 'payment', status: 'pending' },
    { key: 'invoicing', status: 'pending' },
    { key: 'contracting', status: 'pending' },
    { key: 'auditPlanning', status: 'pending' },
    { key: 'auditExecution', status: 'pending' },
    { key: 'reporting', status: 'pending' },
    { key: 'surveillance', status: 'pending' },
  ],
  documents: {
    total: 4,
    uploaded: 4,
    pending: 0,
    rejected: 0,
  },
  confirmationEmails: ['sara.ali@alnoor-foods.example'],
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getCabApplicationReceipt(
  applicationId?: string,
  clientId?: string,
): Promise<CabApplicationReceipt> {
  if (!isDemoMode() && applicationId) {
    return authorizedRequest<CabApplicationReceipt>(
      `/cab/certification-applications/${encodeURIComponent(applicationId)}/receipt`,
    )
  }
  const { loadCabApplicationOverlay } = await import(
    '@/lib/api/cabCertificationApplicationApi'
  )
  const overlay = await loadCabApplicationOverlay(applicationId, clientId)
  if (!overlay) {
    await delay()
    return MOCK_RECEIPT
  }

  const { application, standards, submittedDate, clientName, clientId: resolvedClientId } = overlay
  const known = CLIENTS.find((c) => c.id === resolvedClientId)
  const uploaded = application.documents?.length ?? 0
  const displayName = clientName || MOCK_RECEIPT.clientName

  return {
    ...MOCK_RECEIPT,
    applicationId: application.orderNumber || application.id,
    clientName: displayName,
    applicationType: application.legalInfo?.requestType === 'RENEWAL' ? 'Renewal' : 'Initial Certification',
    receivedOnDate: submittedDate.toLocaleDateString(),
    receivedOnTime: submittedDate.toLocaleTimeString(),
    receivedOn: submittedDate.toLocaleString(),
    primaryStandards: standards.length > 0 ? standards : MOCK_RECEIPT.primaryStandards,
    numberOfSites: Math.max(1, application.branches?.length ?? 1),
    auditLanguage: application.consultantInfo?.systemLanguage === 'AR' ? 'Arabic' : 'English',
    applicationDate: submittedDate.toLocaleDateString(),
    applicationReceivedDate: submittedDate.toLocaleString(),
    referenceNo: `RCPT/${submittedDate.getFullYear()}/${String(submittedDate.getMonth() + 1).padStart(2, '0')}/${(application.orderNumber || application.id).replace(/\D/g, '').padStart(6, '0')}`,
    accreditationBody: known?.countryCode === 'EG' ? 'EGAC' : 'SAAC',
    client: {
      ...MOCK_RECEIPT.client,
      organizationType: known?.legalCapacity ?? MOCK_RECEIPT.client.organizationType,
      name: displayName,
      clientId: resolvedClientId.slice(0, 8).toUpperCase() || MOCK_RECEIPT.client.clientId,
      country: known?.country || application.legalInfo?.country || MOCK_RECEIPT.client.country,
      countryCode: application.legalInfo?.country || MOCK_RECEIPT.client.countryCode,
      legalEntityName: displayName,
      registrationLicenseNo: application.legalInfo?.commercialRegisterNumber || notSet(),
      industry: application.legalInfo?.mainActivity || MOCK_RECEIPT.client.industry,
    },
    scopeSummary:
      application.declarationInfo?.certificateScopeEn ||
      application.legalInfo?.mainActivity ||
      MOCK_RECEIPT.scopeSummary,
    documents: {
      total: Math.max(uploaded, 1),
      uploaded,
      pending: 0,
      rejected: 0,
    },
    confirmationEmails: [application.legalInfo?.email].filter(Boolean) as string[],
  }
}

/* ───────────── Acknowledgement e-mail ───────────── */

export interface ApplicationAcknowledgement {
  id: string
  sentAt: string
  sentBy: string
  recipients: string[]
}

const ackPath = (applicationId: string) => `/cab/certification-applications/${encodeURIComponent(applicationId)}/receipt`
const DEMO_ACK_KEY = 'receiptAcknowledgements'
const demoAcks = () => loadState<Record<string, ApplicationAcknowledgement[]>>(DEMO_ACK_KEY, () => ({}))

/** Acknowledgement e-mails sent for the application, newest first. */
export async function listAcknowledgements(applicationId: string): Promise<ApplicationAcknowledgement[]> {
  if (!isDemoMode()) return authorizedRequest<ApplicationAcknowledgement[]>(`${ackPath(applicationId)}/acknowledgements`)
  await delay(120)
  return demoAcks()[applicationId] ?? []
}

/** Re-sends the acknowledgement e-mail to the client's confirmation addresses. */
export async function resendAcknowledgement(applicationId: string, recipients: string[]): Promise<ApplicationAcknowledgement> {
  if (!isDemoMode()) return authorizedRequest<ApplicationAcknowledgement>(`${ackPath(applicationId)}/acknowledgement`, { method: 'POST' })
  await delay(200)
  if (!recipients.length) throw new Error('The client has no e-mail address on file.')
  const entry: ApplicationAcknowledgement = { id: `ack-${Date.now()}`, sentAt: new Date().toISOString(), sentBy: 'CAB Admin', recipients }
  const state = demoAcks()
  state[applicationId] = [entry, ...(state[applicationId] ?? [])]
  saveState(DEMO_ACK_KEY, state)
  return entry
}


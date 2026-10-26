/**
 * Client portal profile (portal home, company profile, staff banner).
 * Real endpoints: GET /portal/profile, PATCH /portal/profile (company essentials + address),
 * POST /portal/profile/sites { name, address }, PATCH/DELETE /portal/profile/sites/:id,
 * PATCH/DELETE /portal/profile/contacts/:id, POST /portal/profile/documents and
 * PUT/DELETE /portal/profile/documents/:id (multipart `file`); all return ClientProfile with ISO dates, which
 * are formatted here for display. The last profile is cached so pages paint instantly.
 * In the preview (demo mode) the profile is assembled from the shared demo store.
 */
import { ApiError } from '@/lib/api/client'
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { getAuthSession } from '@/lib/authStorage'
import { PORTAL_CLIENT_ID, STANDARDS, fmtDate, person, primaryContact } from '@/lib/api/demo/dataset'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { appsOfClient, auditPlans, certificates, clientRecord, informationRequired, notificationStore, sessionClientId } from '@/lib/api/demo/records'
import { notSet } from '@/lib/emptyValue'

export interface ClientProfile {
  id: string
  clientCode: string
  name: string
  legalName: string
  tradingName: string
  country: string
  industrySector: string
  registrationNumber: string
  /** VAT registration number ('' when none) — buyer VAT on ZATCA tax invoices. */
  vatNumber?: string
  website: string
  status: 'Active client' | 'Pending' | 'Suspended'
  logoUrl?: string

  // Address
  address: {
    country: string
    building: string
    city: string
    postalCode: string
    street: string
    additionalLine: string
  }

  // Related data
  primaryContact: {
    name: string
    role: string
    email: string
    phone: string
  }

  hasPendingLegalChange: boolean
  pendingChanges: Array<{
    id: string
    field: string
    currentValue: string
    requestedValue: string
    submittedAt: string
    status: 'Under review' | 'Approved' | 'Rejected'
  }>

  sites: Array<{
    id: string
    name: string
    address: string
    status: 'Active' | 'Inactive'
  }>

  contacts: Array<{
    id: string
    name: string
    role: string
    email: string
    phone: string
    isPrimary: boolean
    hasPortalAccess: boolean
    isSignatory: boolean
  }>

  documents: Array<{
    id: string
    name: string
    type: 'Legal' | 'General' | 'Policy' | 'Technical'
    lastUpdated: string
    fileSize?: string
    /** Download link of the stored file (a data URL for files added in the preview). */
    fileUrl?: string
    mimeType?: string
  }>

  activeApplication?: {
    id: string
    scheme: string
    status: 'Draft' | 'Submitted' | 'In Review' | 'Approved'
    lastUpdated: string
    submittedDate?: string
  }

  clarification?: {
    required: boolean
    applicationId: string
    message: string
    dueDate: string
  }

  upcomingAudit?: {
    stage: string
    date: string
    location: string
  }

  documentsSummary: {
    uploadedByYou: number
    requestedByUs: number
    sharedWithYou: number
  }

  recentActivity: Array<{
    id: string
    date: string
    details: string
    relatedTo: string
    type: 'edit' | 'alert' | 'upload' | 'create'
  }>

  cabContacts: Array<{
    id: string
    name: string
    role: string
    email: string
    phone: string
    initials: string
  }>
}

/**
 * The portal client's profile, assembled from the shared demo store so the
 * home page shows the same applications, audits and contacts the CAB sees
 * (lib/api/demo/records.ts).
 */
function buildPortalProfile(): ClientProfile {
  const c = clientRecord(sessionClientId() ?? PORTAL_CLIENT_ID)
  const pc = primaryContact(c)
  const clientApps = appsOfClient(c.id).sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
  const active = clientApps.find((a) => a.stage !== 'certified' && a.status !== 'REJECTED') ?? clientApps[0]
  const openIr = active ? informationRequired(active.id).find((i) => i.status === 'PENDING') : undefined
  const nextAudit = auditPlans()
    .filter((p) => p.clientCode === c.code && new Date(p.proposedStartDate).getTime() > Date.now())
    .sort((a, b) => a.proposedStartDate.localeCompare(b.proposedStartDate))[0]
  const appStatus = (status?: string): NonNullable<ClientProfile['activeApplication']>['status'] =>
    status === 'DRAFT' ? 'Draft' : status === 'SUBMITTED' ? 'Submitted' : status === 'UNDER_REVIEW' ? 'In Review' : 'Approved'
  const cab = [person('emp-0006'), person(c.industry.includes('Food') ? 'emp-0002' : 'emp-0001')]
  const feed = notificationStore().client.filter((n) => !n.clientId || n.clientId === c.id)

  return {
    id: c.code,
    clientCode: c.code,
    name: c.name,
    legalName: c.name,
    tradingName: c.tradeName,
    country: c.country,
    industrySector: c.industry,
    registrationNumber: c.crNumber,
    website: c.website,
    status: 'Active client',
    address: {
      country: c.country,
      building: c.address.split(',')[0],
      city: c.city,
      postalCode: c.address.match(/\d{5}/)?.[0] ?? '',
      street: c.address.split(',')[1]?.trim() ?? '',
      additionalLine: '',
    },
    primaryContact: { name: `${pc.firstName} ${pc.lastName}`, role: pc.role, email: pc.email, phone: `${pc.phonePrefix} ${pc.phone}` },
    hasPendingLegalChange: false,
    pendingChanges: [],
    sites: c.sites.map((site) => ({ id: site.id, name: site.name, address: `${site.address}, ${c.country}`, status: 'Active' as const })),
    contacts: c.contacts.map((x) => ({ id: x.id, name: `${x.firstName} ${x.lastName}`, role: x.role, email: x.email, phone: `${x.phonePrefix} ${x.phone}`, isPrimary: x.isPrimary, hasPortalAccess: x.portalAccess, isSignatory: x.isSignatory })),
    documents: [
      { id: `DOC-${c.code}-1`, name: 'Commercial Registration', type: 'Legal', lastUpdated: fmtDate(c.createdAt) },
      { id: `DOC-${c.code}-2`, name: 'Organization Chart', type: 'General', lastUpdated: fmtDate(c.createdAt) },
      { id: `DOC-${c.code}-3`, name: `${STANDARDS[active?.standard ?? 'ISO 9001'].name} Policy`, type: 'Policy', lastUpdated: fmtDate(active?.submittedAt ?? c.createdAt) },
    ],
    activeApplication: active ? { id: active.orderNumber, scheme: `${STANDARDS[active.standard].name} (${active.standard})`, status: appStatus(active.status), lastUpdated: fmtDate(active.updatedAt), submittedDate: active.submittedAt ? fmtDate(active.submittedAt) : undefined } : undefined,
    clarification: openIr && active ? { required: true, applicationId: active.orderNumber, message: openIr.informationItem, dueDate: fmtDate(openIr.dueDate) } : undefined,
    upcomingAudit: nextAudit ? { stage: `${nextAudit.stage} Audit`, date: fmtDate(nextAudit.proposedStartDate), location: `${nextAudit.siteName}, ${c.city}` } : undefined,
    documentsSummary: {
      uploadedByYou: clientApps.reduce((sum, a) => sum + (a.documents?.length ?? 0), 0),
      requestedByUs: clientApps.reduce((sum, a) => sum + informationRequired(a.id).filter((i) => i.status === 'PENDING').length, 0),
      sharedWithYou: certificates().filter((x) => x.clientId === c.code && x.status === 'ISSUED').length + 2,
    },
    recentActivity: feed.slice(0, 5).map((n, i) => ({
      id: `ACT-${i + 1}`,
      date: fmtDate(n.createdAt),
      details: n.type.replace(/_/g, ' ').replace(/^\w/, (m) => m.toUpperCase()),
      relatedTo: n.params.ref ?? notSet(),
      type: n.type.includes('requested') || n.type.includes('due') ? 'alert' : n.type.includes('issued') ? 'create' : 'edit',
    })),
    cabContacts: cab.map((p) => ({ id: p.id, name: p.name, role: p.jobRole === 'APPLICATIONS_RECEIVER' ? 'Client Manager' : 'Technical Manager', email: p.email, phone: p.phone, initials: p.initials })),
  }
}

export const INITIAL_PORTAL_CLIENT: ClientProfile = buildPortalProfile()

const STORAGE_KEY = 'icasco_portal_client_profile'

/** Real mode keeps one cached profile per organization so a new sign-in never sees another client's data. */
function storageKey(): string {
  if (isDemoMode()) return STORAGE_KEY
  const session = getAuthSession()
  return `${STORAGE_KEY}_${session?.organization?.id ?? session?.user?.id ?? 'anonymous'}`
}

/** Blank profile shown before the first real response arrives (never demo data). */
const EMPTY_PROFILE: ClientProfile = {
  id: '',
  clientCode: '',
  name: '',
  legalName: '',
  tradingName: '',
  country: '',
  industrySector: '',
  registrationNumber: '',
  website: '',
  status: 'Active client',
  address: { country: '', building: '', city: '', postalCode: '', street: '', additionalLine: '' },
  primaryContact: { name: '', role: '', email: '', phone: '' },
  hasPendingLegalChange: false,
  pendingChanges: [],
  sites: [],
  contacts: [],
  documents: [],
  documentsSummary: { uploadedByYou: 0, requestedByUs: 0, sharedWithYou: 0 },
  recentActivity: [],
  cabContacts: [],
}

/** The API sends ISO dates; the pages show them as "24 Oct 2026". */
function formatForDisplay(p: ClientProfile): ClientProfile {
  const day = (value?: string) => (value ? fmtDate(value) : notSet())
  return {
    ...p,
    documents: p.documents.map((d) => ({ ...d, lastUpdated: day(d.lastUpdated) })),
    activeApplication: p.activeApplication
      ? { ...p.activeApplication, lastUpdated: day(p.activeApplication.lastUpdated), submittedDate: p.activeApplication.submittedDate ? day(p.activeApplication.submittedDate) : undefined }
      : undefined,
    clarification: p.clarification ? { ...p.clarification, dueDate: day(p.clarification.dueDate) } : undefined,
    upcomingAudit: p.upcomingAudit ? { ...p.upcomingAudit, date: day(p.upcomingAudit.date) } : undefined,
    recentActivity: p.recentActivity.map((a) => ({ ...a, date: day(a.date) })),
  }
}

/** Latest profile: the real API, or the demo store in the preview. Also refreshes the cache. */
export async function getPortalProfile(): Promise<ClientProfile> {
  if (!isDemoMode()) {
    const profile = formatForDisplay(await authorizedRequest<ClientProfile>('/portal/profile'))
    saveStoredPortalProfile(profile)
    return profile
  }
  return getStoredPortalProfile()
}

/** Fields of the company profile form that the API saves. */
export type PortalProfileUpdate = Pick<ClientProfile, 'legalName' | 'tradingName' | 'country' | 'industrySector' | 'registrationNumber' | 'vatNumber' | 'website' | 'address'>

export async function updatePortalProfile(current: ClientProfile, patch: PortalProfileUpdate): Promise<ClientProfile> {
  if (!isDemoMode()) {
    const profile = formatForDisplay(await authorizedRequest<ClientProfile>('/portal/profile', { method: 'PATCH', body: JSON.stringify(patch) }))
    saveStoredPortalProfile(profile)
    return profile
  }
  const updated = { ...current, ...patch }
  saveStoredPortalProfile(updated)
  return updated
}

export async function addPortalSite(current: ClientProfile, site: { name: string; address: string }): Promise<ClientProfile> {
  if (!isDemoMode()) {
    const profile = formatForDisplay(await authorizedRequest<ClientProfile>('/portal/profile/sites', { method: 'POST', body: JSON.stringify(site) }))
    saveStoredPortalProfile(profile)
    return profile
  }
  const id = `SITE-00${current.sites.length + 1}`
  const updated = { ...current, sites: [...current.sites, { id, name: site.name, address: site.address, status: 'Active' as const }] }
  saveStoredPortalProfile(updated)
  return updated
}

/** Server error codes the company profile page translates ("SITE_IN_USE: …" → Error('SITE_IN_USE')). */
const PROFILE_ERROR_CODES = ['SITE_IN_USE', 'CONTACT_IS_OWNER', 'CONTACT_IS_SELF', 'FILE_REQUIRED'] as const
export type PortalProfileErrorCode = (typeof PROFILE_ERROR_CODES)[number]

async function profileCall(path: string, init: RequestInit): Promise<ClientProfile> {
  try {
    const profile = formatForDisplay(await authorizedRequest<ClientProfile>(path, init))
    saveStoredPortalProfile(profile)
    return profile
  } catch (err) {
    if (err instanceof ApiError) {
      const code = PROFILE_ERROR_CODES.find((c) => err.message.startsWith(c))
      if (code) throw new Error(code, { cause: err })
    }
    throw err
  }
}

/** Preview: apply a change to the stored profile. */
function demoUpdate(current: ClientProfile, patch: Partial<ClientProfile>): ClientProfile {
  const updated = { ...current, ...patch }
  saveStoredPortalProfile(updated)
  return updated
}

const sitePath = (id: string) => `/portal/profile/sites/${encodeURIComponent(id)}`
const contactPath = (id: string) => `/portal/profile/contacts/${encodeURIComponent(id)}`
const documentPath = (id: string) => `/portal/profile/documents/${encodeURIComponent(id)}`

export type PortalSitePatch = Partial<{ name: string; address: string; status: 'Active' | 'Inactive' }>

export async function updatePortalSite(current: ClientProfile, siteId: string, patch: PortalSitePatch): Promise<ClientProfile> {
  if (!isDemoMode()) return profileCall(sitePath(siteId), { method: 'PATCH', body: JSON.stringify(patch) })
  return demoUpdate(current, { sites: current.sites.map((s) => (s.id === siteId ? { ...s, ...patch } : s)) })
}

/** Rejects with Error('SITE_IN_USE') when an application covers the site (set it Inactive instead). */
export async function deletePortalSite(current: ClientProfile, siteId: string): Promise<ClientProfile> {
  if (!isDemoMode()) return profileCall(sitePath(siteId), { method: 'DELETE' })
  return demoUpdate(current, { sites: current.sites.filter((s) => s.id !== siteId) })
}

export type PortalContactPatch = Partial<{ name: string; role: string; phone: string }>

/** Name, business role and phone; the e-mail is the person's sign-in and stays as it is. */
export async function updatePortalContact(current: ClientProfile, contactId: string, patch: PortalContactPatch): Promise<ClientProfile> {
  if (!isDemoMode()) return profileCall(contactPath(contactId), { method: 'PATCH', body: JSON.stringify(patch) })
  return demoUpdate(current, { contacts: current.contacts.map((c) => (c.id === contactId ? { ...c, ...patch } : c)) })
}

/** Removes the person's access. Rejects with CONTACT_IS_OWNER / CONTACT_IS_SELF. */
export async function removePortalContact(current: ClientProfile, contactId: string): Promise<ClientProfile> {
  if (!isDemoMode()) return profileCall(contactPath(contactId), { method: 'DELETE' })
  const contact = current.contacts.find((c) => c.id === contactId)
  if (contact?.isPrimary) throw new Error('CONTACT_IS_OWNER')
  return demoUpdate(current, { contacts: current.contacts.filter((c) => c.id !== contactId) })
}

/** Document types the server stores; Legal ones show as "Legal" in the list. */
export const PORTAL_DOCUMENT_TYPES = ['COMMERCIAL_REGISTER', 'ACTIVITY_LICENSE', 'TAX_CARD', 'NATIONAL_ADDRESS_CERTIFICATE', 'OTHER'] as const
export type PortalDocumentType = (typeof PORTAL_DOCUMENT_TYPES)[number]
/** Same rules as the server: PDF, PNG or JPEG up to 10 MB (2 MB in the preview, which keeps the file in the browser). */
export const PORTAL_DOCUMENT_MIMES = ['application/pdf', 'image/png', 'image/jpeg']
export const portalDocumentMaxBytes = () => (isDemoMode() ? 2 : 10) * 1024 * 1024

const sizeLabel = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('FILE_READ_FAILED'))
    reader.readAsDataURL(file)
  })

const withExtension = (name: string, file: File) => {
  const ext = /\.[A-Za-z0-9]{1,8}$/.exec(file.name)?.[0] ?? ''
  return ext && !name.toLowerCase().endsWith(ext.toLowerCase()) ? `${name}${ext}` : name
}

export async function uploadPortalDocument(
  current: ClientProfile,
  input: { file: File; documentType: PortalDocumentType; name?: string },
): Promise<ClientProfile> {
  if (!isDemoMode()) {
    const form = new FormData()
    form.append('file', input.file)
    form.append('documentType', input.documentType)
    if (input.name?.trim()) form.append('name', input.name.trim())
    return profileCall('/portal/profile/documents', { method: 'POST', body: form })
  }
  const doc = {
    id: `DOC-${Date.now()}`,
    name: input.name?.trim() ? withExtension(input.name.trim(), input.file) : input.file.name,
    type: (input.documentType === 'OTHER' ? 'General' : 'Legal') as ClientProfile['documents'][number]['type'],
    lastUpdated: fmtDate(new Date().toISOString()),
    fileSize: sizeLabel(input.file.size),
    fileUrl: await readAsDataUrl(input.file),
    mimeType: input.file.type,
  }
  return demoUpdate(current, { documents: [doc, ...current.documents] })
}

export async function replacePortalDocument(current: ClientProfile, documentId: string, file: File): Promise<ClientProfile> {
  if (!isDemoMode()) {
    const form = new FormData()
    form.append('file', file)
    return profileCall(documentPath(documentId), { method: 'PUT', body: form })
  }
  const fileUrl = await readAsDataUrl(file)
  return demoUpdate(current, {
    documents: current.documents.map((d) =>
      d.id === documentId
        ? { ...d, name: file.name, lastUpdated: fmtDate(new Date().toISOString()), fileSize: sizeLabel(file.size), fileUrl, mimeType: file.type }
        : d,
    ),
  })
}

export async function deletePortalDocument(current: ClientProfile, documentId: string): Promise<ClientProfile> {
  if (!isDemoMode()) return profileCall(documentPath(documentId), { method: 'DELETE' })
  return demoUpdate(current, { documents: current.documents.filter((d) => d.id !== documentId) })
}

/** Last known profile, synchronously (cache in real mode, demo store in the preview). */
export function getStoredPortalProfile(): ClientProfile {
  try {
    const raw = localStorage.getItem(storageKey())
    if (raw) {
      const stored = JSON.parse(raw) as ClientProfile
      // Preview: keep edits, but refresh the live parts (applications, audits, activity).
      if (isDemoMode()) {
        const live = buildPortalProfile()
        if (stored.id !== live.id) return live
        return { ...stored, activeApplication: live.activeApplication, clarification: live.clarification, upcomingAudit: live.upcomingAudit, documentsSummary: live.documentsSummary, recentActivity: live.recentActivity }
      }
      return stored
    }
  } catch (e) {
    console.error('Failed to parse portal profile:', e)
  }
  return isDemoMode() ? buildPortalProfile() : EMPTY_PROFILE
}

export function saveStoredPortalProfile(profile: ClientProfile): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(profile))
  } catch (e) {
    console.error('Failed to save portal profile:', e)
  }
}

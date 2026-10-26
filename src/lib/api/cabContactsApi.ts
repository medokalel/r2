/**
 * Client contacts API — people at the CAB's audit clients.
 *
 *   GET    /cab/contacts?search&client&status   → ContactItem[]
 *   GET    /cab/contacts/clients                 → ContactClientOption[] (clients with their sites)
 *   POST   /cab/contacts                         → ContactItem
 *   PATCH  /cab/contacts/:id                     → ContactItem
 *   DELETE /cab/contacts/:id
 *
 * The backend scopes everything to the CAB in the JWT. In the preview (demo mode) the
 * contacts live in the shared demo store (lib/api/demo/records.ts).
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { CLIENTS } from '@/lib/api/demo/dataset'
import { contacts, saveContacts, scopeToSession } from '@/lib/api/demo/records'

export interface ContactItem {
  id: string
  contactCode: string
  /** Client organization id (sent by the API; demo rows carry only the code). */
  clientId?: string
  clientName: string
  clientCode: string
  country: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  phoneNumber: string
  phonePrefix: string
  /** Site (branch) ids */
  linkedSites: string[]
  /** Site names, same order as linkedSites (sent by the API). */
  linkedSiteNames?: string[]
  isPrimaryContact: boolean
  isAuthorizedSignatory: boolean
  inviteToPortal: boolean
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
}

export interface ContactsFilterParams {
  searchQuery?: string
  /** Client id, or client code in the demo; 'all' = every client */
  client?: string
  country?: string
  status?: string
}

/** An audit client the contact form can attach a contact to. */
export interface ContactClientOption {
  id: string
  code: string
  name: string
  country: string
  sites: Array<{ id: string; name: string }>
}

export interface CreateContactInput {
  clientId: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  phoneNumber: string
  phonePrefix: string
  linkedSites: string[]
  isPrimaryContact: boolean
  isAuthorizedSignatory: boolean
  inviteToPortal: boolean
}

export type UpdateContactInput = Partial<Omit<CreateContactInput, 'clientId'>> & {
  status?: ContactItem['status']
}

const store = () => contacts()
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))
const demoClient = (idOrCode: string) => CLIENTS.find((c) => c.id === idOrCode || c.code === idOrCode)

export async function getContactClients(): Promise<ContactClientOption[]> {
  if (!isDemoMode()) return authorizedRequest<ContactClientOption[]>('/cab/contacts/clients')
  await delay(100)
  return CLIENTS.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    country: c.country,
    sites: c.sites.map((s) => ({ id: s.id, name: s.name })),
  }))
}

export async function getContacts(params?: ContactsFilterParams): Promise<ContactItem[]> {
  if (!isDemoMode()) {
    const query = new URLSearchParams()
    if (params?.searchQuery?.trim()) query.set('search', params.searchQuery.trim())
    if (params?.client && params.client !== 'all') query.set('client', params.client)
    if (params?.status && params.status !== 'all') query.set('status', params.status)
    const qs = query.toString()
    return authorizedRequest<ContactItem[]>(`/cab/contacts${qs ? `?${qs}` : ''}`)
  }
  await delay()
  let result = scopeToSession([...store()], (c) => c.clientCode)
  if (params?.searchQuery) {
    const q = params.searchQuery.toLowerCase().trim()
    result = result.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.clientName.toLowerCase().includes(q) ||
        c.jobTitle.toLowerCase().includes(q) ||
        c.contactCode.toLowerCase().includes(q)
    )
  }
  if (params?.client && params.client !== 'all') {
    const code = demoClient(params.client)?.code ?? params.client
    result = result.filter((c) => c.clientCode === code)
  }
  if (params?.status && params.status !== 'all') {
    result = result.filter((c) => c.status === params.status)
  }
  return result
}

export async function createContact(data: CreateContactInput): Promise<ContactItem> {
  if (!isDemoMode()) {
    return authorizedRequest<ContactItem>('/cab/contacts', { method: 'POST', body: JSON.stringify(data) })
  }
  await delay(250)
  const client = demoClient(data.clientId)
  const newContact: ContactItem = {
    ...data,
    clientName: client?.name ?? '',
    clientCode: client?.code ?? data.clientId,
    country: client?.country ?? '',
    id: `cnt-${Date.now()}`,
    contactCode: `CNT-${String(store().length + 1).padStart(4, '0')}`,
    createdAt: new Date().toISOString().split('T')[0],
    status: 'active',
  }
  store().unshift(newContact)
  saveContacts()
  return newContact
}

export async function updateContact(id: string, patch: UpdateContactInput): Promise<ContactItem> {
  if (!isDemoMode()) {
    return authorizedRequest<ContactItem>(`/cab/contacts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  }
  await delay(150)
  const item = store().find((c) => c.id === id)
  if (!item) throw new Error('Contact not found.')
  Object.assign(item, patch)
  saveContacts()
  return item
}

export async function deleteContact(id: string): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest(`/cab/contacts/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return
  }
  await delay(150)
  const list = store()
  const index = list.findIndex((c) => c.id === id)
  if (index >= 0) list.splice(index, 1)
  saveContacts()
}

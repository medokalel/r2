import { authorizedRequest } from '@/lib/api/authorizedClient'
import { portalFindingResponsePath } from '@/lib/routes'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { parseDisplayDate } from '@/lib/format/dates'
import { apps, appsOfClient, certificates, clientRecord, informationRequired, invoices, ncs, notificationStore, orgUsers, scopeToSession, sessionClientId } from '@/lib/api/demo/records'
import { notSet } from '@/lib/emptyValue'

/**
 * Client dashboard data layer.
 *
 * Real endpoints (audit-client accounts; the organization comes from the JWT):
 *   GET /dashboard/stats       → DashboardStats
 *   GET /dashboard/tasks       → DashboardTask[]
 *   GET /dashboard/activities  → DashboardActivity[] (latest 5 of the client notification feed)
 *
 * In the preview (demo mode) the figures are computed from the shared demo store.
 */

export interface DashboardStats {
  approvedCertificates: number
  currentOrders: number
  pendingRequests: number
  users: number
}

export type DashboardTaskStatus = 'urgent' | 'underReview' | 'pending'
export type DashboardTaskType = 'documentReview' | 'contractProcessing' | 'feeCollection'

export interface DashboardTask {
  id: string
  applicantName: string
  companyCode: string
  taskType: DashboardTaskType
  status: DashboardTaskStatus
  /** Page that handles the task (set by the backend; demo tasks open the application feedback view). */
  href?: string
}

export type DashboardActivityType = 'documentReceived' | 'correspondenceSent' | 'statusChanged'

export interface DashboardActivity {
  id: string
  type: DashboardActivityType
  titleKey: string
  entityName: string
  /** ISO timestamp; the UI derives a relative "x minutes/hours ago" label from it. */
  occurredAt: string
  /** Only set for statusChanged activities. */
  statusNote?: string
}

/*
 * Demo mode: figures are computed from the shared demo store for the signed-in
 * client (or the whole register for CAB users), so they match the lists they
 * open (lib/api/demo/records.ts).
 */

function delay<T>(value: () => T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value()), ms))
}

function scopedApps() {
  const id = sessionClientId()
  return id ? appsOfClient(id) : apps()
}

export function getDashboardStats(): Promise<DashboardStats> {
  if (!isDemoMode()) return authorizedRequest<DashboardStats>('/dashboard/stats')
  return delay(() => {
    const list = scopedApps()
    const id = sessionClientId()
    const certs = scopeToSession(certificates(), (c) => c.clientId)
    return {
      approvedCertificates: certs.filter((c) => c.status === 'ISSUED').length,
      currentOrders: list.filter((a) => !['DRAFT', 'REJECTED'].includes(a.status) && a.stage !== 'certified').length,
      pendingRequests: list.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW' || a.status === 'DRAFT').length,
      users: id ? clientRecord(id).contacts.filter((c) => c.portalAccess).length + 1 : orgUsers().length,
    }
  })
}

export function getDashboardTasks(): Promise<DashboardTask[]> {
  if (!isDemoMode()) return authorizedRequest<DashboardTask[]>('/dashboard/tasks')
  return delay(() => {
    const tasks: DashboardTask[] = []
    for (const app of scopedApps()) {
      const code = app.organization.id.slice(0, 8).toUpperCase()
      const open = informationRequired(app.id).filter((i) => i.status === 'PENDING')
      if (open.length || app.stage === 'informationRequired' || app.status === 'DRAFT') {
        tasks.push({ id: app.id, applicantName: `${app.organization.name} · ${app.orderNumber}`, companyCode: code, taskType: 'documentReview', status: open.some((i) => i.priority === 'HIGH') ? 'urgent' : 'pending' })
      }
      if (app.status === 'QUOTATION_ISSUED') {
        tasks.push({ id: app.id, applicantName: `${app.organization.name} · ${app.orderNumber}`, companyCode: code, taskType: 'contractProcessing', status: 'underReview' })
      }
    }
    for (const inv of scopeToSession(invoices(), (i) => i.organizationId)) {
      if (inv.balance > 0 && inv.status !== 'Draft') {
        tasks.push({ id: inv.id, applicantName: `${inv.clientName} · ${inv.invoiceNumber}`, companyCode: inv.clientCode, taskType: 'feeCollection', status: (parseDisplayDate(inv.dueDate)?.getTime() ?? Infinity) < Date.now() ? 'urgent' : 'pending' })
      }
    }
    for (const n of scopeToSession(ncs(), (x) => x.clientId)) {
      if (n.status !== 'closed') {
        tasks.push({ id: n.id, applicantName: `${n.clientName} · ${n.ncId}`, companyCode: n.clientId, taskType: 'documentReview', status: n.overdue || n.classification === 'major' ? 'urgent' : 'underReview', href: portalFindingResponsePath(n.id) })
      }
    }
    return tasks
  })
}

export function getDashboardActivities(): Promise<DashboardActivity[]> {
  if (!isDemoMode()) return authorizedRequest<DashboardActivity[]>('/dashboard/activities')
  return delay(() => {
    const id = sessionClientId()
    const feed = id ? notificationStore().client.filter((n) => !n.clientId || n.clientId === id) : notificationStore().cab
    const name = (ref?: string) => (ref ? apps().find((a) => a.orderNumber === ref)?.organization.name ?? ref : notSet())
    return feed.slice(0, 5).map((n) => {
      const type: DashboardActivity['type'] = n.type.includes('received') || n.type.includes('responded') ? 'documentReceived' : n.type.includes('requested') || n.type.includes('due') || n.type.includes('awaiting') ? 'correspondenceSent' : 'statusChanged'
      return {
        id: n.id,
        type,
        titleKey: `dashboard.activities.items.${type}`,
        entityName: n.params.client ?? `${name(n.params.ref)} (${n.params.ref ?? ''})`,
        occurredAt: n.createdAt,
        statusNote: type === 'statusChanged' ? 'dashboard.activities.movedToAwaitingDocuments' : undefined,
      }
    })
  })
}

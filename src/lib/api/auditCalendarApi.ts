/**
 * Audit calendar API — GET /cab/audit-calendar?from&to → AuditCalendarEntry[].
 *
 * The server derives one entry per audit day from the CAB's audit plans. In the preview
 * (demo mode) the same entries are derived from the shared demo store's plans.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { initialsOf } from '@/lib/api/demo/dataset'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { auditPlans } from '@/lib/api/demo/records'

export type AuditCalendarStatus =
  | 'planned'
  | 'inProgress'
  | 'completed'
  | 'reportFinalization'
  | 'cancelled'
  | 'postponed'

export interface AuditCalendarEntry {
  id: string
  /** Audit plan the day belongs to (real API). */
  planId?: string
  planNumber?: string
  /** ISO date (YYYY-MM-DD) of the audit day. */
  date: string
  clientName: string
  standard: string
  auditType: string
  auditTeam: string[]
  timeRange: string
  status: AuditCalendarStatus
}

export interface AuditCalendarRange {
  /** YYYY-MM-DD, inclusive */
  from?: string
  /** YYYY-MM-DD, inclusive */
  to?: string
}

const STATUS: Record<string, AuditCalendarStatus> = {
  Draft: 'planned',
  Planned: 'planned',
  'In progress': 'inProgress',
  'Under review': 'reportFinalization',
  Completed: 'completed',
  Rescheduled: 'postponed',
}

export function getAuditCalendarEntries(range: AuditCalendarRange = {}): Promise<AuditCalendarEntry[]> {
  if (!isDemoMode()) {
    const query = new URLSearchParams()
    if (range.from) query.set('from', range.from)
    if (range.to) query.set('to', range.to)
    const qs = query.toString()
    return authorizedRequest<AuditCalendarEntry[]>(`/cab/audit-calendar${qs ? `?${qs}` : ''}`)
  }
  // Demo: each audit-plan day of the shared demo store becomes a calendar entry.
  return new Promise((resolve) =>
    setTimeout(() => {
      const entries: AuditCalendarEntry[] = []
      for (const plan of auditPlans()) {
        const days = Math.max(1, plan.durationDays)
        for (let i = 0; i < days; i += 1) {
          const date = new Date(`${plan.proposedStartDate}T00:00:00Z`)
          date.setUTCDate(date.getUTCDate() + i)
          const iso = date.toISOString().slice(0, 10)
          if ((range.from && iso < range.from) || (range.to && iso > range.to)) continue
          entries.push({
            id: `${plan.id}-${i}`,
            planId: plan.id,
            planNumber: plan.planNumber,
            date: iso,
            clientName: plan.clientName,
            standard: plan.standardName.match(/\(([^)]+)\)/)?.[1] ?? plan.standardName,
            auditType: `${plan.stage} Audit`,
            auditTeam: plan.auditTeam.map((name) => initialsOf(name)),
            timeRange: i === days - 1 ? '08:30 AM - 02:00 PM' : '08:30 AM - 04:30 PM',
            status: STATUS[plan.status] ?? 'planned',
          })
        }
      }
      resolve(entries.sort((a, b) => a.date.localeCompare(b.date)))
    }, 300),
  )
}

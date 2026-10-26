/** Paths of the iCASCO platform console (all below ROUTES.platform = "/platform"). */
export const PLATFORM_ROUTES = {
  dashboard: '/platform',
  tenants: '/platform/tenants',
  tenantNew: '/platform/tenants/new',
  plans: '/platform/plans',
  planNew: '/platform/plans/new',
  invoices: '/platform/invoices',
  announcements: '/platform/announcements',
  staff: '/platform/staff',
  auditLog: '/platform/audit-log',
  settings: '/platform/settings',
} as const

export type TenantTab = 'overview' | 'subscription' | 'features' | 'users' | 'invoices' | 'history'

export function platformTenantPath(id: string, tab?: TenantTab): string {
  const base = `/platform/tenants/${encodeURIComponent(id)}`
  return tab && tab !== 'overview' ? `${base}?tab=${tab}` : base
}

export function platformPlanPath(id: string): string {
  return `/platform/plans/${encodeURIComponent(id)}`
}

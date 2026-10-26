import { lazy, type ComponentType } from 'react'

function lazyNamed(importer: () => Promise<Record<string, unknown>>, exportName: string) {
  return lazy(async () => {
    const mod = await importer()
    return { default: mod[exportName] as ComponentType }
  })
}

// Audit execution, checklist library and stage reports (CAB), and the client portal view of an audit.
export const CabAuditExecutionPage = lazyNamed(() => import('@/pages/execution/CabAuditExecutionPage'), 'CabAuditExecutionPage')
export const CabChecklistLibraryPage = lazyNamed(() => import('@/pages/execution/CabChecklistLibraryPage'), 'CabChecklistLibraryPage')
export const CabStageReportPage = lazyNamed(() => import('@/pages/execution/CabStageReportPage'), 'CabStageReportPage')
export const PortalAuditDetailPage = lazyNamed(() => import('@/pages/execution/PortalAuditDetailPage'), 'PortalAuditDetailPage')
export const PortalAuditReportPage = lazyNamed(() => import('@/pages/execution/PortalAuditReportPage'), 'PortalAuditReportPage')

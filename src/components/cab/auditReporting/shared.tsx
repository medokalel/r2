import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { AuditEvidenceTask, AuditFinding, WorkspaceScope } from '@/lib/api/cabAuditReportingApi'

export const CARD = 'rounded-lg border border-neutral-100 bg-white'
export const INPUT =
  'h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm font-medium text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-neutral-50'
export const PRIMARY_BTN =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-md bg-primary px-5 text-body-sm font-medium text-white transition-colors hover:bg-primary-active disabled:opacity-50'
export const GHOST_BTN =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50'

export type TabId = 'agenda' | 'evidence' | 'findings' | 'report'
export type PageState = 'ready' | 'loading' | 'error' | 'denied' | 'empty'

/** An evidence task of the workspace plus its row selection (UI only). */
export type EvidenceTask = AuditEvidenceTask & { selected: boolean }

export type Finding = AuditFinding

export function ScopeBanner({ title, scope }: { title: string; scope: WorkspaceScope }) {
  const { t } = useTranslation()
  return (
    <section className={cn(CARD, 'border-primary/20 bg-primary-25 p-4')} aria-label={t('ui.tenantScope')}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-caption">
        <span className="rounded-sm bg-primary px-2 py-0.5 font-bold text-white">{title}</span>
        <span className="font-medium text-neutral-800">{t('ui.orgLabel')} {scope.org}</span>
        <span className="font-medium text-neutral-800">{t('ui.siteLabel')} {scope.site}</span>
        <span className="font-medium text-neutral-800">{t('ui.contactLabel')} {scope.contact}</span>
      </div>
      <p className="mt-1.5 text-caption text-neutral-600">{t('ui.docsLabel')} {scope.docs}{t('ui.idsStableNote')}</p>
    </section>
  )
}

export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 start-1/2 z-[999] -translate-x-1/2 rtl:translate-x-1/2" role="status" aria-live="polite">
      <div className="flex max-w-[min(92vw,560px)] items-center gap-2.5 rounded-lg bg-slate-900 px-5 py-3 text-white shadow-xl">
        <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success-500 text-caption font-bold">✓</span>
        <span className="text-body-sm font-semibold">{message}</span>
      </div>
    </div>
  )
}

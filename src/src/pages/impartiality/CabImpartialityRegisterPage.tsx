import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { DataTable, EmptyState, ErrorBlock, KeyValue, LoadingBlock, MobileCard, MobileCards, PageHeader } from '@/components/platform/PlatformUi'
import { Button } from '@/components/ui/Button'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'
import { PersonImpartialityCard } from '@/components/teamSelection/PersonImpartialityCard'
import { PersonAvailabilityCard } from '@/components/teamSelection/PersonAvailabilityCard'
import { RelationshipList } from '@/components/teamSelection/RelationshipList'
import { RelationshipDialog } from '@/components/teamSelection/ImpartialityDialogs'
import { TeamExceptionsList } from '@/components/teamSelection/TeamExceptionsList'
import { TeamSettingsForm } from '@/components/teamSelection/TeamSettingsForm'
import { getImpartialityRegister, listRelationships, type ImpartialityRegister, type ImpartialityRelationship, type ReviewStatus } from '@/lib/api/impartialityApi'
import { listTeamExceptions, type TeamException } from '@/lib/api/teamSelectionApi'
import { formatDate } from '@/lib/format/dates'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

type Tab = 'people' | 'relationships' | 'exceptions' | 'settings'
const TABS: Tab[] = ['people', 'relationships', 'exceptions', 'settings']
const STATUS_STYLE = { valid: 'bg-success-50 text-success-700', expiring: 'bg-warning-50 text-warning-800', expired: 'bg-error-50 text-error-700', missing: 'bg-error-50 text-error-700' } as const

/**
 * Impartiality register (/cab/impartiality): declaration status per person, relationships with clients
 * and their CAB review, team-selection exceptions and the team-selection rules (cooling-off period …).
 */
export function CabImpartialityRegisterPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const personId = params.get('person') ?? ''
  const tab = (TABS.includes(params.get('tab') as Tab) ? params.get('tab') : 'people') as Tab
  const [register, setRegister] = useState<ImpartialityRegister | null>(null)
  const [relationships, setRelationships] = useState<ImpartialityRelationship[] | null>(null)
  const [exceptions, setExceptions] = useState<TeamException[] | null>(null)
  const [error, setError] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<ReviewStatus | ''>('')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<ImpartialityRelationship | null>(null)
  const [reload, setReload] = useState(0)

  const refresh = useCallback(() => setReload((n) => n + 1), [])

  useEffect(() => {
    let alive = true
    Promise.all([getImpartialityRegister(), listRelationships(), listTeamExceptions()]).then(
      ([reg, rels, exc]) => {
        if (!alive) return
        setRegister(reg)
        setRelationships(rels)
        setExceptions(exc)
        setError(false)
      },
      () => alive && setError(true),
    )
    return () => {
      alive = false
    }
  }, [reload])

  const people = useMemo(() => (register?.people ?? []).map((p) => ({ personId: p.personId, name: p.name })), [register])
  const selected = register?.people.find((p) => p.personId === personId)
  const shownRelationships = (relationships ?? []).filter((r) => !reviewFilter || r.reviewStatus === reviewFilter)
  const pendingExceptions = (exceptions ?? []).filter((e) => e.status === 'PENDING').length
  const setTab = (next: Tab) => setParams((prev) => {
    const copy = new URLSearchParams(prev)
    copy.set('tab', next)
    copy.delete('person')
    return copy
  })
  const openPerson = (id: string) => setParams({ tab: 'people', person: id })

  const kpis = register
    ? [
        { key: 'valid', label: t('team.register.kpi.valid'), value: register.summary.validDeclarations, tone: 'text-success-700' },
        { key: 'missing', label: t('team.register.kpi.missing'), value: register.summary.missingOrExpired, tone: 'text-error-600' },
        { key: 'pending', label: t('team.register.kpi.pending'), value: register.summary.pendingReview, tone: 'text-warning-800' },
        { key: 'blocking', label: t('team.register.kpi.blocking'), value: register.summary.blockingRelationships, tone: 'text-neutral-900' },
      ]
    : []

  return (
    <CabLayout>
      <CabHeader title={t('team.register.title')} />
      <main className="flex min-w-0 flex-1 flex-col gap-5 page-main">
        <PageHeader
          title={t('team.register.title')}
          subtitle={t('team.register.subtitle', { months: register?.settings.coolingOffMonths ?? 24 })}
          crumbs={[{ label: t('team.common.hub'), to: ROUTES.workspace }, { label: t('team.register.title') }]}
          actions={
            <>
              <Button asChild variant="secondary" size="sm" className="w-full sm:w-auto">
                <Link to={ROUTES.cabTeamAvailability}>{t('team.register.availability')}</Link>
              </Button>
              <Button variant="primary" size="sm" className="w-full sm:w-auto" onClick={() => setAdding(true)} disabled={!register}>
                {t('team.impartiality.add')}
              </Button>
            </>
          }
        />

        {error && !register && <ErrorBlock message={t('team.common.loadError')} onRetry={refresh} />}
        {!error && !register && <LoadingBlock rows={5} />}

        {register && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {kpis.map((k) => (
                <div key={k.key} className="flex min-w-0 flex-col gap-1 rounded-lg border border-neutral-100 bg-white p-4">
                  <span className="text-caption font-medium text-neutral-600">{k.label}</span>
                  <span className={cn('text-h3 font-bold', k.tone)}>{k.value}</span>
                </div>
              ))}
            </div>

            <div className={pageTabListClassName} role="tablist" aria-label={t('team.register.title')}>
              {TABS.map((key) => (
                <button key={key} type="button" role="tab" aria-selected={tab === key} className={pageTabClassName(tab === key)} onClick={() => setTab(key)}>
                  {t(`team.register.tabs.${key}`)}
                  {key === 'exceptions' && pendingExceptions > 0 && <span className="ms-1 rounded-full bg-warning-500 px-1.5 text-overline font-bold text-white">{pendingExceptions}</span>}
                </button>
              ))}
            </div>

            {tab === 'people' && !selected && (
              <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-3 sm:p-5">
                {register.people.length === 0 ? (
                  <EmptyState title={t('team.register.emptyTitle')} hint={t('team.register.emptyHint')} />
                ) : (
                  <>
                    <DataTable head={[t('team.register.cols.person'), t('team.register.cols.declaration'), t('team.register.cols.validUntil'), t('team.register.cols.relationships'), t('team.register.cols.pending'), t('team.register.cols.blocking')]} minWidth={820}>
                      {register.people.map((p, i) => (
                        <tr key={p.personId} onClick={() => openPerson(p.personId)} className={cn('cursor-pointer border-b border-neutral-50 hover:bg-primary-25', i % 2 === 1 && 'bg-neutral-25')}>
                          <td className="px-4 py-3">
                            <button type="button" className="text-body-sm font-semibold text-primary hover:underline" onClick={(e) => { e.stopPropagation(); openPerson(p.personId) }}>
                              {p.name}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('rounded-xs px-2 py-0.5 text-caption font-medium', STATUS_STYLE[p.declarationStatus])}>{t(`team.declaration.status.${p.declarationStatus}`)}</span>
                          </td>
                          <td className="px-4 py-3 text-body-sm text-neutral-700">{p.declarationValidUntil ? formatDate(p.declarationValidUntil) : t('team.common.none')}</td>
                          <td className="px-4 py-3 text-body-sm text-neutral-700">{p.relationshipCount}</td>
                          <td className="px-4 py-3 text-body-sm text-neutral-700">{p.pendingReview}</td>
                          <td className={cn('px-4 py-3 text-body-sm', p.blockingRelationships ? 'font-semibold text-error-600' : 'text-neutral-700')}>{p.blockingRelationships}</td>
                        </tr>
                      ))}
                    </DataTable>
                    <MobileCards>
                      {register.people.map((p) => (
                        <MobileCard key={p.personId} onClick={() => openPerson(p.personId)}>
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-body font-bold text-primary">{p.name}</span>
                            <span className={cn('rounded-xs px-2 py-0.5 text-caption font-medium', STATUS_STYLE[p.declarationStatus])}>{t(`team.declaration.status.${p.declarationStatus}`)}</span>
                          </div>
                          <dl className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3">
                            <KeyValue label={t('team.register.cols.validUntil')}>{p.declarationValidUntil ? formatDate(p.declarationValidUntil) : t('team.common.none')}</KeyValue>
                            <KeyValue label={t('team.register.cols.blocking')}>{p.blockingRelationships}</KeyValue>
                          </dl>
                        </MobileCard>
                      ))}
                    </MobileCards>
                  </>
                )}
              </section>
            )}

            {tab === 'people' && selected && (
              <div className="flex min-w-0 flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-section-title text-text-primary">{selected.name}</h2>
                  <button type="button" className="text-body-sm font-semibold text-primary hover:underline" onClick={() => setParams({ tab: 'people' })}>
                    {t('team.register.backToList')}
                  </button>
                </div>
                <PersonImpartialityCard key={`imp-${selected.personId}-${reload}`} personId={selected.personId} />
                <PersonAvailabilityCard key={`ava-${selected.personId}`} personId={selected.personId} />
              </div>
            )}

            {tab === 'relationships' && (
              <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-3 sm:p-5">
                <label className="flex flex-col gap-1 text-caption font-semibold text-neutral-800 sm:w-64">
                  {t('team.register.reviewFilter')}
                  <select value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value as ReviewStatus | '')} className="h-11 rounded-md border border-neutral-100 bg-white px-3 text-body-sm font-normal">
                    <option value="">{t('team.register.allReviews')}</option>
                    {(['PENDING', 'CONFIRMED', 'DISMISSED'] as const).map((s) => (
                      <option key={s} value={s}>
                        {t(`team.impartiality.review.${s}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <RelationshipList rows={shownRelationships} showPerson onEdit={setEditing} onChanged={refresh} />
              </section>
            )}

            {tab === 'exceptions' && (
              <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-3 sm:p-5">
                <p className="text-caption text-neutral-600">{t('team.exceptions.hint')}</p>
                <TeamExceptionsList exceptions={exceptions ?? []} personName={(id) => people.find((p) => p.personId === id)?.name ?? ''} onChanged={refresh} />
              </section>
            )}

            {tab === 'settings' && <TeamSettingsForm onSaved={refresh} />}
          </>
        )}
      </main>
      <RelationshipDialog
        open={adding || Boolean(editing)}
        people={people}
        personId={tab === 'people' && selected ? selected.personId : undefined}
        editing={editing}
        onClose={() => {
          setAdding(false)
          setEditing(null)
        }}
        onSaved={refresh}
      />
    </CabLayout>
  )
}

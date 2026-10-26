import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Add, SecuritySafe } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { Card, ErrorBlock, LoadingBlock } from '@/components/platform/PlatformUi'
import { FormDialog } from '@/components/platform/FormDialog'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { SsoConnectionCard } from '@/components/sso/SsoConnectionCard'
import { SsoConnectionEditor, type SsoEditorStep } from '@/components/sso/SsoConnectionEditor'
import { ProviderMark } from '@/components/sso/SsoUi'
import {
  deleteSsoConnection,
  getSsoOptions,
  listSsoConnections,
  listSsoEvents,
  updateSsoConnection,
  type SsoAuditEvent,
  type SsoConnection,
  type SsoOptions,
} from '@/lib/api/ssoApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { ROUTES } from '@/lib/routes'
import { SSO_PROVIDERS, type SsoProvider } from '@/lib/sso'
import { toast } from '@/lib/toast'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-500 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type Editing = { connection: SsoConnection | null; provider: SsoProvider; step?: SsoEditorStep } | null

/**
 * Settings → Single sign-on (CAB admin): connections to the organization's identity providers,
 * domains, provisioning, "Require SSO" and the SSO audit trail. Locked by the subscription gate
 * (FeatureRouteGate, feature `sso`) when the plan does not include single sign-on.
 */
export function CabSsoSettingsPage() {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  const [connections, setConnections] = useState<SsoConnection[] | null>(null)
  const [options, setOptions] = useState<SsoOptions | null>(null)
  const [events, setEvents] = useState<SsoAuditEvent[]>([])
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState<Editing>(null)
  const [picking, setPicking] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<SsoConnection | null>(null)

  const fetchAll = () => Promise.all([listSsoConnections(), getSsoOptions(), listSsoEvents({ limit: 20 })])
  const apply = ([list, opts, evts]: Awaited<ReturnType<typeof fetchAll>>) => {
    setConnections(list)
    setOptions(opts)
    setEvents(evts)
  }
  const reload = () => {
    setError(false)
    fetchAll().then(apply, () => setError(true))
  }

  useEffect(() => {
    let alive = true
    Promise.all([listSsoConnections(), getSsoOptions(), listSsoEvents({ limit: 20 })]).then(
      ([list, opts, evts]) => {
        if (!alive) return
        setConnections(list)
        setOptions(opts)
        setEvents(evts)
      },
      () => alive && setError(true),
    )
    return () => {
      alive = false
    }
  }, [])

  const replace = useCallback((c: SsoConnection) => {
    setConnections((list) => (list ? (list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c]) : [c]))
    void listSsoEvents({ limit: 20 }).then(setEvents).catch(() => undefined)
  }, [])

  const toggle = async (c: SsoConnection, enabled: boolean) => {
    setBusyId(c.id)
    try {
      replace(await updateSsoConnection(c.id, { status: enabled ? 'ENABLED' : 'DISABLED' }))
      toast.success(enabled ? t('sso.card.enabled') : t('sso.card.disabled'))
    } catch (err) {
      toast.error(getUserErrorMessage(err, t))
    } finally {
      setBusyId(null)
    }
  }

  const startNew = (provider: SsoProvider) => {
    setPicking(false)
    setEditing({ connection: null, provider })
  }

  const list = connections ?? []

  return (
    <CabLayout tourId="cab-sso" tourSteps={[]}>
      <CabHeader title={t('sso.page.title')} />
      <main className="flex min-w-0 flex-1 flex-col gap-5 page-main">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-body-sm" aria-label={t('platform.common.breadcrumb')}>
          <Link to={ROUTES.workspace} className="font-light text-neutral-500 hover:text-primary">
            {t('sso.page.breadcrumbHub')}
          </Link>
          <Chevron />
          <Link to={ROUTES.cabCompanyProfile} className="font-light text-neutral-500 hover:text-primary">
            {t('sso.page.breadcrumbSettings')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-800">{t('sso.page.title')}</span>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-page-title text-text-primary">
              <AppIcon icon={SecuritySafe} size={28} className="text-primary" />
              {t('sso.page.title')}
            </h1>
            <p className="mt-1 max-w-3xl text-body-sm text-neutral-600">{t('sso.page.subtitle')}</p>
          </div>
          {!editing && list.length > 0 && (
            <Button variant="primary" icon={<AppIcon icon={Add} size={20} />} onClick={() => setPicking(true)} className="w-full sm:w-auto">
              {t('sso.page.add')}
            </Button>
          )}
        </div>

        {error && !connections ? <ErrorBlock message={t('sso.page.loadError')} onRetry={reload} /> : null}
        {!error && !connections ? <LoadingBlock rows={4} /> : null}

        {connections && editing && (
          <Card bodyClassName="p-4 sm:p-6">
            <SsoConnectionEditor
              key={editing.connection?.id ?? `new-${editing.provider}`}
              connection={editing.connection}
              provider={editing.provider}
              initialStep={editing.step}
              options={options}
              onSaved={replace}
              onClose={() => setEditing(null)}
            />
          </Card>
        )}

        {connections && !editing && (
          <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-4">
              {list.length === 0 || picking ? (
                <Card title={list.length === 0 ? t('sso.page.emptyTitle') : t('sso.page.add')}>
                  <p className="mb-4 text-body-sm text-neutral-600">{t('sso.page.emptyHint')}</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {SSO_PROVIDERS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => startNew(p)}
                        className="flex min-w-0 items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-start transition-colors hover:border-primary/50 hover:bg-primary-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                      >
                        <ProviderMark provider={p} />
                        <span className="min-w-0">
                          <span className="block text-body-sm font-semibold text-neutral-900">{t(`sso.providers.${p}`)}</span>
                          <span className="block text-caption text-neutral-600">{t(`sso.providerHints.${p}`)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {picking && (
                    <div className="mt-4">
                      <Button variant="outline" size="sm" onClick={() => setPicking(false)}>
                        {t('sso.wizard.close')}
                      </Button>
                    </div>
                  )}
                </Card>
              ) : null}
              {list.map((c) => (
                <SsoConnectionCard
                  key={c.id}
                  connection={c}
                  busy={busyId === c.id}
                  onEdit={() => setEditing({ connection: c, provider: c.provider })}
                  onTest={() => setEditing({ connection: c, provider: c.provider, step: 'security' })}
                  onToggle={(enabled) => void toggle(c, enabled)}
                  onDelete={() => setDeleting(c)}
                />
              ))}
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <Card title={t('sso.page.howTitle')}>
                <ol className="list-decimal space-y-2 ps-5 text-body-sm text-neutral-700">
                  <li>{t('sso.page.how1')}</li>
                  <li>{t('sso.page.how2')}</li>
                  <li>{t('sso.page.how3')}</li>
                  <li>{t('sso.page.how4')}</li>
                </ol>
              </Card>
              <Card title={t('sso.page.activity')}>
                {events.length === 0 ? (
                  <p className="text-body-sm text-neutral-600">{t('sso.page.activityEmpty')}</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-neutral-100" data-testid="sso-events">
                    {events.map((e) => (
                      <li key={e.id} className="flex min-w-0 flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
                        <span className="text-body-sm font-medium text-neutral-900">{t(`sso.events.${e.action.replace(/\./g, '_')}`, { defaultValue: e.action })}</span>
                        <span className="break-words text-caption text-neutral-600">
                          {[e.email, typeof e.details?.domain === 'string' ? e.details.domain : null, e.actor && !e.email ? t('sso.events.by', { name: e.actor.name }) : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                        <span className="text-caption text-neutral-500">{f.dateTime(e.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        )}
      </main>

      <FormDialog
        open={Boolean(deleting)}
        title={t('sso.card.deleteTitle', { name: deleting?.name ?? '' })}
        description={t('sso.card.deleteBody')}
        submitLabel={t('sso.card.delete')}
        destructive
        onClose={() => setDeleting(null)}
        onSubmit={async () => {
          if (!deleting) return
          await deleteSsoConnection(deleting.id)
          setConnections((current) => (current ?? []).filter((x) => x.id !== deleting.id))
          toast.success(t('sso.card.deleted'))
          void listSsoEvents({ limit: 20 }).then(setEvents).catch(() => undefined)
        }}
      >
        {null}
      </FormDialog>
    </CabLayout>
  )
}

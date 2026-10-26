import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock1 } from 'iconsax-reactjs'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { useSubscription } from '@/hooks/useSubscription'
import { AppIcon, SearchIcon, type AppIconComponent } from '@/components/icons'
import { getAuthSession, isAuditClientSession } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'
import { WORKSPACE_APPS, WORKSPACE_PHASES } from '@/lib/workspaceApps'

interface WorkspaceApp {
  key: string
  title: string
  description: string
  route?: string
  icon: AppIconComponent
  comingSoon?: boolean
}

function AppTile({ app, step, locked = false }: { app: WorkspaceApp; step?: number; locked?: boolean }) {
  const { t } = useTranslation()
  const className =
    'group relative flex min-h-[166px] flex-col items-center justify-center rounded-3xl border border-neutral-100 bg-white px-5 py-6 text-center shadow-card transition duration-200'
  const content = (
    <>
      {step !== undefined && (
        <span className="absolute start-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary-25 text-caption font-semibold text-primary tabular-nums">
          {step}
        </span>
      )}
      {app.comingSoon && (
        <span className="absolute end-3 top-3 rounded-full bg-neutral-50 px-2 py-1 text-overline font-medium text-neutral-600">
          {t('cab.workspace.comingSoon')}
        </span>
      )}
      {locked && (
        <span className="absolute end-3 top-3 flex size-7 items-center justify-center rounded-full bg-warning-500/15 text-warning-700" aria-hidden>
          <AppIcon icon={Lock1} size={15} />
        </span>
      )}
      <div
        className={
          locked
            ? 'mb-4 flex size-12 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500'
            : 'mb-4 flex size-12 items-center justify-center rounded-lg bg-primary-25 text-primary transition-colors group-hover:bg-primary group-hover:text-white'
        }
      >
        <AppIcon icon={app.icon} size={24} />
      </div>
      <h2 className={locked ? 'text-body font-semibold text-neutral-600' : 'text-body font-semibold text-neutral-900'}>{app.title}</h2>
      {locked ? (
        <p className="mt-1.5 text-caption font-medium leading-5 text-warning-700">{t('subscription.notInPlan')}</p>
      ) : (
        <p className="mt-1.5 line-clamp-2 text-caption leading-5 text-neutral-600">
          {app.description}
        </p>
      )}
    </>
  )

  if (locked) {
    // Locked modules stay discoverable and open "My subscription", where an upgrade can be requested.
    return (
      <Link
        to={ROUTES.cabSubscription}
        aria-label={t('subscription.lockedTileAria', { name: app.title })}
        className={`${className} bg-neutral-25 hover:border-warning-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
      >
        {content}
      </Link>
    )
  }

  if (!app.route) {
    return (
      <div
        aria-disabled="true"
        className={`${className} cursor-default opacity-75`}
      >
        {content}
      </div>
    )
  }

  return (
    <Link
      to={app.route}
      aria-label={t('cab.workspace.openApp', { name: app.title })}
      className={`${className} hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_12px_28px_rgba(18,54,163,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
    >
      {content}
    </Link>
  )
}

export function WorkspacePage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const { isPathAllowed } = useSubscription()
  const session = getAuthSession()
  const isCab =
    !isAuditClientSession(session) &&
    (Boolean(session?.cab) || session?.organization?.type === 'CERTIFICATION_BODY')
  const isAccreditationBody = session?.organization?.type === 'ACCREDITATION_BODY'

  // Tiles and phases come from '@/lib/workspaceApps' (shared with iHelp, which builds its sections from them).
  const cabApps: WorkspaceApp[] = useMemo(
    () =>
      WORKSPACE_APPS.map((app) => ({
        key: app.key,
        title: t(app.titleKey),
        description: t(app.descriptionKey),
        route: app.route,
        icon: app.icon,
        comingSoon: app.comingSoon,
      })),
    [t],
  )

  const phases = useMemo(
    () =>
      WORKSPACE_PHASES.map((phase) => ({
        key: phase.key,
        title: t(phase.titleKey, phase.titleFallback),
        hint: t(phase.hintKey, phase.hintFallback),
        apps: phase.apps,
      })),
    [t],
  )

  if (!isCab) {
    return (
      <Navigate
        to={isAccreditationBody ? ROUTES.abDashboard : ROUTES.dashboard}
        replace
      />
    )
  }

  // Apps in flow order; anything not placed in a phase is appended to the last phase.
  const placed = new Set(phases.flatMap((phase) => phase.apps))
  const leftover = cabApps.filter((app) => !placed.has(app.key)).map((app) => app.key)
  // Leftovers join the last flow phase (the trailing Help group is not part of the flow).
  const lastFlowIndex = phases.map((phase) => phase.key).lastIndexOf('followUp')
  const flowPhases = leftover.length
    ? phases.map((phase, i) => (i === (lastFlowIndex >= 0 ? lastFlowIndex : phases.length - 1) ? { ...phase, apps: [...phase.apps, ...leftover] } : phase))
    : phases
  const orderedKeys = flowPhases.flatMap((phase) => phase.apps)
  const stepNumber = new Map(orderedKeys.map((key, index) => [key, index + 1]))
  const allApps = orderedKeys
    .map((key) => cabApps.find((app) => app.key === key))
    .filter((app): app is WorkspaceApp => Boolean(app))
  const normalizedQuery = query.trim().toLowerCase()
  const visibleApps = normalizedQuery
    ? allApps.filter(
        (app) =>
          app.title.toLowerCase().includes(normalizedQuery) ||
          app.description.toLowerCase().includes(normalizedQuery),
      )
    : allApps

  return (
    <div className="flex min-h-screen flex-col bg-neutral-25">
      <CabHeader
        title=""
        logoClassName="h-14 w-auto object-contain sm:h-16 lg:h-[72px]"
      />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mb-7">
          <p className="text-small-medium uppercase tracking-[0.14em] text-primary">
            {t('cab.workspace.appHub')}
          </p>
          <h1 className="text-page-title text-text-primary mt-2">{t('cab.workspace.heroTitle')}</h1>
          <p className="mt-2 max-w-2xl text-body-2 text-neutral-600">
            {t('cab.workspace.heroSubtitle')}
          </p>
        </div>

        <label className="relative mb-8 block">
          <span className="sr-only">{t('cab.workspace.searchAria')}</span>
          <AppIcon
            icon={SearchIcon}
            size={20}
            className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('cab.workspace.searchPlaceholder')}
            className="h-12 w-full rounded-lg border border-neutral-100 bg-white ps-12 pe-4 text-body-3 text-neutral-900 shadow-md outline-none transition placeholder:text-neutral-500 focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </label>

        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-small-medium uppercase tracking-[0.1em] text-neutral-600">
            {t('cab.workspace.allApplications')}
          </h2>
          <span className="rounded-full bg-primary-subtle px-3 py-1 text-small-medium text-primary">
            {visibleApps.length}
          </span>
        </div>

        {visibleApps.length > 0 ? (
          <section aria-label={t('cab.workspace.allApplications')} className="flex flex-col gap-8">
            {flowPhases.map((phase, phaseIndex) => {
              const apps = phase.apps
                .map((key) => visibleApps.find((app) => app.key === key))
                .filter((app): app is WorkspaceApp => Boolean(app))
              if (!apps.length) return null
              return (
                <div key={phase.key}>
                  <div className="mb-3 flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-body-sm font-semibold text-white tabular-nums">
                      {phaseIndex + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="flex flex-wrap items-center gap-2 text-body-2-semibold text-text-primary">
                        {phase.title}
                        {phaseIndex === 0 && !normalizedQuery && (
                          <span className="rounded-sm bg-primary-50 px-2 py-0.5 text-caption font-medium text-primary">
                            {t('cab.workspace.startHere', 'Start here')}
                          </span>
                        )}
                      </h3>
                      <p className="text-body-3 text-text-secondary">{phase.hint}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                    {apps.map((app) => (
                      <AppTile key={app.key} app={app} step={phase.key === 'help' ? undefined : stepNumber.get(app.key)} locked={Boolean(app.route && !isPathAllowed(app.route))} />
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-white px-6 text-center">
            <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-primary-subtle text-primary">
              <AppIcon icon={SearchIcon} size={21} />
            </div>
            <h2 className="text-body-2-semibold text-neutral-900">{t('cab.workspace.noResults')}</h2>
            <p className="mt-1 text-body-3 text-neutral-600">
              {t('cab.workspace.noResultsHint')}
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-4 text-body-3-medium text-primary hover:underline"
            >
              {t('cab.workspace.clearSearch')}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

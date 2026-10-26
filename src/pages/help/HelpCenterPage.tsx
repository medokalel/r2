import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageQuestion } from 'iconsax-reactjs'
import { AppIcon, MenuIcon } from '@/components/icons'
import { CabLayout } from '@/components/layout/CabLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { PageFeedback } from '@/components/dashboard/PageFeedback'
import { HelpSearch } from '@/components/help/HelpSearch'
import { HelpNavTree } from '@/components/help/HelpNavTree'
import { HelpArticleView } from '@/components/help/HelpArticleView'
import { HelpOverview, HelpSectionView } from '@/components/help/HelpOverview'
import { AUDIENCE_ICONS } from '@/components/help/helpIcons'
import { findArticleForPath } from '@/lib/help/registry'
import { audienceForPath, helpArticlePath, helpOverviewPath } from '@/lib/help/paths'
import { readableAudiences, sessionAudience, useHelpLang, useHelpTree } from '@/lib/help/useHelp'
import { HELP_AUDIENCES, type HelpAudience } from '@/lib/help/types'
import { cn } from '@/lib/utils'

/** The app shell of the signed-in user: iHelp lives inside the workspace each audience knows. */
function Shell({ own, children }: { own: HelpAudience; children: React.ReactNode }) {
  const { t } = useTranslation()
  if (own === 'platform') {
    return (
      <PlatformLayout>
        {children}
        <PageFeedback />
      </PlatformLayout>
    )
  }
  if (own === 'client') {
    return (
      <AppLayout>
        <CabHeader title={t('help.title')} />
        <main className="flex min-w-0 flex-1 flex-col page-main">{children}</main>
      </AppLayout>
    )
  }
  return (
    <CabLayout tourId="ihelp" tourSteps={[]}>
      <CabHeader title={t('help.title')} />
      <main className="flex min-w-0 flex-1 flex-col page-main">{children}</main>
    </CabLayout>
  )
}

function AudienceSwitcher({ value, options, onChange }: { value: HelpAudience; options: HelpAudience[]; onChange: (a: HelpAudience) => void }) {
  const { t } = useTranslation()
  if (options.length < 2) return null
  return (
    <div role="radiogroup" aria-label={t('help.audience.label')} className="flex w-full flex-wrap gap-1 rounded-lg border border-border-default bg-white p-1 sm:w-auto">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={option === value}
          onClick={() => onChange(option)}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-body-sm font-medium transition-colors sm:flex-none',
            option === value ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
          )}
        >
          <AppIcon icon={AUDIENCE_ICONS[option]} size={16} />
          {t(`help.audience.${option}`)}
        </button>
      ))}
    </div>
  )
}

export function HelpCenterPage() {
  const { t } = useTranslation()
  const lang = useHelpLang()
  const tree = useHelpTree()
  const location = useLocation()
  const { section: sectionId, article: articleId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const own = sessionAudience()
  const readable = readableAudiences(own)
  const [drawerPath, setDrawerPath] = useState<string | null>(null)
  const drawerOpen = drawerPath === location.pathname + location.search

  const asked = params.get('for') as HelpAudience | null
  const from = params.get('from')
  const anchor = params.get('to')

  const section = sectionId ? HELP_AUDIENCES.flatMap((a) => tree.sections[a]).find((s) => s.id === sectionId) : undefined
  const audience: HelpAudience = section?.audience ?? (asked && readable.includes(asked) ? asked : own)
  const article = section && articleId ? section.articles.find((a) => a.id === articleId) : undefined

  useEffect(() => {
    if (!anchor) return
    const id = window.setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    return () => window.clearTimeout(id)
  }, [anchor, articleId])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setDrawerPath(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  useEffect(() => {
    if (!article && !section) document.title = 'iHelp'
  }, [article, section])

  // Context help (?from=/cab/offers): open the article that documents that screen.
  if (from) {
    const contextAudience = asked && readable.includes(asked) ? asked : (audienceForPath(from) && readable.includes(audienceForPath(from)!) ? audienceForPath(from)! : own)
    const match = findArticleForPath(tree, contextAudience, from)
    const matchSection = match ? tree.sectionOf.get(`${contextAudience}:${match.id}`) : undefined
    return <Navigate replace to={match && matchSection ? helpArticlePath(matchSection.id, match.id) : helpOverviewPath(contextAudience)} />
  }

  // A section of an audience the user may not read falls back to the overview.
  if (section && !readable.includes(section.audience)) return <Navigate replace to={helpOverviewPath(own)} />

  const switchAudience = (next: HelpAudience) => {
    navigate(helpOverviewPath(next === own ? undefined : next))
  }

  const nav = (onNavigate?: () => void) => (
    <HelpNavTree sections={tree.sections[audience]} audience={audience} lang={lang} activeSectionId={section?.id} activeArticleId={article?.id} onNavigate={onNavigate} />
  )

  let body: React.ReactNode
  if (article && section) body = <HelpArticleView tree={tree} audience={audience} section={section} article={article} lang={lang} />
  else if (section && !articleId) body = <HelpSectionView section={section} audience={audience} lang={lang} />
  else if (sectionId)
    body = (
      <div className="rounded-lg border border-dashed border-border-strong bg-white px-6 py-12 text-center">
        <h1 className="text-section-title text-text-primary">{t('help.notFound.title')}</h1>
        <p className="mt-2 text-body-sm text-text-secondary">{t('help.notFound.body')}</p>
        <Link to={helpOverviewPath(audience)} className="mt-4 inline-block text-body-sm font-semibold text-primary hover:underline">
          {t('help.notFound.back')}
        </Link>
      </div>
    )
  else body = <HelpOverview tree={tree} audience={audience} lang={lang} />

  return (
    <Shell own={own}>
      <div className="mx-auto flex w-full max-w-[1440px] min-w-0 flex-col gap-6">
        <section className="relative z-20 rounded-2xl border border-primary-100 bg-bg-brand-light px-4 py-5 sm:px-6 sm:py-6">
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <span className="absolute -end-16 -top-20 size-56 rounded-full bg-primary-100/60" />
            <span className="absolute -bottom-24 end-40 size-40 rounded-full bg-primary-50" />
          </span>
          <div className="relative flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-md">
                  <AppIcon icon={MessageQuestion} size={26} variant="Bold" />
                </span>
                <div className="min-w-0">
                  <p className="text-h3-bold leading-tight text-text-primary">
                    <span dir="ltr">
                      i<span className="text-primary">Help</span>
                    </span>
                  </p>
                  <p className="text-body-sm text-text-secondary">{t('help.tagline')}</p>
                </div>
              </div>
              <AudienceSwitcher value={audience} options={readable} onChange={switchAudience} />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerPath(location.pathname + location.search)}
                aria-label={t('help.nav.open')}
                aria-expanded={drawerOpen}
                className="flex h-14 shrink-0 items-center gap-2 rounded-lg border border-border-default bg-white px-3 text-body-sm font-semibold text-text-primary hover:border-primary hover:text-primary xl:hidden"
              >
                <AppIcon icon={MenuIcon} size={22} />
                <span className="hidden sm:inline">{t('help.nav.open')}</span>
              </button>
              <HelpSearch tree={tree} audience={audience} lang={lang} />
            </div>
          </div>
        </section>

        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[264px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border-default bg-white p-3">{nav()}</div>
          </aside>
          <div className="@container min-w-0">{body}</div>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-[1500] xl:hidden">
          <div className="absolute inset-0 bg-surface-overlay/50" onClick={() => setDrawerPath(null)} aria-hidden />
          <aside className="absolute inset-y-0 start-0 flex w-[300px] max-w-[88vw] flex-col bg-white shadow-2xl" aria-label={t('help.nav.label')}>
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <span className="text-body-1-semibold text-text-primary">{t('help.nav.open')}</span>
              <button type="button" onClick={() => setDrawerPath(null)} aria-label={t('help.nav.close')} className="flex size-9 items-center justify-center rounded-md text-icon-secondary hover:bg-bg-hover">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">{nav(() => setDrawerPath(null))}</div>
          </aside>
        </div>
      )}
    </Shell>
  )
}

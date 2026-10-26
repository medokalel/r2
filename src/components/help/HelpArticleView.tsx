import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import i18n from 'i18next'
import {
  ArrowLeft2,
  ArrowRight2,
  Calendar1,
  Clock,
  CloseCircle,
  ExportSquare,
  Flash,
  Location,
  MagicStar,
  Profile2User,
  SearchZoomIn,
  TickCircle,
} from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Alert } from '@/components/ui/Alert'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { HelpStatusChip } from '@/components/help/HelpStatusChip'
import { HelpRichText } from '@/components/help/HelpRichText'
import { HELP_SCREENSHOTS } from '@/content/help'
import { formatDate } from '@/lib/format/dates'
import { helpArticlePath, helpOverviewPath, helpSectionPath } from '@/lib/help/paths'
import type { HelpArticle, HelpSection, HelpTree } from '@/lib/help/registry'
import { flatArticles } from '@/lib/help/registry'
import { statusRows } from '@/lib/help/statuses'
import { tourStepsFromResource } from '@/lib/help/tours'
import type { HelpAudience, HelpLang } from '@/lib/help/types'
import { cn } from '@/lib/utils'

interface Props {
  tree: HelpTree
  audience: HelpAudience
  section: HelpSection
  article: HelpArticle
  lang: HelpLang
}

const cardClass = 'rounded-lg border border-border-default bg-white p-4 sm:p-6'

function Heading({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-body-1-semibold text-text-primary">
      {children}
    </h2>
  )
}

function Bullets({ items, icon = TickCircle, tone = 'text-success-600' }: { items: string[]; icon?: typeof TickCircle; tone?: string }) {
  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2.5 text-body-sm leading-relaxed text-text-primary">
          <AppIcon icon={icon} size={18} className={cn('mt-0.5 shrink-0', tone)} variant="Bulk" />
          <span><HelpRichText text={item} /></span>
        </li>
      ))}
    </ul>
  )
}

function Screenshot({ id, lang, title }: { id: string; lang: HelpLang; title: string }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  if (failed || !HELP_SCREENSHOTS[lang].includes(id)) return null
  const src = `${import.meta.env.BASE_URL}help/${lang}/${id}.webp`
  const alt = t('help.article.screenshot', { title })
  return (
    <Dialog.Root>
      <figure className="group relative overflow-hidden rounded-lg border border-border-default bg-bg-secondary">
        <Dialog.Trigger asChild>
          <button type="button" className="block w-full cursor-zoom-in" aria-label={t('help.article.zoom')}>
            <img src={src} alt={alt} loading="lazy" decoding="async" width={1200} height={750} onError={() => setFailed(true)} className="block h-auto w-full" />
            <span className="absolute end-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/95 text-primary shadow-md transition-transform group-hover:scale-105">
              <AppIcon icon={SearchZoomIn} size={18} />
            </span>
          </button>
        </Dialog.Trigger>
      </figure>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[2000] bg-surface-overlay/80" />
        <Dialog.Content className="fixed inset-2 z-[2001] flex flex-col items-center justify-center focus:outline-none sm:inset-6" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          <img src={src} alt={alt} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" />
          <Dialog.Close
            aria-label={t('help.article.closeZoom')}
            className="absolute end-2 top-2 flex size-10 items-center justify-center rounded-full bg-white text-text-primary shadow-lg hover:text-primary"
          >
            <AppIcon icon={CloseCircle} size={22} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Fact({ icon, label, value }: { icon: typeof Profile2User; label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-bg-brand-light text-icon-brand">
        <AppIcon icon={icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-caption font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
        <p className="mt-0.5 break-words text-body-sm text-text-primary"><HelpRichText text={value} /></p>
      </div>
    </div>
  )
}

/** Finds where an article lives for a reader of `audience` (its own audience first). */
function locate(tree: HelpTree, audience: HelpAudience, articleId: string): string | undefined {
  const own = tree.sectionOf.get(`${audience}:${articleId}`)
  if (own) return helpArticlePath(own.id, articleId)
  const article = tree.articles.get(articleId)
  const other = article?.audiences.map((a) => tree.sectionOf.get(`${a}:${articleId}`)).find(Boolean)
  return other ? helpArticlePath(other.id, articleId) : undefined
}

export function HelpArticleView({ tree, audience, section, article, lang }: Props) {
  const { t } = useTranslation()
  const text = article.text[lang]
  const rows = statusRows(t, article.statusDomain, text.statuses, article.statusValues)

  const order = useMemo(() => flatArticles(tree, audience), [tree, audience])
  const index = order.findIndex((a) => a.id === article.id)
  const prev = index > 0 ? order[index - 1] : undefined
  const next = index >= 0 && index < order.length - 1 ? order[index + 1] : undefined
  const sectionFor = (a: HelpArticle) => tree.sectionOf.get(`${audience}:${a.id}`)?.id ?? section.id

  const tourSteps = article.tourPrefix ? tourStepsFromResource(i18n.getResource(lang, 'translation', article.tourPrefix)) : []
  const related = (article.related ?? [])
    .map((id) => ({ id, to: locate(tree, audience, id), article: tree.articles.get(id) }))
    .filter((r): r is { id: string; to: string; article: HelpArticle } => Boolean(r.to && r.article))

  const toc = [
    text.steps?.length && { id: 'steps', label: t('help.article.steps') },
    text.fields?.length && { id: 'fields', label: t('help.article.fields') },
    rows.length && { id: 'statuses', label: t('help.article.statuses') },
    text.rules?.length && { id: 'rules', label: t('help.article.rules') },
    ...(text.sections ?? []).map((s) => ({ id: s.id, label: s.title })),
  ].filter(Boolean) as Array<{ id: string; label: string }>

  useEffect(() => {
    document.title = `${text.title} · iHelp`
  }, [text.title])

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_220px]">
      <article className="flex min-w-0 flex-col gap-5">
        <Breadcrumbs
          items={[
            { label: t('help.title'), to: helpOverviewPath(audience) },
            { label: section.title[lang], to: helpSectionPath(section.id) },
            { label: text.title },
          ]}
        />

        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {article.stub ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-3 py-1 text-caption font-semibold text-warning-700">
                <AppIcon icon={MagicStar} size={14} />
                {t('help.article.autoGenerated')}
              </span>
            ) : (
              article.updated && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-secondary px-3 py-1 text-caption font-medium text-text-secondary">
                  <AppIcon icon={Clock} size={14} />
                  {t('help.article.lastUpdated', { date: formatDate(article.updated, lang) })}
                </span>
              )
            )}
          </div>
          <h1 className="text-page-title text-text-primary">{text.title}</h1>
          <p className="max-w-3xl text-body-2 leading-relaxed text-text-secondary"><HelpRichText text={text.summary} /></p>
          {article.open && (
            <div>
              <Link to={article.open} className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'h-10 px-4')}>
                <AppIcon icon={ExportSquare} size={18} />
                {t('help.article.open')}
              </Link>
            </div>
          )}
        </header>

        {article.stub && <Alert tone="warning">{t('help.article.stubNote')}</Alert>}

        {(text.who || text.when || text.nav) && (
          <section className={cn(cardClass, 'grid grid-cols-1 gap-5 @3xl:grid-cols-3')}>
            <Fact icon={Profile2User} label={t('help.article.who')} value={text.who} />
            <Fact icon={Calendar1} label={t('help.article.when')} value={text.when} />
            <Fact icon={Location} label={t('help.article.where')} value={text.nav} />
          </section>
        )}

        <Screenshot id={article.id} lang={lang} title={text.title} />

        {text.screen?.length ? (
          <section className={cardClass}>
            <Heading>{t('help.article.onScreen')}</Heading>
            <ol className="mt-3 grid grid-cols-1 gap-2.5 @3xl:grid-cols-2">
              {text.screen.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-body-sm text-text-primary">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-primary-200 bg-primary-25 text-caption font-semibold text-primary tabular-nums">{i + 1}</span>
                  <span className="pt-0.5"><HelpRichText text={item} /></span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {text.steps?.length ? (
          <section className={cardClass}>
            <Heading id="steps">{t('help.article.steps')}</Heading>
            <ol className="mt-4 flex flex-col">
              {text.steps.map((step, i) => (
                <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < text.steps!.length - 1 && <span aria-hidden className="absolute start-[15px] top-8 bottom-0 w-px bg-border-default" />}
                  <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-body-sm font-semibold text-white tabular-nums">{i + 1}</span>
                  <p className="pt-1 text-body-sm leading-relaxed text-text-primary"><HelpRichText text={step} /></p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {text.fields?.length ? (
          <section className={cardClass}>
            <Heading id="fields">{t('help.article.fields')}</Heading>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-start text-body-sm">
                <thead>
                  <tr className="border-b border-border-default text-caption uppercase tracking-wide text-text-secondary">
                    <th scope="col" className="w-2/5 py-2 pe-4 text-start font-semibold">{t('help.article.field')}</th>
                    <th scope="col" className="py-2 text-start font-semibold">{t('help.article.meaning')}</th>
                  </tr>
                </thead>
                <tbody>
                  {text.fields.map(([field, meaning], i) => (
                    <tr key={i} className="border-b border-border-subtle last:border-0">
                      <th scope="row" className="py-2.5 pe-4 text-start align-top font-semibold text-text-primary">{field}</th>
                      <td className="py-2.5 align-top text-text-secondary"><HelpRichText text={meaning} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {rows.length ? (
          <section className={cardClass}>
            <Heading id="statuses">{t('help.article.statuses')}</Heading>
            <ul className="mt-3 flex flex-col divide-y divide-border-subtle">
              {rows.map((row, i) => (
                <li key={`${row.value ?? row.label}-${i}`} className="flex flex-col gap-1.5 py-2.5 sm:flex-row sm:items-center sm:gap-4">
                  <span className="sm:w-48 sm:shrink-0">
                    <HelpStatusChip domain={article.statusDomain} value={row.value} label={row.label} />
                  </span>
                  {row.description && <span className="text-body-sm text-text-secondary"><HelpRichText text={row.description} /></span>}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {text.rules?.length ? (
          <section className={cardClass}>
            <Heading id="rules">{t('help.article.rules')}</Heading>
            <Bullets items={text.rules} />
          </section>
        ) : null}

        {text.after?.length ? (
          <section className={cardClass}>
            <Heading>{t('help.article.after')}</Heading>
            <Bullets items={text.after} icon={Flash} tone="text-primary" />
          </section>
        ) : null}

        {text.handoff && <Alert tone="info" title={t('help.article.handoff')}><HelpRichText text={text.handoff} /></Alert>}
        {text.warnings?.map((warning, i) => (
          <Alert key={`w${i}`} tone="warning" title={t('help.article.warning')}><HelpRichText text={warning} /></Alert>
        ))}
        {text.tips?.length ? (
          <Alert tone="success" title={t('help.article.tips')}>
            {text.tips.length === 1 ? (
              <HelpRichText text={text.tips[0]} />
            ) : (
              <ul className="list-disc ps-4">
                {text.tips.map((tip, i) => <li key={i}><HelpRichText text={tip} /></li>)}
              </ul>
            )}
          </Alert>
        ) : null}

        {text.sections?.length ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-section-title text-text-primary">{t('help.article.details')}</h2>
            {text.sections.map((sub) => (
              <div key={sub.id} id={sub.id} className={cn(cardClass, 'scroll-mt-24')}>
                <h3 className="text-body-1-semibold text-text-primary">{sub.title}</h3>
                <Bullets items={sub.bullets} icon={ArrowRight2} tone="text-icon-brand rtl:-scale-x-100" />
              </div>
            ))}
          </section>
        ) : null}

        {tourSteps.length ? (
          <section className={cardClass}>
            <Heading>{t('help.article.tour')}</Heading>
            <ol className="mt-3 flex flex-col gap-3">
              {tourSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-25 text-caption font-semibold text-primary tabular-nums">{i + 1}</span>
                  <div>
                    <p className="text-body-sm font-semibold text-text-primary">{step.title}</p>
                    <p className="text-body-sm text-text-secondary">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {related.length ? (
          <section>
            <h2 className="mb-3 text-body-1-semibold text-text-primary">{t('help.article.related')}</h2>
            <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2">
              {related.map((r) => (
                <Link key={r.id} to={r.to} className="group rounded-lg border border-border-default bg-white p-4 transition hover:border-primary-200 hover:shadow-md">
                  <p className="text-body-sm font-semibold text-text-primary group-hover:text-primary">{r.article.text[lang].title}</p>
                  <p className="mt-1 line-clamp-2 text-caption text-text-secondary">{r.article.text[lang].summary}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <nav aria-label={t('help.nav.label')} className="grid grid-cols-1 gap-3 @xl:grid-cols-2">
          {prev ? (
            <Link to={helpArticlePath(sectionFor(prev), prev.id)} className="group flex items-center gap-3 rounded-lg border border-border-default bg-white p-4 transition hover:border-primary-200 hover:shadow-md">
              <AppIcon icon={ArrowLeft2} size={20} className="shrink-0 text-icon-brand rtl:-scale-x-100" />
              <span className="min-w-0">
                <span className="block text-caption text-text-secondary">{t('help.article.previous')}</span>
                <span className="block truncate text-body-sm font-semibold text-text-primary group-hover:text-primary">{prev.text[lang].title}</span>
              </span>
            </Link>
          ) : (
            <span className="hidden @xl:block" />
          )}
          {next && (
            <Link to={helpArticlePath(sectionFor(next), next.id)} className="group flex items-center justify-end gap-3 rounded-lg border border-border-default bg-white p-4 text-end transition hover:border-primary-200 hover:shadow-md">
              <span className="min-w-0">
                <span className="block text-caption text-text-secondary">{t('help.article.next')}</span>
                <span className="block truncate text-body-sm font-semibold text-text-primary group-hover:text-primary">{next.text[lang].title}</span>
              </span>
              <AppIcon icon={ArrowRight2} size={20} className="shrink-0 text-icon-brand rtl:-scale-x-100" />
            </Link>
          )}
        </nav>
      </article>

      {toc.length > 1 && (
        <aside className="hidden 2xl:block">
          <div className="sticky top-6 rounded-lg border border-border-default bg-white p-4">
            <p className="text-caption font-semibold uppercase tracking-wide text-text-secondary">{t('help.article.inThisArticle')}</p>
            <ul className="mt-2 flex flex-col gap-1 text-body-sm">
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} onClick={(event) => { event.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} className="block rounded-sm px-2 py-1 text-text-secondary hover:bg-bg-hover hover:text-primary">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  )
}

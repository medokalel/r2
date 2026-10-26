import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight2, Flash, Routing2 } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { sectionIcon } from '@/components/help/helpIcons'
import { HelpRichText } from '@/components/help/HelpRichText'
import { HELP_CHANGELOG, HELP_GETTING_STARTED } from '@/content/help'
import { formatDate } from '@/lib/format/dates'
import { helpArticlePath, helpOverviewPath, helpSectionPath } from '@/lib/help/paths'
import type { HelpSection, HelpTree } from '@/lib/help/registry'
import type { HelpAudience, HelpLang } from '@/lib/help/types'

interface Props {
  tree: HelpTree
  audience: HelpAudience
  lang: HelpLang
}

function SectionCard({ section, lang }: { section: HelpSection; lang: HelpLang }) {
  const { t } = useTranslation()
  return (
    <div className="group flex flex-col rounded-lg border border-border-default bg-white p-5 transition hover:border-primary-200 hover:shadow-md">
      <Link to={helpSectionPath(section.id)} className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-bg-brand-light text-icon-brand transition-colors group-hover:bg-primary group-hover:text-white">
          <AppIcon icon={sectionIcon(section.id)} size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body-1-semibold text-text-primary group-hover:text-primary">{section.title[lang]}</span>
          <span className="mt-0.5 block text-caption font-medium text-text-secondary">{t('help.overview.articles', { count: section.articles.length })}</span>
        </span>
      </Link>
      {section.description[lang] && <p className="mt-3 line-clamp-2 text-body-sm text-text-secondary">{section.description[lang]}</p>}
      <ul className="mt-3 flex flex-col gap-1 border-t border-border-subtle pt-3">
        {section.articles.slice(0, 3).map((article) => (
          <li key={article.id}>
            <Link to={helpArticlePath(section.id, article.id)} className="flex items-center gap-1.5 text-body-sm text-text-primary hover:text-primary">
              <AppIcon icon={ArrowRight2} size={14} className="shrink-0 text-icon-secondary rtl:-scale-x-100" />
              <span className="truncate">{article.text[lang].title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The iHelp home of one audience: getting-started path, topic cards and what's new. */
export function HelpOverview({ tree, audience, lang }: Props) {
  const { t } = useTranslation()
  const [allNews, setAllNews] = useState(false)
  const sections = tree.sections[audience]
  const path = HELP_GETTING_STARTED[audience]
    .map((id) => ({ id, section: tree.sectionOf.get(`${audience}:${id}`), article: tree.articles.get(id) }))
    .filter((step) => step.section && step.article)
  const news = HELP_CHANGELOG.filter((entry) => entry.audience.includes(audience)).sort((a, b) => b.date.localeCompare(a.date))
  const shownNews = allNews ? news : news.slice(0, 5)

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <Breadcrumbs items={[{ label: t('help.title'), to: helpOverviewPath(audience) }, { label: t(`help.audience.${audience}`) }]} />
      <div>
        <h1 className="text-page-title text-text-primary">{t(`help.overview.${audience}.title`)}</h1>
        <p className="mt-1 max-w-3xl text-body-2 text-text-secondary">{t(`help.overview.${audience}.subtitle`)}</p>
      </div>

      {path.length > 0 && (
        <section aria-labelledby="help-start">
          <div className="mb-3 flex items-center gap-2">
            <AppIcon icon={Routing2} size={20} className="text-icon-brand" />
            <h2 id="help-start" className="text-section-title text-text-primary">{t('help.overview.gettingStarted')}</h2>
          </div>
          <p className="mb-3 text-body-sm text-text-secondary">{t('help.overview.gettingStartedHint')}</p>
          <ol className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
            {path.map((step, index) => (
              <li key={step.id}>
                <Link
                  to={helpArticlePath(step.section!.id, step.id)}
                  className="group flex h-full items-start gap-3 rounded-lg border border-border-default bg-white p-4 transition hover:border-primary-200 hover:shadow-md"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-body-sm font-semibold text-white tabular-nums">{index + 1}</span>
                  <span className="min-w-0">
                    <span className="block text-body-sm font-semibold text-text-primary group-hover:text-primary">{step.article!.text[lang].title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-caption text-text-secondary"><HelpRichText text={step.article!.text[lang].summary} /></span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="help-browse">
        <h2 id="help-browse" className="mb-3 text-section-title text-text-primary">{t('help.overview.browse')}</h2>
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
          {sections.map((section) => (
            <SectionCard key={section.id} section={section} lang={lang} />
          ))}
        </div>
      </section>

      {news.length > 0 && (
        <section aria-labelledby="help-news" className="rounded-lg border border-border-default bg-white p-5 sm:p-6">
          <div className="mb-1 flex items-center gap-2">
            <AppIcon icon={Flash} size={20} className="text-warning-500" variant="Bold" />
            <h2 id="help-news" className="text-section-title text-text-primary">{t('help.overview.whatsNew')}</h2>
          </div>
          <p className="mb-4 text-body-sm text-text-secondary">{t('help.overview.whatsNewHint')}</p>
          <ol className="flex flex-col">
            {shownNews.map((entry) => {
              const section = entry.article ? tree.sectionOf.get(`${audience}:${entry.article}`) : undefined
              const title = entry.text[lang].title
              return (
                <li key={entry.id} className="relative flex gap-4 border-s-2 border-border-default pb-5 ps-5 last:pb-0">
                  <span aria-hidden className="absolute -start-[7px] top-1.5 size-3 rounded-full border-2 border-white bg-primary" />
                  <div className="min-w-0">
                    <p className="text-caption font-semibold text-text-brand">{formatDate(entry.date, lang)}</p>
                    {section ? (
                      <Link to={helpArticlePath(section.id, entry.article!)} className="text-body-sm font-semibold text-text-primary hover:text-primary hover:underline">
                        {title}
                      </Link>
                    ) : (
                      <p className="text-body-sm font-semibold text-text-primary">{title}</p>
                    )}
                    <p className="mt-0.5 text-body-sm text-text-secondary">{entry.text[lang].body}</p>
                  </div>
                </li>
              )
            })}
          </ol>
          {news.length > 5 && (
            <button type="button" onClick={() => setAllNews((v) => !v)} className="mt-4 text-body-sm font-semibold text-primary hover:underline">
              {allNews ? t('help.overview.showLess') : t('help.overview.showAll')}
            </button>
          )}
        </section>
      )}
    </div>
  )
}

/** One topic: its description and every article in it. */
export function HelpSectionView({ section, audience, lang }: { section: HelpSection; audience: HelpAudience; lang: HelpLang }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Breadcrumbs items={[{ label: t('help.title'), to: helpOverviewPath(audience) }, { label: section.title[lang] }]} />
      <div className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-bg-brand-light text-icon-brand">
          <AppIcon icon={sectionIcon(section.id)} size={28} />
        </span>
        <div>
          <h1 className="text-page-title text-text-primary">{section.title[lang]}</h1>
          {section.description[lang] && <p className="mt-1 text-body-2 text-text-secondary">{section.description[lang]}</p>}
        </div>
      </div>
      <section aria-label={t('help.section.articles')} className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
        {section.articles.map((article) => (
          <Link
            key={article.id}
            to={helpArticlePath(section.id, article.id)}
            className="group flex flex-col rounded-lg border border-border-default bg-white p-4 transition hover:border-primary-200 hover:shadow-md"
          >
            <span className="flex items-center gap-2 text-body-1-semibold text-text-primary group-hover:text-primary">
              {article.text[lang].title}
              {article.stub && <span className="rounded-full bg-warning-50 px-2 py-0.5 text-caption font-semibold text-warning-700">{t('help.article.autoGenerated')}</span>}
            </span>
            <span className="mt-1 line-clamp-2 text-body-sm text-text-secondary"><HelpRichText text={article.text[lang].summary} /></span>
          </Link>
        ))}
      </section>
    </div>
  )
}

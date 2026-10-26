import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AgreementSection } from '@/lib/api/agreementsApi'
import { cn } from '@/lib/utils'

interface AgreementDocumentViewProps {
  title: string
  reference: string
  sections: AgreementSection[]
  /** Small line under the title (client, version, status …). */
  meta?: string
}

/**
 * The agreement text as the parties read it. Both languages are part of the signed document;
 * the reader switches between them (each shown in its own direction).
 */
export function AgreementDocumentView({ title, reference, sections, meta }: AgreementDocumentViewProps) {
  const { t, i18n } = useTranslation()
  const [lang, setLang] = useState<'en' | 'ar'>(i18n.language.startsWith('ar') ? 'ar' : 'en')
  const rtl = lang === 'ar'

  return (
    <section className="min-w-0 rounded-lg border border-neutral-100 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 sm:px-5">
        <h2 className="text-body font-semibold text-neutral-900">{t('agreements.document.title')}</h2>
        <div role="tablist" aria-label={t('agreements.document.language')} className="inline-flex rounded-md bg-neutral-25 p-1 ring-1 ring-neutral-100">
          {(['en', 'ar'] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={lang === key}
              onClick={() => setLang(key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-body-sm font-semibold transition-colors',
                lang === key ? 'bg-white text-primary shadow-card' : 'text-text-secondary hover:text-primary',
              )}
            >
              {key === 'en' ? 'English' : 'العربية'}
            </button>
          ))}
        </div>
      </div>
      <article dir={rtl ? 'rtl' : 'ltr'} lang={lang} className={cn('flex flex-col gap-5 px-4 py-5 sm:px-8 sm:py-7', rtl && 'font-arabic')}>
        <header className="flex flex-col gap-1 border-b border-neutral-100 pb-4 text-center">
          <p className="text-h3 font-bold text-neutral-900">{title}</p>
          <p className="text-body-sm text-neutral-600" dir="ltr">
            {reference}
          </p>
          {meta && <p className="text-caption text-neutral-500">{meta}</p>}
        </header>
        <ol className="flex flex-col gap-5">
          {sections.map((section, index) => (
            <li key={section.key} className="flex flex-col gap-2">
              <h3 className="text-body font-semibold text-primary">
                {index + 1}. {section.title[lang]}
              </h3>
              <p className="whitespace-pre-line text-body-sm leading-7 text-neutral-800">{section.body[lang]}</p>
            </li>
          ))}
        </ol>
      </article>
    </section>
  )
}

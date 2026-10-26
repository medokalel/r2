import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SearchNormal1, CloseCircle, DocumentText, ArrowRight2 } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { HelpHighlight } from '@/components/help/HelpHighlight'
import { buildSearchIndex, searchHelp, searchTokens } from '@/lib/help/search'
import { helpArticlePath } from '@/lib/help/paths'
import type { HelpTree } from '@/lib/help/registry'
import type { HelpAudience, HelpLang } from '@/lib/help/types'
import { cn } from '@/lib/utils'

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

/** Instant search over the current audience's guide, in the current language. Ctrl/Cmd+K focuses it. */
export function HelpSearch({ tree, audience, lang }: { tree: HelpTree; audience: HelpAudience; lang: HelpLang }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const docs = useMemo(() => buildSearchIndex(tree, audience, lang), [tree, audience, lang])
  const tokens = useMemo(() => searchTokens(query), [query])
  const hits = useMemo(() => searchHelp(docs, query), [docs, query])
  const sectionTitle = useMemo(() => {
    const map = new Map(tree.sections[audience].map((section) => [section.id, section.title[lang]]))
    return (id: string) => map.get(id) ?? ''
  }, [tree, audience, lang])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
        setOpen(true)
      }
    }
    const onDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [])

  const go = (index: number) => {
    const hit = hits[index]
    if (!hit) return
    navigate(helpArticlePath(hit.doc.sectionId, hit.doc.articleId, hit.doc.anchor))
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      go(active)
    } else if (event.key === 'Escape') {
      if (query) setQuery('')
      else inputRef.current?.blur()
      setOpen(false)
    }
  }

  const showPanel = open && tokens.length > 0
  const activeId = showPanel && hits[active] ? `${listId}-${active}` : undefined

  return (
    <div ref={wrapRef} className="relative w-full">
      <label className="relative block">
        <span className="sr-only">{t('help.search.label')}</span>
        <AppIcon icon={SearchNormal1} size={20} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-icon-secondary" />
        <input
          ref={inputRef}
          type="search"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t('help.search.placeholder')}
          className="h-14 w-full rounded-lg border border-border-default bg-white ps-12 pe-12 text-start sm:pe-24 text-body text-text-primary shadow-sm outline-none transition placeholder:text-text-placeholder focus:border-primary focus:ring-4 focus:ring-primary/10 [&::-webkit-search-cancel-button]:hidden"
        />
        <span className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-sm border border-border-default bg-bg-secondary px-2 py-0.5 text-caption font-medium text-text-secondary sm:flex" aria-hidden>
          <bdi dir="ltr">{isMac() ? '⌘ K' : t('help.search.shortcut')}</bdi>
        </span>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label={t('help.search.clear')}
            className="absolute end-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-icon-secondary hover:text-primary sm:end-20"
          >
            <AppIcon icon={CloseCircle} size={18} />
          </button>
        )}
      </label>

      {showPanel && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-lg border border-border-default bg-white shadow-lg">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-2 text-caption text-text-secondary">
            <span role="status">{t('help.search.results', { count: hits.length })}</span>
            <span className="hidden sm:inline">{t('help.search.keyboardHint')}</span>
          </div>
          {hits.length ? (
            <ul id={listId} role="listbox" aria-label={t('help.search.label')} className="max-h-[min(60vh,28rem)] overflow-y-auto py-1">
              {hits.map((hit, index) => (
                <li
                  key={`${hit.doc.articleId}-${hit.doc.anchor ?? ''}`}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    go(index)
                  }}
                  className={cn('flex cursor-pointer items-start gap-3 px-4 py-3', index === active && 'bg-bg-brand-light')}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-25 text-primary">
                    <AppIcon icon={DocumentText} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-caption text-text-secondary">
                      {sectionTitle(hit.doc.sectionId)}
                      {hit.doc.parentTitle ? ` · ${hit.doc.parentTitle}` : ''}
                    </span>
                    <span className="block text-body-sm font-semibold text-text-primary">
                      <HelpHighlight text={hit.doc.title} tokens={tokens} />
                    </span>
                    {hit.snippet && (
                      <span className="mt-0.5 line-clamp-2 block text-caption text-text-secondary">
                        <HelpHighlight text={hit.snippet} tokens={tokens} />
                      </span>
                    )}
                  </span>
                  <AppIcon icon={ArrowRight2} size={16} className="mt-2 shrink-0 text-icon-secondary rtl:-scale-x-100" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-body-sm font-semibold text-text-primary">{t('help.search.noResults', { query: query.trim() })}</p>
              <p className="mt-1 text-caption text-text-secondary">{t('help.search.noResultsHint')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

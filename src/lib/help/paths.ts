import type { HelpAudience } from '@/lib/help/types'

/** URLs of iHelp. Kept free of content imports so headers can link to iHelp cheaply. */
export const HELP_BASE = '/help'

export const helpArticlePath = (sectionId: string, articleId: string, anchor?: string) =>
  `${HELP_BASE}/${encodeURIComponent(sectionId)}/${encodeURIComponent(articleId)}${anchor ? `?to=${encodeURIComponent(anchor)}` : ''}`

export const helpSectionPath = (sectionId: string) => `${HELP_BASE}/${encodeURIComponent(sectionId)}`

export const helpOverviewPath = (audience?: HelpAudience) => (audience ? `${HELP_BASE}?for=${audience}` : HELP_BASE)

/** Context help: iHelp resolves `from` to the article that documents that screen. */
export const helpContextPath = (fromPath: string, audience?: HelpAudience) => {
  const params = new URLSearchParams({ from: fromPath })
  if (audience) params.set('for', audience)
  return `${HELP_BASE}?${params.toString()}`
}

/** Audience implied by where the user is: portal pages are the client guide, console pages the platform guide. */
export function audienceForPath(pathname: string): HelpAudience | undefined {
  if (pathname === '/platform' || pathname.startsWith('/platform/')) return 'platform'
  if (pathname === '/portal' || pathname.startsWith('/portal/')) return 'client'
  return undefined
}

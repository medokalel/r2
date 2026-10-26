/**
 * iHelp content model. Articles are plain data (src/content/help/*), never hand-written pages:
 * the help center renders them, indexes them for search and maps them to app routes.
 */

export type HelpLang = 'en' | 'ar'
export type HelpAudience = 'cab' | 'client' | 'platform'

export const HELP_LANGS: HelpLang[] = ['en', 'ar']
export const HELP_AUDIENCES: HelpAudience[] = ['cab', 'client', 'platform']

/** A titled block of bullets inside an article (a sub-topic, shown with its own anchor). */
export interface HelpSectionText {
  id: string
  title: string
  bullets: string[]
}

/** Everything a reader sees, in one language. EN and AR must have the same shape (tested). */
export interface HelpText {
  title: string
  summary: string
  who?: string
  when?: string
  /** Where to find it: menu path in words. */
  nav?: string
  /** "On this screen": what each marked area of the screen is for. */
  screen?: string[]
  steps?: string[]
  /** [field, what it means] */
  fields?: [string, string][]
  rules?: string[]
  /** [status label, what it means]; matched to enum values through `statusValues`. */
  statuses?: [string, string][]
  /** What happens next. */
  after?: string[]
  tips?: string[]
  warnings?: string[]
  /** What the other party (client or CAB) sees or does next. */
  handoff?: string
  sections?: HelpSectionText[]
  /** Extra words people may search with (synonyms, abbreviations). */
  keywords?: string[]
}

/** Status domains whose values come from the app's real enums (see lib/help/statuses.ts). */
export type HelpStatusDomain =
  | 'application'
  | 'quotation'
  | 'quotationApproval'
  | 'offer'
  | 'cabInvoice'
  | 'nonconformity'
  | 'certificate'
  | 'lifecycle'
  | 'cycleRequest'
  | 'zatca'
  | 'subscription'
  | 'platformInvoice'

/** Where the screenshot script opens the article's screen (demo data ids are fine here). */
export interface HelpCapture {
  as: HelpAudience
  route: string
}

export interface HelpArticleSource {
  /** Unique, stable, URL-safe id (also the screenshot file name). */
  id: string
  /** Audience(s) whose guide lists the article. */
  audience: HelpAudience | HelpAudience[]
  /** Section key inside the audience (e.g. 'setup', 'start', 'billing'), or one per audience. */
  section: string | Partial<Record<HelpAudience, string>>
  /** Route patterns this article documents (react-router syntax, e.g. '/cab/invoices/:invoiceId'). */
  routes: string[]
  /** Concrete route for the "Open this screen" button (no params). Omit when the screen cannot be opened directly. */
  open?: string
  /** Sidebar / workspace / portal / console item ids (label keys or tile keys) this article documents. */
  navIds?: string[]
  /** Renders a generated status table with the app's chips. */
  statusDomain?: HelpStatusDomain
  /** Enum value for each row of text.*.statuses (same order); null when a row has no enum value. */
  statusValues?: (string | null)[]
  /** Guided-tour copy to show (i18n key prefix holding {title, description} pairs). */
  tourPrefix?: string
  /** ISO date of the last content change. */
  updated: string
  capture?: HelpCapture
  /** Ids of related articles (any audience). */
  related?: string[]
  text: Record<HelpLang, HelpText>
}

export interface HelpChangelogEntry {
  id: string
  /** ISO date of the release. */
  date: string
  audience: HelpAudience[]
  /** Article id the entry links to (optional). */
  article?: string
  /** Module / nav id the change belongs to (optional, for filtering). */
  module?: string
  text: Record<HelpLang, { title: string; body: string }>
}

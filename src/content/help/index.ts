import type { HelpArticleSource, HelpAudience } from '@/lib/help/types'
import { CAB_GUIDE_ARTICLES } from './guide-cab'
import { CLIENT_GUIDE_ARTICLES } from './guide-client'
import { CAB_ARTICLES } from './articles-cab'
import { SHARED_ARTICLES } from './articles-shared'
import { PLATFORM_ARTICLES } from './articles-platform'
import { SSO_ARTICLES } from './articles-sso'
import { IMPORT_ARTICLES } from './articles-imports'
import { AGREEMENT_ARTICLES } from './articles-agreements'
import { EXECUTION_ARTICLES } from './articles-execution'
import { TRAVEL_ARTICLES } from './articles-travel'
import { TEAM_ARTICLES } from './articles-team'

export { HELP_CHANGELOG } from './changelog'
export { HELP_SCREENSHOTS } from './screenshots'

/** Every written iHelp article. Add new content files here (see docs/IHELP.md). */
export const HELP_ARTICLES: HelpArticleSource[] = [
  ...CAB_GUIDE_ARTICLES,
  ...CAB_ARTICLES,
  ...SHARED_ARTICLES,
  ...CLIENT_GUIDE_ARTICLES,
  ...PLATFORM_ARTICLES,
  ...SSO_ARTICLES,
  ...IMPORT_ARTICLES,
  ...AGREEMENT_ARTICLES,
  ...EXECUTION_ARTICLES,
  ...TRAVEL_ARTICLES,
  ...TEAM_ARTICLES,
]

/** The "Getting started" path on each overview: article ids in reading order. */
export const HELP_GETTING_STARTED: Record<HelpAudience, string[]> = {
  cab: ['workspace', 'cab-profile', 'competence', 'audit-clients', 'application-submission', 'application-review', 'quotation', 'build-audit-plan', 'decision-details'],
  client: ['c-register', 'c-company-profile', 'c-request', 'c-offers', 'c-audits', 'c-finding-respond'],
  platform: ['platform-roles', 'platform-tenant-new', 'platform-tenant-detail', 'platform-invoices'],
}

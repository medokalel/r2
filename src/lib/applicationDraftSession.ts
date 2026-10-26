import type { ApplicationDraftForm } from '@/lib/applicationDraftForm'
import type { StandardsScopeForm } from '@/lib/standardsScopeForm'
import type { Site, SitesFacilitiesForm } from '@/lib/sitesFacilitiesForm'
import type { DocumentsForm } from '@/lib/documentsForm'
import type { MultiSiteRuleResult } from '@/lib/multiSiteRuleForm'

const SNAPSHOT_KEY = 'icasco_application_draft_snapshot'
const PENDING_SITE_KEY = 'icasco_application_draft_pending_site'
const PENDING_MULTI_SITE_RULE_KEY = 'icasco_application_draft_pending_multi_site_rule'

/** ApplicationDraftPage keeps every step's form in local state, so navigating
 *  away to the full-page AddSitePage (a separate route) would otherwise lose
 *  all of it. This snapshot is written on every change and restored on the
 *  way back — a stopgap until the draft has a real backend to save to. */
export interface ApplicationDraftSnapshot {
  step: 1 | 2 | 3 | 4 | 5
  form: ApplicationDraftForm
  standardsScopeForm: StandardsScopeForm
  sitesFacilitiesForm: SitesFacilitiesForm
  documentsForm: DocumentsForm
}

export function saveApplicationDraftSnapshot(snapshot: ApplicationDraftSnapshot): void {
  sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
}

export function loadApplicationDraftSnapshot(): ApplicationDraftSnapshot | null {
  const raw = sessionStorage.getItem(SNAPSHOT_KEY)
  if (!raw) return null

  try {
    return reviveSnapshotDates(JSON.parse(raw) as ApplicationDraftSnapshot)
  } catch {
    return null
  }
}

/** JSON.stringify turns Date fields into ISO strings; JSON.parse doesn't turn
 *  them back. `ApplicationDraftForm.applicationDate`/`requestedAuditDate` are
 *  the only two Date fields anywhere in the snapshot (every other form is
 *  plain JSON-safe data) — revive them here so every consumer (DatePicker,
 *  the Review & Confirm summary, …) keeps getting a real Date, exactly like
 *  a freshly-filled form would, instead of each consumer having to guard
 *  against a string on its own. */
function reviveSnapshotDates(snapshot: ApplicationDraftSnapshot): ApplicationDraftSnapshot {
  return {
    ...snapshot,
    form: {
      ...snapshot.form,
      applicationDate: snapshot.form.applicationDate ? new Date(snapshot.form.applicationDate) : undefined,
      requestedAuditDate: snapshot.form.requestedAuditDate ? new Date(snapshot.form.requestedAuditDate) : undefined,
    },
  }
}

export function clearApplicationDraftSnapshot(): void {
  sessionStorage.removeItem(SNAPSHOT_KEY)
}

/** Set by AddSitePage on "Next", picked up once by ApplicationDraftPage to
 *  append the new site to the Sites & Facilities list. */
export function savePendingNewSite(site: Site): void {
  sessionStorage.setItem(PENDING_SITE_KEY, JSON.stringify(site))
}

/** Non-destructive read — safe to call from a useState lazy initializer,
 *  which React (in StrictMode, in dev) invokes twice on mount. Pair with
 *  clearPendingNewSite() in a useEffect to actually consume it; see the
 *  usage note there for why the read and the clear are split. */
export function peekPendingNewSite(): Site | null {
  const raw = sessionStorage.getItem(PENDING_SITE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as Site
  } catch {
    return null
  }
}

/** Removes the pending site once it's been applied. Idempotent — safe to
 *  call more than once (e.g. StrictMode's double effect invocation), unlike
 *  a combined read-and-delete, which a double invocation would silently
 *  turn into a lost site on the second call. */
export function clearPendingNewSite(): void {
  sessionStorage.removeItem(PENDING_SITE_KEY)
}

/** Set by ApplyMultiSiteRulePage on "Apply Rule", picked up once by
 *  ApplicationDraftPage to store on sitesFacilitiesForm.multiSiteRule —
 *  same round trip as savePendingNewSite/peekPendingNewSite above. */
export function savePendingMultiSiteRule(result: MultiSiteRuleResult): void {
  sessionStorage.setItem(PENDING_MULTI_SITE_RULE_KEY, JSON.stringify(result))
}

export function peekPendingMultiSiteRule(): MultiSiteRuleResult | null {
  const raw = sessionStorage.getItem(PENDING_MULTI_SITE_RULE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as MultiSiteRuleResult
  } catch {
    return null
  }
}

export function clearPendingMultiSiteRule(): void {
  sessionStorage.removeItem(PENDING_MULTI_SITE_RULE_KEY)
}
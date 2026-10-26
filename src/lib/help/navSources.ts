import { CAB_NAV_GROUPS, CAB_NAV_HOME, type CabNavItem } from '@/lib/cabNav'
import { PORTAL_NAV } from '@/lib/portalNav'
import { PLATFORM_NAV } from '@/lib/platformNav'
import { WORKSPACE_APPS, WORKSPACE_PHASES } from '@/lib/workspaceApps'
import type { HelpAudience } from '@/lib/help/types'

/**
 * The app's own navigation, flattened for iHelp. Nothing here is written by hand except
 * which help section a portal / console item belongs to: the items themselves come from the
 * configs the sidebars, the workspace and the console render.
 */
export interface HelpNavItem {
  /** Label key (sidebar, portal, console) or tile key (workspace). */
  id: string
  labelKey: string
  /** Workspace tile description key, when the item is a tile. */
  descriptionKey?: string
  route: string
  sectionKey: string
}

export interface HelpSectionSource {
  key: string
  /** i18n key of the title (the app's own group label when there is one). */
  titleKey: string
  /** i18n key of the one-line description. */
  descriptionKey: string
}

/** Sections every audience starts with. */
export const START_SECTION = 'start'
/** Catch-all section for items whose section is unknown (kept empty by the coverage test). */
export const MORE_SECTION = 'more'

const flattenCab = (items: CabNavItem[]): CabNavItem[] => items.flatMap((item) => [item, ...flattenCab(item.children ?? [])])

/** Which client-portal help section each portal item belongs to. Unknown items land in "More". */
export const PORTAL_SECTION_OF: Record<string, string> = {
  'portal.nav.home': 'start',
  'portal.nav.profile': 'start',
  'portal.nav.applications': 'certification',
  'portal.nav.offers': 'certification',
  'agreements.nav.portal': 'certification',
  'portal.nav.audits': 'certification',
  'portal.nav.findings': 'certification',
  'portal.nav.certificates': 'certification',
  'portal.nav.invoices': 'billing',
  'portal.nav.wallet': 'billing',
}

/** Which console help section each platform item belongs to. Unknown items land in "More". */
export const PLATFORM_SECTION_OF: Record<string, string> = {
  'platform.nav.dashboard': 'overview',
  'platform.nav.tenants': 'customers',
  'platform.nav.plans': 'billing',
  'platform.nav.invoices': 'billing',
  'platform.nav.announcements': 'communication',
  'platform.nav.staff': 'administration',
  'platform.nav.auditLog': 'administration',
  'platform.nav.settings': 'administration',
}

const helpSection = (audience: HelpAudience, key: string): HelpSectionSource => ({
  key,
  titleKey: `help.sections.${audience}.${key}.title`,
  descriptionKey: `help.sections.${audience}.${key}.description`,
})

export function sectionSources(audience: HelpAudience): HelpSectionSource[] {
  if (audience === 'cab') {
    return [
      helpSection('cab', START_SECTION),
      // The CAB sidebar groups are the CAB help sections, with the workspace phase hint as description.
      ...CAB_NAV_GROUPS.map((group) => ({
        key: group.id,
        titleKey: group.labelKey,
        descriptionKey: `cab.workspace.phases.${group.id}Hint`,
      })),
      helpSection('cab', MORE_SECTION),
    ]
  }
  if (audience === 'client') {
    return ['start', 'certification', 'billing', MORE_SECTION].map((key) => helpSection('client', key))
  }
  return ['start', 'overview', 'customers', 'billing', 'communication', 'administration', MORE_SECTION].map((key) => helpSection('platform', key))
}

export function navItems(audience: HelpAudience): HelpNavItem[] {
  if (audience === 'cab') {
    const items: HelpNavItem[] = [
      { id: CAB_NAV_HOME.labelKey, labelKey: CAB_NAV_HOME.labelKey, route: CAB_NAV_HOME.href ?? '', sectionKey: START_SECTION },
    ]
    for (const group of CAB_NAV_GROUPS) {
      for (const item of flattenCab(group.items)) {
        if (item.href) items.push({ id: item.labelKey, labelKey: item.labelKey, route: item.href, sectionKey: group.id })
      }
    }
    // Workspace tiles: their phase is the sidebar group of the same key; the trailing Help phase joins "Getting started".
    const groupIds = new Set(CAB_NAV_GROUPS.map((group) => group.id))
    for (const app of WORKSPACE_APPS) {
      if (!app.route) continue
      const phase = WORKSPACE_PHASES.find((p) => p.apps.includes(app.key))?.key
      const sectionKey = phase && groupIds.has(phase) ? phase : phase === 'help' ? START_SECTION : MORE_SECTION
      items.push({ id: app.key, labelKey: app.titleKey, descriptionKey: app.descriptionKey, route: app.route, sectionKey })
    }
    return items
  }
  if (audience === 'client') {
    return PORTAL_NAV.map((item) => ({
      id: item.labelKey,
      labelKey: item.labelKey,
      route: item.href,
      sectionKey: PORTAL_SECTION_OF[item.labelKey] ?? MORE_SECTION,
    }))
  }
  return PLATFORM_NAV.map((item) => ({
    id: item.labelKey,
    labelKey: item.labelKey,
    route: item.to,
    sectionKey: PLATFORM_SECTION_OF[item.labelKey] ?? MORE_SECTION,
  }))
}

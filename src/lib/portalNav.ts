import type { AppIconComponent } from '@/components/icons'
import {
  BuildingsIcon,
  CalendarAppIcon,
  CertificateBadgeIcon,
  CorrectiveActionIcon,
  DashboardGridIcon,
  FileTextIcon,
  ReceiptIcon,
  RequestsListIcon,
  WalletCardIcon,
} from '@/components/icons'
import { DocumentText1 } from 'iconsax-reactjs'
import { ROUTES } from '@/lib/routes'

export interface PortalNavItem {
  icon: AppIconComponent
  labelKey: string
  fallback: string
  href: string
}

/** Navigation of the client portal: every link stays inside /portal so it works for the client and for CAB staff viewing it. */
export const PORTAL_NAV: PortalNavItem[] = [
  { icon: DashboardGridIcon, labelKey: 'portal.nav.home', fallback: 'Home', href: ROUTES.portalHome },
  { icon: RequestsListIcon, labelKey: 'portal.nav.applications', fallback: 'Applications', href: ROUTES.portalApplications },
  { icon: FileTextIcon, labelKey: 'portal.nav.offers', fallback: 'Offers', href: ROUTES.portalOffers },
  { icon: DocumentText1, labelKey: 'agreements.nav.portal', fallback: 'Agreements', href: ROUTES.portalAgreements },
  { icon: CalendarAppIcon, labelKey: 'portal.nav.audits', fallback: 'Audits', href: ROUTES.portalAudits },
  { icon: CorrectiveActionIcon, labelKey: 'portal.nav.findings', fallback: 'Findings', href: ROUTES.portalFindings },
  { icon: CertificateBadgeIcon, labelKey: 'portal.nav.certificates', fallback: 'Certificates', href: ROUTES.portalCertificates },
  { icon: ReceiptIcon, labelKey: 'portal.nav.invoices', fallback: 'Invoices', href: ROUTES.portalInvoices },
  { icon: WalletCardIcon, labelKey: 'portal.nav.wallet', fallback: 'Wallet', href: ROUTES.portalWallet },
  { icon: BuildingsIcon, labelKey: 'portal.nav.profile', fallback: 'Company profile', href: ROUTES.portalCompanyProfile },
]

export const isPortalPath = (pathname: string) => pathname === ROUTES.portal || pathname.startsWith(`${ROUTES.portal}/`)

/** Shared pages an audit client reaches from the portal (own profile, the application form): they keep the portal navigation. */
const CLIENT_PORTAL_SHARED_PATHS: string[] = [ROUTES.accountProfile, ROUTES.certificationRequestNew]

/** Whether the sidebar / bottom bar show the portal navigation on this path. */
export function showsPortalNav(pathname: string, isAuditClient: boolean): boolean {
  const isHelp = pathname === ROUTES.help || pathname.startsWith(`${ROUTES.help}/`)
  return isPortalPath(pathname) || (isAuditClient && (CLIENT_PORTAL_SHARED_PATHS.includes(pathname) || isHelp))
}

export function isPortalNavActive(href: string, pathname: string): boolean {
  if (href === ROUTES.portalHome) return pathname === ROUTES.portal || pathname === ROUTES.portalHome
  return pathname === href || pathname.startsWith(`${href}/`)
}

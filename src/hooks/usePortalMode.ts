import { useLocation } from 'react-router-dom'
import { isAuditClientSession } from '@/lib/authStorage'
import { isPortalPath } from '@/lib/portalNav'

/**
 * True when a page shared by CAB staff and the client portal should render as the portal:
 * on a /portal path (also when CAB staff view it) or whenever an audit client is signed in.
 * Portal mode uses the portal shell and hides CAB-only controls.
 */
export function usePortalMode(): boolean {
  const { pathname } = useLocation()
  return isPortalPath(pathname) || isAuditClientSession()
}

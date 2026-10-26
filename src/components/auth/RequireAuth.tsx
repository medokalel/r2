import { Navigate, useLocation } from 'react-router-dom'
import { FeatureRouteGate } from '@/components/subscription/FeatureRouteGate'
import { getAuthSession, getAuthToken, getPostLoginRedirect, isAuditClientSession, isPlatformSession } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'

interface RequireAuthProps {
  children: React.ReactNode
}

const isUnder = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`)

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation()

  if (!getAuthToken()) {
    return <Navigate to={ROUTES.login} replace />
  }

  const session = getAuthSession()

  // iCASCO platform staff live in the platform console only; nobody else may open it.
  const isPlatform = isPlatformSession(session)
  const isPlatformRoute = isUnder(location.pathname, ROUTES.platform)
  // iHelp (/help) is open to every signed-in audience, platform staff included.
  const isHelpRoute = isUnder(location.pathname, ROUTES.help)
  if (isPlatform && !isPlatformRoute && !isHelpRoute) {
    return <Navigate to={ROUTES.platform} replace />
  }
  if (!isPlatform && isPlatformRoute) {
    return <Navigate to={session ? getPostLoginRedirect(session) : ROUTES.login} replace />
  }
  if (isPlatform) {
    return children
  }

  const isCab =
    !isAuditClientSession(session) &&
    (Boolean(session?.cab) || session?.organization?.type === 'CERTIFICATION_BODY')
  const isCabRoute = location.pathname.startsWith('/cab/')
  const isAuditClientRoute = [
    ROUTES.dashboard,
    ROUTES.certificationRequestNew,
    ROUTES.certificationRequests,
    ROUTES.dashboardTasks,
    ROUTES.companyProfile,
    ROUTES.users,
    ROUTES.wallet,
    ROUTES.periodicVisits,
    ROUTES.invoices,
  ].some(
    (route) =>
      location.pathname === route || location.pathname.startsWith(`${route}/`)
  )

  if (!isCab && isCabRoute) {
    return <Navigate to={isAuditClientSession(session) ? ROUTES.portalHome : ROUTES.dashboard} replace />
  }

  if (isCab && isAuditClientRoute) {
    return <Navigate to={ROUTES.workspace} replace />
  }

  // CAB staff: modules outside the subscription show a friendly "not in your plan" screen.
  if (isCab && (isCabRoute || isUnder(location.pathname, ROUTES.portal))) {
    return <FeatureRouteGate>{children}</FeatureRouteGate>
  }

  return children
}

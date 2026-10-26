import { Navigate } from 'react-router-dom'
import { UnifiedOnboardingFlow } from '@/components/auth/UnifiedOnboardingFlow'
import { isAuditClientSession } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'

export function OnboardingPage() {
  if (isAuditClientSession()) {
    return <Navigate to={ROUTES.portalHome} replace />
  }

  return <UnifiedOnboardingFlow />
}

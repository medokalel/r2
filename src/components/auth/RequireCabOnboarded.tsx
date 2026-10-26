import { Navigate } from 'react-router-dom'
import { getAuthSession, isCabUserOnboarded } from '@/lib/authStorage'
import { isCabAdminSession } from '@/lib/cabOnboardingStatus'
import { isOnboardingComplete } from '@/lib/onboardingStatus'
import { ROUTES } from '@/lib/routes'

interface RequireCabOnboardedProps {
  children: React.ReactNode
}

export function RequireCabOnboarded({ children }: RequireCabOnboardedProps) {
  const session = getAuthSession()

  // Server truth first: setup completed → never block.
  if (session?.cab?.setupCompleted) {
    return children
  }

  if (isCabAdminSession()) {
    if (!isCabUserOnboarded()) {
      return <Navigate to={ROUTES.onboarding} replace />
    }
    return children
  }

  const org = session?.organization
  if (
    org?.type === 'CERTIFICATION_BODY' &&
    !isOnboardingComplete(org.id, org.onboardingStatus)
  ) {
    return <Navigate to={ROUTES.onboarding} replace />
  }

  return children
}

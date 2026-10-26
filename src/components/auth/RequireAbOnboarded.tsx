import { Navigate } from 'react-router-dom'
import { getAuthSession } from '@/lib/authStorage'
import { isOnboardingComplete } from '@/lib/onboardingStatus'
import { ROUTES } from '@/lib/routes'

interface RequireAbOnboardedProps {
  children: React.ReactNode
}

export function RequireAbOnboarded({ children }: RequireAbOnboardedProps) {
  const org = getAuthSession()?.organization
  if (
    org?.type === 'ACCREDITATION_BODY' &&
    !isOnboardingComplete(org.id, org.onboardingStatus)
  ) {
    return <Navigate to={ROUTES.onboarding} replace />
  }

  return children
}

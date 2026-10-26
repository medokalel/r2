import { Navigate } from 'react-router-dom'
import { getAuthSession } from '@/lib/authStorage'
import { isOnboardingComplete } from '@/lib/onboardingStatus'
import { ROUTES } from '@/lib/routes'

interface RequireAbDashboardProps {
  children: React.ReactNode
}

export function RequireAbDashboard({ children }: RequireAbDashboardProps) {
  const org = getAuthSession()?.organization

  if (org?.type !== 'ACCREDITATION_BODY') {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  if (!isOnboardingComplete(org.id, org.onboardingStatus)) {
    return <Navigate to={ROUTES.onboarding} replace />
  }

  return children
}

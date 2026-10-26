import { Navigate } from 'react-router-dom'
import { getAuthSession } from '@/lib/authStorage'
import { isOnboardingComplete } from '@/lib/onboardingStatus'
import { ROUTES } from '@/lib/routes'

interface RedirectAbFromGenericDashboardProps {
  children: React.ReactNode
}

/** Keeps onboarded accreditation bodies on the AB dashboard route. */
export function RedirectAbFromGenericDashboard({ children }: RedirectAbFromGenericDashboardProps) {
  const org = getAuthSession()?.organization

  if (
    org?.type === 'ACCREDITATION_BODY' &&
    isOnboardingComplete(org.id, org.onboardingStatus)
  ) {
    return <Navigate to={ROUTES.abDashboard} replace />
  }

  return children
}

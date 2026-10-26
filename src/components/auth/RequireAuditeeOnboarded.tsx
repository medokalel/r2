import { Navigate } from 'react-router-dom'
import { getAuthSession, isAuditClientSession } from '@/lib/authStorage'
import { isOnboardingComplete } from '@/lib/onboardingStatus'
import { ROUTES } from '@/lib/routes'

interface RequireAuditeeOnboardedProps {
  children: React.ReactNode
}

export function RequireAuditeeOnboarded({ children }: RequireAuditeeOnboardedProps) {
  if (isAuditClientSession()) return children

  const org = getAuthSession()?.organization
  if (
    org?.type === 'CONSULTATION_BODY' &&
    !isOnboardingComplete(org.id, org.onboardingStatus)
  ) {
    return <Navigate to={ROUTES.onboarding} replace />
  }

  return children
}

import { Navigate } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'

export function AuditeeOnboardingPage() {
  return <Navigate to={ROUTES.onboarding} replace />
}

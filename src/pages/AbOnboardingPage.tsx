import { Navigate } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'

export function AbOnboardingPage() {
  return <Navigate to={ROUTES.onboarding} replace />
}

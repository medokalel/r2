import { Navigate } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'

export function CabOnboardingPage() {
  return <Navigate to={ROUTES.onboarding} replace />
}

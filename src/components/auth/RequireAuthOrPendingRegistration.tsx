import { Navigate } from 'react-router-dom'
import { getAuthToken } from '@/lib/authStorage'
import { hasPendingRegistration } from '@/lib/pendingRegistrationStorage'
import { ROUTES } from '@/lib/routes'

interface RequireAuthOrPendingRegistrationProps {
  children: React.ReactNode
}

export function RequireAuthOrPendingRegistration({ children }: RequireAuthOrPendingRegistrationProps) {
  if (!getAuthToken() && !hasPendingRegistration()) {
    return <Navigate to={ROUTES.login} replace />
  }

  return children
}

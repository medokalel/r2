import { Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'

/**
 * Legacy CAB "Application draft" route (`/cab/applications/draft`).
 *
 * The CAB fills a client's certification application in the submission flow
 * (`/cab/applications/submission`), which saves, previews and submits through the real
 * certification-application endpoints. The old five-step draft form duplicated that flow
 * with its own unsaved, browser-only data model, so this route now forwards to the
 * submission flow — keeping `clientId` / `id` so links to a specific draft still land on it.
 * The "Add site" sub-page (`/cab/applications/draft/sites/new`) stays and is opened from
 * the submission flow.
 */
export function ApplicationDraftPage() {
  const { search } = useLocation()
  const incoming = new URLSearchParams(search)
  const params = new URLSearchParams()
  for (const key of ['clientId', 'id', 'fill']) {
    const value = incoming.get(key)
    if (value) params.set(key, value)
  }
  const query = params.toString()
  return <Navigate to={`${ROUTES.cabApplicationSubmission}${query ? `?${query}` : ''}`} replace />
}

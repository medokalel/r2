import { authorizedRequest } from '@/lib/api/authorizedClient'
import type {
  ApplicationResponse,
  DraftApplicationRequest,
} from '@/lib/api/certificationApplicationApi'

export interface CabCertificationApplication extends ApplicationResponse {
  organization?: {
    id: string
    name: string
    city?: string | null
  }
}

const clientApplicationsPath = (clientId: string) =>
  `/cab-clients/${encodeURIComponent(clientId)}/certification-applications`

const LIST_TTL_MS = 60_000
let listInFlight: Promise<CabCertificationApplication[]> | null = null
let listCached: { at: number; data: CabCertificationApplication[] } | null = null

export function invalidateCabCertificationApplications(): void {
  listInFlight = null
  listCached = null
}

export function listCabCertificationApplications(): Promise<
  CabCertificationApplication[]
> {
  if (listCached && Date.now() - listCached.at < LIST_TTL_MS) {
    return Promise.resolve(listCached.data)
  }
  if (listInFlight) return listInFlight

  listInFlight = authorizedRequest<CabCertificationApplication[]>(
    '/cab/certification-applications',
  )
    .then((data) => {
      listCached = { at: Date.now(), data }
      return data
    })
    .catch((error) => {
      if (listCached) return listCached.data
      throw error
    })
    .finally(() => {
      listInFlight = null
    })

  return listInFlight
}

export function createCabClientCertificationApplication(
  clientId: string,
  payload: DraftApplicationRequest,
): Promise<CabCertificationApplication> {
  invalidateCabCertificationApplications()
  return authorizedRequest(clientApplicationsPath(clientId), {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listCabClientCertificationApplications(
  clientId: string,
): Promise<CabCertificationApplication[]> {
  return authorizedRequest(clientApplicationsPath(clientId))
}

export function updateCabClientCertificationApplicationDraft(
  clientId: string,
  applicationId: string,
  payload: DraftApplicationRequest,
): Promise<CabCertificationApplication> {
  return authorizedRequest(
    `${clientApplicationsPath(clientId)}/${encodeURIComponent(applicationId)}/draft`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export function submitCabClientCertificationApplication(
  clientId: string,
  applicationId: string,
): Promise<CabCertificationApplication> {
  invalidateCabCertificationApplications()
  return authorizedRequest(
    `${clientApplicationsPath(clientId)}/${encodeURIComponent(applicationId)}/submit`,
    { method: 'POST' },
  )
}

export function getCabClientCertificationApplication(
  _clientId: string,
  applicationId: string,
): Promise<CabCertificationApplication> {
  return getCabCertificationApplication(applicationId)
}

export function getCabCertificationApplication(
  applicationId: string,
): Promise<CabCertificationApplication> {
  return authorizedRequest(
    `/cab/certification-applications/${encodeURIComponent(applicationId)}`,
  )
}

export function clientIdOf(
  application: CabCertificationApplication,
): string {
  return application.organization?.id ?? application.organizationId ?? ''
}

export async function startCabClientApplication(
  clientId: string,
): Promise<CabCertificationApplication> {
  const existing = await listCabClientCertificationApplications(clientId)
  const draft = existing.find((item) => item.status === 'DRAFT')
  if (draft) return draft
  return createCabClientCertificationApplication(clientId, {})
}

/**
 * Finds an application by id or order number. When the id lookup fails, it searches the
 * client's applications (when `clientId` is known) or else all of the CAB's applications.
 */
export async function resolveCabCertificationApplication(
  applicationId?: string | null,
  clientId?: string | null,
): Promise<CabCertificationApplication | null> {
  if (!applicationId) return null
  try {
    return await getCabCertificationApplication(applicationId)
  } catch {
    const applications = clientId
      ? await listCabClientCertificationApplications(clientId)
      : await listCabCertificationApplications()
    const match = applications.find(
      (item) => item.id === applicationId || item.orderNumber === applicationId,
    )
    return match ?? null
  }
}

export interface CabApplicationOverlay {
  application: CabCertificationApplication
  clientId: string
  clientName: string
  standards: string[]
  submittedDate: Date
}

export async function loadCabApplicationOverlay(
  applicationId?: string | null,
  clientId?: string | null,
): Promise<CabApplicationOverlay | null> {
  try {
    const application = await resolveCabCertificationApplication(
      applicationId,
      clientId,
    )
    if (!application) return null
    const submitted =
      application.submittedAt || application.updatedAt || application.createdAt
    return {
      application,
      clientId: clientIdOf(application),
      clientName:
        application.organization?.name ||
        application.legalInfo?.organizationName ||
        '',
      standards: (application.certificates ?? [])
        .map(
          (certificate) =>
            certificate.certificateName || certificate.certificateCode || '',
        )
        .filter(Boolean),
      submittedDate: submitted ? new Date(submitted) : new Date(),
    }
  } catch {
    return null
  }
}

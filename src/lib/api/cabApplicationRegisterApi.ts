import {
  listCabCertificationApplications,
  type CabCertificationApplication,
} from '@/lib/api/cabCertificationApplicationApi'
import type { ApplicationStatus } from '@/lib/api/certificationApplicationApi'
import { notSet } from '@/lib/emptyValue'

export type ApplicationRegisterStatus = ApplicationStatus

export interface ApplicationRegisterItem {
  id: string
  clientId: string
  applicationCode: string
  clientCode: string
  clientName: string
  standards: string[]
  status: ApplicationRegisterStatus
  countryCode: string
  updatedAt: string
}

function shortCode(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}

function toRegisterItem(
  application: CabCertificationApplication,
): ApplicationRegisterItem {
  const clientId = application.organization?.id ?? application.organizationId ?? ''
  return {
    id: application.id,
    clientId,
    applicationCode:
      application.orderNumber ?? `DRAFT-${shortCode(application.id)}`,
    clientCode: shortCode(clientId),
    clientName:
      application.organization?.name ??
      application.legalInfo?.organizationName ??
      notSet(),
    standards: (application.certificates ?? [])
      .map(
        (certificate) =>
          certificate.certificateName ?? certificate.certificateCode ?? '',
      )
      .filter(Boolean),
    status: application.status,
    countryCode: application.legalInfo?.country ?? '',
    updatedAt:
      application.updatedAt ?? application.createdAt ?? new Date(0).toISOString(),
  }
}

export async function listCabApplications(): Promise<ApplicationRegisterItem[]> {
  const applications = await listCabCertificationApplications()
  return applications.map(toRegisterItem)
}

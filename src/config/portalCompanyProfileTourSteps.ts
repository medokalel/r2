import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function usePortalCompanyProfileTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'portal-profile-header',
      step: 1,
      totalSteps: 5,
      title: t('portal.companyProfile.tour.header.title', 'Company Profile & Status'),
      description: t(
        'portal.companyProfile.tour.header.description',
        'Review your registered organization identifiers, pending legal changes awaiting CAB approval, and manage save operations.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'portal-profile-logo-card',
      step: 2,
      totalSteps: 5,
      title: t('portal.companyProfile.tour.logo.title', 'Brand Identity & Logo'),
      description: t(
        'portal.companyProfile.tour.logo.description',
        'Maintain high-resolution official logos used across your issued audit certificates, client portal, and compliance reports.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'portal-profile-company-details',
      step: 3,
      totalSteps: 5,
      title: t('portal.companyProfile.tour.details.title', 'Legal & Commercial Details'),
      description: t(
        'portal.companyProfile.tour.details.description',
        'Update registered trade names, commercial registration number, industry category, and official website.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'portal-profile-main-address',
      step: 4,
      totalSteps: 5,
      title: t('portal.companyProfile.tour.address.title', 'Main Registered Address'),
      description: t(
        'portal.companyProfile.tour.address.description',
        'Ensure company headquarters address, postal codes, and city records are accurate for official certification documentation.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'portal-profile-sites-contacts-docs',
      step: 5,
      totalSteps: 5,
      title: t('portal.companyProfile.tour.sitesDocs.title', 'Sites, Contacts & Documents'),
      description: t(
        'portal.companyProfile.tour.sitesDocs.description',
        'Manage secondary operational facilities, authorized contact representatives, and upload official statutory compliance documents.'
      ),
      side: 'top',
      align: 'start',
    },
  ]
}

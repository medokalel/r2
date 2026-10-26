import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { usePersonnelProfileTourSteps } from '@/config/personnelProfileTourSteps'
import { PersonnelProfileForm } from '@/components/dashboard/cab/PersonnelProfileForm'
import { ReturnToBanner } from '@/components/ui/ReturnToBanner'
import { useDeepLinkField } from '@/hooks/useDeepLinkField'
import { Button } from '@/components/ui/Button'
import {
  fetchPersonnelProfile,
  getCachedPerson,
  rememberSavedPerson,
  type CompetencePerson,
} from '@/lib/api/cabCompetenceApi'
import { ROUTES } from '@/lib/routes'
import { RETURN_TO_PARAM, safeReturnTo } from '@/lib/fieldNavigation'
import { PersonAvailabilityCard } from '@/components/teamSelection/PersonAvailabilityCard'
import { PersonImpartialityCard } from '@/components/teamSelection/PersonImpartialityCard'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-500 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CabPersonnelProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = usePersonnelProfileTourSteps()

  const [person, setPerson] = useState<CompetencePerson | undefined>(() =>
    id ? getCachedPerson(id) : undefined
  )
  const [loading, setLoading] = useState(Boolean(id))

  useEffect(() => {
    // Without an id (new person) `loading` starts false and nothing is fetched.
    if (!id) return
    let cancelled = false
    fetchPersonnelProfile(id)
      .then((loaded) => {
        if (!cancelled && loaded) setPerson(loaded)
      })
      .catch(() => {
        // Leaves the person unset: the page shows "not found".
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const title = t(id ? 'cab.competence.memberProfile.editProfile' : 'cab.competence.addNewPerson')
  const backToRegister = () => navigate(ROUTES.cabCompetence)

  // Opened from another page (e.g. "Complete" after an import): go back there once saved.
  const [searchParams] = useSearchParams()
  const returnTo = safeReturnTo(searchParams.get(RETURN_TO_PARAM))

  const handleSaved = (savedPerson: CompetencePerson) => {
    rememberSavedPerson(savedPerson)
    navigate(returnTo ?? ROUTES.cabCompetence)
  }

  useDeepLinkField(!loading && Boolean(person || !id))

  return (
    <CabLayout
      sidebarVariant="competence"
      tourId="personnel-profile-tour"
      tourSteps={tourSteps}
    >
      <CabHeader title={t('cab.competence.title')} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <nav aria-label={t('common.breadcrumb')} className="flex min-w-0 flex-wrap items-center gap-2 text-body-sm">
          <Link to={ROUTES.workspace} className="font-light text-neutral-500 hover:text-primary">
            {t('cab.competence.title')}
          </Link>
          <Chevron />
          <Link to={ROUTES.cabCompetence} className="font-light text-neutral-500 hover:text-primary">
            {t('cab.competence.personnelRegister', 'Personnel register')}
          </Link>
          <Chevron />
          <span aria-current="page" className="font-medium text-neutral-800">
            {title}
          </span>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <CabTourStep steps={tourSteps} stepId="profile-header">
            <div>
              <h1 className="text-page-title text-text-primary">{title}</h1>
              <p className="mt-1 text-body-sm text-neutral-600">
                {person ? `${person.name} · ${person.code}` : t('cab.competence.memberProfile.pageDescription')}
              </p>
            </div>
          </CabTourStep>
          <Button variant="outline" onClick={backToRegister}>
            {t('cab.competence.memberProfile.backToRegister')}
          </Button>
        </div>

        <ReturnToBanner />

        {loading ? (
          <div className="flex items-center justify-center rounded-lg border border-neutral-100 bg-white p-12">
            <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : id && !person ? (
          <p role="alert" className="rounded-lg border border-neutral-100 bg-white p-8 text-body text-neutral-600">
            {t('cab.competence.memberProfile.notFound')}
          </p>
        ) : (
          <PersonnelProfileForm
            key={id ?? 'new'}
            person={person}
            onCancel={backToRegister}
            onSaved={handleSaved}
            tourSteps={tourSteps}
          />
        )}
        {/* Team selection inputs of an existing person: impartiality declarations and availability. */}
        {!loading && id && person && (
          <>
            <PersonImpartialityCard personId={person.id} />
            <PersonAvailabilityCard personId={person.id} />
          </>
        )}
      </main>
    </CabLayout>
  )
}

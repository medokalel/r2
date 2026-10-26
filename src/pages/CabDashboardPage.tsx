import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { PageHeaderWithAction } from '@/components/dashboard/PageHeaderWithAction'
import { CabStatCards } from '@/components/dashboard/cab/CabStatCards'
import { CabDonutCard } from '@/components/dashboard/cab/CabDonutCard'
import { CabAuditsOverviewChart } from '@/components/dashboard/cab/CabAuditsOverviewChart'
import { AuditCalendarModal } from '@/components/dashboard/cab/AuditCalendarModal'
import { ApplicationsByStageModal } from '@/components/dashboard/cab/ApplicationsByStageModal'
import { CabWorkQueue } from '@/components/dashboard/cab/CabWorkQueue'
import { CabRecentActivity } from '@/components/dashboard/cab/CabRecentActivity'
import { CabQuickActions } from '@/components/dashboard/cab/CabQuickActions'
import { AppIcon, CalendarIcon } from '@/components/icons'
import { ROUTES } from '@/lib/routes'
import {
  getApplicationsByStage,
  getAuditsOverview,
  getCabDashboardStats,
  getCabRecentActivity,
  getCertificationDecisions,
  getWorkQueue,
  type ApplicationsByStageEntry,
  type AuditsOverviewEntry,
  type CabActivityItem,
  type CabDashboardStats,
  type CertificationDecisionEntry,
  type WorkQueueItem,
} from '@/lib/api/cabDashboardApi'

import { markTourPending } from '@/context/TourContext'
import { CabDashboardTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useCabDashboardTourSteps } from '@/config/cabTourSteps'
import { markCabWorkflowTourPending, resetCabWorkflowTour } from '@/config/cabTourSequence'

/**
 * Consumes `?restartCabTour=1`: resets the CAB workflow tour before the page (and its
 * tour) first renders, then drops the flag from the URL. Returns the tour session key.
 */
function consumeRestartCabTourFlag(): number {
  const params = new URLSearchParams(window.location.search)
  if (params.get('restartCabTour') !== '1') return 0
  resetCabWorkflowTour()
  markCabWorkflowTourPending()
  params.delete('restartCabTour')
  const query = params.toString()
  window.history.replaceState({}, '', query ? `${window.location.pathname}?${query}` : window.location.pathname)
  return 1
}

export function CabDashboardPage() {
  const { t } = useTranslation()
  const dashboardTourSteps = useCabDashboardTourSteps()
  const navigate = useNavigate()
  const [stats, setStats] = useState<CabDashboardStats | null>(null)
  const [applicationsByStage, setApplicationsByStage] = useState<ApplicationsByStageEntry[]>([])
  const [auditsOverview, setAuditsOverview] = useState<AuditsOverviewEntry[]>([])
  const [certificationDecisions, setCertificationDecisions] = useState<CertificationDecisionEntry[]>([])
  const [workQueue, setWorkQueue] = useState<WorkQueueItem[]>([])
  const [activities, setActivities] = useState<CabActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuditCalendarOpen, setIsAuditCalendarOpen] = useState(false)
  const [isApplicationsByStageOpen, setIsApplicationsByStageOpen] = useState(false)
  const [tourSessionKey] = useState(consumeRestartCabTourFlag)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getCabDashboardStats(),
      getApplicationsByStage(),
      getAuditsOverview(),
      getCertificationDecisions(),
      getWorkQueue(),
      getCabRecentActivity(),
    ]).then(([statsData, stageData, auditsData, decisionsData, workQueueData, activityData]) => {
      if (cancelled) return
      setStats(statsData)
      setApplicationsByStage(stageData)
      setAuditsOverview(auditsData)
      setCertificationDecisions(decisionsData)
      setWorkQueue(workQueueData)
      setActivities(activityData)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <CabLayout
      tourId="cab-dashboard"
      tourSteps={dashboardTourSteps}
      tourSessionKey={tourSessionKey}
      onTourComplete={() => {
        markTourPending('cab-client-registration')
        navigate('/cab/clients/new')
      }}
    >
      <CabDashboardTourStep stepId="dashboard-header">
        <CabHeader
          title={t('cab.dashboard.title')}
          subtitle={t('cab.dashboard.subtitle')}
          notificationCount={3}
        />
      </CabDashboardTourStep>

      <div className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <CabDashboardTourStep stepId="key-metrics">
          <div className="flex flex-col gap-5">
            <PageHeaderWithAction
              title={t('cab.dashboard.title')}
              subtitle={t('cab.dashboard.subtitle')}
              action={{
                icon: <AppIcon icon={CalendarIcon} size={20} />,
                label: t('cab.dashboard.auditCalendar.title'),
                onClick: () => setIsAuditCalendarOpen(true),
              }}
            />
            <CabStatCards stats={stats} loading={loading} />
          </div>
        </CabDashboardTourStep>

        <CabDashboardTourStep stepId="visual-analytics">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <CabDonutCard
              title={t('cab.dashboard.applicationsByStage.title')}
              entries={applicationsByStage.map((e) => ({ key: e.stageKey, count: e.count, color: e.color, href: e.href }))}
              labelPrefix="cab.dashboard.applicationsByStage.stages"
              info={t('cab.dashboard.info.applicationsByStage')}
              hintPrefix="cab.dashboard.hints.stage"
              totalLabel={t('cab.dashboard.total')}
              footerLink={{
                label: t('cab.dashboard.applicationsByStage.viewFullPipeline'),
                onClick: () => setIsApplicationsByStageOpen(true),
              }}
            />

            <CabAuditsOverviewChart
              entries={auditsOverview}
              footerLink={{
                label: t('cab.dashboard.auditsOverview.viewAuditCalendar'),
                onClick: () => setIsAuditCalendarOpen(true),
              }}
            />

            <CabDonutCard
              title={t('cab.dashboard.certificationDecisions.title')}
              entries={certificationDecisions.map((e) => ({ key: e.decisionKey, count: e.count, color: e.color, href: e.href }))}
              labelPrefix="cab.dashboard.certificationDecisions.decisions"
              totalLabel={t('cab.dashboard.total')}
              info={t('cab.dashboard.info.certificationDecisions')}
              hintPrefix="cab.dashboard.hints.decision"
              footerLink={{ label: t('cab.dashboard.certificationDecisions.viewDecisions'), onClick: () => navigate(ROUTES.cabDecisions) }}
            />
          </div>
        </CabDashboardTourStep>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <CabDashboardTourStep stepId="work-queue">
            <CabWorkQueue items={workQueue} />
          </CabDashboardTourStep>

          <CabDashboardTourStep stepId="recent-activity">
            <CabRecentActivity activities={activities} />
          </CabDashboardTourStep>

          <CabDashboardTourStep stepId="quick-actions">
            <CabQuickActions
              onNewApplication={() => navigate('/cab/clients/new')}
              onAssignReview={() => navigate('/cab/applications/review')}
              onIssueCertificate={() => navigate(ROUTES.cabCertificates)}
            />
          </CabDashboardTourStep>
        </div>
      </div>
      <AuditCalendarModal open={isAuditCalendarOpen} onOpenChange={setIsAuditCalendarOpen} />
      <ApplicationsByStageModal
        open={isApplicationsByStageOpen}
        onOpenChange={setIsApplicationsByStageOpen}
        entries={applicationsByStage}
      />
    </CabLayout>
  )
}
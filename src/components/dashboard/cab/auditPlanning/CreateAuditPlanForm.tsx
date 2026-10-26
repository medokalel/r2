import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { Button } from '@/components/ui/Button'
import { FormField, SelectField, TextField } from '@/components/ui'
import { DatePicker } from '@/components/ui/DatePicker'
import { parseIsoDate, toIsoDate } from '@/components/dashboard/companyProfile/mappers'
import { listCabApplications, type ApplicationRegisterItem } from '@/lib/api/cabApplicationRegisterApi'
import {
  fetchPlanningAuditors,
  fetchPlanningClients,
  saveAuditPlan,
  type AuditPlan,
  type PlanningAuditor,
  type PlanningClient,
} from '@/lib/api/cabAuditPlanningApi'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { enumLabel } from '@/lib/enumLabel'
import { toast } from '@/lib/toast'
import { notSet } from '@/lib/emptyValue'
import { LeadRecommendations } from '@/components/teamSelection/LeadRecommendations'

const STAGES: ReadonlyArray<AuditPlan['stage']> = ['Stage 1', 'Stage 2', 'Surveillance 1', 'Surveillance 2', 'Recertification', 'Special Audit']
const NO_APPLICATION = '__none__'
const cardClassName = 'rounded-lg border border-neutral-100 bg-white p-5 sm:p-6'

/**
 * Blank "new audit plan" form (route /cab/audit-planning/new): client, application, stage,
 * standard, dates and lead auditor. Creates the Draft plan (POST /cab/audit-plans) and opens
 * its build page.
 */
export function CreateAuditPlanForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [clients, setClients] = useState<PlanningClient[]>([])
  const [applications, setApplications] = useState<ApplicationRegisterItem[]>([])
  const [auditors, setAuditors] = useState<PlanningAuditor[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [clientId, setClientId] = useState('')
  const [applicationId, setApplicationId] = useState(NO_APPLICATION)
  const [stage, setStage] = useState<AuditPlan['stage']>('Stage 1')
  const [standard, setStandard] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [leadAuditor, setLeadAuditor] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchPlanningClients(), listCabApplications().catch(() => []), fetchPlanningAuditors().catch(() => [])])
      .then(([clientList, applicationList, auditorList]) => {
        if (cancelled) return
        setClients(clientList)
        setApplications(applicationList)
        setAuditors(auditorList.filter((a) => a.qualified))
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const client = clients.find((c) => c.id === clientId)
  const clientApplications = useMemo(
    () => applications.filter((a) => a.clientId === clientId && a.status !== 'DRAFT'),
    [applications, clientId],
  )
  const application = clientApplications.find((a) => a.id === applicationId)

  const today = toIsoDate(new Date())
  const datesValid = Boolean(startDate && endDate && endDate >= startDate)
  const standardValue = standard.trim() || application?.standards.join(', ') || ''
  const canSave = Boolean(client && stage && standardValue && datesValid && leadAuditor) && !saving

  const submit = async () => {
    if (!client || !canSave) return
    setSaving(true)
    setError(null)
    try {
      const created = await saveAuditPlan({
        organizationId: client.id,
        applicationId: application?.id ?? null,
        clientName: client.name,
        clientCode: client.code,
        country: client.country,
        applicationNumber: application?.applicationCode,
        stage,
        standardName: standardValue,
        proposedStartDate: startDate,
        proposedEndDate: endDate,
        leadAuditor,
        auditTeam: [leadAuditor],
        status: 'Draft',
      })
      toast.success(t('cab.auditPlanning.create.created', { defaultValue: 'Audit plan {{number}} created.', number: created.planNumber }))
      navigate(`/cab/audit-planning/build/${encodeURIComponent(created.planNumber)}`, { replace: true })
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setSaving(false)
    }
  }

  return (
    <CabLayout sidebarVariant="auditPlanning">
      <CabHeader
        title={t('cab.auditPlanning.title', 'Audit Planning')}
        subtitle={t('cab.auditPlanning.subtitle', 'Plan and manage audits across clients and sites.')}
      />
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <nav className="flex flex-wrap items-center gap-2 text-body-sm text-neutral-500" aria-label={t('common.breadcrumb', 'Breadcrumb')}>
          <button type="button" onClick={() => navigate('/cab/audit-planning/schedule')} className="font-medium hover:text-primary">
            {t('cab.sidebar.auditSchedule', 'Audit Plans')}
          </button>
          <span aria-hidden>›</span>
          <span className="font-semibold text-primary">{t('cab.auditPlanning.create.title', 'New audit plan')}</span>
        </nav>

        <div>
          <h1 className="text-section-title text-text-primary">{t('cab.auditPlanning.create.title', 'New audit plan')}</h1>
          <p className="mt-1 text-body-sm text-neutral-600">
            {t('cab.auditPlanning.create.subtitle', 'Create a draft plan; the agenda, team and site details are completed on the build page.')}
          </p>
        </div>

        {loadFailed ? (
          <section className={cardClassName}>
            <p role="alert" className="text-error-500">{t('cab.auditPlanning.create.loadError', 'Could not load clients and auditors. Try again later.')}</p>
          </section>
        ) : (
          <form
            className={cardClassName}
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                id="new-plan-client"
                label={t('cab.auditPlanning.create.client', 'Client')}
                required
                value={clientId}
                placeholder={t('cab.auditPlanning.create.selectClient', 'Select a client')}
                options={clients.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))}
                onChange={(value) => {
                  setClientId(value)
                  setApplicationId(NO_APPLICATION)
                }}
              />
              <SelectField
                id="new-plan-application"
                label={t('cab.auditPlanning.create.application', 'Application')}
                value={applicationId}
                disabled={!clientId}
                options={[
                  { value: NO_APPLICATION, label: t('cab.auditPlanning.create.noApplication', 'No application (e.g. special audit)') },
                  ...clientApplications.map((a) => ({ value: a.id, label: `${a.applicationCode} · ${a.standards.join(', ') || notSet()}` })),
                ]}
                onChange={setApplicationId}
              />
              <SelectField
                id="new-plan-stage"
                label={t('cab.auditPlanning.create.stage', 'Audit stage')}
                required
                value={stage}
                options={STAGES.map((value) => ({ value, label: enumLabel(t, value) }))}
                onChange={(value) => setStage(value as AuditPlan['stage'])}
              />
              <TextField
                id="new-plan-standard"
                label={t('cab.auditPlanning.create.standard', 'Standard')}
                required={!application}
                value={standard}
                placeholder={application?.standards.join(', ') || 'ISO 9001:2015'}
                maxLength={300}
                onChange={(event) => setStandard(event.target.value)}
              />
              <FormField label={t('cab.auditPlanning.create.startDate', 'Start date')} required>
                <DatePicker value={parseIsoDate(startDate) ?? null} onChange={(date) => setStartDate(toIsoDate(date))} />
                {startDate && startDate < today && (
                  <p className="text-caption text-warning-700">{t('cab.auditPlanning.create.pastDate', 'The start date is in the past.')}</p>
                )}
              </FormField>
              <FormField label={t('cab.auditPlanning.create.endDate', 'End date')} required>
                <DatePicker value={parseIsoDate(endDate) ?? null} onChange={(date) => setEndDate(toIsoDate(date))} />
                {startDate && endDate && endDate < startDate && (
                  <p role="alert" className="text-caption text-error-700">{t('cab.auditPlanning.create.endBeforeStart', 'The end date must be on or after the start date.')}</p>
                )}
              </FormField>
              <SelectField
                id="new-plan-lead"
                label={t('cab.auditPlanning.create.leadAuditor', 'Lead auditor')}
                required
                value={leadAuditor}
                placeholder={t('cab.auditPlanning.create.selectLead', 'Select the lead auditor')}
                options={auditors.map((a) => ({ value: a.name, label: `${a.name} · ${enumLabel(t, a.role)}` }))}
                onChange={setLeadAuditor}
              />
              {/* Team-leader recommendations from the competence register (application scope, dates, impartiality). */}
              {application && <LeadRecommendations applicationId={application.id} startDate={startDate} endDate={endDate} selectedName={leadAuditor} onSelect={setLeadAuditor} />}
            </div>

            {error && (
              <p role="alert" className="mt-5 whitespace-pre-line rounded-md bg-error-50 px-3 py-2 text-body-sm text-error-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" size="sm" className="h-11 px-5" onClick={() => navigate('/cab/audit-planning/schedule')}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" size="sm" className="h-11 px-5" disabled={!canSave}>
                {saving ? t('common.saving', 'Saving...') : t('cab.auditPlanning.create.submit', 'Create plan')}
              </Button>
            </div>
          </form>
        )}
      </main>
    </CabLayout>
  )
}

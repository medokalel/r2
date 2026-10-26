import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ClientRegistrationForm } from '@/components/dashboard/cab/ClientRegistrationForm'
import { ReturnToBanner } from '@/components/ui/ReturnToBanner'
import { useDeepLinkField } from '@/hooks/useDeepLinkField'
import { buildClientWorkflowSteps } from '@/lib/workflowSteps'
import { WorkflowProgressCard } from '@/components/dashboard/cab/WorkflowProgressCard'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import { useFieldValidation } from '@/hooks/useFieldValidation'
import {
  CLIENT_REGISTRATION_FIELD_LABELS,
  emptyClientRegistrationForm,
  getClientRegistrationRules,
} from '@/lib/clientRegistrationForm'
import {
  cabClientToForm,
  createCabClient,
  getCabClient,
  updateCabClient,
} from '@/lib/api/clientRegistrationApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { ROUTES, cabApplicationSubmissionPath } from '@/lib/routes'

import { markTourPending } from '@/context/tour/tourStorage'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { useClientRegistrationTourSteps } from '@/config/clientRegistrationTourSteps'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-500 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ClientRegistrationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clientId } = useParams()
  const editing = Boolean(clientId)
  const [form, setForm] = useState(emptyClientRegistrationForm)
  const [draftId, setDraftId] = useState<string | null>(clientId ?? null)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    getCabClient(clientId)
      .then((client) => {
        if (cancelled) return
        setForm(cabClientToForm(client))
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(getUserErrorMessage(error, t, { fallbackKey: 'cab.clientsPage.loadError' }))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [clientId, t])

  const tourSteps = useClientRegistrationTourSteps()
  const patch = (f: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...f }))
  const { fieldProps, validateAll } = useFieldValidation(form, getClientRegistrationRules(t))
  // "Complete" after an import focuses the missing field (?field=client-…).
  useDeepLinkField(!loading)

  const save = async (options?: { skipEditRedirect?: boolean }) => {
    if (!validateAll()) {
      toast.error(t('validation.fixErrors'))
      return null
    }
    setSaving(true)
    const isNew = !draftId
    try {
      const result = draftId ? await updateCabClient(draftId, form) : await createCabClient(form)
      setDraftId(result.client.id)
      if (!clientId && !options?.skipEditRedirect) {
        navigate(`/cab/clients/${result.client.id}/edit`, { replace: true })
      }
      toast.success(t(isNew ? 'cab.clientRegistration.messages.created' : 'cab.clientRegistration.messages.saved'))
      return result.client
    } catch (error) {
      const organizationId =
        error && typeof error === 'object' && 'organizationId' in error
          ? String((error as { organizationId?: string }).organizationId ?? '')
          : ''
      if (organizationId && !draftId) {
        setDraftId(organizationId)
        navigate(`/cab/clients/${organizationId}/edit`, { replace: true })
      }
      toast.error(
        getUserErrorMessage(error, t, {
          fallbackKey: 'cab.clientRegistration.saveError',
          fieldLabels: CLIENT_REGISTRATION_FIELD_LABELS,
        }),
      )
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = () => {
    void save()
  }

  const handleSaveDraftAndContinue = async () => {
    const client = await save({ skipEditRedirect: true })
    if (!client) return
    navigate(`/cab/clients/${client.id}/profile`)
  }

  return (
    <CabLayout
      tourId="cab-client-registration"
      tourSteps={tourSteps}
      onTourComplete={() => {
        markTourPending('cab-application-draft')
        navigate(draftId ? cabApplicationSubmissionPath(draftId) : ROUTES.cabApplicationSubmission)
      }}
    >
      <DashboardTourStep steps={tourSteps} stepId="header">
        <CabHeader
          title={t(editing ? 'cab.clientRegistration.editTitle' : 'cab.clientRegistration.title')}
          notificationCount={3}
        />
      </DashboardTourStep>

      <div className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-body-sm" aria-label={t('common.breadcrumb')}>
          <Link to={ROUTES.workspace} className="font-light text-neutral-500 hover:text-primary">
            {t('cab.clientRegistration.breadcrumbWorkspace')}
          </Link>
          <Chevron />
          <Link to={ROUTES.cabAuditClients} className="font-light text-neutral-500 hover:text-primary">
            {t('cab.clientRegistration.breadcrumbClientRegister')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-800">
            {t(editing ? 'cab.clientRegistration.editTitle' : 'cab.clientRegistration.title')}
          </span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-h3-semi text-neutral-900">
              {t(editing ? 'cab.clientRegistration.editTitle' : 'cab.clientRegistration.title')}
            </h2>
            <p className="text-body-2 text-neutral-600">{t('cab.clientRegistration.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.cabAuditClients)}
            className="rounded-md border border-primary px-4 py-2.5 text-body-sm font-medium text-primary hover:bg-primary-50"
          >
            {t('cab.clientRegistration.viewRegisteredClients')}
          </button>
        </div>

        <ReturnToBanner />

        {loading ? (
          <div className="rounded-lg border border-neutral-100 bg-white p-8 text-center text-neutral-600">
            {t('common.loading')}
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1 space-y-5">
              <ClientRegistrationForm form={form} onPatch={patch} fieldProps={fieldProps} />
            </div>
            <DashboardTourStep steps={tourSteps} stepId="workflow-progress" className="w-full shrink-0 lg:w-[340px]">
              <WorkflowProgressCard
                steps={buildClientWorkflowSteps(t, 'application')}
                title={t('cab.clientRegistration.workflow.title')}
                viewFullLabel={t('cab.clientRegistration.workflow.viewFull')}
                statusLabels={{
                  completed: t('cab.applications.receipt.workflow.completed'),
                  inProgress: t('cab.clientRegistration.workflow.inProgress'),
                  pending: t('cab.clientRegistration.workflow.pending'),
                }}
              />
            </DashboardTourStep>
          </div>
        )}
      </div>

      <DashboardTourStep steps={tourSteps} stepId="action-buttons">
        <DashboardFooter
          onBack={() => navigate(editing && clientId ? `/cab/clients/${clientId}` : ROUTES.workspace)}
          backDisabled={saving || loading}
          onSaveDraft={handleSaveDraft}
          saveDraftDisabled={saving || loading}
          saveDraftLoading={saving}
          onNext={handleSaveDraftAndContinue}
          nextDisabled={saving || loading}
          nextLabel={
            saving
              ? t('common.loading')
              : t('cab.clientRegistration.saveDraftAndContinue')
          }
        />
      </DashboardTourStep>
    </CabLayout>
  )
}

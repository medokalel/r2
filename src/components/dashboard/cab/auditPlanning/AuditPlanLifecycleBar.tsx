import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import {
  AUDIT_PLAN_TRANSITIONS,
  auditPlanTransitionBlock,
  changeAuditPlanStatus,
  type AuditPlan,
  type AuditPlanTransition,
} from '@/lib/api/cabAuditPlanningApi'
import { enumLabel } from '@/lib/enumLabel'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { executionPath } from '@/lib/api/executionApi'
import {
  AUDIT_PLAN_ACTIONS,
  auditPlanActionLabel,
  auditPlanBlockText,
  auditReportPath,
  confirmText,
  successText,
} from '@/components/dashboard/cab/auditPlanning/lifecycleText'

interface TransitionDialogProps {
  plan: AuditPlan | null
  action: AuditPlanTransition | null
  onClose: () => void
  onDone: (plan: AuditPlan) => void
}

/** Confirmation dialog that runs one lifecycle action (shared by the build page and the plan list). */
export function AuditPlanTransitionDialog({ plan, action, onClose, onDone }: TransitionDialogProps) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const open = Boolean(plan && action)

  const confirm = async () => {
    if (!plan || !action) return
    setBusy(true)
    setError(null)
    try {
      const updated = await changeAuditPlanStatus(plan, action)
      toast.success(successText(t, action, updated))
      onDone(updated)
      onClose()
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <WorkflowDialog
      open={open}
      title={action ? auditPlanActionLabel(t, action) : ''}
      description={plan && action ? confirmText(t, action, plan) : ''}
      confirmLabel={action ? auditPlanActionLabel(t, action) : ''}
      busy={busy}
      error={error}
      onConfirm={() => void confirm()}
      onClose={() => {
        setError(null)
        onClose()
      }}
    />
  )
}

/** Lifecycle actions of the build page: buttons disabled with the reason, plus the report link. */
export function AuditPlanLifecycleBar({ plan, onChange }: { plan: AuditPlan; onChange: (plan: AuditPlan) => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [action, setAction] = useState<AuditPlanTransition | null>(null)

  return (
    <section
      aria-label={t('cab.auditPlanning.lifecycle.title', 'Audit lifecycle')}
      className="flex flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="min-w-0">
        <p className="text-body-sm font-bold text-neutral-900">{t('cab.auditPlanning.lifecycle.title', 'Audit lifecycle')}</p>
        <p className="mt-0.5 text-body-sm text-neutral-600">
          {t('cab.auditPlanning.lifecycle.current', { defaultValue: 'Current status: {{status}}', status: enumLabel(t, plan.status) })}
          {plan.reportId && plan.reportStatus ? ` · ${t('cab.auditPlanning.lifecycle.report', 'Report')}: ${enumLabel(t, plan.reportStatus)}` : ''}
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-3">
        {AUDIT_PLAN_ACTIONS.map((key) => {
          const block = auditPlanTransitionBlock(plan, key)
          const primary = !block && AUDIT_PLAN_TRANSITIONS[key].from.includes(plan.status)
          return (
            <div key={key} className="flex min-w-[140px] flex-col gap-1">
              <Button
                type="button"
                size="sm"
                variant={primary ? 'primary' : 'outline'}
                className="h-10 px-4"
                disabled={Boolean(block)}
                title={block ? auditPlanBlockText(t, block) : undefined}
                onClick={() => setAction(key)}
              >
                {auditPlanActionLabel(t, key)}
              </Button>
              {block && <span className="max-w-[180px] text-caption text-neutral-600">{auditPlanBlockText(t, block)}</span>}
            </div>
          )
        })}
        {plan.stage !== 'Planning' && (
          <Button type="button" size="sm" variant="primary" className="h-10 px-4" onClick={() => navigate(executionPath(plan.planNumber))} data-testid="open-execution">
            {plan.status === 'Completed' ? t('execution.openButton.view') : t('execution.openButton.startContinue')}
          </Button>
        )}
        {plan.reportId && (
          <Button type="button" size="sm" variant="secondary" className="h-10 px-4" onClick={() => navigate(auditReportPath(plan.reportId as string))}>
            {t('cab.auditPlanning.lifecycle.openReport', 'Open audit report')}
          </Button>
        )}
      </div>
      <AuditPlanTransitionDialog plan={plan} action={action} onClose={() => setAction(null)} onDone={onChange} />
    </section>
  )
}

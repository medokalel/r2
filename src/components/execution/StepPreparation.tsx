import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Trash } from 'iconsax-reactjs'
import { Button } from '@/components/ui/Button'
import { ApprovedLibraryBadge, CheckRow, Field, Panel, StatusLine } from '@/components/execution/executionUi'
import { INPUT_CLASS, TEXTAREA_CLASS } from '@/components/execution/fieldClasses'
import type { StepProps } from '@/components/execution/types'
import { addAuditChecklist, assignChecklistAuditor, removeAuditChecklist, updateExecution } from '@/lib/api/executionApi'
import { listChecklists, type ChecklistTemplate } from '@/lib/api/checklistsApi'
import { getAgreementGate, type AgreementGate } from '@/lib/api/agreementsApi'
import { AgreementGateNotice } from '@/components/agreements/AgreementGateNotice'
import { localized } from '@/lib/execution/executionText'

/** Step 1: plan sent and confirmed, team declarations, certification agreement, documents reviewed, checklists assigned per auditor. */
export function StepPreparation({ ws, busy, locked, run }: StepProps) {
  const { t, i18n } = useTranslation()
  const planId = ws.plan.id
  const [notes, setNotes] = useState(ws.preparation.notes)
  const [options, setOptions] = useState<ChecklistTemplate[]>([])
  const [sourceRef, setSourceRef] = useState('')
  const [gate, setGate] = useState<AgreementGate | null>(null)
  const [gateState, setGateState] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const team = [...new Set([ws.plan.leadAuditor, ...ws.plan.auditTeam].filter(Boolean))]

  useEffect(() => {
    let alive = true
    listChecklists().then((list) => alive && setOptions(list), () => alive && setOptions([]))
    // Certification agreement (ISO/IEC 17021-1 5.1.2): read from the agreements module when it is available.
    getAgreementGate(ws.plan.organizationId, ws.plan.stage).then(
      (g) => {
        if (!alive) return
        setGate(g)
        setGateState('ready')
      },
      () => alive && setGateState('unavailable'),
    )
    return () => {
      alive = false
    }
  }, [ws.plan.organizationId, ws.plan.stage])

  const agreementLine = () => {
    if (gateState === 'loading') return <StatusLine ok={false} label={t('execution.preparation.agreement')} detail={t('common.loading', 'Loading…')} />
    if (gateState === 'unavailable' || !gate) return <StatusLine ok={false} label={t('execution.preparation.agreement')} detail={t('execution.preparation.agreementUnavailable')} />
    const ok = !gate.required || gate.satisfied
    const detail = !gate.required
      ? t('execution.preparation.agreementNotRequired')
      : gate.satisfied
        ? t('execution.preparation.agreementActive', { reference: gate.agreement?.reference ?? '' })
        : t(gate.mode === 'block' ? 'execution.preparation.agreementMissingBlock' : 'execution.preparation.agreementMissingWarn')
    return (
      <StatusLine
        ok={ok}
        label={t('execution.preparation.agreement')}
        detail={detail}
        action={gate.link ? <Link to={gate.link} className="text-body-sm font-semibold text-primary underline-offset-4 hover:underline">{t('execution.preparation.openAgreement')}</Link> : undefined}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t('execution.preparation.readinessTitle')} description={t('execution.preparation.readinessDescription')}>
        <AgreementGateNotice clientId={ws.plan.organizationId} stage={ws.plan.stage} />
        <ul className="flex flex-col gap-2">
          <StatusLine
            ok={ws.preparation.planSent}
            label={t('execution.preparation.planSent')}
            detail={ws.preparation.planSent ? t('execution.preparation.planSentYes') : t('execution.preparation.planSentNo')}
            action={<Link to={`/cab/audit-planning/build/${ws.plan.planNumber}`} className="text-body-sm font-semibold text-primary underline-offset-4 hover:underline">{t('execution.preparation.openPlan')}</Link>}
          />
          <StatusLine ok={ws.preparation.clientConfirmed} label={t('execution.preparation.clientConfirmed')} detail={ws.preparation.clientConfirmed ? t('execution.preparation.clientConfirmedYes') : t('execution.preparation.clientConfirmedNo')} />
          <StatusLine ok={ws.preparation.teamDeclared} label={t('execution.preparation.teamDeclared')} detail={ws.preparation.teamDeclared ? t('execution.preparation.teamDeclaredYes') : t('execution.preparation.teamDeclaredNo')} />
          {agreementLine()}
        </ul>
        <CheckRow
          checked={ws.preparation.documentsReviewed}
          disabled={locked || busy}
          onChange={(next) => void run(() => updateExecution(planId, { documentsReviewed: next }))}
          label={t('execution.preparation.documentsReviewed')}
          hint={t('execution.preparation.documentsReviewedHint')}
          testId="documents-reviewed"
        />
        <Field label={t('execution.preparation.notes')} htmlFor="prep-notes">
          <textarea id="prep-notes" value={notes} disabled={locked} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== ws.preparation.notes && void run(() => updateExecution(planId, { preparationNotes: notes }))} className={TEXTAREA_CLASS} />
        </Field>
      </Panel>

      <Panel title={t('execution.preparation.checklistsTitle')} description={t('execution.preparation.checklistsDescription')}>
        {ws.checklists.length === 0 && <p className="text-body-sm text-neutral-600">{t('execution.preparation.noChecklists')}</p>}
        <ul className="flex flex-col gap-2">
          {ws.checklists.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 rounded-md border border-neutral-100 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-body-sm font-semibold text-neutral-900">{localized(i18n.language, c.name, c.nameAr)}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-caption text-neutral-600">
                  {t('execution.preparation.itemCount', { count: c.progress.total })}
                  {c.sourceType === 'library' && <ApprovedLibraryBadge />}
                </p>
              </div>
              <div className="flex items-end gap-2">
                <Field label={t('execution.preparation.auditor')} htmlFor={`auditor-${c.id}`}>
                  <select id={`auditor-${c.id}`} value={c.auditorName} disabled={busy} onChange={(e) => void run(() => assignChecklistAuditor(planId, c.id, e.target.value))} className={`${INPUT_CLASS} min-w-[200px]`}>
                    <option value="">{t('execution.preparation.chooseAuditor')}</option>
                    {[...new Set([...team, c.auditorName].filter(Boolean))].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>
                {!locked && c.progress.answered === 0 && (
                  <button type="button" className="flex size-11 items-center justify-center rounded-md text-error-700 hover:bg-error-50" aria-label={t('execution.preparation.removeChecklist', { name: c.name })} onClick={() => void run(() => removeAuditChecklist(planId, c.id))}>
                    <Trash size={18} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {!ws.steps.find((s) => s.key === 'closing' && s.status === 'done') && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field label={t('execution.preparation.addChecklist')} htmlFor="add-checklist">
              <select id="add-checklist" value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} className={`${INPUT_CLASS} sm:min-w-[320px]`}>
                <option value="">{t('execution.preparation.chooseChecklist')}</option>
                {options.map((o) => (
                  <option key={o.id ?? o.key} value={o.source === 'library' ? `library:${o.key}` : o.id ?? ''}>
                    {localized(i18n.language, o.name, o.nameAr)} {o.source === 'cab' ? `(${t('execution.checklists.ours')})` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="button" size="md" variant="outline" disabled={!sourceRef || busy} onClick={async () => { if (await run(() => addAuditChecklist(planId, { sourceRef }))) setSourceRef('') }}>
              {t('execution.preparation.add')}
            </Button>
          </div>
        )}
      </Panel>
    </div>
  )
}

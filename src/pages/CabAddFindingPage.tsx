import { useEffect, useState } from 'react'
import { toast as appToast } from '@/lib/toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import {
  SCHEME_RULES,
  createFinding,
  getAuditReport,
  reportScope,
  validateFindingForSubmit,
  type AuditFindingClassification,
  type AuditFindingType,
  type AuditReport,
} from '@/lib/api/cabAuditReportingApi'
import {
  classificationText,
  dueRuleText,
  findingErrorText,
  schemeNameText,
  schemeVersionText,
} from '@/lib/auditReportingText'
import { FIELD_KEYS } from '@/lib/api/cabAuditReportingApi'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { linkFindingToItem } from '@/lib/api/executionApi'
import { CARD, GHOST_BTN, INPUT, PRIMARY_BTN, ScopeBanner } from '@/components/cab/auditReporting/shared'
import { cn } from '@/lib/utils'

export function CabAddFindingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tr = (k: string, fb: string) => t(k, fb)
  const [searchParams] = useSearchParams()
  const reportIdParam = searchParams.get('reportId')
  // Opened from an audit checklist item (audit execution): the form starts pre-filled from that item.
  const fromItem = {
    checklistItemId: searchParams.get('checklistItemId'),
    planId: searchParams.get('planId'),
    returnTo: searchParams.get('returnTo'),
  }
  const prefill = (key: string) => searchParams.get(key) ?? ''
  const prefilled = Boolean(fromItem.checklistItemId)
  // The preview opens with an illustrative finding; the real form starts empty.
  const [demo] = useState(() => isDemoMode() && !prefilled)

  const [report, setReport] = useState<AuditReport | null>(null)
  const [findingType, setFindingType] = useState<AuditFindingType>(() => (prefilled && ['Nonconformity', 'Observation', 'Opportunity'].includes(prefill('type')) ? (prefill('type') as AuditFindingType) : 'Nonconformity'))
  const [classification, setClassification] = useState<AuditFindingClassification>(() => (prefilled ? (prefill('classification') as AuditFindingClassification) : ''))
  const [requirementRef, setRequirementRef] = useState(prefilled ? prefill('requirementRef') : demo ? 'ISO 9001:2015, Clause 8.5.1' : '')
  const [evidenceText, setEvidenceText] = useState(prefilled ? prefill('evidence') : demo ? 'Storage area temperature records for March were available for 1-10 March only (DOC-102).' : '')
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>(demo ? ['EV-0103'] : [])
  const [statement, setStatement] = useState(prefilled ? prefill('statement') : demo ? 'Complete temperature records for the storage area were not maintained per the referenced requirement.' : '')
  const [dueDate, setDueDate] = useState(prefilled ? prefill('dueDate') : demo ? '2025-04-12' : '')
  const [process, setProcess] = useState(demo ? 'Storage and Handling' : '')
  const [contact, setContact] = useState(demo ? 'Sara Ali (CTC-011 - Client contact)' : '')
  const [comments, setComments] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showScheme, setShowScheme] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    getAuditReport(reportIdParam)
      .then((data) => {
        if (!cancelled) setReport(data)
      })
      .catch((error) => console.error('Failed to load the audit report:', error))
    return () => {
      cancelled = true
    }
  }, [reportIdParam])

  const workspacePath = fromItem.returnTo?.startsWith('/cab/') ? fromItem.returnTo : `/cab/audit-reporting${report ? `?reportId=${encodeURIComponent(report.id)}` : ''}`
  const evidenceOptions = report
    ? [...report.evidence.map((e) => e.code), ...report.documentRefs.map((d) => d.split(' ')[0])]
    : []

  const show = (m: string) => {
    appToast.success(m)
  }
  const markDirty = () => setIsDirty(true)
  const toggleLink = (id: string) => {
    markDirty()
    setEvidenceLinks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }
  /** Saves the finding as a draft or submits it; a failed save keeps the entered values. */
  const save = async (submit: boolean) => {
    if (!report) return false
    setSaving(true)
    try {
      const next = await createFinding(report.id, {
        type: findingType,
        classification,
        requirementRef,
        statement,
        objectiveEvidence: evidenceText,
        linkedEvidence: evidenceLinks,
        dueDate,
        process,
        responsibleContact: contact,
        comments,
        submit,
        ...(fromItem.checklistItemId ? { checklistItemId: fromItem.checklistItemId } : {}),
      })
      const created = next.findings[next.findings.length - 1]
      if (fromItem.checklistItemId && fromItem.planId && created) {
        await linkFindingToItem(fromItem.planId, fromItem.checklistItemId, {
          code: created.code,
          type: created.type,
          classification: created.classification,
          requirementRef: created.requirementRef,
          statement: created.statement,
          dueDate: created.dueDate,
          status: created.status,
        })
      }
      setIsDirty(false)
      return true
    } catch (error) {
      setErrors([error instanceof Error && error.message ? error.message : tr('errors.generic', 'Something went wrong')])
      show(tr('cab.auditReporting.submitBlocked', 'Submission blocked - resolve the listed gates first. Draft preserved.'))
      return false
    } finally {
      setSaving(false)
    }
  }
  const handleSaveDraft = async () => {
    setErrors([])
    if (await save(false)) {
      show(tr('cab.auditReporting.findingDraftSaved', 'Finding draft saved - incomplete later-stage data allowed in draft.'))
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = validateFindingForSubmit({ findingType, classification, requirementRef, evidenceText, evidenceLinks, statement })
    setErrors(res.errors)
    if (!res.ok) {
      show(tr('cab.auditReporting.submitBlocked', 'Submission blocked - resolve the listed gates first. Draft preserved.'))
      return
    }
    if (!(await save(true))) return
    show(tr('cab.auditReporting.findingSubmitted', 'Finding submitted. Classification follows configured scheme rules.'))
    window.setTimeout(() => navigate(workspacePath), 1100)
  }
  const handleCancel = () => {
    if (isDirty) setShowCancel(true)
    else navigate(workspacePath)
  }

  return (
    <CabLayout sidebarVariant="auditReporting">
      <div className="flex min-h-screen flex-col">
        <CabHeader
          title={demo ? tr('cab.auditReporting.addFindingTitle', 'Add finding: NC-0024') : tr('cab.auditReporting.addFinding', 'Add finding')}
          subtitle={demo || !report ? tr('cab.auditReporting.addFindingSub', 'AUD-0024 · linked to audit + requirement') : `${report.auditNumber} · ${report.clientName} · ${report.stage}`}
          notificationCount={0}
        />

        <main className="flex flex-1 flex-col gap-5 overflow-auto bg-neutral-25 page-main">
          <nav className="flex items-center gap-2 text-body-sm font-medium text-neutral-500" aria-label={t('common.breadcrumb')}>
            <button type="button" onClick={handleCancel} className="transition-colors hover:text-primary">
              {tr('cab.auditReporting.title', 'Audit Reporting')}
            </button>
            <span aria-hidden>/</span>
            <span className="font-semibold text-neutral-700">{tr('cab.auditReporting.addFinding', 'Add finding')}</span>
          </nav>

          <ScopeBanner title={tr('cab.auditReporting.scope', 'CAB-client scope')} scope={reportScope(report)} />

          {errors.length > 0 && (
            <div className="rounded-md border border-error-200 bg-error-50 p-4" role="alert">
              <p className="text-body-sm font-bold text-error-600">{tr('cab.auditReporting.gatesBlockedTitle', 'Submission gates: resolve to submit')}</p>
              <ul className="mt-1.5 list-disc space-y-0.5 ps-5 text-caption font-medium text-neutral-800">
                {errors.map((e) => <li key={e}>{findingErrorText(t, e)}</li>)}
              </ul>
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            {/* ===== Left column ===== */}
            <div className={cn(CARD, 'space-y-4 p-5')}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-body-sm font-medium text-neutral-800">
                    {tr('cab.auditReporting.findingType', 'Finding type')} *
                  </label>
                  <select value={findingType} onChange={(e) => { setFindingType(e.target.value as AuditFindingType); markDirty(); }} className={INPUT} data-field={FIELD_KEYS.findingType}>
                    <option value="Nonconformity">{t('ui.findingType.nc')}</option>
                    <option value="Observation">{t('ui.findingType.obs')}</option>
                    <option value="Opportunity">{t('ui.findingType.ofi')}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-body-sm font-medium text-neutral-800">
                    {tr('cab.auditReporting.classification', 'Classification (scheme rules)')} *
                    <button type="button" onClick={() => setShowScheme(true)} aria-label={t('ui.schemeRulesInfo')}
                      className="flex size-5 items-center justify-center rounded-full bg-primary-50 text-caption font-bold text-primary">?</button>
                  </label>
                  <select value={classification} onChange={(e) => { setClassification(e.target.value as AuditFindingClassification); markDirty(); }} className={INPUT} data-field={FIELD_KEYS.classification}>
                    <option value="">{tr('cab.auditReporting.selectClass', 'Select per scheme rules…')}</option>
                    {SCHEME_RULES.classifications.map((c) => <option key={c.value} value={c.value}>{classificationText(t, c.value)}</option>)}
                  </select>
                  <p className="mt-1 text-caption text-neutral-600">
                    {classification ? dueRuleText(t, classification) : schemeVersionText(t)}
                  </p>
                </div>
              </div>

              {/* Requirement reference field */}
              <div>
                <label className="mb-1 block text-body-sm font-medium text-neutral-800">
                  {tr('cab.auditReporting.reqRefFull', 'Requirement reference')} *
                </label>
                <input
                  value={requirementRef}
                  onChange={(e) => { setRequirementRef(e.target.value); markDirty(); }}
                  className={INPUT}
                  data-field={FIELD_KEYS.requirementRef}
                />
              </div>

              <div>
                <label className="mb-1 block text-body-sm font-medium text-neutral-800">
                  {tr('cab.auditReporting.objectiveEvidence', 'Objective evidence (linked)')} *
                </label>
                <textarea rows={3} value={evidenceText} onChange={(e) => { setEvidenceText(e.target.value); markDirty(); }} className="w-full rounded-md border border-neutral-100 bg-white p-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none min-h-20 resize-y" data-field={FIELD_KEYS.objectiveEvidence} />
                <div className="mt-2 flex flex-wrap gap-2">
                  {evidenceOptions.map((id) => (
                    <label key={id} className={cn('cursor-pointer rounded-md border px-3 py-1.5 text-caption font-medium',
                      evidenceLinks.includes(id) ? 'border-primary bg-primary-50 text-primary' : 'border-neutral-100 bg-white text-neutral-700')}>
                      <input type="checkbox" className="me-1.5 accent-primary" checked={evidenceLinks.includes(id)} onChange={() => toggleLink(id)} />
                      {id}
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-caption text-neutral-600">
                  {tr('cab.auditReporting.evidenceGate', 'Evidence must reference the audit and requirement. Generic claims are blocked on submission.')}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-body-sm font-medium text-neutral-800">
                  {tr('cab.auditReporting.statement', 'Finding statement')} *
                </label>
                <textarea rows={3} value={statement} onChange={(e) => { setStatement(e.target.value); markDirty(); }} className="w-full rounded-md border border-neutral-100 bg-white p-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none min-h-20 resize-y" data-field={FIELD_KEYS.statement} />
              </div>

              <div>
                <button type="button" onClick={() => setDetailsOpen((v) => !v)} aria-expanded={detailsOpen}
                  className="flex w-full items-center justify-between rounded-md border border-neutral-100 bg-neutral-50 px-4 py-2.5 text-body-sm font-medium text-neutral-800">
                  {tr('cab.auditReporting.moreDetails', 'More details (progressive disclosure)')}
                  <span aria-hidden className={cn(detailsOpen ? 'rotate-180' : '')}>▾</span>
                </button>
              </div>

              {detailsOpen && (
                <div className="mt-3 grid grid-cols-1 gap-4 rounded-md border border-neutral-100 bg-neutral-25 p-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-caption font-medium text-neutral-800">{tr('cab.auditReporting.process', 'Process / area')}</label>
                    <input value={process} onChange={(e) => { setProcess(e.target.value); markDirty(); }} className={INPUT} data-field={FIELD_KEYS.process} />
                  </div>
                  <div>
                    <label className="mb-1 block text-caption font-medium text-neutral-800">
                      {tr('cab.auditReporting.dueDate', 'Due date')} · {tr('cab.auditReporting.schemeRuled', 'scheme-ruled')}
                    </label>
                    <input type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); markDirty(); }} className={INPUT} data-field={FIELD_KEYS.dueDate} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-caption font-medium text-neutral-800">{tr('cab.auditReporting.responsible', 'Responsible contact (client contact role)')}</label>
                    <input value={contact} onChange={(e) => { setContact(e.target.value); markDirty(); }} className={INPUT} data-field={FIELD_KEYS.contact} />
                    <p className="mt-1 text-caption text-neutral-600">
                      {tr('cab.auditReporting.rolesSep', 'Client contact ≠ portal access ≠ signatory authority ≠ competence record ≠ decision authority.')}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-caption font-medium text-neutral-800">{tr('cab.auditReporting.comments', 'Additional comments (optional)')}</label>
                    <textarea rows={2} value={comments} onChange={(e) => { setComments(e.target.value); markDirty(); }} className="w-full rounded-md border border-neutral-100 bg-white p-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none resize-y" />
                  </div>
                </div>
              )}
            </div>
            {/* ===== /Left column ===== */}

            {/* ===== Right column ===== */}
            <aside className={cn(CARD, 'h-fit space-y-3 p-5 shadow-none')}>
              <h3 className="text-body font-bold text-neutral-900">{tr('cab.auditReporting.stageGates', 'Stage gates')}</h3>
              <p className="text-caption text-neutral-600">
                {tr('cab.auditReporting.stageGatesSub', 'Draft permits incomplete later-stage data. Submission enforces configured gates.')}
              </p>
              <ul className="space-y-2 text-caption font-medium">
                {([
                  [Boolean(findingType), tr('cab.auditReporting.gateType', 'Finding type chosen')],
                  [classification !== '', tr('cab.auditReporting.gateClass', 'Classified per scheme rules')],
                  [requirementRef.trim() !== '', tr('cab.auditReporting.gateReq', 'Requirement referenced')],
                  [evidenceText.trim() !== '' || evidenceLinks.length > 0, tr('cab.auditReporting.gateEv', 'Evidence linked')],
                  [statement.trim() !== '', tr('cab.auditReporting.gateStmt', 'Statement written')],
                ] as [boolean, string][]).map(([ok, label]) => (
                  <li key={label} className={cn('flex items-center gap-2 rounded-md border px-3 py-2', ok ? 'border-success-200 bg-success-50 text-success-700' : 'border-neutral-300 bg-neutral-50 text-neutral-600')}>
                    <span aria-hidden className={cn('flex size-4 items-center justify-center rounded-full text-overline text-white', ok ? 'bg-success-500' : 'bg-neutral-400')}>✓</span>
                    {label}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 border-t border-neutral-100 pt-4">
                <button type="button" onClick={handleCancel} className={GHOST_BTN}>{tr('common.cancel', 'Cancel')}</button>
                <button type="button" onClick={() => void handleSaveDraft()} disabled={saving || !report || report.frozen} className={GHOST_BTN}>{tr('common.saveDraft', 'Save as Draft')}</button>
                <button type="submit" disabled={saving || !report || report.frozen} className={PRIMARY_BTN}>{tr('cab.auditReporting.submitFinding', 'Submit finding')}</button>
              </div>
            </aside>
            {/* ===== /Right column ===== */}
          </form>
        </main>


        {showCancel && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-surface-overlay/50 p-4" role="alertdialog" aria-modal="true" aria-label={t('cab.auditReporting.discard')}>
            <div className={cn(CARD, 'w-full max-w-md space-y-3 p-6 shadow-2xl')}>
              <p className="text-body font-bold text-neutral-900">{tr('cab.auditReporting.dirtyCancelTitle', 'Discard unsaved finding?')}</p>
              <p className="text-caption text-neutral-700">{tr('cab.auditReporting.dirtyCancelBody', 'This finding has unsaved draft changes. Leave without saving?')}</p>
              <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
                <button type="button" className={GHOST_BTN} onClick={() => setShowCancel(false)}>{tr('common.cancel', 'Cancel')}</button>
                <button type="button" className={PRIMARY_BTN} onClick={() => { setIsDirty(false); navigate(workspacePath); }}>
                  {tr('cab.auditReporting.discard', 'Discard changes')}
                </button>
              </div>
            </div>
          </div>
        )}

        {showScheme && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-surface-overlay/50 p-4" role="dialog" aria-modal="true" aria-label={t('ui.schemeRules')}>
            <div className={cn(CARD, 'w-full max-w-lg space-y-4 p-6 shadow-2xl')}>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-body font-bold text-neutral-900">{schemeNameText(t)}</h3>
                <span className="text-caption text-neutral-600">{schemeVersionText(t)}</span>
              </div>
              <p className="text-body-sm text-neutral-700">{t('ui.classificationRules')}</p>
              <div className="space-y-2">
                {SCHEME_RULES.classifications.map((c) => (
                  <div key={c.value} className="rounded-md border border-neutral-300 bg-neutral-50 p-3 text-body-sm">
                    <p className="font-semibold text-neutral-900">{classificationText(t, c.value)}</p>
                    <p className="mt-0.5 text-caption text-neutral-700">{dueRuleText(t, c.value)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button type="button" className={PRIMARY_BTN} onClick={() => setShowScheme(false)}>
                  {tr('common.close', 'Close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CabLayout>
  )
}
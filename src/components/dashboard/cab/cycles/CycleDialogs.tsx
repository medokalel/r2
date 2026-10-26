import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField, TextField } from '@/components/ui'
import { DialogDateField, DialogTextArea, WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import {
  createCycleRequest,
  decideCycleRequest,
  type CycleRequest,
  type CycleRequestStatus,
  type CycleRequestType,
} from '@/lib/api/cabCertificationApi'
import {
  extendCertificate,
  reinstateCertificate,
  reissueCertificate,
  suspendCertificate,
  withdrawCertificate,
} from '@/lib/api/cabCertificatesApi'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'

export type CertificateCycleAction = 'suspend' | 'reinstate' | 'withdraw' | 'extend' | 'reissue'

/** Logs a scope change, site change or transfer request (with type-specific fields). */
export function CycleRequestDialog({
  cycleId,
  type,
  currentScope,
  onClose,
  onSaved,
}: {
  cycleId: string
  type: CycleRequestType | null
  currentScope: string
  onClose: () => void
  onSaved: (request: CycleRequest) => void
}) {
  return type ? <RequestForm key={type} cycleId={cycleId} type={type} currentScope={currentScope} onClose={onClose} onSaved={onSaved} /> : null
}

function RequestForm({ cycleId, type, currentScope, onClose, onSaved }: { cycleId: string; type: CycleRequestType; currentScope: string; onClose: () => void; onSaved: (request: CycleRequest) => void }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [meta, setMeta] = useState<Record<string, string>>((): Record<string, string> =>
    type === 'scopeChange' ? { proposedScope: currentScope } : type === 'siteChange' ? { change: 'add', siteName: '', siteAddress: '' } : { direction: 'in', otherCab: '' },
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setField = (key: string, value: string) => setMeta((prev) => ({ ...prev, [key]: value }))

  const titles: Record<CycleRequestType, string> = {
    scopeChange: t('cab.manageCycle.actions.requestScopeChange', 'Request scope change'),
    siteChange: t('cab.manageCycle.actions.requestSiteChange', 'Request site change'),
    transfer: t('cab.manageCycle.actions.transferCertificate', 'Transfer certificate'),
  }

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const saved = await createCycleRequest(cycleId, { type, title: title.trim(), details: details.trim(), metadata: meta })
      toast.success(t('cab.manageCycle.requests.logged', { defaultValue: 'Request {{code}} logged.', code: saved.code }))
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <WorkflowDialog
      open
      size="lg"
      title={titles[type]}
      description={t('cab.manageCycle.requests.hint', 'The request is logged against the certification cycle; approve, reject or complete it from the tab.')}
      confirmLabel={t('cab.manageCycle.requests.submit', 'Log request')}
      confirmDisabled={title.trim().length < 3}
      busy={busy}
      error={error}
      onConfirm={() => void save()}
      onClose={onClose}
    >
      <TextField id="cycle-request-title" label={t('cab.manageCycle.requests.title', 'Title')} required value={title} maxLength={300} onChange={(e) => setTitle(e.target.value)} />
      {type === 'scopeChange' && (
        <DialogTextArea id="cycle-request-scope" label={t('cab.manageCycle.requests.proposedScope', 'Proposed scope')} rows={4} value={meta.proposedScope ?? ''} onChange={(v) => setField('proposedScope', v)} />
      )}
      {type === 'siteChange' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            id="cycle-request-change"
            label={t('cab.manageCycle.requests.change', 'Change')}
            value={meta.change ?? 'add'}
            options={[
              { value: 'add', label: t('cab.manageCycle.requests.changeAdd', 'Add a site') },
              { value: 'remove', label: t('cab.manageCycle.requests.changeRemove', 'Remove a site') },
              { value: 'modify', label: t('cab.manageCycle.requests.changeModify', 'Change a site') },
            ]}
            onChange={(v) => setField('change', v)}
          />
          <TextField id="cycle-request-site" label={t('cab.manageCycle.requests.siteName', 'Site name')} value={meta.siteName ?? ''} maxLength={300} onChange={(e) => setField('siteName', e.target.value)} />
          <div className="sm:col-span-2">
            <TextField id="cycle-request-address" label={t('cab.manageCycle.requests.siteAddress', 'Site address')} value={meta.siteAddress ?? ''} maxLength={500} onChange={(e) => setField('siteAddress', e.target.value)} />
          </div>
        </div>
      )}
      {type === 'transfer' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            id="cycle-request-direction"
            label={t('cab.manageCycle.requests.direction', 'Direction')}
            value={meta.direction ?? 'in'}
            options={[
              { value: 'in', label: t('cab.manageCycle.requests.transferIn', 'Transfer in (from another CAB)') },
              { value: 'out', label: t('cab.manageCycle.requests.transferOut', 'Transfer out (to another CAB)') },
            ]}
            onChange={(v) => setField('direction', v)}
          />
          <TextField id="cycle-request-cab" label={t('cab.manageCycle.requests.otherCab', 'Other certification body')} value={meta.otherCab ?? ''} maxLength={300} onChange={(e) => setField('otherCab', e.target.value)} />
        </div>
      )}
      <DialogTextArea id="cycle-request-details" label={t('cab.manageCycle.requests.details', 'Details')} rows={3} value={details} onChange={setDetails} />
    </WorkflowDialog>
  )
}

/** Approve / reject / complete a request with an optional note. */
export function CycleDecisionDialog({
  cycleId,
  target,
  onClose,
  onSaved,
}: {
  cycleId: string
  target: { request: CycleRequest; status: Exclude<CycleRequestStatus, 'open'> } | null
  onClose: () => void
  onSaved: (request: CycleRequest) => void
}) {
  const { t } = useTranslation()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const labels: Record<Exclude<CycleRequestStatus, 'open'>, string> = {
    approved: t('cab.manageCycle.requests.approve', 'Approve'),
    rejected: t('cab.manageCycle.requests.reject', 'Reject'),
    completed: t('cab.manageCycle.requests.complete', 'Mark completed'),
  }
  const save = async () => {
    if (!target) return
    setBusy(true)
    setError(null)
    try {
      const saved = await decideCycleRequest(cycleId, target.request.id, target.status, note.trim() || undefined)
      toast.success(t('cab.manageCycle.requests.updated', { defaultValue: 'Request {{code}} updated.', code: saved.code }))
      setNote('')
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }
  return (
    <WorkflowDialog
      open={target !== null}
      title={target ? `${labels[target.status]} · ${target.request.code}` : ''}
      description={target?.request.title}
      confirmLabel={target ? labels[target.status] : ''}
      tone={target?.status === 'rejected' ? 'destructive' : 'primary'}
      busy={busy}
      error={error}
      onConfirm={() => void save()}
      onClose={() => {
        setNote('')
        setError(null)
        onClose()
      }}
    >
      <DialogTextArea id="cycle-decision-note" label={t('cab.manageCycle.requests.note', 'Note (optional)')} value={note} onChange={setNote} />
    </WorkflowDialog>
  )
}

/** Suspend / reinstate / withdraw / extend / reissue the cycle's certificate. */
export function CycleCertificateDialog({
  certificateId,
  certificateNumber,
  currentScope,
  action,
  onClose,
  onDone,
}: {
  certificateId: string
  certificateNumber: string
  currentScope: string
  action: CertificateCycleAction | null
  onClose: () => void
  onDone: () => void
}) {
  return action ? (
    <CertificateForm
      key={action}
      certificateId={certificateId}
      certificateNumber={certificateNumber}
      currentScope={currentScope}
      action={action}
      onClose={onClose}
      onDone={onDone}
    />
  ) : null
}

function CertificateForm({
  certificateId,
  certificateNumber,
  currentScope,
  action,
  onClose,
  onDone,
}: {
  certificateId: string
  certificateNumber: string
  currentScope: string
  action: CertificateCycleAction
  onClose: () => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [date, setDate] = useState('')
  const [scope, setScope] = useState(currentScope)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const labels: Record<CertificateCycleAction, string> = {
    suspend: t('cab.manageCycle.actions.suspendCertificate', 'Suspend certificate'),
    reinstate: t('cab.manageCycle.actions.reinstateCertificate', 'Reinstate certificate'),
    withdraw: t('cab.manageCycle.actions.withdrawCertificate', 'Withdraw certificate'),
    extend: t('cab.manageCycle.actions.extendCertificate', 'Extend validity'),
    reissue: t('cab.manageCycle.actions.reissueCertificate', 'Reissue certificate'),
  }
  const descriptions: Record<CertificateCycleAction, string> = {
    suspend: t('cab.certificateRegister.statusDialog.suspendBody', 'The certificate is not valid while suspended. The reason is kept on the certificate record.'),
    reinstate: t('cab.certificateRegister.lifecycle.reinstateBody', 'The certificate becomes valid again once the cause of the suspension is resolved. The client is notified.'),
    withdraw: t('cab.certificateRegister.statusDialog.withdrawBody', 'The certificate stops being valid permanently. The reason is kept on the certificate record.'),
    extend: t('cab.certificateRegister.lifecycle.extendBody', 'Extend the validity by at most six months, for a documented reason (e.g. a delayed recertification audit).'),
    reissue: t('cab.certificateRegister.lifecycle.reissueBody', 'A new version of the certificate is issued with the next revision number; the current version becomes superseded and the client is notified.'),
  }

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = reason.trim()
      if (action === 'suspend') await suspendCertificate(certificateId, r)
      else if (action === 'withdraw') await withdrawCertificate(certificateId, r)
      else if (action === 'reinstate') await reinstateCertificate(certificateId, r)
      else if (action === 'extend') await extendCertificate(certificateId, date, r)
      else await reissueCertificate(certificateId, { reason: r, scope: scope.trim() !== currentScope ? scope : undefined })
      toast.success(t('cab.manageCycle.certificateUpdated', { defaultValue: 'Certificate {{number}} updated.', number: certificateNumber }))
      onDone()
      onClose()
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <WorkflowDialog
      open
      title={`${labels[action]} · ${certificateNumber}`}
      description={descriptions[action]}
      confirmLabel={labels[action]}
      tone={action === 'suspend' || action === 'withdraw' ? 'destructive' : 'primary'}
      confirmDisabled={reason.trim().length < 3 || (action === 'extend' && !date)}
      busy={busy}
      error={error}
      onConfirm={() => void save()}
      onClose={onClose}
    >
      {action === 'extend' && <DialogDateField label={t('cab.certificateRegister.lifecycle.newExpiry', 'New expiry date')} required value={date} onChange={setDate} />}
      {action === 'reissue' && (
        <DialogTextArea id="cycle-reissue-scope" label={t('cab.certificateRegister.lifecycle.scope', 'Scope on the new version')} rows={3} maxLength={5000} value={scope} onChange={setScope} />
      )}
      <DialogTextArea id="cycle-certificate-reason" label={t('cab.certificateRegister.statusDialog.reason', 'Reason')} required value={reason} onChange={setReason} />
    </WorkflowDialog>
  )
}

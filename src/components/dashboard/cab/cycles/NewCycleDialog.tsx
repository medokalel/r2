import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField, TextField } from '@/components/ui'
import { DialogDateField, DialogTextArea, WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import {
  createCertificationCycle,
  listCycleCertificateCandidates,
  type CertificationCycleDetail,
  type CreateCertificationCyclePayload,
  type CycleCertificateCandidate,
} from '@/lib/api/cabCertificationApi'
import { fetchPlanningClients, type PlanningClient } from '@/lib/api/cabAuditPlanningApi'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { cn } from '@/lib/utils'
import { displayCountry } from '@/lib/localizeCountry'
import { rangeText } from '@/lib/emptyValue'

type Mode = 'existing' | 'migrated'

/**
 * "New cycle" on the certification-cycles register: registers a cycle by hand for an issued
 * certificate that has none yet, or for a certificate migrated from another system.
 */
export function NewCycleDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (cycle: CertificationCycleDetail) => void
}) {
  return open ? <NewCycleForm onClose={onClose} onCreated={onCreated} /> : null
}

function NewCycleForm({ onClose, onCreated }: { onClose: () => void; onCreated: (cycle: CertificationCycleDetail) => void }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>('existing')
  const [candidates, setCandidates] = useState<CycleCertificateCandidate[] | null>(null)
  const [clients, setClients] = useState<PlanningClient[] | null>(null)
  const [certificateId, setCertificateId] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [standard, setStandard] = useState('')
  const [certificateNumber, setCertificateNumber] = useState('')
  const [scope, setScope] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [type, setType] = useState<CreateCertificationCyclePayload['type']>('initial')
  const [initialDate, setInitialDate] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([listCycleCertificateCandidates(), fetchPlanningClients()])
      .then(([certs, orgs]) => {
        if (cancelled) return
        setCandidates(certs)
        setClients(orgs)
        if (certs.length === 0) setMode('migrated')
      })
      .catch((err) => {
        if (!cancelled) setError(workflowErrorMessage(err, t))
      })
    return () => {
      cancelled = true
    }
  }, [t])

  const datesValid = Boolean(issueDate && expiryDate && expiryDate > issueDate)
  const valid =
    mode === 'existing'
      ? Boolean(certificateId)
      : Boolean(organizationId && standard.trim().length >= 2 && certificateNumber.trim().length >= 3 && scope.trim().length >= 3 && datesValid)

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const payload: CreateCertificationCyclePayload = {
        type,
        ...(initialDate ? { initialCertificationDate: initialDate } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(mode === 'existing'
          ? { certificateId }
          : {
              certificate: {
                organizationId,
                standard: standard.trim(),
                scope: scope.trim(),
                certificateNumber: certificateNumber.trim(),
                issueDate,
                expiryDate,
              },
            }),
      }
      const created = await createCertificationCycle(payload)
      toast.success(t('cab.certification.newCycleDialog.created', { defaultValue: 'Certification cycle {{code}} created.', code: created.cycleId }))
      onCreated(created)
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  const modeButton = (value: Mode, label: string, disabled = false) => (
    <button
      type="button"
      role="radio"
      aria-checked={mode === value}
      disabled={disabled}
      onClick={() => setMode(value)}
      className={cn(
        'flex-1 rounded-md px-3 py-2 text-body-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        mode === value ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-50',
      )}
    >
      {label}
    </button>
  )

  const loading = candidates === null || clients === null

  return (
    <WorkflowDialog
      open
      size="lg"
      title={t('cab.certification.newCycleDialog.title', 'New certification cycle')}
      description={t(
        'cab.certification.newCycleDialog.description',
        'Cycles open automatically when a certificate is issued. Register one by hand for an issued certificate without a cycle, or for a certificate migrated from another system.',
      )}
      confirmLabel={t('cab.certification.newCycleDialog.create', 'Create cycle')}
      confirmDisabled={loading || !valid}
      busy={busy}
      error={error}
      onConfirm={() => void save()}
      onClose={onClose}
    >
      <div role="radiogroup" aria-label={t('cab.certification.newCycleDialog.source', 'Certificate')} className="flex gap-1 rounded-md border border-neutral-100 p-1">
        {modeButton('existing', t('cab.certification.newCycleDialog.existing', 'Issued certificate'), candidates?.length === 0)}
        {modeButton('migrated', t('cab.certification.newCycleDialog.migrated', 'Migrated certificate'))}
      </div>

      {loading ? (
        <p className="text-body-sm text-neutral-600">{t('common.loading', 'Loading…')}</p>
      ) : mode === 'existing' ? (
        <SelectField
          id="new-cycle-certificate"
          label={t('cab.certification.newCycleDialog.certificate', 'Certificate without a cycle')}
          required
          value={certificateId}
          placeholder={t('cab.certification.newCycleDialog.pickCertificate', 'Select a certificate')}
          options={(candidates ?? []).map((c) => ({
            value: c.id,
            label: `${c.certificateNumber} · ${c.clientName} · ${c.standard} (${rangeText(c.issueDate, c.expiryDate)})`,
          }))}
          onChange={setCertificateId}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SelectField
              id="new-cycle-client"
              label={t('cab.certification.newCycleDialog.client', 'Client')}
              required
              value={organizationId}
              placeholder={t('cab.certification.newCycleDialog.pickClient', 'Select a client')}
              options={(clients ?? []).map((c) => ({ value: c.id, label: c.country ? `${c.name} · ${displayCountry(c.country)}` : c.name }))}
              onChange={setOrganizationId}
            />
          </div>
          <TextField id="new-cycle-standard" label={t('cab.certification.newCycleDialog.standard', 'Standard')} required placeholder="ISO 9001:2015" value={standard} maxLength={200} onChange={(e) => setStandard(e.target.value)} />
          <TextField id="new-cycle-number" label={t('cab.certification.newCycleDialog.number', 'Certificate number')} required value={certificateNumber} maxLength={100} onChange={(e) => setCertificateNumber(e.target.value)} />
          <DialogDateField label={t('cab.certification.newCycleDialog.issueDate', 'Issue date')} required value={issueDate} onChange={setIssueDate} />
          <DialogDateField label={t('cab.certification.newCycleDialog.expiryDate', 'Expiry date')} required value={expiryDate} onChange={setExpiryDate} />
          {issueDate && expiryDate && !datesValid && (
            <p className="text-caption text-error-600 sm:col-span-2">{t('cab.certification.newCycleDialog.datesInvalid', 'The expiry date must be after the issue date.')}</p>
          )}
          <div className="sm:col-span-2">
            <DialogTextArea id="new-cycle-scope" label={t('cab.certification.newCycleDialog.scope', 'Certified scope')} required rows={3} maxLength={5000} value={scope} onChange={setScope} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          id="new-cycle-type"
          label={t('cab.certification.newCycleDialog.type', 'Cycle type')}
          value={type}
          options={[
            { value: 'initial', label: t('cab.certification.newCycleDialog.typeInitial', 'Initial certification') },
            { value: 'recertification', label: t('cab.certification.newCycleDialog.typeRecertification', 'Recertification') },
          ]}
          onChange={(value) => setType(value as CreateCertificationCyclePayload['type'])}
        />
        <DialogDateField label={t('cab.certification.newCycleDialog.initialDate', 'Initial certification date')} value={initialDate} onChange={setInitialDate} />
      </div>
      <DialogTextArea id="new-cycle-notes" label={t('cab.certification.newCycleDialog.notes', 'Notes')} rows={2} maxLength={2000} value={notes} onChange={setNotes} />
    </WorkflowDialog>
  )
}

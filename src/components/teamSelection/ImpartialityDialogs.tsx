import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import {
  RELATIONSHIP_TYPES,
  createDeclaration,
  createRelationship,
  updateRelationship,
  type ImpartialityRelationship,
  type RelationshipInput,
  type RelationshipType,
} from '@/lib/api/impartialityApi'
import { fetchAuditPlans, fetchPlanningClients, type PlanningClient } from '@/lib/api/cabAuditPlanningApi'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { toast } from '@/lib/toast'

const inputClass = 'h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm font-normal text-neutral-900 focus:border-primary focus:outline-none'
const labelClass = 'flex flex-col gap-1 text-caption font-semibold text-neutral-800'
const OTHER = '__other__'

const emptyRelationship = (): RelationshipInput => ({ organizationId: null, clientName: '', type: 'CONSULTANCY', description: '', startDate: '', endDate: '' })

function useClients() {
  const [clients, setClients] = useState<PlanningClient[]>([])
  useEffect(() => {
    let alive = true
    fetchPlanningClients().then((list) => alive && setClients(list), () => undefined)
    return () => {
      alive = false
    }
  }, [])
  return clients
}

/** Fields of one relationship (client or counterparty, type, description, dates). */
function RelationshipFields({ value, onChange, clients, idPrefix, fixedClient }: { value: RelationshipInput; onChange: (v: RelationshipInput) => void; clients: PlanningClient[]; idPrefix: string; fixedClient?: boolean }) {
  const { t } = useTranslation()
  const selected = value.organizationId ?? (value.clientName ? OTHER : '')
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {!fixedClient && (
        <label className={labelClass} htmlFor={`${idPrefix}-client`}>
          {t('team.impartiality.fields.client')}
          <select
            id={`${idPrefix}-client`}
            className={inputClass}
            value={selected}
            onChange={(e) => onChange({ ...value, organizationId: e.target.value && e.target.value !== OTHER ? e.target.value : null, clientName: e.target.value === OTHER ? value.clientName : '' })}
          >
            <option value="">{t('team.impartiality.fields.chooseClient')}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={OTHER}>{t('team.impartiality.fields.notAClient')}</option>
          </select>
        </label>
      )}
      {!fixedClient && selected === OTHER && (
        <label className={labelClass}>
          {t('team.impartiality.fields.counterparty')}
          <input className={inputClass} value={value.clientName ?? ''} maxLength={300} onChange={(e) => onChange({ ...value, clientName: e.target.value })} />
        </label>
      )}
      <label className={labelClass}>
        {t('team.impartiality.fields.type')}
        <select className={inputClass} value={value.type} onChange={(e) => onChange({ ...value, type: e.target.value as RelationshipType })}>
          {RELATIONSHIP_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`team.impartiality.types.${type}`)}
            </option>
          ))}
        </select>
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        {t('team.impartiality.fields.description')}
        <input className={inputClass} value={value.description} maxLength={2000} onChange={(e) => onChange({ ...value, description: e.target.value })} />
      </label>
      <label className={labelClass}>
        {t('team.impartiality.fields.start')}
        <input type="date" className={inputClass} value={value.startDate ?? ''} onChange={(e) => onChange({ ...value, startDate: e.target.value })} />
      </label>
      <label className={labelClass}>
        {t('team.impartiality.fields.end')}
        <input type="date" className={inputClass} value={value.endDate ?? ''} min={value.startDate || undefined} onChange={(e) => onChange({ ...value, endDate: e.target.value })} />
        <span className="font-normal text-neutral-500">{t('team.impartiality.fields.endHint')}</span>
      </label>
    </div>
  )
}

const relationshipReady = (r: RelationshipInput) => r.description.trim().length >= 3 && Boolean(r.organizationId || r.clientName?.trim())
const cleanRelationship = (r: RelationshipInput): RelationshipInput => ({
  ...(r.organizationId ? { organizationId: r.organizationId } : { clientName: r.clientName?.trim() }),
  type: r.type,
  description: r.description.trim(),
  startDate: r.startDate || null,
  endDate: r.endDate || null,
})

interface RelationshipDialogProps {
  open: boolean
  people: Array<{ personId: string; name: string }>
  personId?: string
  editing?: ImpartialityRelationship | null
  onClose: () => void
  onSaved: () => void
}

/** Record (or edit) a relationship in the register as a CAB record. Mounted only while open (fresh form each time). */
export function RelationshipDialog(props: RelationshipDialogProps) {
  return props.open ? <RelationshipDialogBody {...props} /> : null
}

function RelationshipDialogBody({ open, people, personId, editing, onClose, onSaved }: RelationshipDialogProps) {
  const { t } = useTranslation()
  const clients = useClients()
  const [who, setWho] = useState(editing?.personId ?? personId ?? '')
  const [value, setValue] = useState<RelationshipInput>(() =>
    editing
      ? { organizationId: editing.organizationId, clientName: editing.organizationId ? '' : editing.clientName, type: editing.type, description: editing.description, startDate: editing.startDate ?? '', endDate: editing.endDate ?? '' }
      : emptyRelationship(),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      if (editing) await updateRelationship(editing.id, cleanRelationship(value))
      else await createRelationship({ personId: who, ...cleanRelationship(value) })
      toast.success(t('team.impartiality.saved'))
      onSaved()
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
      size="lg"
      title={editing ? t('team.impartiality.editTitle') : t('team.impartiality.addTitle')}
      description={t('team.impartiality.addHint')}
      confirmLabel={t('team.impartiality.save')}
      confirmDisabled={!who || !relationshipReady(value)}
      busy={busy}
      error={error}
      onConfirm={() => void save()}
      onClose={onClose}
    >
      {!personId && !editing && (
        <label className={labelClass}>
          {t('team.impartiality.fields.person')}
          <select className={inputClass} value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="">{t('team.impartiality.fields.choosePerson')}</option>
            {people.map((p) => (
              <option key={p.personId} value={p.personId}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <RelationshipFields value={value} onChange={setValue} clients={clients} idPrefix="rel" />
    </WorkflowDialog>
  )
}

/**
 * Record the declaration a person signed: annual (all clients) or for one audit plan; either
 * "no conflicts" or the relationships declared (they go to the CAB review).
 */
interface DeclarationDialogProps {
  open: boolean
  personId: string
  personName: string
  onClose: () => void
  onSaved: () => void
}

export function DeclarationDialog(props: DeclarationDialogProps) {
  return props.open ? <DeclarationDialogBody {...props} /> : null
}

function DeclarationDialogBody({ open, personId, personName, onClose, onSaved }: DeclarationDialogProps) {
  const { t } = useTranslation()
  const clients = useClients()
  const [kind, setKind] = useState<'ANNUAL' | 'AUDIT'>('ANNUAL')
  const [plans, setPlans] = useState<Array<{ id: string; label: string }>>([])
  const [planId, setPlanId] = useState('')
  const [noConflicts, setNoConflicts] = useState(true)
  const [relationships, setRelationships] = useState<RelationshipInput[]>([])
  const [signedName, setSignedName] = useState(personName)
  const [declaredAt, setDeclaredAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchAuditPlans().then(
      (list) => alive && setPlans(list.filter((p) => p.status !== 'Completed').map((p) => ({ id: p.id, label: `${p.planNumber} · ${p.clientName} · ${p.proposedStartDate}` }))),
      () => undefined,
    )
    return () => {
      alive = false
    }
  }, [])

  const ready = signedName.trim().length >= 2 && (kind === 'ANNUAL' || planId) && (noConflicts || (relationships.length > 0 && relationships.every(relationshipReady)))

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await createDeclaration({
        personId,
        kind,
        ...(kind === 'AUDIT' ? { auditPlanId: planId } : {}),
        noConflicts,
        signedName: signedName.trim(),
        declaredAt,
        relationships: noConflicts ? [] : relationships.map(cleanRelationship),
      })
      toast.success(t('team.declaration.saved'))
      onSaved()
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
      size="lg"
      title={t('team.declaration.title', { name: personName })}
      description={t('team.declaration.hint')}
      confirmLabel={t('team.declaration.save')}
      confirmDisabled={!ready}
      busy={busy}
      error={error}
      onConfirm={() => void save()}
      onClose={onClose}
    >
      <fieldset className="flex flex-wrap gap-4">
        <legend className="mb-1 text-caption font-semibold text-neutral-800">{t('team.declaration.kind')}</legend>
        {(['ANNUAL', 'AUDIT'] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 text-body-sm text-neutral-800">
            <input type="radio" name="decl-kind" checked={kind === k} onChange={() => setKind(k)} />
            {t(`team.declaration.kinds.${k}`)}
          </label>
        ))}
      </fieldset>
      {kind === 'AUDIT' && (
        <label className={labelClass}>
          {t('team.declaration.plan')}
          <select className={inputClass} value={planId} onChange={(e) => setPlanId(e.target.value)}>
            <option value="">{t('team.declaration.choosePlan')}</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-caption font-semibold text-neutral-800">{t('team.declaration.answer')}</legend>
        <label className="flex items-center gap-2 text-body-sm text-neutral-800">
          <input
            type="radio"
            name="decl-answer"
            checked={noConflicts}
            onChange={() => {
              setNoConflicts(true)
              setRelationships([])
            }}
          />
          {t('team.declaration.noConflicts')}
        </label>
        <label className="flex items-center gap-2 text-body-sm text-neutral-800">
          <input
            type="radio"
            name="decl-answer"
            checked={!noConflicts}
            onChange={() => {
              setNoConflicts(false)
              setRelationships((list) => (list.length ? list : [emptyRelationship()]))
            }}
          />
          {t('team.declaration.hasRelationships')}
        </label>
      </fieldset>
      {!noConflicts &&
        relationships.map((rel, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border border-neutral-100 p-3">
            <div className="flex items-center justify-between">
              <p className="text-caption font-semibold text-neutral-800">{t('team.declaration.relationship', { n: i + 1 })}</p>
              {relationships.length > 1 && (
                <button type="button" className="text-caption font-semibold text-error-600" onClick={() => setRelationships(relationships.filter((_, x) => x !== i))}>
                  {t('team.declaration.remove')}
                </button>
              )}
            </div>
            <RelationshipFields value={rel} onChange={(v) => setRelationships(relationships.map((r, x) => (x === i ? v : r)))} clients={clients} idPrefix={`decl-${i}`} fixedClient={kind === 'AUDIT'} />
          </div>
        ))}
      {!noConflicts && (
        <button type="button" className="self-start text-caption font-semibold text-primary underline underline-offset-4" onClick={() => setRelationships([...relationships, emptyRelationship()])}>
          {t('team.declaration.addRelationship')}
        </button>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          {t('team.declaration.signedName')}
          <input className={inputClass} value={signedName} maxLength={200} onChange={(e) => setSignedName(e.target.value)} />
        </label>
        <label className={labelClass}>
          {t('team.declaration.date')}
          <input type="date" className={inputClass} value={declaredAt} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDeclaredAt(e.target.value)} />
        </label>
      </div>
    </WorkflowDialog>
  )
}

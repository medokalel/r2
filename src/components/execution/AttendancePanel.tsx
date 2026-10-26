import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash } from 'iconsax-reactjs'
import { Button } from '@/components/ui/Button'
import { SignaturePad } from '@/components/ui/SignaturePad'
import { Checkbox } from '@/components/ui/Checkbox'
import { Chip, Field, Panel } from '@/components/execution/executionUi'
import { INPUT_CLASS } from '@/components/execution/fieldClasses'
import type { Attendee, AttendeeInput, AttendeeParty, SignatureKind } from '@/lib/api/executionApi'

interface AttendancePanelProps {
  meeting: 'opening' | 'closing'
  attendees: Attendee[]
  locked: boolean
  busy: boolean
  /** Team members offered as quick picks. */
  teamNames: string[]
  onAdd: (input: AttendeeInput) => Promise<boolean>
  onSign: (attendee: Attendee, signature: string, kind: SignatureKind) => Promise<boolean>
  onRemove: (attendee: Attendee) => void
}

const PARTIES: AttendeeParty[] = ['Client', 'Audit team', 'Observer']

/** Opening / closing meeting attendance: attendees with party and position, each signs on the device (draw, type or upload). */
export function AttendancePanel({ meeting, attendees, locked, busy, teamNames, onAdd, onSign, onRemove }: AttendancePanelProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [party, setParty] = useState<AttendeeParty>('Client')
  const [remote, setRemote] = useState(false)
  const [signature, setSignature] = useState('')
  const [kind, setKind] = useState<SignatureKind>('drawn')
  const [signingId, setSigningId] = useState<string | null>(null)
  const [laterSignature, setLaterSignature] = useState('')
  const [laterKind, setLaterKind] = useState<SignatureKind>('drawn')

  const add = async () => {
    if (!name.trim()) return
    const ok = await onAdd({ meeting, name: name.trim(), position: position.trim(), party, remote, ...(signature ? { signature, signatureType: kind } : {}) })
    if (ok) {
      setName('')
      setPosition('')
      setSignature('')
      setRemote(false)
    }
  }

  return (
    <Panel
      title={t(`execution.attendance.title.${meeting}`)}
      description={t('execution.attendance.description')}
    >
      {attendees.length === 0 ? (
        <p className="text-body-sm text-neutral-600">{t('execution.attendance.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2" data-testid={`attendance-${meeting}`}>
          {attendees.map((a) => (
            <li key={a.id} className="flex flex-col gap-2 rounded-md border border-neutral-100 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-body-sm font-semibold text-neutral-900">{a.name}</p>
                  <p className="text-caption text-neutral-600">
                    {[a.position, t(`execution.attendance.parties.${a.party}`), a.remote ? t('execution.attendance.remote') : ''].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {a.signed ? (
                    <Chip className="border-success-500 bg-success-50 text-success-700">{t('execution.attendance.signed')}</Chip>
                  ) : (
                    <Chip className="border-neutral-300 bg-neutral-50 text-neutral-700">{t('execution.attendance.notSigned')}</Chip>
                  )}
                  {!locked && !a.signed && (
                    <Button type="button" size="sm" variant="outline" onClick={() => { setSigningId(a.id); setLaterSignature('') }}>
                      {t('execution.attendance.signNow')}
                    </Button>
                  )}
                  {!locked && (
                    <button type="button" className="flex size-10 items-center justify-center rounded-md text-error-700 hover:bg-error-50" aria-label={t('execution.attendance.remove', { name: a.name })} onClick={() => onRemove(a)}>
                      <Trash size={18} />
                    </button>
                  )}
                </div>
              </div>
              {a.signature && a.signature.startsWith('data:') && (
                <img src={a.signature} alt={t('execution.attendance.signatureOf', { name: a.name })} className="h-14 w-auto max-w-[240px] rounded-sm border border-neutral-100 bg-white object-contain" />
              )}
              {signingId === a.id && (
                <div className="flex flex-col gap-2">
                  <SignaturePad value={laterSignature} onChange={setLaterSignature} signerName={a.name} caption={a.name} onCommit={(info) => setLaterKind(info.method)} />
                  <div className="flex gap-2">
                    <Button type="button" size="md" disabled={!laterSignature || busy} onClick={async () => { if (await onSign(a, laterSignature, laterKind)) setSigningId(null) }}>
                      {t('execution.attendance.saveSignature')}
                    </Button>
                    <Button type="button" size="md" variant="outline" onClick={() => setSigningId(null)}>{t('common.cancel', 'Cancel')}</Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!locked && (
        <div className="flex flex-col gap-3 rounded-md border border-dashed border-neutral-200 bg-neutral-25 p-3 sm:p-4">
          <p className="text-body-sm font-semibold text-neutral-900">{t('execution.attendance.addTitle')}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('execution.attendance.name')} required htmlFor={`att-name-${meeting}`}>
              <input id={`att-name-${meeting}`} list={`att-team-${meeting}`} value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} autoComplete="off" />
              <datalist id={`att-team-${meeting}`}>{teamNames.map((n) => <option key={n} value={n} />)}</datalist>
            </Field>
            <Field label={t('execution.attendance.position')} htmlFor={`att-pos-${meeting}`}>
              <input id={`att-pos-${meeting}`} value={position} onChange={(e) => setPosition(e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label={t('execution.attendance.party')} htmlFor={`att-party-${meeting}`}>
              <select id={`att-party-${meeting}`} value={party} onChange={(e) => setParty(e.target.value as AttendeeParty)} className={INPUT_CLASS}>
                {PARTIES.map((p) => <option key={p} value={p}>{t(`execution.attendance.parties.${p}`)}</option>)}
              </select>
            </Field>
            <label className="flex min-h-11 items-center gap-3 self-end text-body-sm text-neutral-800">
              <Checkbox checked={remote} onChange={() => setRemote((v) => !v)} />
              {t('execution.attendance.remoteLabel')}
            </label>
          </div>
          <Field label={t('execution.attendance.signature')} hint={t('execution.attendance.signatureHint')}>
            <SignaturePad value={signature} onChange={setSignature} signerName={name} caption={name || undefined} onCommit={(info) => setKind(info.method)} />
          </Field>
          <div>
            <Button type="button" size="md" disabled={!name.trim() || busy} onClick={() => void add()} data-testid={`add-attendee-${meeting}`}>
              {t('execution.attendance.add')}
            </Button>
          </div>
        </div>
      )}
    </Panel>
  )
}

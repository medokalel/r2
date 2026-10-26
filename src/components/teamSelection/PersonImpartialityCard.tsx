import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getImpartialityPerson, type ImpartialityPerson, type ImpartialityRelationship } from '@/lib/api/impartialityApi'
import { DeclarationDialog, RelationshipDialog } from '@/components/teamSelection/ImpartialityDialogs'
import { RelationshipList } from '@/components/teamSelection/RelationshipList'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/format/dates'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { cn } from '@/lib/utils'

const STATUS_STYLE = { valid: 'bg-success-50 text-success-700', expiring: 'bg-warning-50 text-warning-800', expired: 'bg-error-50 text-error-700', missing: 'bg-error-50 text-error-700' } as const

/**
 * The person's own impartiality declarations and declared relationships (shown on the competence
 * profile). The CAB records the declaration the person signed; employees do not sign in.
 */
export function PersonImpartialityCard({ personId }: { personId: string }) {
  const { t } = useTranslation()
  const [data, setData] = useState<ImpartialityPerson | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [declaring, setDeclaring] = useState(false)
  const [editing, setEditing] = useState<ImpartialityRelationship | null>(null)
  const [adding, setAdding] = useState(false)

  const [reloadKey, setReloadKey] = useState(0)
  const load = useCallback(() => setReloadKey((n) => n + 1), [])

  useEffect(() => {
    let alive = true
    getImpartialityPerson(personId).then(
      (person) => {
        if (!alive) return
        setData(person)
        setError(null)
      },
      (err) => alive && setError(workflowErrorMessage(err, t)),
    )
    return () => {
      alive = false
    }
  }, [personId, reloadKey, t])

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-4 sm:p-5" aria-labelledby={`impartiality-${personId}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id={`impartiality-${personId}`} className="text-body font-bold text-neutral-900">
            {t('team.declaration.cardTitle')}
          </h2>
          <p className="text-caption text-neutral-600">{t('team.declaration.cardSubtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="md" onClick={() => setDeclaring(true)} disabled={!data}>
            {t('team.declaration.record')}
          </Button>
          <Button type="button" size="md" variant="outline" onClick={() => setAdding(true)} disabled={!data}>
            {t('team.impartiality.add')}
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-error-50 px-3 py-2 text-caption text-error-700">
          {error}
        </p>
      )}
      {data && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full px-3 py-1 text-caption font-semibold', STATUS_STYLE[data.declarationStatus])}>{t(`team.declaration.status.${data.declarationStatus}`)}</span>
            {data.declarationValidUntil && <span className="text-caption text-neutral-600">{t('team.declaration.validUntil', { date: formatDate(data.declarationValidUntil) })}</span>}
            <Link to={`/cab/impartiality?person=${personId}`} className="text-caption font-semibold text-primary hover:underline">
              {t('team.declaration.openRegister')}
            </Link>
          </div>
          {data.declarations.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {data.declarations.slice(0, 5).map((d) => (
                <li key={d.id} className="text-caption text-neutral-700">
                  <span className="font-semibold text-neutral-900">{t(`team.declaration.kinds.${d.kind}`)}</span>
                  {d.planNumber && <span dir="ltr"> {d.planNumber}</span>} · {formatDate(d.declaredAt)} · {d.noConflicts ? t('team.declaration.noConflictsShort') : t('team.declaration.relationshipsShort', { count: d.relationshipIds.length })} ·{' '}
                  {t('team.declaration.signedBy', { name: d.signedName })}
                </li>
              ))}
            </ul>
          )}
          <RelationshipList rows={data.relationships} onEdit={setEditing} onChanged={load} />
          <DeclarationDialog open={declaring} personId={personId} personName={data.name} onClose={() => setDeclaring(false)} onSaved={load} />
          <RelationshipDialog
            open={adding || Boolean(editing)}
            people={[{ personId, name: data.name }]}
            personId={personId}
            editing={editing}
            onClose={() => {
              setAdding(false)
              setEditing(null)
            }}
            onSaved={load}
          />
        </>
      )}
    </section>
  )
}

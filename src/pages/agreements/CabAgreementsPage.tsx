import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Add, DocumentText, Setting2 } from 'iconsax-reactjs'
import { AppIcon, SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { DataTable, EmptyState, ErrorBlock, KeyValue, LoadingBlock, MobileCard, MobileCards, PageHeader } from '@/components/platform/PlatformUi'
import { AgreementStatusBadge } from '@/components/agreements/AgreementStatusBadge'
import { AgreementFormDialog } from '@/components/agreements/AgreementFormDialog'
import { kindTitle } from '@/components/agreements/agreementHelpers'
import {
  AGREEMENT_STATUSES,
  createAgreement,
  listAgreementClients,
  listAgreements,
  type AgreementListItem,
  type AgreementStatus,
} from '@/lib/api/agreementsApi'
import { formatDate } from '@/lib/format/dates'
import { ROUTES, cabAgreementPath } from '@/lib/routes'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

/** CAB register of certification agreements (/cab/agreements): every version, filters, generate by hand. */
export function CabAgreementsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const clientFilter = params.get('client') ?? ''
  const [rows, setRows] = useState<AgreementListItem[] | null>(null)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<AgreementStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [generating, setGenerating] = useState(Boolean(clientFilter))
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [clientId, setClientId] = useState(clientFilter)

  useEffect(() => {
    let alive = true
    listAgreements({ organizationId: clientFilter || undefined }).then(
      (list) => {
        if (!alive) return
        setRows(list)
        setError(false)
      },
      () => alive && setError(true),
    )
    return () => {
      alive = false
    }
  }, [reload, clientFilter])

  useEffect(() => {
    let alive = true
    listAgreementClients().then((list) => alive && setClients(list), () => undefined)
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (rows ?? []).filter(
      (a) =>
        (status === 'all' || a.status === status) &&
        (!term || [a.reference, a.clientName, a.clientCode, a.standards, a.offerNumber].some((v) => String(v ?? '').toLowerCase().includes(term))),
    )
  }, [rows, search, status])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const count = (s: AgreementStatus) => (rows ?? []).filter((a) => a.status === s).length
  const clientName = clients.find((c) => c.id === clientFilter)?.name

  const kpis: Array<{ key: string; label: string; value: number; tone: string; filter: AgreementStatus }> = [
    { key: 'draft', label: t('agreements.register.kpi.toSend'), value: count('draft'), tone: 'text-neutral-900', filter: 'draft' },
    { key: 'sent', label: t('agreements.register.kpi.awaitingClient'), value: count('sent'), tone: 'text-warning-700', filter: 'sent' },
    { key: 'client_signed', label: t('agreements.register.kpi.toCountersign'), value: count('client_signed'), tone: 'text-primary', filter: 'client_signed' },
    { key: 'active', label: t('agreements.register.kpi.active'), value: count('active'), tone: 'text-success-700', filter: 'active' },
  ]

  const generate = async () => {
    const created = await createAgreement({ organizationId: clientId })
    toast.success(t('agreements.register.generated', { reference: created.reference }))
    navigate(cabAgreementPath(created.id))
  }

  return (
    <CabLayout tourId="cab-agreements" tourSteps={[]}>
      <CabHeader title={t('agreements.register.title')} />
      <main className="flex min-w-0 flex-1 flex-col gap-5 page-main">
        <PageHeader
          title={t('agreements.register.title')}
          subtitle={t('agreements.register.subtitle')}
          crumbs={[{ label: t('agreements.common.hub'), to: ROUTES.workspace }, { label: t('agreements.register.title') }]}
          actions={
            <>
              <Button asChild variant="secondary" size="sm" className="w-full sm:w-auto">
                <Link to={ROUTES.cabAgreementTerms}>
                  <AppIcon icon={Setting2} size={18} />
                  {t('agreements.register.terms')}
                </Link>
              </Button>
              <Button variant="primary" size="sm" icon={<AppIcon icon={Add} size={18} />} onClick={() => setGenerating(true)} className="w-full sm:w-auto">
                {t('agreements.register.generate')}
              </Button>
            </>
          }
        />

        {clientFilter && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary-100 bg-primary-25 px-4 py-2.5 text-body-sm text-primary">
            <span>{t('agreements.register.clientFilter', { client: clientName ?? clientFilter })}</span>
            <button type="button" className="font-semibold underline underline-offset-4" onClick={() => setParams({})}>
              {t('agreements.register.clearFilter')}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <button
              key={k.key}
              type="button"
              onClick={() => {
                setPage(1)
                setStatus(status === k.filter ? 'all' : k.filter)
              }}
              aria-pressed={status === k.filter}
              className={cn(
                'flex min-w-0 flex-col items-start gap-1 rounded-lg border bg-white p-4 text-start transition-colors hover:border-primary/40',
                status === k.filter ? 'border-primary' : 'border-neutral-100',
              )}
            >
              <span className="text-caption font-medium text-neutral-600">{k.label}</span>
              <span className={cn('text-h3 font-bold', k.tone)}>{k.value}</span>
            </button>
          ))}
        </div>

        <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-3 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full min-w-0 sm:max-w-[360px] sm:flex-1">
              <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-500">
                <AppIcon icon={SearchIcon} size={18} />
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
                placeholder={t('agreements.register.search')}
                aria-label={t('agreements.register.search')}
                className="h-11 w-full rounded-md border border-neutral-100 bg-white ps-10 pe-3 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none"
              />
            </div>
            <TableFilterSelect
              label={t('agreements.fields.status')}
              value={status}
              onChange={(v) => {
                setPage(1)
                setStatus(v as AgreementStatus | 'all')
              }}
              options={[{ value: 'all', label: t('agreements.register.allStatuses') }, ...AGREEMENT_STATUSES.map((s) => ({ value: s, label: t(`agreements.status.${s}`) }))]}
              className="sm:w-56"
            />
          </div>

          {error && !rows ? <ErrorBlock message={t('agreements.common.loadError')} onRetry={() => setReload((n) => n + 1)} /> : null}
          {!error && !rows ? <LoadingBlock rows={5} /> : null}
          {rows && rows.length === 0 ? (
            <EmptyState
              title={t('agreements.register.emptyTitle')}
              hint={t('agreements.register.emptyHint')}
              action={
                <Button variant="primary" size="sm" onClick={() => setGenerating(true)}>
                  {t('agreements.register.generate')}
                </Button>
              }
            />
          ) : null}
          {rows && rows.length > 0 && filtered.length === 0 ? <p className="py-6 text-center text-body-sm text-neutral-600">{t('agreements.register.noMatch')}</p> : null}

          {visible.length > 0 && (
            <>
              <DataTable
                head={[
                  t('agreements.fields.reference'),
                  t('agreements.fields.client'),
                  t('agreements.fields.standards'),
                  t('agreements.fields.status'),
                  t('agreements.register.nextStep'),
                  t('agreements.fields.updated'),
                ]}
                minWidth={900}
              >
                {visible.map((a, i) => (
                  <tr
                    key={a.id}
                    onClick={() => navigate(cabAgreementPath(a.id))}
                    className={cn('cursor-pointer border-b border-neutral-50 transition-colors hover:bg-primary-25', i % 2 === 1 && 'bg-neutral-25')}
                  >
                    <td className="px-4 py-3.5">
                      <Link to={cabAgreementPath(a.id)} className="text-body-sm font-semibold text-primary hover:underline" dir="ltr" onClick={(e) => e.stopPropagation()}>
                        {a.reference}
                      </Link>
                      <p className="text-caption text-neutral-600">{kindTitle(t, a)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-body-sm font-medium text-neutral-900">{a.clientName}</p>
                      <p className="text-caption text-neutral-600" dir="ltr">
                        {a.offerNumber ?? a.clientCode}
                      </p>
                    </td>
                    <td className="max-w-[220px] px-4 py-3.5 text-body-sm text-neutral-800">{a.standards || t('agreements.common.notSet')}</td>
                    <td className="px-4 py-3.5">
                      <AgreementStatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3.5 text-body-sm text-neutral-700">{t(`agreements.next.${a.status}`)}</td>
                    <td className="px-4 py-3.5 text-body-sm text-neutral-700">{formatDate(a.countersignedAt ?? a.clientSignedAt ?? a.sentAt ?? a.createdAt)}</td>
                  </tr>
                ))}
              </DataTable>
              <MobileCards>
                {visible.map((a) => (
                  <MobileCard key={a.id} onClick={() => navigate(cabAgreementPath(a.id))}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-body font-bold text-primary" dir="ltr">
                        {a.reference}
                      </span>
                      <AgreementStatusBadge status={a.status} />
                    </div>
                    <p className="text-body-sm font-semibold text-neutral-900">{a.clientName}</p>
                    <p className="text-caption text-neutral-600">{kindTitle(t, a)}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3">
                      <KeyValue label={t('agreements.fields.standards')}>{a.standards || t('agreements.common.notSet')}</KeyValue>
                      <KeyValue label={t('agreements.register.nextStep')}>{t(`agreements.next.${a.status}`)}</KeyValue>
                    </dl>
                  </MobileCard>
                ))}
              </MobileCards>
              <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </section>

        <p className="flex items-start gap-2 text-caption text-neutral-600">
          <AppIcon icon={DocumentText} size={16} className="mt-0.5 shrink-0" />
          {t('agreements.register.footnote')}
        </p>
      </main>

      <AgreementFormDialog
        open={generating}
        title={t('agreements.generate.title')}
        description={t('agreements.generate.description')}
        submitLabel={t('agreements.generate.submit')}
        canSubmit={Boolean(clientId)}
        onClose={() => setGenerating(false)}
        onSubmit={generate}
      >
        <label className="flex flex-col gap-2 text-body-sm font-semibold text-neutral-800" htmlFor="agreement-client">
          {t('agreements.fields.client')}
          <select
            id="agreement-client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="h-12 w-full rounded-md border border-neutral-200 bg-white px-3 text-body-sm font-normal text-neutral-900 focus:border-primary focus:outline-none"
          >
            <option value="">{t('agreements.generate.choose')}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </AgreementFormDialog>
    </CabLayout>
  )
}

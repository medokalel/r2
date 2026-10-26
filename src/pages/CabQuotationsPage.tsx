import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { QuotationStatusBadge } from '@/components/dashboard/cab/QuotationView'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui'
import { listQuotations, type QuotationList, type QuotationStatus } from '@/lib/api/cabQuotationApi'
import { cabApplicationQuotationPath, ROUTES } from '@/lib/routes'
import {
  approveQuotation,
  listQuotationApprovalQueue,
  type ApprovalQueueFilter,
  type QuotationApprovalQueueItem,
} from '@/lib/api/cabApplicationQuotationApi'
import { WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { notSet } from '@/lib/emptyValue'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'

const STATUSES: QuotationStatus[] = ['CREATED', 'ISSUED', 'ACCEPTED', 'REJECTED', 'CANCELLED']

type Tab = ApprovalQueueFilter | 'list'
const TABS: Tab[] = ['pending', 'draft', 'approved', 'list']

/**
 * /cab/quotations/approval — the internal approval queue (open quotations awaiting approval,
 * returned for changes, approved and ready to issue) plus the list of every quotation.
 */
export function CabQuotationsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('pending')
  const labels: Record<Tab, string> = {
    pending: t('cab.quotationApproval.queue.pending', 'Awaiting approval'),
    draft: t('cab.quotationApproval.queue.draft', 'Returned for changes'),
    approved: t('cab.quotationApproval.queue.approved', 'Approved, ready to issue'),
    all: t('cab.quotationApproval.queue.all', 'All open'),
    list: t('cab.quotationFlow.allQuotations'),
  }
  return (
    <CabLayout>
      <CabHeader title={t('cab.quotationApproval.queue.title', 'Quotation approvals')} />
      <main className="flex flex-1 flex-col gap-6 overflow-auto bg-white page-main">
        <div role="tablist" aria-label={t('cab.quotationApproval.queue.title', 'Quotation approvals')} className={pageTabListClassName}>
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={pageTabClassName(tab === key)}
            >
              {labels[key]}
            </button>
          ))}
        </div>
        {tab === 'list' ? <AllQuotationsList /> : <ApprovalQueue key={tab} filter={tab} />}
      </main>
    </CabLayout>
  )
}

function ApprovalQueue({ filter }: { filter: ApprovalQueueFilter }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState<QuotationApprovalQueueItem[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [approving, setApproving] = useState<QuotationApprovalQueueItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listQuotationApprovalQueue(filter)
      .then((list) => {
        if (!cancelled) setItems(list)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [filter, attempt])

  const money = (value: string, currency: string) => {
    try {
      return new Intl.NumberFormat(i18n.language, { style: 'currency', currency }).format(Number(value))
    } catch {
      return `${value} ${currency}`
    }
  }

  const approve = async () => {
    if (!approving) return
    setBusy(true)
    setError(null)
    try {
      await approveQuotation(approving.quotationId)
      toast.success(t('cab.quotationApproval.approved', 'Quotation approved. It can now be issued to the client.'))
      setApproving(null)
      setAttempt((n) => n + 1)
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  if (failed) return <p role="alert" className="text-error-500">{t('cab.quotationEditor.loadError')}</p>
  if (!items) return <p className="text-neutral-600">{t('common.loading')}</p>
  if (!items.length) return <p className="text-neutral-600">{t('cab.quotationApproval.queue.empty', 'Nothing to show here.')}</p>

  return (
    <>
      <ul className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <li key={item.quotationId} className="flex flex-col gap-3 rounded-lg border border-neutral-100 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-body font-bold text-primary">{item.applicationNumber ?? item.quotationId.slice(0, 8).toUpperCase()}</p>
                <p className="text-body-sm text-neutral-800">{item.clientName}</p>
                <p className="text-caption text-neutral-600">{item.standardCodes.join(', ')}</p>
              </div>
              <p className="text-body font-bold">{money(item.totalAmount, item.currency)}</p>
            </div>
            <p className="text-caption text-neutral-600">
              {item.submittedBy
                ? t('cab.quotationApproval.queue.submitted', {
                    defaultValue: 'Submitted by {{name}} · {{date}}',
                    name: item.submittedBy.name,
                    date: new Date(item.submittedAt ?? item.createdAt).toLocaleDateString(i18n.language),
                  })
                : t('cab.quotationApproval.preparedBy', { defaultValue: 'Prepared by {{name}}.', name: item.preparedBy?.name ?? notSet() })}
              {item.note ? ` · “${item.note}”` : ''}
            </p>
            {item.approveBlockedReason === 'separationOfDuties' && (
              <p className="text-caption text-neutral-600">
                {t('cab.quotationApproval.separation', 'You prepared this quotation; another CAB user (or the CAB administrator) must approve it.')}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="h-9 px-3" onClick={() => navigate(cabApplicationQuotationPath(item.applicationId))}>
                {t('cab.quotationApproval.queue.open', 'Open quotation')}
              </Button>
              {item.approvalStatus === 'PENDING' && (
                <Button type="button" size="sm" className="h-9 px-3" disabled={!item.canApprove} onClick={() => setApproving(item)}>
                  {t('cab.quotationApproval.actions.approve', 'Approve')}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <WorkflowDialog
        open={approving !== null}
        title={t('cab.quotationApproval.actions.approve', 'Approve')}
        description={t('cab.quotationApproval.confirm.approve', 'Approving allows the quotation to be issued to the client.')}
        confirmLabel={t('cab.quotationApproval.actions.approve', 'Approve')}
        busy={busy}
        error={error}
        onConfirm={() => void approve()}
        onClose={() => {
          setApproving(null)
          setError(null)
        }}
      />
    </>
  )
}

/** Every quotation of this CAB (GET /cab/quotations) with its client decision status. */
function AllQuotationsList() {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; list?: QuotationList; failed?: boolean } | null>(null)
  const key = `${status}|${page}|${attempt}`

  useEffect(() => {
    let cancelled = false
    listQuotations({ status: (status || undefined) as QuotationStatus | undefined, page, limit: 10 })
      .then((list) => { if (!cancelled) setResult({ key, list }) })
      .catch(() => { if (!cancelled) setResult({ key, failed: true }) })
    return () => { cancelled = true }
  }, [status, page, key])

  const loading = result?.key !== key
  const list = result?.list
  const money = (value: string, currency: string) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency }).format(Number(value))

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-60">
            <SelectField
              id="quotation-status-filter"
              label={t('cab.quotationFlow.filterStatus')}
              value={status || 'ALL'}
              options={[{ value: 'ALL', label: t('cab.quotationFlow.allStatuses') }, ...STATUSES.map((value) => ({ value, label: t(`cab.quotationFlow.status.${value}`) }))]}
              onChange={(value) => { setStatus(value === 'ALL' ? '' : value); setPage(1) }}
            />
          </div>
          <Link className="text-body-sm font-semibold text-primary underline" to={ROUTES.cabApplicationQuotation}>
            + {t('cab.quotationFlow.newQuotation')}
          </Link>
        </div>

        {result?.failed ? (
          <p role="alert" className="text-error-500">{t('cab.quotationEditor.loadError')}</p>
        ) : loading ? (
          <p className="text-neutral-600">{t('common.loading')}</p>
        ) : !list || list.items.length === 0 ? (
          <p className="text-neutral-600">{t('cab.quotationFlow.empty')}</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-100 bg-white">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-start text-body-sm">
              <thead className="bg-primary text-body-2-medium text-white">
                <tr>
                  {['number', 'standards', 'status', 'total', 'offerEnd', 'created'].map((col) => (
                    <th key={col} scope="col" className="px-4 py-3.5 text-start">{t(`cab.quotationFlow.list.${col}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.items.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100 text-caption text-text-primary last:border-b-0 hover:bg-primary-25">
                    <td className="px-4 py-3.5">
                      <Link className="font-semibold text-primary underline" to={cabApplicationQuotationPath(item.applicationId)}>
                        {item.quotationNumber ?? item.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">{item.standardCodesUsed.join(', ')}</td>
                    <td className="px-4 py-3.5"><QuotationStatusBadge status={item.status} /></td>
                    <td className="px-4 py-3.5 font-semibold">{money(item.totalAmount, item.currency)}</td>
                    <td className="px-4 py-3.5">{item.offerEndDate ? new Date(`${item.offerEndDate.slice(0, 10)}T00:00:00`).toLocaleDateString(i18n.language) : notSet()}</td>
                    <td className="px-4 py-3.5">{new Date(item.createdAt).toLocaleDateString(i18n.language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {list && list.totalPages > 1 && (
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.back')}</Button>
            <span className="text-body-sm">{page} / {list.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= list.totalPages} onClick={() => setPage(page + 1)}>{t('common.next')}</Button>
            <Button variant="outline" size="sm" onClick={() => setAttempt(attempt + 1)}>{t('cab.quotationFlow.refresh')}</Button>
          </div>
        )}
    </div>
  )
}

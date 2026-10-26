import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { InvoiceTable } from '@/components/platform/InvoiceTable'
import { ErrorBlock, FieldLabel, KpiCard, LoadingBlock, PageHeader } from '@/components/platform/PlatformUi'
import { PLATFORM_BRAND } from '@/components/platform/platformStyles'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { useLoader } from '@/components/platform/useLoader'
import { exportPlatformInvoices, generatePlatformInvoices, listPlatformInvoices, listTenants } from '@/lib/api/platformApi'
import { INVOICE_STATUSES, type PlatformInvoice } from '@/lib/api/platformTypes'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { PLATFORM_ROUTES } from '@/lib/platformRoutes'
import { toast } from '@/lib/toast'
import { downloadXlsxWorkbook } from '@/lib/xlsxDownload'

const PAGE_SIZE = 10
const OPEN = ['ISSUED', 'OVERDUE', 'PARTIALLY_PAID']

export function PlatformInvoicesPage() {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  const [status, setStatus] = useState('all')
  const [tenant, setTenant] = useState('all')
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState<'generate' | 'export' | null>(null)
  const filters = { status: status === 'all' ? undefined : status, tenant: tenant === 'all' ? undefined : tenant }
  const { data, loading, error, reload } = useLoader(() => listPlatformInvoices(filters), [filters.status, filters.tenant])
  const tenants = useLoader(() => listTenants(), [])
  const rows = useMemo(() => data ?? [], [data])
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)

  const open = (i: PlatformInvoice) => Math.max(0, i.total - (i.amountPaid ?? 0))
  const outstanding = rows.filter((i) => OPEN.includes(i.status)).reduce((s, i) => s + open(i), 0)
  const overdue = rows.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + open(i), 0)
  const collected = rows.reduce((s, i) => s + (i.amountPaid ?? 0), 0)
  const drafts = rows.filter((i) => i.status === 'DRAFT').length

  const generate = async () => {
    setBusy('generate')
    try {
      const count = await generatePlatformInvoices()
      toast.success(count ? t('platform.invoices.generated', { count }) : t('platform.invoices.nothingToGenerate'))
      reload()
    } catch (err) {
      toast.error(getUserErrorMessage(err, t))
    } finally {
      setBusy(null)
    }
  }

  const exportFile = async () => {
    setBusy('export')
    try {
      const blob = await exportPlatformInvoices(filters)
      const name = `icasco-invoices-${new Date().toISOString().slice(0, 10)}.xlsx`
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = name
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      } else {
        downloadXlsxWorkbook(name, [
          {
            name: 'Invoices',
            rows: [
              [t('platform.invoices.number'), t('platform.invoices.tenant'), t('platform.invoices.periodStart'), t('platform.invoices.periodEnd'), t('platform.invoices.subtotal'), t('platform.invoices.vatShort'), t('platform.invoices.total'), t('platform.invoices.totalSar'), t('platform.invoices.paid'), t('platform.common.status'), t('platform.invoices.dueDate')],
              ...rows.map((i) => [
                i.number, i.tenantName ?? i.cabId, i.periodStart.slice(0, 10), i.periodEnd.slice(0, 10), i.subtotal.toFixed(2), i.vatAmount.toFixed(2),
                i.total.toFixed(2), i.totalSar.toFixed(2), (i.amountPaid ?? 0).toFixed(2), t(`platform.invoiceStatus.${i.status}`), i.dueDate.slice(0, 10),
              ]),
            ],
          },
        ])
      }
    } catch (err) {
      toast.error(getUserErrorMessage(err, t))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader
        title={t('platform.invoices.title')}
        subtitle={t('platform.invoices.subtitle')}
        crumbs={[{ label: t('platform.nav.dashboard'), to: PLATFORM_ROUTES.dashboard }, { label: t('platform.invoices.title') }]}
        actions={
          <>
            <Button variant="outline" onClick={() => void exportFile()} disabled={busy !== null || rows.length === 0} className="flex-1 sm:flex-none">
              {t('platform.invoices.export')}
            </Button>
            <Button variant="primary" onClick={() => void generate()} disabled={busy !== null} className="flex-1 sm:flex-none">
              {t('platform.invoices.generate')}
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label={t('platform.dashboard.kpi.outstanding')} value={f.usdShort(outstanding)} accent={PLATFORM_BRAND.gold} />
        <KpiCard label={t('platform.dashboard.kpi.overdue')} value={f.usdShort(overdue)} accent="#e74d3c" />
        <KpiCard label={t('platform.invoices.collected')} value={f.usdShort(collected)} accent={PLATFORM_BRAND.teal} />
        <KpiCard label={t('platform.invoices.drafts')} value={f.number(drafts)} accent={PLATFORM_BRAND.mid} />
      </section>

      <section className="rounded-lg border border-neutral-100 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div className="flex flex-col gap-2">
            <FieldLabel>{t('platform.common.status')}</FieldLabel>
            <SelectField
              value={status}
              onChange={(v) => {
                setPage(1)
                setStatus(v)
              }}
              options={[{ value: 'all', label: t('platform.common.allStatuses') }, ...INVOICE_STATUSES.map((s) => ({ value: s, label: t(`platform.invoiceStatus.${s}`) }))]}
            />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>{t('platform.invoices.tenant')}</FieldLabel>
            <SelectField
              value={tenant}
              onChange={(v) => {
                setPage(1)
                setTenant(v)
              }}
              options={[{ value: 'all', label: t('platform.invoices.allTenants') }, ...(tenants.data ?? []).map((row) => ({ value: row.id, label: row.name }))]}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setStatus('all')
              setTenant('all')
              setPage(1)
            }}
            disabled={status === 'all' && tenant === 'all'}
            className="h-11 justify-self-start whitespace-nowrap text-body-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline"
          >
            {t('platform.common.clearFilters')}
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-5">
        <p className="text-body-sm text-neutral-600">{loading ? t('platform.common.loading') : t('platform.invoices.count', { count: rows.length })}</p>
        {error ? <ErrorBlock message={getUserErrorMessage(error, t)} onRetry={reload} /> : null}
        {loading && !data ? (
          <LoadingBlock />
        ) : (
          <>
            <InvoiceTable invoices={rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)} canManage onChanged={reload} />
            {rows.length > PAGE_SIZE && (
              <div className="flex justify-end border-t border-neutral-100 pt-4">
                <TablePagination page={current} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}

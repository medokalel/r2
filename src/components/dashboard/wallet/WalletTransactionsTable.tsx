import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, ExcelFileIcon, PdfFileIcon, SearchIcon } from '@/components/icons'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { DatePicker, parseDisplayDate } from '@/components/ui/DatePicker'
import {
  downloadExcelCsv,
  downloadPdfFromTable,
  matchesSearch,
  previewFieldsDocument,
  printFieldsDocument,
  type TableColumn,
} from '@/lib/tableTools'
import {
  formatWalletAmount,
  type WalletPaymentMethod,
  type WalletTransaction,
  type WalletTransactionStatus,
} from '@/lib/api/walletApi'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

interface WalletTransactionsTableProps {
  transactions: WalletTransaction[]
}

type AmountFilterOperator = 'all' | 'gt' | 'lt'

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isWithinDateRange(txDate: string, from: Date | null, to: Date | null) {
  if (!from && !to) return true

  const parsed = parseDisplayDate(txDate)
  if (!parsed) return false

  const day = startOfDay(parsed)
  const rangeFrom = from && to && from > to ? to : from
  const rangeTo = from && to && from > to ? from : to

  if (rangeFrom && day < startOfDay(rangeFrom)) return false
  if (rangeTo && day > startOfDay(rangeTo)) return false
  return true
}

const datePickerFilterClass =
  'min-w-[150px] [&_button]:h-auto [&_button]:min-h-[42px] [&_button]:py-2.5 [&_button]:text-body-sm'

function PaymentMethodBadge({ method }: { method: WalletPaymentMethod }) {
  const { t } = useTranslation()

  const config = {
    mada: {
      label: t('wallet.paymentMethods.mada'),
      icon: (
        <span className="flex size-6 items-center justify-center rounded bg-[#00a651] text-overline font-bold text-white">
          mada
        </span>
      ),
    },
    bank_transfer: {
      label: t('wallet.paymentMethods.bankPaymentMethod'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-600">
          <path d="M3 10h18M5 10V19M9 10V19M15 10V19M19 10V19M2 19h20M12 3l9 5H3l9-5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    visa: {
      label: t('wallet.paymentMethods.visa'),
      icon: (
        <span className="text-body-sm font-bold italic text-primary-800">VISA</span>
      ),
    },
  }[method]

  return (
    <div className="flex items-center justify-center gap-2">
      {config.icon}
      <span className="text-body-sm text-neutral-800">{config.label}</span>
    </div>
  )
}

export function WalletTransactionsTable({ transactions }: WalletTransactionsTableProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [amountOperator, setAmountOperator] = useState<AmountFilterOperator>('all')
  const [amountValue, setAmountValue] = useState('')

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesQuery = matchesSearch(
        [tx.transactionNumber, tx.statementTitle, tx.statementSubtitle, tx.date],
        appliedQuery
      )
      const matchesType = typeFilter === 'all' || tx.paymentMethod === typeFilter
      const matchesDate = isWithinDateRange(tx.date, dateFrom, dateTo)
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter

      const parsedAmount = Number(amountValue)
      const matchesAmount =
        amountOperator === 'all' ||
        !amountValue ||
        Number.isNaN(parsedAmount) ||
        (amountOperator === 'gt' ? tx.amount > parsedAmount : tx.amount < parsedAmount)

      return matchesQuery && matchesType && matchesDate && matchesStatus && matchesAmount
    })
  }, [transactions, appliedQuery, typeFilter, dateFrom, dateTo, statusFilter, amountOperator, amountValue])

  const paymentMethodLabel = (method: WalletPaymentMethod) => {
    const map = {
      mada: t('wallet.paymentMethods.mada'),
      bank_transfer: t('wallet.paymentMethods.bankPaymentMethod'),
      visa: t('wallet.paymentMethods.visa'),
    }
    return map[method]
  }

  const statusLabel = (status: WalletTransactionStatus) => {
    if (status === 'failed') return t('wallet.transactions.statusUnsuccessful')
    if (status === 'successful') return t('wallet.transactions.statusSuccessful')
    return status
  }

  const exportColumns: TableColumn<WalletTransaction>[] = [
    { header: '#', value: (_, index) => index + 1 },
    { header: t('wallet.transactions.columns.transactionNumber'), value: (row) => row.transactionNumber },
    { header: t('wallet.transactions.columns.date'), value: (row) => row.date },
    {
      header: t('wallet.transactions.columns.statement'),
      value: (row) => `${row.statementTitle}${row.statementSubtitle ? ` - ${row.statementSubtitle}` : ''}`,
    },
    { header: t('wallet.transactions.columns.paymentMethod'), value: (row) => paymentMethodLabel(row.paymentMethod) },
    { header: t('wallet.transactions.columns.amount'), value: (row) => formatWalletAmount(row.amount) },
    { header: t('wallet.transactions.columns.status'), value: (row) => statusLabel(row.status) },
  ]

  const buildInvoiceFields = (tx: WalletTransaction) => [
    { label: t('wallet.transactions.columns.transactionNumber'), value: tx.transactionNumber },
    { label: t('wallet.transactions.columns.date'), value: tx.date },
    { label: t('wallet.transactions.columns.statement'), value: tx.statementTitle },
    { label: t('wallet.transactions.columns.paymentMethod'), value: paymentMethodLabel(tx.paymentMethod) },
    { label: t('wallet.transactions.columns.amount'), value: formatWalletAmount(tx.amount) },
    { label: t('wallet.transactions.columns.status'), value: statusLabel(tx.status) },
  ]

  const handleSearch = () => setAppliedQuery(query)

  const transactionFilterControlClass =
    'rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-body-sm text-neutral-800 outline-none focus:border-primary'

  return (
    <section className="flex flex-col rounded-lg border border-neutral-100 bg-white py-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4 px-5">
        <div>
          <h2 className="text-body-lg font-semibold text-neutral-900">
            {t('wallet.transactions.title')}
          </h2>
          <p className="mt-1 text-body-sm text-neutral-600">{t('wallet.transactions.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              downloadPdfFromTable(
                'wallet-transactions.pdf',
                t('wallet.transactions.title'),
                exportColumns,
                filtered
              )
            }
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-body-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            <AppIcon icon={PdfFileIcon} size={22} />
            {t('wallet.transactions.downloadPdf')}
          </button>
          <button
            type="button"
            onClick={() => downloadExcelCsv('wallet-transactions.csv', exportColumns, filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-body-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            <AppIcon icon={ExcelFileIcon} size={22} />
            {t('wallet.transactions.exportExcel')}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 px-5">
        <div className="relative min-w-[240px] flex-1">
          <AppIcon
            icon={SearchIcon}
            size={18}
            className="pointer-events-none absolute inset-y-0 start-3 my-auto text-neutral-500"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('wallet.transactions.searchPlaceholder')}
            className="w-full rounded-md border border-neutral-300 bg-white py-2.5 ps-10 pe-3 text-body-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
        >
          {t('common.search')}
        </button>
        <TableFilterSelect
          label={t('wallet.transactions.allTypes')}
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'all', label: t('wallet.transactions.allTypes') },
            { value: 'mada', label: t('wallet.paymentMethods.mada') },
            { value: 'bank_transfer', label: t('wallet.paymentMethods.bankPaymentMethod') },
            { value: 'visa', label: t('wallet.paymentMethods.visa') },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <DatePicker
            key={`from-${dateFrom?.toISOString() ?? 'empty'}`}
            value={dateFrom ?? undefined}
            onChange={setDateFrom}
            placeholder={t('wallet.transactions.dateFrom')}
            className={datePickerFilterClass}
          />
          <span className="text-body-sm text-neutral-500">{notSet()}</span>
          <DatePicker
            key={`to-${dateTo?.toISOString() ?? 'empty'}`}
            value={dateTo ?? undefined}
            onChange={setDateTo}
            placeholder={t('wallet.transactions.dateTo')}
            className={datePickerFilterClass}
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom(null)
                setDateTo(null)
              }}
              className="text-body-sm font-medium text-primary hover:underline"
            >
              {t('wallet.transactions.clearDates')}
            </button>
          )}
        </div>
        <TableFilterSelect
          label={t('wallet.transactions.allCases')}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: t('wallet.transactions.allCases') },
            { value: 'successful', label: t('wallet.transactions.statusSuccessful') },
            { value: 'failed', label: t('wallet.transactions.statusUnsuccessful') },
          ]}
        />
        <div className="flex items-center gap-2">
          <TableFilterSelect
            label={t('wallet.transactions.allAmounts')}
            value={amountOperator}
            onChange={(value) => setAmountOperator(value as AmountFilterOperator)}
            options={[
              { value: 'all', label: t('wallet.transactions.allAmounts') },
              { value: 'gt', label: t('wallet.transactions.amountMoreThan') },
              { value: 'lt', label: t('wallet.transactions.amountLessThan') },
            ]}
          />
          <input
            type="number"
            min={0}
            step="0.01"
            value={amountValue}
            onChange={(e) => setAmountValue(e.target.value)}
            disabled={amountOperator === 'all'}
            placeholder={t('wallet.transactions.amountPlaceholder')}
            aria-label={t('wallet.transactions.amountPlaceholder')}
            className={cn(
              transactionFilterControlClass,
              'w-[120px]',
              amountOperator === 'all' && 'cursor-not-allowed bg-neutral-50 text-neutral-500'
            )}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-center">
          <thead>
            <tr className="bg-primary text-white">
              <th className="px-4 py-4 text-body-sm font-medium">{t('wallet.transactions.columns.index')}</th>
              <th className="px-4 py-4 text-body-sm font-medium">{t('wallet.transactions.columns.transactionNumber')}</th>
              <th className="px-4 py-4 text-body-sm font-medium">{t('wallet.transactions.columns.date')}</th>
              <th className="px-4 py-4 text-body-sm font-medium">{t('wallet.transactions.columns.statement')}</th>
              <th className="px-4 py-4 text-body-sm font-medium">{t('wallet.transactions.columns.paymentMethod')}</th>
              <th className="px-4 py-4 text-body-sm font-medium">{t('wallet.transactions.columns.amount')}</th>
              <th className="px-4 py-4 text-body-sm font-medium">{t('wallet.transactions.columns.status')}</th>
              <th className="px-4 py-4 text-body-sm font-medium">{t('wallet.transactions.columns.procedure')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-neutral-600">
                  {notSet()}
                </td>
              </tr>
            ) : (
              filtered.map((tx, index) => (
                <tr key={tx.id} className={cn(index % 2 === 1 && 'bg-neutral-25')}>
                  <td className="px-4 py-4 text-body-sm text-neutral-800">{index + 1}</td>
                  <td className="px-4 py-4 text-body-sm text-neutral-800" dir="ltr">
                    {tx.transactionNumber}
                  </td>
                  <td className="px-4 py-4 text-body-sm text-neutral-800" dir="ltr">
                    {tx.date}
                  </td>
                  <td className="px-4 py-4 text-start">
                    <p className="text-body-sm font-medium text-neutral-900">{tx.statementTitle}</p>
                    {tx.statementSubtitle && (
                      <p className="text-caption text-neutral-600">{tx.statementSubtitle}</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <PaymentMethodBadge method={tx.paymentMethod} />
                  </td>
                  <td className="px-4 py-4 text-body-sm font-medium text-primary" dir="ltr">
                    {formatWalletAmount(tx.amount)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'text-body-sm font-medium',
                        tx.status === 'failed' ? 'text-error-500' : 'text-success-500'
                      )}
                    >
                      {statusLabel(tx.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          previewFieldsDocument(
                            t('wallet.transactions.preview'),
                            buildInvoiceFields(tx)
                          )
                        }
                        className="rounded-md border border-warning-500 px-3 py-1.5 text-body-sm font-medium text-warning-700 transition-colors hover:bg-orange-50"
                      >
                        {t('wallet.transactions.preview')}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          printFieldsDocument(
                            t('wallet.transactions.printInvoice'),
                            buildInvoiceFields(tx)
                          )
                        }
                        className="text-body-sm font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {t('wallet.transactions.printInvoice')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

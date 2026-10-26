import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useTranslation } from 'react-i18next'
import { AppIcon, MoreIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { ConfirmActionDialog } from '@/components/dashboard/ConfirmActionDialog'
import { DataTable, EmptyState, InvoiceStatusBadge, MobileCard, MobileCards } from '@/components/platform/PlatformUi'
import { cellClass, rowClass } from '@/components/platform/platformStyles'
import { RecordPaymentDialog } from '@/components/platform/RecordPaymentDialog'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { issuePlatformInvoice, voidPlatformInvoice } from '@/lib/api/platformApi'
import type { PlatformInvoice } from '@/lib/api/platformTypes'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { rangeText } from '@/lib/emptyValue'

type Action = 'view' | 'issue' | 'void' | 'pay'

function actionsFor(invoice: PlatformInvoice, canManage: boolean): Action[] {
  if (!canManage) return ['view']
  if (invoice.status === 'DRAFT') return ['view', 'issue', 'void']
  if (invoice.status === 'ISSUED' || invoice.status === 'OVERDUE') return ['view', 'pay', ...((invoice.amountPaid ?? 0) > 0 ? [] : (['void'] as Action[]))]
  if (invoice.status === 'PARTIALLY_PAID') return ['view', 'pay']
  return ['view']
}

export function InvoiceDetailsDialog({ invoice, onClose }: { invoice: PlatformInvoice | null; onClose: () => void }) {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  return (
    <Dialog.Root open={invoice !== null} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(640px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2"
        >
          {invoice && (
            <div className="flex min-h-0 flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-6 py-4">
                <div className="min-w-0">
                  <Dialog.Title className="text-body-lg font-semibold text-neutral-900" dir="ltr" style={{ textAlign: 'start' }}>
                    {invoice.number}
                  </Dialog.Title>
                  {invoice.tenantName && <p className="text-body-sm text-neutral-600">{invoice.tenantName}</p>}
                </div>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5 text-body-sm">
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-caption text-neutral-600">{t('platform.invoices.period')}</dt>
                    <dd>{rangeText(f.date(invoice.periodStart), f.date(invoice.periodEnd))}</dd>
                  </div>
                  <div>
                    <dt className="text-caption text-neutral-600">{t('platform.invoices.issuedAt')}</dt>
                    <dd>{f.date(invoice.issuedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-caption text-neutral-600">{t('platform.invoices.dueDate')}</dt>
                    <dd>{f.date(invoice.dueDate)}</dd>
                  </div>
                </dl>
                <div className="overflow-x-auto rounded-lg border border-neutral-100">
                  <table className="w-full min-w-[420px] text-body-sm">
                    <thead className="bg-neutral-25 text-neutral-700">
                      <tr>
                        <th className="px-3 py-2 text-start font-medium">{t('platform.invoices.line')}</th>
                        <th className="px-3 py-2 text-end font-medium">{t('platform.invoices.qty')}</th>
                        <th className="px-3 py-2 text-end font-medium">{t('platform.invoices.unitPrice')}</th>
                        <th className="px-3 py-2 text-end font-medium">{t('platform.invoices.amount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lines.map((line, i) => (
                        <tr key={i} className="border-t border-neutral-100">
                          <td className="px-3 py-2">{line.description}</td>
                          <td className="px-3 py-2 text-end" dir="ltr">{line.quantity}</td>
                          <td className="px-3 py-2 text-end" dir="ltr">{f.usd(line.unitPrice)}</td>
                          <td className="px-3 py-2 text-end" dir="ltr">{f.usd(line.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="ms-auto flex w-full max-w-xs flex-col gap-1">
                  <div className="flex justify-between gap-2"><span>{t('platform.invoices.subtotal')}</span><span dir="ltr">{f.usd(invoice.subtotal)}</span></div>
                  <div className="flex justify-between gap-2"><span>{t('platform.invoices.vat', { rate: f.percent(invoice.vatRate) })}</span><span dir="ltr">{f.usd(invoice.vatAmount)}</span></div>
                  <div className="flex justify-between gap-2 border-t border-neutral-100 pt-1 font-semibold"><span>{t('platform.invoices.total')}</span><span dir="ltr">{f.usd(invoice.total)}</span></div>
                  <div className="flex justify-between gap-2 text-caption text-neutral-600">
                    <span>{t('platform.invoices.sarEquivalent', { rate: invoice.sarRate })}</span>
                    <span dir="ltr">{f.sar(invoice.totalSar)}</span>
                  </div>
                  {(invoice.amountPaid ?? 0) > 0 && (
                    <div className="flex justify-between gap-2 text-success-700"><span>{t('platform.invoices.paid')}</span><span dir="ltr">{f.usd(invoice.amountPaid ?? 0)}</span></div>
                  )}
                </div>
                {(invoice.payments ?? []).length > 0 && (
                  <div>
                    <p className="mb-2 font-semibold text-neutral-900">{t('platform.invoices.payments')}</p>
                    <ul className="flex flex-col gap-2">
                      {(invoice.payments ?? []).map((p) => (
                        <li key={p.id} className="flex flex-wrap justify-between gap-2 rounded-md bg-neutral-25 px-3 py-2 text-body-sm">
                          <span>
                            {f.date(p.receivedAt)} · {t(`platform.payment.methods.${p.method}`)} · <span dir="ltr">{p.reference}</span>
                          </span>
                          <span className="font-medium" dir="ltr">{f.usd(p.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex justify-end border-t border-neutral-100 px-6 py-4">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  {t('common.close')}
                </Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Platform invoices with their lifecycle actions (issue, void, record payment) for finance and admins. */
export function InvoiceTable({
  invoices,
  showTenant = true,
  canManage,
  onChanged,
}: {
  invoices: PlatformInvoice[]
  showTenant?: boolean
  canManage: boolean
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  const [viewing, setViewing] = useState<PlatformInvoice | null>(null)
  const [paying, setPaying] = useState<PlatformInvoice | null>(null)
  const [confirm, setConfirm] = useState<{ invoice: PlatformInvoice; action: 'issue' | 'void' } | null>(null)

  const run = (invoice: PlatformInvoice, action: Action) => {
    if (action === 'view') setViewing(invoice)
    else if (action === 'pay') setPaying(invoice)
    else setConfirm({ invoice, action })
  }

  const menu = (invoice: PlatformInvoice) => (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={t('platform.common.actionsFor', { name: invoice.number })}
          className="flex size-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-50 hover:text-primary"
        >
          <AppIcon icon={MoreIcon} size={20} className="rotate-90" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} className="z-50 min-w-[180px] rounded-md border border-neutral-100 bg-white p-1 shadow-lg">
          {actionsFor(invoice, canManage).map((action) => (
            <DropdownMenu.Item
              key={action}
              onSelect={() => run(invoice, action)}
              className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-start text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
            >
              {t(`platform.invoices.actions.${action}`)}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )

  if (invoices.length === 0) return <EmptyState title={t('platform.invoices.empty')} />

  return (
    <>
      <DataTable
        minWidth={showTenant ? 980 : 820}
        head={[
          t('platform.invoices.number'),
          ...(showTenant ? [t('platform.invoices.tenant')] : []),
          t('platform.invoices.period'),
          t('platform.invoices.total'),
          t('platform.invoices.dueDate'),
          t('platform.common.status'),
          <span key="a" className="sr-only">{t('platform.common.actions')}</span>,
        ]}
      >
        {invoices.map((invoice, index) => (
          <tr key={invoice.id} className={rowClass(index)}>
            <td className={cellClass}>
              <button type="button" onClick={() => setViewing(invoice)} className="font-semibold text-primary hover:underline" dir="ltr">
                {invoice.number}
              </button>
            </td>
            {showTenant && <td className={cellClass}>{invoice.tenantName ?? invoice.cabId}</td>}
            <td className={`${cellClass} whitespace-nowrap`}>
              {rangeText(f.date(invoice.periodStart), f.date(invoice.periodEnd))}
            </td>
            <td className={`${cellClass} whitespace-nowrap`}>
              <span className="block font-medium text-neutral-900" dir="ltr" style={{ textAlign: 'start' }}>{f.usd(invoice.total)}</span>
              <span className="block text-caption text-neutral-600" dir="ltr" style={{ textAlign: 'start' }}>≈ {f.sar(invoice.totalSar)}</span>
            </td>
            <td className={`${cellClass} whitespace-nowrap`}>{f.date(invoice.dueDate)}</td>
            <td className={cellClass}>
              <InvoiceStatusBadge status={invoice.status} />
            </td>
            <td className={`${cellClass} w-12`}>{menu(invoice)}</td>
          </tr>
        ))}
      </DataTable>
      <MobileCards>
        {invoices.map((invoice) => (
          <MobileCard key={invoice.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <button type="button" onClick={() => setViewing(invoice)} className="text-body font-semibold text-primary" dir="ltr">
                  {invoice.number}
                </button>
                {showTenant && <p className="truncate text-body-sm text-neutral-700">{invoice.tenantName}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <InvoiceStatusBadge status={invoice.status} />
                {menu(invoice)}
              </div>
            </div>
            <p className="mt-2 text-body-sm text-neutral-600">
              {rangeText(f.date(invoice.periodStart), f.date(invoice.periodEnd))}
            </p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <span className="text-caption text-neutral-600">
                {t('platform.invoices.dueDate')}: {f.date(invoice.dueDate)}
              </span>
              <span className="text-end">
                <span className="block text-body font-semibold text-neutral-900" dir="ltr">{f.usd(invoice.total)}</span>
                <span className="block text-caption text-neutral-600" dir="ltr">≈ {f.sar(invoice.totalSar)}</span>
              </span>
            </div>
          </MobileCard>
        ))}
      </MobileCards>

      <InvoiceDetailsDialog invoice={viewing} onClose={() => setViewing(null)} />
      <RecordPaymentDialog invoice={paying} onClose={() => setPaying(null)} onSaved={onChanged} />
      <ConfirmActionDialog
        open={confirm !== null}
        title={confirm?.action === 'void' ? t('platform.invoices.voidTitle', { number: confirm.invoice.number }) : t('platform.invoices.issueTitle', { number: confirm?.invoice.number ?? '' })}
        description={confirm?.action === 'void' ? t('platform.invoices.voidBody') : t('platform.invoices.issueBody')}
        confirmLabel={confirm?.action === 'void' ? t('platform.invoices.actions.void') : t('platform.invoices.actions.issue')}
        destructive={confirm?.action === 'void'}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return
          try {
            if (confirm.action === 'void') await voidPlatformInvoice(confirm.invoice.id)
            else await issuePlatformInvoice(confirm.invoice.id)
          } catch (error) {
            throw new Error(getUserErrorMessage(error, t), { cause: error })
          }
          toast.success(confirm.action === 'void' ? t('platform.invoices.voided') : t('platform.invoices.issued'))
          onChanged()
        }}
      />
    </>
  )
}

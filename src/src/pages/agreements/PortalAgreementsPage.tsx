import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DocumentText } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { ErrorBlock, LoadingBlock } from '@/components/platform/PlatformUi'
import { AgreementStatusBadge } from '@/components/agreements/AgreementStatusBadge'
import { kindTitle } from '@/components/agreements/agreementHelpers'
import { listClientAgreements, type AgreementListItem } from '@/lib/api/agreementsApi'
import { formatDate } from '@/lib/format/dates'
import { portalAgreementPath } from '@/lib/routes'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { cn } from '@/lib/utils'

/** Client portal (/portal/agreements): certification agreements sent by the certification body, to review, sign and download. */
export function PortalAgreementsPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<AgreementListItem[] | null>(null)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let alive = true
    listClientAgreements().then(
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
  }, [reload])

  const toSign = (rows ?? []).filter((a) => a.status === 'sent').length

  return (
    <PortalLayout title={t('agreements.portal.title')} subtitle={t('agreements.portal.subtitle')}>
      {toSign > 0 && (
        <p role="status" className="rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-body-sm font-medium text-warning-700">
          {t('agreements.portal.toSign', { count: toSign })}
        </p>
      )}
      {error && !rows ? <ErrorBlock message={t('agreements.common.loadError')} onRetry={() => setReload((n) => n + 1)} /> : null}
      {!error && !rows ? <LoadingBlock rows={4} /> : null}
      {rows && rows.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-neutral-100 bg-white px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-25 text-primary">
            <AppIcon icon={DocumentText} size={28} />
          </span>
          <p className="text-body font-semibold text-neutral-900">{t('agreements.portal.emptyTitle')}</p>
          <p className="max-w-md text-body-sm text-neutral-600">{t('agreements.portal.emptyHint')}</p>
        </div>
      )}
      {rows && rows.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((a) => (
            <li key={a.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-neutral-100 bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-body font-semibold text-neutral-900">{kindTitle(t, a)}</p>
                  <p className="text-body-sm text-primary" dir="ltr">
                    {a.reference}
                  </p>
                </div>
                <AgreementStatusBadge status={a.status} />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-body-sm">
                <div className="min-w-0">
                  <dt className="text-caption text-neutral-600">{t('agreements.fields.standards')}</dt>
                  <dd className="break-words text-neutral-900">{a.standards || t('agreements.common.notSet')}</dd>
                </div>
                <div>
                  <dt className="text-caption text-neutral-600">{a.status === 'active' ? t('agreements.fields.activeSince') : t('agreements.fields.sentAt')}</dt>
                  <dd className="text-neutral-900">{formatDate(a.status === 'active' ? a.countersignedAt : a.sentAt)}</dd>
                </div>
              </dl>
              <Link
                to={portalAgreementPath(a.id)}
                className={cn(buttonVariants({ variant: a.status === 'sent' ? 'primary' : 'secondary', size: 'sm' }), 'w-full sm:w-fit')}
              >
                {a.status === 'sent' ? t('agreements.portal.reviewSign') : t('agreements.portal.view')}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PortalLayout>
  )
}

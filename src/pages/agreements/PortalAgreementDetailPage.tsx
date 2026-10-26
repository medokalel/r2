import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DocumentDownload, PenTool } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { ErrorBlock, LoadingBlock } from '@/components/platform/PlatformUi'
import { AgreementStatusBadge } from '@/components/agreements/AgreementStatusBadge'
import { AgreementDocumentView } from '@/components/agreements/AgreementDocumentView'
import { AgreementSignatures } from '@/components/agreements/AgreementSignatures'
import { AgreementAuditTrail } from '@/components/agreements/AgreementAuditTrail'
import { AgreementFlow } from '@/components/agreements/AgreementFlow'
import { AgreementIntegrity } from '@/components/agreements/AgreementIntegrity'
import { SignAgreementDialog } from '@/components/agreements/SignAgreementDialog'
import { agreementErrorMessage, kindTitle } from '@/components/agreements/agreementHelpers'
import { getClientAgreement, requestSigningCode, signAgreement, type AgreementDetail } from '@/lib/api/agreementsApi'
import { downloadAgreementPdf } from '@/lib/pdf/agreementPdf'
import { ROUTES, portalAgreementPath } from '@/lib/routes'
import { toast } from '@/lib/toast'

/** Client portal (/portal/agreements/:agreementId): read the agreement in English or Arabic, sign it with the emailed code, download the signed copy. */
export function PortalAgreementDetailPage() {
  const { t, i18n } = useTranslation()
  const { agreementId = '' } = useParams()
  const [a, setA] = useState<AgreementDetail | null>(null)
  const [error, setError] = useState(false)
  const [signing, setSigning] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const load = useCallback(() => {
    setError(false)
    getClientAgreement(agreementId).then(setA, () => setError(true))
  }, [agreementId])

  useEffect(() => {
    let alive = true
    getClientAgreement(agreementId).then(
      (detail) => alive && setA(detail),
      () => alive && setError(true),
    )
    return () => {
      alive = false
    }
  }, [agreementId])

  const download = async () => {
    if (!a) return
    setDownloading(true)
    try {
      await downloadAgreementPdf(a, t, i18n.language)
    } catch (err) {
      toast.error(agreementErrorMessage(err, t))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <PortalLayout title={t('agreements.portal.title')} subtitle={a ? `${kindTitle(t, a)} ${a.reference}` : undefined}>
      <nav className="flex flex-wrap items-center gap-2 text-body-sm" aria-label={t('agreements.common.breadcrumb')}>
        <Link to={ROUTES.portalAgreements} className="font-light text-neutral-500 hover:text-primary">
          {t('agreements.portal.title')}
        </Link>
        <span className="text-neutral-400" aria-hidden>
          /
        </span>
        <span className="font-medium text-neutral-800" dir="ltr">
          {a?.reference ?? ''}
        </span>
      </nav>

      {error && !a ? <ErrorBlock message={t('agreements.common.loadError')} onRetry={load} /> : null}
      {!error && !a ? <LoadingBlock rows={6} /> : null}

      {a && (
        <>
          <div className="flex min-w-0 flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <AgreementFlow status={a.status} />
              <AgreementStatusBadge status={a.status} />
            </div>
            {a.actions.sign && <p className="text-body-sm text-neutral-700">{t('agreements.portal.signHint')}</p>}
            {a.status === 'client_signed' && <p className="text-body-sm text-neutral-700">{t('agreements.portal.waitingCab')}</p>}
            {a.supersededBy && (
              <p className="text-body-sm text-neutral-700">
                {t('agreements.detail.superseded')}{' '}
                <Link to={portalAgreementPath(a.supersededBy.id)} className="font-semibold text-primary hover:underline" dir="ltr">
                  {a.supersededBy.reference}
                </Link>
              </p>
            )}
            {a.status === 'terminated' && a.terminationReason && <p className="text-body-sm text-error-700">{t('agreements.portal.terminated', { reason: a.terminationReason })}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              {a.actions.sign && (
                <Button variant="primary" size="sm" icon={<AppIcon icon={PenTool} size={18} />} onClick={() => setSigning(true)} className="w-full sm:w-auto">
                  {t('agreements.portal.sign')}
                </Button>
              )}
              <Button variant="secondary" size="sm" icon={<AppIcon icon={DocumentDownload} size={18} />} onClick={() => void download()} disabled={downloading} className="w-full sm:w-auto">
                {a.status === 'active' ? t('agreements.actions.downloadSigned') : t('agreements.actions.download')}
              </Button>
            </div>
          </div>

          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex min-w-0 flex-col gap-5">
              <AgreementDocumentView
                title={kindTitle(t, a)}
                reference={a.reference}
                sections={a.sections}
                meta={a.amendment ? `${t('agreements.amendment.replaces', { reference: a.amendment.previousReference ?? '' })} ${a.amendment.reason}` : a.cab?.legalName}
              />
              <AgreementSignatures signatures={a.signatures} />
            </div>
            <aside className="flex min-w-0 flex-col gap-5">
              <AgreementIntegrity agreement={a} />
              <AgreementAuditTrail events={a.events} />
            </aside>
          </div>

          <SignAgreementDialog
            open={signing}
            agreement={a}
            party="client"
            defaultName={a.variables['client.representative'] ?? ''}
            onClose={() => setSigning(false)}
            requestCode={() => requestSigningCode(a.id)}
            sign={(payload) => signAgreement(a.id, payload)}
            onSigned={(detail) => {
              setA(detail)
              toast.success(t('agreements.toast.signed'))
            }}
          />
        </>
      )}
    </PortalLayout>
  )
}

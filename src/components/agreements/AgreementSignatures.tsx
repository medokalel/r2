import { useTranslation } from 'react-i18next'
import type { AgreementSignature } from '@/lib/api/agreementsApi'
import { formatDateTime } from '@/lib/format/dates'
import { shortHash } from '@/components/agreements/agreementHelpers'

/** Both parties' signatures with what was recorded (name, title, method, time, IP, device, hash). */
export function AgreementSignatures({ signatures }: { signatures: AgreementSignature[] }) {
  const { t } = useTranslation()
  const parties: Array<'client' | 'cab'> = ['client', 'cab']
  return (
    <section className="min-w-0 rounded-lg border border-neutral-100 bg-white">
      <h2 className="border-b border-neutral-100 px-4 py-3 text-body font-semibold text-neutral-900 sm:px-5">{t('agreements.signatures.title')}</h2>
      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        {parties.map((party) => {
          const s = signatures.find((x) => x.party === party)
          return (
            <div key={party} className="flex min-w-0 flex-col gap-2 rounded-md border border-neutral-100 p-3">
              <p className="text-caption font-semibold uppercase tracking-wide text-neutral-500">{t(`agreements.signatures.${party}`)}</p>
              {s ? (
                <>
                  <div className="flex h-20 items-center justify-center rounded-md bg-neutral-25">
                    {s.signatureImage ? (
                      <img src={s.signatureImage} alt={t('agreements.signatures.imageAlt', { name: s.signerName })} className="max-h-16 max-w-full object-contain" />
                    ) : (
                      <span className="text-h3 italic text-primary-active" style={{ fontFamily: '"Segoe Script", "Brush Script MT", cursive' }}>
                        {s.signatureText ?? s.signerName}
                      </span>
                    )}
                  </div>
                  <p className="text-body-sm font-semibold text-neutral-900">{s.signerName}</p>
                  <p className="text-caption text-neutral-600">{s.signerTitle}</p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-caption text-neutral-700">
                    <dt className="text-neutral-500">{t('agreements.signatures.signedAt')}</dt>
                    <dd>{formatDateTime(s.signedAt)}</dd>
                    <dt className="text-neutral-500">{t('agreements.signatures.method')}</dt>
                    <dd>{t(`agreements.method.${s.method}`)}</dd>
                    <dt className="text-neutral-500">{t('agreements.signatures.ip')}</dt>
                    <dd dir="ltr" className="text-start">{s.ipAddress ?? t('agreements.common.notRecorded')}</dd>
                    <dt className="text-neutral-500">{t('agreements.signatures.hash')}</dt>
                    <dd dir="ltr" className="truncate text-start font-mono" title={s.documentHash}>
                      {shortHash(s.documentHash)}
                    </dd>
                  </dl>
                </>
              ) : (
                <p className="py-6 text-center text-body-sm text-neutral-500">{t('agreements.signatures.pending')}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

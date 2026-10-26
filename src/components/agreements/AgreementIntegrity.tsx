import { useTranslation } from 'react-i18next'
import { ShieldTick, Warning2 } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import type { AgreementDetail } from '@/lib/api/agreementsApi'
import { cn } from '@/lib/utils'

/** SHA-256 fingerprint of the signed text and the seal over both signatures, re-checked by the server. */
export function AgreementIntegrity({ agreement }: { agreement: AgreementDetail }) {
  const { t } = useTranslation()
  const failed = agreement.integrity.documentHashValid === false || agreement.integrity.sealHashValid === false
  const sealed = Boolean(agreement.documentHash)
  return (
    <section className="min-w-0 rounded-lg border border-neutral-100 bg-white p-4 sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 text-body font-semibold text-neutral-900">
        <AppIcon icon={failed ? Warning2 : ShieldTick} size={20} className={failed ? 'text-error-600' : 'text-success-600'} />
        {t('agreements.integrity.title')}
      </h2>
      <p className={cn('mb-3 text-body-sm', failed ? 'font-semibold text-error-700' : 'text-neutral-700')}>
        {failed ? t('agreements.integrity.failed') : sealed ? t('agreements.integrity.ok') : t('agreements.integrity.draft')}
      </p>
      <dl className="flex flex-col gap-2 text-caption">
        <div>
          <dt className="text-neutral-500">{sealed ? t('agreements.integrity.documentHash') : t('agreements.integrity.draftHash')}</dt>
          <dd className="break-all font-mono text-neutral-900" dir="ltr">
            {agreement.documentHash ?? agreement.draftHash}
          </dd>
        </div>
        {agreement.sealHash && (
          <div>
            <dt className="text-neutral-500">{t('agreements.integrity.sealHash')}</dt>
            <dd className="break-all font-mono text-neutral-900" dir="ltr">
              {agreement.sealHash}
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}

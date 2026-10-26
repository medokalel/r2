import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getAgreementGate, type AgreementGate } from '@/lib/api/agreementsApi'
import { cn } from '@/lib/utils'

interface AgreementGateNoticeProps {
  /** Audit-client organization id (or the client code in the preview). */
  clientId: string
  /** Plan stage label or code ("Stage 1", "STAGE_1" …). */
  stage: string
}

/**
 * Shown before a plan is sent: Stage 1, Stage 2 and recertification audits need an active certification
 * agreement (ISO/IEC 17021-1 5.1.2). Block mode stops the send; warn mode lets it go with this warning.
 */
export function AgreementGateNotice({ clientId, stage }: AgreementGateNoticeProps) {
  const { t } = useTranslation()
  const [gate, setGate] = useState<AgreementGate | null>(null)

  useEffect(() => {
    let alive = true
    if (!clientId) return
    getAgreementGate(clientId, stage).then(
      (g) => alive && setGate(g),
      () => alive && setGate(null),
    )
    return () => {
      alive = false
    }
  }, [clientId, stage])

  if (!gate || !gate.required || gate.satisfied) return null
  const block = gate.mode === 'block'
  return (
    <div
      role={block ? 'alert' : 'status'}
      className={cn(
        'flex flex-col gap-2 rounded-md border px-3 py-2.5 text-body-sm',
        block ? 'border-error-100 bg-error-50 text-error-700' : 'border-warning-100 bg-warning-50 text-warning-700',
      )}
    >
      <p className="font-semibold">{block ? t('agreements.gate.blockTitle') : t('agreements.gate.warnTitle')}</p>
      <p>{t('agreements.gate.body')}</p>
      <Link to={gate.link} className="w-fit font-semibold underline underline-offset-4">
        {gate.agreement ? t('agreements.gate.openAgreement', { reference: gate.agreement.reference }) : t('agreements.gate.openRegister')}
      </Link>
    </div>
  )
}

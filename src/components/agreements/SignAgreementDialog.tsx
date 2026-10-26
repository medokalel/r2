import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AgreementFormDialog } from '@/components/agreements/AgreementFormDialog'
import { agreementErrorMessage, shortHash } from '@/components/agreements/agreementHelpers'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { SignaturePad } from '@/components/ui/SignaturePad'
import { TextField } from '@/components/ui/TextField'
import type { AgreementDetail, SignAgreementPayload, SignatureMethod, SigningCode } from '@/lib/api/agreementsApi'

interface SignAgreementDialogProps {
  open: boolean
  agreement: AgreementDetail
  party: 'client' | 'cab'
  defaultName?: string
  defaultTitle?: string
  onClose: () => void
  requestCode: () => Promise<SigningCode>
  sign: (payload: SignAgreementPayload) => Promise<AgreementDetail>
  onSigned: (detail: AgreementDetail) => void
}

/**
 * Electronic signature: signer name and title, a drawn, typed or uploaded signature, consent, and the
 * 6-digit code emailed to the signer (10 minutes, 5 attempts). The client signs first; the CAB countersigns.
 */
export function SignAgreementDialog({ open, agreement, party, defaultName = '', defaultTitle = '', onClose, requestCode, sign, onSigned }: SignAgreementDialogProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(defaultName)
  const [title, setTitle] = useState(defaultTitle)
  const [image, setImage] = useState('')
  const [method, setMethod] = useState<SignatureMethod>('drawn')
  const [typedName, setTypedName] = useState('')
  const [consent, setConsent] = useState(false)
  const [code, setCode] = useState('')
  const [sent, setSent] = useState<SigningCode | null>(null)
  const [sending, setSending] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  const askCode = async () => {
    setSending(true)
    setCodeError(null)
    try {
      setSent(await requestCode())
    } catch (err) {
      setCodeError(agreementErrorMessage(err, t))
    } finally {
      setSending(false)
    }
  }

  const ready = name.trim().length >= 2 && title.trim().length >= 2 && Boolean(image) && consent && /^\d{6}$/.test(code)

  const submit = async () => {
    const detail = await sign({
      code,
      signerName: name.trim(),
      signerTitle: title.trim(),
      method,
      ...(method === 'typed' ? { signatureText: typedName || name.trim() } : {}),
      signatureImage: image,
      documentHash: agreement.documentHash ?? '',
      accept: true,
    })
    onSigned(detail)
  }

  return (
    <AgreementFormDialog
      open={open}
      wide
      title={party === 'client' ? t('agreements.sign.titleClient') : t('agreements.sign.titleCab')}
      description={t('agreements.sign.description', { reference: agreement.reference })}
      submitLabel={party === 'client' ? t('agreements.sign.submitClient') : t('agreements.sign.submitCab')}
      canSubmit={ready}
      onClose={onClose}
      onSubmit={submit}
    >
      <div className="rounded-md border border-neutral-100 bg-neutral-25 px-3 py-2 text-caption text-neutral-700">
        {t('agreements.sign.fingerprint')}{' '}
        <span className="font-mono text-neutral-900" dir="ltr" title={agreement.documentHash ?? ''}>
          {shortHash(agreement.documentHash)}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="signer-name" label={t('agreements.sign.name')} required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <TextField id="signer-title" label={t('agreements.sign.jobTitle')} required value={title} onChange={(e) => setTitle(e.target.value)} autoComplete="organization-title" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-semibold text-neutral-800">{t('agreements.sign.signature')}</span>
        <SignaturePad
          value={image}
          onChange={setImage}
          signerName={name}
          caption={name || undefined}
          onCommit={(info) => {
            setMethod(info.method)
            setTypedName(info.typedName ?? '')
          }}
        />
      </div>
      <label className="flex items-start gap-3 text-body-sm text-neutral-800">
        <Checkbox checked={consent} onChange={() => setConsent((v) => !v)} aria-label={t('agreements.sign.consent')} className="mt-0.5" />
        <span>{t('agreements.sign.consent')}</span>
      </label>
      <div className="flex flex-col gap-3 rounded-lg border border-neutral-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-neutral-900">{t('agreements.sign.codeTitle')}</p>
            <p className="text-caption text-neutral-600">{sent ? t('agreements.sign.codeSent', { to: sent.sentTo }) : t('agreements.sign.codeHint')}</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => void askCode()} disabled={sending} aria-busy={sending || undefined}>
            {sent ? t('agreements.sign.resend') : t('agreements.sign.sendCode')}
          </Button>
        </div>
        {sent?.devCode && (
          <p role="status" className="rounded-md bg-primary-25 px-3 py-2 text-body-sm text-primary">
            {t('agreements.sign.demoCode')}{' '}
            <strong className="font-mono tracking-widest" dir="ltr">
              {sent.devCode}
            </strong>
          </p>
        )}
        {codeError && (
          <p role="alert" className="text-body-sm text-error-600">
            {codeError}
          </p>
        )}
        <TextField
          id="signing-code"
          label={t('agreements.sign.code')}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          dir="ltr"
          className="font-mono tracking-[0.4em]"
          disabled={!sent}
        />
      </div>
    </AgreementFormDialog>
  )
}

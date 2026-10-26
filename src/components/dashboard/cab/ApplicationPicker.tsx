import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { APPLICATION_STATUS_LABEL_KEYS as STATUS_LABEL_KEYS } from '@/lib/applicationStatus'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import {
  listCabApplications,
  type ApplicationRegisterItem,
  type ApplicationRegisterStatus,
} from '@/lib/api/cabApplicationRegisterApi'


interface ApplicationPickerProps {
  title: string
  hint: string
  actionLabel: string
  statusLabel?: string
  allowedStatuses?: ApplicationRegisterStatus[]
  loadApplications?: () => Promise<ApplicationRegisterItem[]>
  extraAction?: { label: string; onClick: () => void }
  onSelect: (application: ApplicationRegisterItem) => void
}

export function ApplicationPicker({
  title,
  hint,
  actionLabel,
  statusLabel,
  allowedStatuses,
  loadApplications = listCabApplications,
  extraAction,
  onSelect,
}: ApplicationPickerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [applications, setApplications] = useState<ApplicationRegisterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const statusFilter = allowedStatuses?.join(',') ?? ''

  useEffect(() => {
    let cancelled = false
    loadApplications()
      .then((items) => {
        if (cancelled) return
        const filtered = statusFilter
          ? items.filter((item) => statusFilter.split(',').includes(item.status))
          : items
        setApplications(filtered)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError(t('cab.applicationRegister.loadError'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [statusFilter, loadApplications, t])

  const options = useMemo(
    () =>
      applications.map((application) => ({
        value: application.id,
        label: `${application.applicationCode} · ${application.clientName} (${statusLabel ?? t(
          `cab.applicationRegister.status.${STATUS_LABEL_KEYS[application.status]}`,
        )})`,
      })),
    [applications, statusLabel, t],
  )

  const selected = applications.find((application) => application.id === selectedId)

  return (
    <section className="mx-auto w-full max-w-[640px] rounded-lg border border-neutral-100 bg-white p-6">
      <h2 className="text-body-lg font-semibold text-neutral-900">{title}</h2>
      <p className="mb-5 mt-1 text-body-sm text-neutral-600">{hint}</p>

      <SearchableSelect
        value={selectedId}
        onChange={setSelectedId}
        options={options}
        placeholder={t('cab.applicationRegister.selectPlaceholder')}
        searchPlaceholder={t('cab.applicationRegister.filters.searchPlaceholder')}
        disabled={loading || applications.length === 0}
      />

      {error && (
        <p role="alert" className="mt-3 text-body-sm text-error-700">
          {error}
        </p>
      )}
      {!loading && applications.length === 0 && !error && (
        <p className="mt-3 text-body-sm text-neutral-600">{t('cab.applicationRegister.empty')}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => navigate('/cab/applications')}>
          {t('cab.applicationSubmission.backToRegister')}
        </Button>
        <Button variant="primary" disabled={loading || !!error || !selected} onClick={() => selected && onSelect(selected)}>
          {actionLabel}
        </Button>
        {extraAction && (
          <Button variant="outline" onClick={extraAction.onClick}>
            {extraAction.label}
          </Button>
        )}
      </div>
    </section>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useValuesChanged } from '@/hooks/useValuesChanged'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '@/lib/api/client'
import { clearAuthSession } from '@/lib/authStorage'
import { isNetworkError, logTechnicalError } from '@/lib/errorMessages'
import {
  createCabClientCertificationApplication,
  getCabClientCertificationApplication,
  submitCabClientCertificationApplication,
  updateCabClientCertificationApplicationDraft,
} from '@/lib/api/cabCertificationApplicationApi'
import {
  createCabClientBranch,
  getCabClientProfile,
  saveCabClientCompanyProfile,
} from '@/lib/api/clientRegistrationApi'
import {
  deleteApplicationDocument,
  uploadApplicationDocument,
  type ApplicationStatus,
} from '@/lib/api/certificationApplicationApi'
import type { OrganizationProfileData, OrgBranch } from '@/lib/api/organizationProfileApi'
import {
  formatCertificationSubmitError,
  listMissingApplicationFields,
} from '@/components/dashboard/entityData/applicationFieldErrors'
import { fillApplicationForm } from '@/components/dashboard/entityData/applicationSampleFill'
import {
  formValuesFromApplication,
  payloadFromForm,
  prefillFromOrganization,
  profilePayloadFromForm,
} from '@/components/dashboard/entityData/applicationMappers'
import type { ApplicationFormContextValue } from '@/components/dashboard/entityData/ApplicationFormContext'
import {
  createEmptyBranch,
  DOCUMENT_SLOT_TYPES,
  EMPTY_APPLICATION_FORM,
  type ApplicationFormValues,
  type ApplicationNotification,
  type BranchFormValues,
} from '@/components/dashboard/entityData/applicationTypes'

const NOTIFICATION_TIMEOUT_MS = 5000

export function useCabApplicationSubmissionState() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const clientId = searchParams.get('clientId')
  const applicationParam = searchParams.get('id')
  const [form, setForm] = useState<ApplicationFormValues>(EMPTY_APPLICATION_FORM)
  const [applicationId, setApplicationId] = useState<string | null>(applicationParam)
  const [status, setStatus] = useState<ApplicationStatus>('DRAFT')
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  // A client in the URL means the loader below runs straight away.
  const [loading, setLoading] = useState(Boolean(clientId))
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notification, setNotification] = useState<ApplicationNotification | null>(null)
  const [loadError, setLoadError] = useState<
    'rateLimit' | 'generic' | 'notFound' | 'forbidden' | 'network' | null
  >(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [orgBranches, setOrgBranches] = useState<OrgBranch[]>([])
  const orgProfileRef = useRef<OrganizationProfileData | null>(null)
  const nextBranchIdRef = useRef(2)
  const pendingOrgBranchSavesRef = useRef<Map<number, Promise<void>>>(new Map())

  const update = useCallback(
    <K extends keyof ApplicationFormValues>(key: K, value: ApplicationFormValues[K]) => {
      setForm((previous) => ({ ...previous, [key]: value }))
    },
    [],
  )

  const notify = useCallback((value: ApplicationNotification) => setNotification(value), [])

  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => setNotification(null), NOTIFICATION_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [notification])

  const handleApiError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        clearAuthSession()
        navigate('/login', { replace: true })
        return
      }
      setNotification({ type: 'error', message: formatCertificationSubmitError(error, t) })
    },
    [navigate, t],
  )

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  const persistIds = useCallback(
    (nextClientId: string, nextApplicationId: string) => {
      setApplicationId(nextApplicationId)
      const nextParams: Record<string, string> = {
        clientId: nextClientId,
        id: nextApplicationId,
      }
      if (searchParams.get('fill') === '1') nextParams.fill = '1'
      setSearchParams(nextParams, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  // Prime the loading flags in the render where the loader's inputs change,
  // so the effect below only sets state from its async callbacks.
  const loadInputsChanged = useValuesChanged([applicationParam, clientId, navigate, reloadKey, searchParams])
  if (loadInputsChanged) {
    if (clientId) {
      setLoading(true)
      setLoadError(null)
    } else {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!clientId) return

    let cancelled = false

    void (async () => {
      try {
        const profile = await getCabClientProfile(clientId)
        if (cancelled) return
        orgProfileRef.current = profile
        setOrgBranches(profile.branches ?? [])

        if (applicationParam) {
          const application = await getCabClientCertificationApplication(
            clientId,
            applicationParam,
          )
          if (cancelled) return
          setApplicationId(application.id)
          setStatus(application.status)
          setOrderNumber(application.orderNumber ?? null)
          const values = formValuesFromApplication(application)
          nextBranchIdRef.current = Math.max(values.branches.length + 1, 2)
          let nextForm =
            application.status === 'DRAFT'
              ? prefillFromOrganization(values, profile)
              : values
          if (searchParams.get('fill') === '1' && application.status === 'DRAFT') {
            nextForm = fillApplicationForm(nextForm)
            nextBranchIdRef.current = Math.max(nextForm.branches.length + 1, 2)
          }
          setForm(nextForm)
        } else {
          setForm((previous) => {
            const prefills = prefillFromOrganization(previous, profile)
            return searchParams.get('fill') === '1'
              ? fillApplicationForm(prefills)
              : prefills
          })
        }
      } catch (error) {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) {
          clearAuthSession()
          navigate('/login', { replace: true })
          return
        }
        logTechnicalError(error)
        if (error instanceof ApiError) {
          if (error.status === 429) setLoadError('rateLimit')
          else if (error.status === 404) setLoadError('notFound')
          else if (error.status === 403) setLoadError('forbidden')
          else setLoadError('generic')
        } else {
          setLoadError(isNetworkError(error) ? 'network' : 'generic')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [applicationParam, clientId, navigate, reloadKey, searchParams])

  const updateBranch = useCallback((localId: number, patch: Partial<BranchFormValues>) => {
    setForm((previous) => ({
      ...previous,
      branches: previous.branches.map((branch) =>
        branch.localId === localId ? { ...branch, ...patch } : branch,
      ),
    }))
  }, [])

  const addBranch = useCallback((): number => {
    const localId = nextBranchIdRef.current++
    setForm((previous) => ({
      ...previous,
      branches: [...previous.branches, createEmptyBranch(localId)],
    }))
    return localId
  }, [])

  const removeBranch = useCallback((localId: number) => {
    setForm((previous) => ({
      ...previous,
      branches: previous.branches.filter((branch) => branch.localId !== localId),
    }))
  }, [])

  const saveOrgBranch = useCallback(
    (localId: number, branchName: string, address: string) => {
      const name = branchName.trim()
      if (!name || !clientId || pendingOrgBranchSavesRef.current.has(localId)) return

      const promise = (async () => {
        try {
          const created = await createCabClientBranch(clientId, {
            branchName: name,
            address: address || undefined,
            branchType: 'PERMANENT',
            employeeCount: 0,
          })
          setOrgBranches((previous) => [...previous, created])
          updateBranch(localId, { sourceBranchId: created.id })
        } catch (error) {
          handleApiError(error)
        } finally {
          pendingOrgBranchSavesRef.current.delete(localId)
        }
      })()

      pendingOrgBranchSavesRef.current.set(localId, promise)
    },
    [clientId, handleApiError, updateBranch],
  )

  const waitForPendingBranchSaves = useCallback(async () => {
    await Promise.all(pendingOrgBranchSavesRef.current.values())
  }, [])

  const setSpecAnswer = useCallback((questionKey: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      specAnswers: { ...previous.specAnswers, [questionKey]: value },
    }))
  }, [])

  const uploadDocument = useCallback(
    async (slotId: string, file: File) => {
      setUploading(true)
      try {
        const result = await uploadApplicationDocument(file)
        setForm((previous) => ({
          ...previous,
          documents: [
            {
              localId: crypto.randomUUID(),
              slotId,
              documentType: DOCUMENT_SLOT_TYPES[slotId] ?? 'OTHER',
              fileUrl: result.fileUrl,
              filePath: result.filePath,
              fileName: result.fileName,
              originalName: file.name,
              mimeType: result.mimeType,
              fileSize: result.sizeBytes,
            },
            ...previous.documents,
          ],
        }))
      } catch (error) {
        handleApiError(error)
      } finally {
        setUploading(false)
      }
    },
    [handleApiError],
  )

  const removeDocument = useCallback(
    async (localId: string) => {
      const document = form.documents.find((entry) => entry.localId === localId)
      if (!document) return
      try {
        if (document.fileName) await deleteApplicationDocument(document.fileName)
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 404)) {
          handleApiError(error)
          return
        }
      }
      setForm((previous) => ({
        ...previous,
        documents: previous.documents.filter((entry) => entry.localId !== localId),
      }))
    },
    [form.documents, handleApiError],
  )

  const uploadCommercialRegister = useCallback(
    async (file: File) => {
      setUploading(true)
      try {
        const result = await uploadApplicationDocument(file)
        setForm((previous) => ({ ...previous, commercialRegisterFile: result.fileUrl }))
      } catch (error) {
        handleApiError(error)
      } finally {
        setUploading(false)
      }
    },
    [handleApiError],
  )

  const syncClientProfile = useCallback(async () => {
    if (!clientId) return
    const snapshot = orgProfileRef.current
    if (!snapshot) return
    const payload = profilePayloadFromForm(form, snapshot)
    try {
      const updated = await saveCabClientCompanyProfile(clientId, payload)
      orgProfileRef.current = {
        ...snapshot,
        profile: payload.profile ?? snapshot.profile,
        address: payload.address ?? snapshot.address,
        status: updated.status,
      }
    } catch {
      // Best-effort — the application draft is the primary save
    }
  }, [clientId, form])

  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (!clientId) {
      setNotification({
        type: 'error',
        message: t('cab.applicationSubmission.selectClientHint'),
      })
      return false
    }
    if (status !== 'DRAFT') return true
    setSaving(true)
    setNotification(null)
    try {
      await waitForPendingBranchSaves()
      const payload = payloadFromForm(form, t)
      let id = applicationId
      if (id) {
        await updateCabClientCertificationApplicationDraft(clientId, id, payload)
      } else {
        const created = await createCabClientCertificationApplication(clientId, payload)
        id = created.id
        persistIds(clientId, id)
      }
      await syncClientProfile()
      setNotification({
        type: 'success',
        message: t('accreditation.messages.draftSaved'),
      })
      return true
    } catch (error) {
      handleApiError(error)
      return false
    } finally {
      setSaving(false)
    }
  }, [
    applicationId,
    clientId,
    form,
    handleApiError,
    persistIds,
    status,
    syncClientProfile,
    t,
    waitForPendingBranchSaves,
  ])

  const fillData = useCallback(() => {
    if (status !== 'DRAFT') return
    setForm((previous) => {
      const filled = fillApplicationForm(previous)
      nextBranchIdRef.current = Math.max(filled.branches.length + 1, 2)
      return filled
    })
    setNotification({
      type: 'success',
      message: t('cab.applicationSubmission.dataFilled'),
    })
  }, [status, t])

  const submit = useCallback(async (): Promise<boolean> => {
    if (!clientId) return false
    if (status !== 'DRAFT') return true
    const missing = listMissingApplicationFields(form, t)
    if (missing.length > 0) {
      setNotification({
        type: 'error',
        message: [
          t('cab.applicationSubmission.fieldErrors.title'),
          ...missing.map((field) => `• ${field}`),
        ].join('\n'),
      })
      return false
    }
    setSubmitting(true)
    setNotification(null)
    try {
      await waitForPendingBranchSaves()
      const payload = payloadFromForm(form, t)
      let id = applicationId
      if (id) {
        await updateCabClientCertificationApplicationDraft(clientId, id, payload)
      } else {
        const created = await createCabClientCertificationApplication(clientId, payload)
        id = created.id
        persistIds(clientId, id)
      }
      const result = await submitCabClientCertificationApplication(clientId, id)
      setStatus(result.status)
      setOrderNumber(result.orderNumber ?? null)
      setNotification({
        type: 'success',
        message: t('accreditation.messages.submitted', {
          orderNumber: result.orderNumber ?? '',
        }),
      })
      return true
    } catch (error) {
      handleApiError(error)
      return false
    } finally {
      setSubmitting(false)
    }
  }, [
    applicationId,
    clientId,
    form,
    handleApiError,
    persistIds,
    status,
    t,
    waitForPendingBranchSaves,
  ])

  const contextValue = useMemo<ApplicationFormContextValue>(() => {
    const readOnly = status !== 'DRAFT'
    return {
      form,
      update: readOnly ? () => undefined : update,
      updateBranch: readOnly ? () => undefined : updateBranch,
      addBranch: readOnly ? () => -1 : addBranch,
      removeBranch: readOnly ? () => undefined : removeBranch,
      saveOrgBranch: readOnly ? () => undefined : saveOrgBranch,
      setSpecAnswer: readOnly ? () => undefined : setSpecAnswer,
      uploadDocument: readOnly ? async () => undefined : uploadDocument,
      removeDocument: readOnly ? async () => undefined : removeDocument,
      uploadCommercialRegister: readOnly
        ? async () => undefined
        : uploadCommercialRegister,
      orgBranches,
      applicationId,
      status,
      saving,
      uploading,
      notify,
      handleApiError,
      readOnly,
    }
  }, [
    addBranch,
    applicationId,
    form,
    handleApiError,
    notify,
    orgBranches,
    removeBranch,
    removeDocument,
    saveOrgBranch,
    saving,
    setSpecAnswer,
    status,
    update,
    updateBranch,
    uploadCommercialRegister,
    uploadDocument,
    uploading,
  ])

  return {
    contextValue,
    form,
    update,
    clientId,
    applicationId,
    loading,
    saving,
    submitting,
    status,
    orderNumber,
    notification,
    loadError,
    reload,
    saveDraft,
    submit,
    fillData,
  }
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { CountryCode } from '@/components/auth/CountryCodeSelect'
import { useIpLocation } from '@/hooks/useIpLocation'
import { ApiError } from '@/lib/api/client'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { CLIENT_REGISTRATION_FIELD_LABELS } from '@/lib/clientRegistrationForm'
import { clearAuthSession } from '@/lib/authStorage'
import {
  getOrganizationProfile,
  saveOrganizationProfile,
  submitOrganizationProfile,
  getBranches,
  getOrganizationDocuments,
  type OrganizationProfileData,
  type OrgBranch,
  type OrgDocument,
} from '@/lib/api/organizationProfileApi'
import { formValuesFromProfile, payloadFromForm } from './mappers'
import { hasProfileFormatErrors } from './validation'
import type { ProfileFormContextValue } from './ProfileFormContext'
import {
  EMPTY_PROFILE_FORM,
  type ProfileFormValues,
  type ProfileNotification,
} from './types'

const NOTIFICATION_TIMEOUT_MS = 5000

export interface CompanyProfileState {
  contextValue: ProfileFormContextValue
  loading: boolean
  saving: boolean
  submitting: boolean
  notification: ProfileNotification | null
  saveDraft: () => Promise<boolean>
  submitProfile: () => Promise<void>
}

export function useCompanyProfileState(): CompanyProfileState {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const ipLocation = useIpLocation()
  const [form, setForm] = useState<ProfileFormValues>(EMPTY_PROFILE_FORM)
  const [profileStatus, setProfileStatus] = useState('DRAFT')
  const [branches, setBranches] = useState<OrgBranch[]>([])
  const [documents, setDocuments] = useState<OrgDocument[]>([])
  const [editingBranch, setEditingBranch] = useState<OrgBranch | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState<ProfileNotification | null>(null)
  const apiCountryCodeRef = useRef(false)
  const apiAddressRef = useRef(false)

  // Marked true the moment the user explicitly sets the phone country code,
  // so the IP-based default below never overwrites it.
  const countryCodeTouchedRef = useRef(false)

  const update = useCallback(
    <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => {
      if (key === 'countryCode') countryCodeTouchedRef.current = true
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const notify = useCallback((n: ProfileNotification) => setNotification(n), [])

  // Action feedback disappears on its own after a short while
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
      setNotification({
        type: 'error',
        message: getUserErrorMessage(error, t, { fieldLabels: CLIENT_REGISTRATION_FIELD_LABELS }),
      })
    },
    [navigate, t]
  )

  const applyProfileData = useCallback((data: OrganizationProfileData) => {
    setProfileStatus(data.status ?? 'DRAFT')
    setForm(formValuesFromProfile(data))
    setBranches(data.branches ?? [])
    setDocuments(data.documents ?? [])
    if (data.profile?.phoneCountryCode) apiCountryCodeRef.current = true
    if (data.address?.country) apiAddressRef.current = true
  }, [])

  const refreshProfile = useCallback(async () => {
    const data = await getOrganizationProfile()
    applyProfileData(data)
  }, [applyProfileData])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getOrganizationProfile()
        if (!cancelled) applyProfileData(data)
      } catch (error) {
        if (!cancelled) handleApiError(error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Default phone country from IP only when the API didn't provide one
  // AND the user hasn't already picked one manually
  useEffect(() => {
    if (loading || apiCountryCodeRef.current || !ipLocation?.countryCode) return
    apiCountryCodeRef.current = true
    if (countryCodeTouchedRef.current) return
    setForm((prev) => ({ ...prev, countryCode: ipLocation.countryCode as CountryCode }))
  }, [ipLocation, loading])

  // Default address country + city from IP, once, only when the API
  // didn't provide an address yet (mirrors the phone-country default above)
  useEffect(() => {
    if (loading || apiAddressRef.current || !ipLocation?.countryCode) return
    apiAddressRef.current = true
    setForm((prev) => ({
      ...prev,
      country: prev.country ?? (ipLocation.countryCode as CountryCode),
      city: prev.city || ipLocation.city || prev.city,
    }))
  }, [ipLocation, loading])


  const refreshBranches = useCallback(async () => {
    setBranches(await getBranches())
  }, [])

  const refreshDocuments = useCallback(async () => {
    setDocuments(await getOrganizationDocuments())
  }, [])

  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (hasProfileFormatErrors(form, false)) {
      setNotification({ type: 'error', message: t('validation.fixErrors') })
      return false
    }
    setSaving(true)
    setNotification(null)
    try {
      await saveOrganizationProfile(payloadFromForm(form))
      apiCountryCodeRef.current = true
      setNotification({ type: 'success', message: t('companyProfile.messages.draftSaved') })
      return true
    } catch (error) {
      handleApiError(error)
      return false
    } finally {
      setSaving(false)
    }
  }, [form, handleApiError, t])

  const submitProfile = useCallback(async () => {
    if (hasProfileFormatErrors(form, false)) {
      setNotification({ type: 'error', message: t('validation.fixErrors') })
      return
    }
    setSubmitting(true)
    setNotification(null)
    try {
      await saveOrganizationProfile(payloadFromForm(form))
      await submitOrganizationProfile()
      setProfileStatus('COMPLETED')
      setNotification({ type: 'success', message: t('companyProfile.messages.submitted') })
    } catch (error) {
      handleApiError(error)
    } finally {
      setSubmitting(false)
    }
  }, [form, handleApiError, t])

  const contextValue = useMemo<ProfileFormContextValue>(
    () => ({
      form,
      update,
      profileStatus,
      branches,
      refreshBranches,
      documents,
      refreshDocuments,
      editingBranch,
      setEditingBranch,
      refreshProfile,
      saveDraft,
      saving,
      notify,
      handleApiError,
    }),
    [
      form,
      update,
      profileStatus,
      branches,
      refreshBranches,
      documents,
      refreshDocuments,
      editingBranch,
      refreshProfile,
      saveDraft,
      saving,
      notify,
      handleApiError,
    ]
  )

  return { contextValue, loading, saving, submitting, notification, saveDraft, submitProfile }
}

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js'
import { PhoneInputRow, type CountryCode } from '@/components/auth/CountryCodeSelect'
import { AppIcon, PhoneIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { SelectField } from '@/components/ui/Select'
import { fieldInputClassName, fieldHeightClassName, fieldLabelClassName } from '@/components/ui/fieldStyles'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { getCountryOptions } from '@/lib/countries'
import { isValidPhoneNumber } from '@/lib/validators'
import { cn } from '@/lib/utils'
import { STANDARD_SCHEMA_OPTIONS } from '@/lib/api/applicationDraftApi'
import { SECTOR_OPTIONS } from '@/components/dashboard/companyProfile/constants'
import { SchemeCompetenceEditor } from '@/components/dashboard/cab/SchemeCompetenceEditor'
import { getCompetenceMatrix, saveCompetenceMatrix, type CompetenceMatrix } from '@/lib/api/competenceMatrixApi'
import { iafDigits } from '@/lib/criticalCodeExams'
import { updateCompetencePerson, type CompetencePerson } from '@/lib/api/cabCompetenceApi'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import {
  employmentDatesPayload,
  isQualificationFileTooLarge,
  personnelDateFields,
  personnelSaveErrorMessage,
  toIsoDate,
  validateEmploymentDates,
} from '@/lib/personnelProfile'
import {
  createCabEmployee,
  updateCabEmployee,
  uploadCabEmployeeImage,
  getCabEmployeeDetail,
  uploadCabEmployeeQualification,
  deleteCabEmployeeQualification,
  toBackendRole,
  cleanIafCodes,
  CAB_PROFESSIONAL_ROLES,
} from '@/lib/api/cabEmployeesApi'
import { getCabProfile } from '@/lib/api/cabApi'
import { ApiError } from '@/lib/api/client'
import {
  DocumentUploadField,
  type UploadedDocumentFile,
} from '@/components/dashboard/DocumentUploadField'

import { Checkbox } from '@/components/ui/Checkbox'
import { DatePicker } from '@/components/ui/DatePicker'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import type { TourStepConfig } from '@/context/tour/tourTypes'
import { formatDate } from '@/lib/format/dates'
import { ErrorSummary } from '@/components/ui/ErrorSummary'
import { cabProfileFixLink, type FieldIssue } from '@/lib/fieldNavigation'
import { STANDARDS_CATALOG, isSameScheme, schemeDisplayName, standardTitleKey } from '@/lib/standardsCatalog'

const inputClass = `mt-1 ${fieldInputClassName} ${fieldHeightClassName}`

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fromIsoDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const datePart = value.split('T')[0]
  const parsed = new Date(`${datePart}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function includeSavedOptions(options: { value: string; label: string }[], saved: string[]) {
  return [...options, ...[...new Set(saved)].filter((value) => value && !options.some((option) => option.value === value)).map((value) => ({ value, label: schemeDisplayName(value) }))]
}

/** Unsaved form kept while the user fixes something on another page (sessionStorage, per page). */
const RETURN_DRAFT_PREFIX = 'icasco_return_draft:'

function readReturnDraft<T>(path: string): T | null {
  try {
    const raw = sessionStorage.getItem(RETURN_DRAFT_PREFIX + path)
    if (!raw) return null
    sessionStorage.removeItem(RETURN_DRAFT_PREFIX + path)
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function parsePersonPhone(raw?: string | null): { countryCode: CountryCode; phone: string } {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return { countryCode: 'SA', phone: '' }

  const parsed = parsePhoneNumberFromString(trimmed)
  if (parsed?.country) {
    return {
      countryCode: parsed.country as CountryCode,
      phone: parsed.nationalNumber,
    }
  }

  const parts = trimmed.split(/\s+/)
  if (parts.length > 1 && parts[0].startsWith('+')) {
    const dialDigits = parts[0].replace(/\D/g, '')
    const match = getCountries().find((c) => getCountryCallingCode(c) === dialDigits)
    if (match) {
      return {
        countryCode: match as CountryCode,
        phone: parts.slice(1).join('').replace(/\D/g, ''),
      }
    }
  }

  if (trimmed.startsWith('+')) {
    for (const c of getCountries()) {
      const dial = `+${getCountryCallingCode(c)}`
      if (trimmed.startsWith(dial)) {
        return {
          countryCode: c as CountryCode,
          phone: trimmed.slice(dial.length).replace(/\D/g, ''),
        }
      }
    }
  }

  return { countryCode: 'SA', phone: trimmed.replace(/\D/g, '') }
}

// Qualification document categories, stored as the document's documentType.
const QUAL_ACADEMIC = 'ACADEMIC'
const QUAL_TRAINING = 'TRAINING'
const QUAL_OTHER = 'Qualification Document' // documents saved before categories existed
const BASE_QUAL_CATEGORIES = [QUAL_ACADEMIC, QUAL_TRAINING]

function normalizeQualCategory(documentType?: string | null): string {
  const value = (documentType ?? '').trim()
  if (!value) return QUAL_OTHER
  if (value.toUpperCase() === QUAL_ACADEMIC) return QUAL_ACADEMIC
  if (value.toUpperCase() === QUAL_TRAINING) return QUAL_TRAINING
  return value
}

export function PersonnelProfileForm({ person, onCancel, onSaved, tourSteps = [] }: {
  person?: CompetencePerson
  onCancel: () => void
  onSaved: (person: CompetencePerson) => void
  tourSteps?: TourStepConfig[]
}) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const here = `${location.pathname}${location.search}`
  const label = (key: string) => t(`cab.competence.memberProfile.${key}`)
  // Coming back from the CAB profile (after fixing a scheme): restore what was typed before leaving.
  const [returnDraft] = useState(() => readReturnDraft<{ form: Record<string, unknown>; matrix: CompetenceMatrix }>(location.pathname))
  // No end date means the person still works here ("present").
  const [currentlyEmployed, setCurrentlyEmployed] = useState(!person?.employmentEndDate)
  const localDate = toIsoDate(new Date())
  const initialPhone = parsePersonPhone(person?.phone)
  const [form, setForm] = useState({
    name: person?.name ?? '', role: person?.role ?? 'Auditor',
    email: person?.email ?? '',
    phoneCountryCode: initialPhone.countryCode,
    phone: initialPhone.phone,
    avatarUrl: person?.avatarUrl ?? '',
    // Today is only the default for a new member; an existing record keeps its blank start date.
    ...personnelDateFields(person, person ? '' : localDate),
    iafCodes: person?.iafCodes ?? [], qualifications: person?.qualifications ?? person?.evaluation?.highestQualification ?? '',
    country: person?.country ?? '', schemes: person?.schemes ?? [],
    authorizedScope: person?.authorizedScope ?? '', expiryDate: person?.expiryDate ? person.expiryDate.split('T')[0] : '',
    ...(returnDraft?.form ?? {}),
  })

  // Refill the form when a (newer) person record arrives — adjusted during render, not in an effect.
  const [syncedPerson, setSyncedPerson] = useState(person)
  if (person !== syncedPerson) {
    setSyncedPerson(person)
    if (person && !returnDraft) {
      const parsedPhone = person.phone ? parsePersonPhone(person.phone) : null
      setCurrentlyEmployed(!person.employmentEndDate)
      setForm((prev) => ({
        ...prev,
        name: person.name || prev.name,
        role: person.role || prev.role,
        email: person.email || prev.email,
        phoneCountryCode: parsedPhone ? parsedPhone.countryCode : prev.phoneCountryCode,
        phone: parsedPhone ? parsedPhone.phone : prev.phone,
        avatarUrl: person.avatarUrl || prev.avatarUrl,
        ...personnelDateFields(person, ''),
        iafCodes: person.iafCodes?.length ? person.iafCodes : prev.iafCodes,
        qualifications: person.qualifications || person.evaluation?.highestQualification || prev.qualifications,
        country: person.country || prev.country,
        schemes: person.schemes?.length ? person.schemes : prev.schemes,
        authorizedScope: person.authorizedScope || prev.authorizedScope,
        expiryDate: person.expiryDate ? person.expiryDate.split('T')[0] : '',
      }))
    }
  }
  // Preserve the register's readable string values while reusing the shared catalogs.
  const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })
  const countryOptions = includeSavedOptions(getCountryOptions(i18n.language).map((country) => ({
    value: countryNames.of(country.code) ?? country.name,
    label: `${country.flag} ${country.name}`,
  })), [form.country])

  // Competence by standard. Saved employees without a matrix yet get their flat
  // IAF codes under each of their standards, so nothing they had is lost.
  const toIafValue = (code: string) => `IAF_${iafDigits(code)}`
  const [matrix, setMatrix] = useState<CompetenceMatrix>(() => returnDraft?.matrix ?? ({
    schemeIafCodes: Object.fromEntries(
      (person?.schemes ?? []).map((scheme) => [scheme, (person?.iafCodes ?? []).map(toIafValue)])
    ),
    exams: [],
  }))
  useEffect(() => {
    if (!person?.id) return
    let cancelled = false
    getCompetenceMatrix(person.id).then((saved) => {
      if (!cancelled && saved && !returnDraft) setMatrix(saved)
    })
    return () => {
      cancelled = true
    }
  }, [person?.id, returnDraft])

  // The CAB's own schemes only add to the built-in catalog, so a failed load must not block
  // the form: show a quiet note with a retry instead of a blocking error.
  const [cabSchemes, setCabSchemes] = useState<string[]>([])
  const [schemesFailed, setSchemesFailed] = useState(false)
  const [schemesAttempt, setSchemesAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    getCabProfile()
      .then(({ cab }) => {
        if (cancelled) return
        const names = (cab?.schemes ?? []).map((s) => s.schemeName).filter(Boolean)
        setCabSchemes(Array.from(new Set(names)))
        setSchemesFailed(false)
      })
      .catch(() => {
        if (!cancelled) setSchemesFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [schemesAttempt])

  const baseSchemeOptions = [
        ...STANDARDS_CATALOG.map((entry) => ({
          value: entry.name,
          label: entry.designation ? `${entry.name} · ${t(`${standardTitleKey(entry)}.title`)}` : t(`${standardTitleKey(entry)}.title`),
        })),
        ...STANDARD_SCHEMA_OPTIONS.filter((scheme) => !STANDARDS_CATALOG.some((entry) => isSameScheme(entry.name, scheme.name))).map(
          (scheme) => ({ value: scheme.name, label: `${scheme.name} · ${scheme.certificationType}` }),
        ),
        { value: 'HACCP', label: 'HACCP' },
      ]

  const schemeOptions = includeSavedOptions(baseSchemeOptions, [...cabSchemes, ...form.schemes])

  const sectorOptions = includeSavedOptions(SECTOR_OPTIONS.map((sector) => ({
    value: t(`companyProfile.profileHeader.sectors.${sector.key}`, { lng: 'en' }),
    label: t(`companyProfile.profileHeader.sectors.${sector.key}`),
  })), [form.authorizedScope])

  const [error, setError] = useState('')
  const [errorDetails, setErrorDetails] = useState<string[]>([])
  // Clickable validation list: each item focuses its field or opens the CAB profile with a way back.
  const [issues, setIssues] = useState<FieldIssue[]>([])
  const [readingImage, setReadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Qualification documents, grouped by category. The category is saved as the
  // document's `documentType`, so groups come back from the server as they were saved.
  type QualFile = UploadedDocumentFile & { category: string }
  const [qualFiles, setQualFiles] = useState<QualFile[]>([])
  const [pendingQualFiles, setPendingQualFiles] = useState<{ id: string; file: File; category: string }[]>([])
  const [customQualCategories, setCustomQualCategories] = useState<string[]>([])
  const [newQualCategory, setNewQualCategory] = useState('')
  const [addingQualCategory, setAddingQualCategory] = useState(false)
  const [uploadingQual, setUploadingQual] = useState(Boolean(person?.id && !person.id.startsWith('per-')))
  const [savedEmployeeId, setSavedEmployeeId] = useState(person?.id)

  useEffect(() => {
    if (!person?.id || person.id.startsWith('per-')) return
    getCabEmployeeDetail(person.id)
      .then(({ employee }) => {
        if (employee?.qualifications?.length) {
          setQualFiles(
            employee.qualifications.map((q) => ({
              id: q.id,
              category: normalizeQualCategory(q.documentType),
              name: q.originalName || q.fileName || 'qualification.pdf',
              sizeLabel: formatFileSize(q.fileSize),
              dateLabel: q.uploadedAt ? formatDate(q.uploadedAt) : undefined,
              url: q.fileUrl,
            })),
          )
        }
      })
      .catch(() => setError(t('cab.competence.profileForm.docsLoadError', 'Could not load saved qualification documents. Please reload the page.')))
      .finally(() => setUploadingQual(false))
  }, [person?.id, t])

  const handleSelectQualFile = async (file: File, category: string) => {
    if (isQualificationFileTooLarge(file)) {
      setError(t('cab.competence.profileForm.fileTooLarge', 'File size exceeds the 20 MB limit.'))
      return
    }
    setError('')

    const tempId = crypto.randomUUID()
    setPendingQualFiles((prev) => [...prev, { id: tempId, file, category }])
    setQualFiles((prev) => [{
      id: tempId, category, name: file.name, sizeLabel: formatFileSize(file.size),
      dateLabel: 'Pending save', url: URL.createObjectURL(file),
    }, ...prev])
  }

  const handleDeleteQualFile = async (docId: string) => {
    const isPending = pendingQualFiles.some((p) => p.id === docId)
    if (isPending) {
      const url = qualFiles.find((file) => file.id === docId)?.url
      if (url) URL.revokeObjectURL(url)
      setPendingQualFiles((prev) => prev.filter((p) => p.id !== docId))
      setQualFiles((prev) => prev.filter((f) => f.id !== docId))
      return
    }
    if (savedEmployeeId) {
      setUploadingQual(true)
      try {
        await deleteCabEmployeeQualification(savedEmployeeId, docId)
        setQualFiles((prev) => prev.filter((f) => f.id !== docId))
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        }
      } finally {
        setUploadingQual(false)
      }
    } else {
      setQualFiles((prev) => prev.filter((f) => f.id !== docId))
    }
  }

  // Built-in categories first, then saved or user-added ones, each listed once.
  const qualCategories = Array.from(
    new Set([...BASE_QUAL_CATEGORIES, ...qualFiles.map((file) => file.category), ...customQualCategories]),
  )
  const qualCategoryLabel = (category: string) => {
    if (category === QUAL_ACADEMIC) return t('cab.competence.qualCategories.academic', 'Academic certificates')
    if (category === QUAL_TRAINING) return t('cab.competence.qualCategories.training', 'Training certificates')
    if (category === QUAL_OTHER) return t('cab.competence.qualCategories.other', 'Other qualification documents')
    return category
  }
  const addQualCategory = () => {
    const name = newQualCategory.trim()
    if (!name) return
    if (!qualCategories.some((c) => c.toLowerCase() === name.toLowerCase() || qualCategoryLabel(c).toLowerCase() === name.toLowerCase())) {
      setCustomQualCategories((prev) => [...prev, name])
    }
    setNewQualCategory('')
    setAddingQualCategory(false)
  }

  const handleOpenQualFile = (file: UploadedDocumentFile) => {
    if (file.url) {
      window.open(file.url, '_blank', 'noopener,noreferrer')
    }
  }

  const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError(label('imageHelp'))
      return
    }
    setError('')
    setImageFile(file)
    setReadingImage(true)
    const reader = new FileReader()
    reader.onload = () => {
      setForm((current) => ({ ...current, avatarUrl: String(reader.result) }))
      setReadingImage(false)
    }
    reader.onerror = () => { setError(label('imageError')); setReadingImage(false) }
    reader.readAsDataURL(file)
  }

  const phoneError =
    form.phone.trim() && !isValidPhoneNumber(form.phone, form.phoneCountryCode)
      ? t('validation.invalidMobile', 'Invalid phone number')
      : undefined

  /** Keeps the typed form while the user fixes a scheme in the CAB profile (restored on return). */
  const saveReturnDraft = () => {
    try {
      sessionStorage.setItem(RETURN_DRAFT_PREFIX + location.pathname, JSON.stringify({ form: { ...form, avatarUrl: form.avatarUrl.startsWith('data:') ? '' : form.avatarUrl }, matrix }))
    } catch {
      // The draft is a convenience; the link still works without it.
    }
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (readingImage || isSubmitting || uploadingQual) return
    const found: FieldIssue[] = []
    if (!form.name.trim()) found.push({ key: 'name', message: label('nameRequired'), fieldId: 'personnel-name' })
    if (!person && !form.email.trim()) {
      found.push({ key: 'email', message: t('cab.competence.memberProfile.emailRequired', 'Email is required'), fieldId: 'personnel-email' })
    }
    if (phoneError) found.push({ key: 'phone', message: phoneError, fieldId: 'personnel-phone' })
    const dateError = validateEmploymentDates(currentlyEmployed, form.employmentStartDate, form.employmentEndDate)
    if (dateError) found.push({ key: 'dates', message: label(dateError), fieldId: 'personnel-end-date' })

    // A scheme counts as configured when the CAB profile holds the same standard under any name
    // ("ISO 45001:2018" matches a profile scheme saved as "ISO 45001"); it is saved under the CAB's name.
    const resolvedSchemes = form.schemes.map((s) => cabSchemes.find((cs) => isSameScheme(cs, s)) ?? s)
    const missingSchemes = resolvedSchemes.filter((scheme) => !cabSchemes.includes(scheme))
    for (const scheme of missingSchemes) {
      found.push({
        key: `scheme-${scheme}`,
        message: t('cab.competence.profileForm.missingSchemeItem', { scheme: schemeDisplayName(scheme) }),
        to: cabProfileFixLink('schemes', 'cab-setup-schemes', here),
        onSelect: saveReturnDraft,
      })
    }

    setIssues(found)
    if (found.length) {
      setError('')
      return
    }
    setError('')
    setErrorDetails([])

    const dialCode = `+${getCountryCallingCode(form.phoneCountryCode)}`
    const cleanPhone = form.phone.replace(/\D/g, '')
    setIsSubmitting(true)
    let employeeId = savedEmployeeId
    try {
      // The server sets the employee's IAF codes from the competence matrix saved below (it checks
      // the critical-code exams there); the preview's mock keeps them on the employee itself.
      const payload = {
        professionalRole: toBackendRole(form.role),
        ...employmentDatesPayload(currentlyEmployed, form.employmentStartDate, form.employmentEndDate),
        ...(isDemoMode()
          ? { iafCodes: cleanIafCodes(Array.from(new Set(form.schemes.flatMap((scheme) => matrix.schemeIafCodes[scheme] ?? [])))) }
          : {}),
        schemes: resolvedSchemes,
      }
      const { employee } = employeeId
        ? await updateCabEmployee(employeeId, payload)
        : await createCabEmployee({
            ...payload, fullName: form.name.trim(), email: form.email.trim(),
            ...(cleanPhone ? { phone: cleanPhone, phoneCountryCode: dialCode } : {}),
          })
      employeeId = employee.id
      // Keep the created ID so retrying a failed upload cannot create another employee.
      setSavedEmployeeId(employeeId)
      // Keyed by the CAB's scheme names, exactly as saved on the employee.
      const savedSchemeName = (scheme: string) => resolvedSchemes[form.schemes.indexOf(scheme)] ?? scheme
      await saveCompetenceMatrix(employeeId, {
        schemeIafCodes: Object.fromEntries(form.schemes.map((scheme) => [savedSchemeName(scheme), matrix.schemeIafCodes[scheme] ?? []])),
        exams: matrix.exams.map((exam) => ({ ...exam, scheme: savedSchemeName(exam.scheme) })),
      })
      await updateCompetencePerson(employeeId, {
        country: form.country,
        authorizedScope: form.authorizedScope,
        expiryDate: form.expiryDate || null,
        qualifications: form.qualifications,
      })
      let avatarUrl = employee.imageUrl || person?.avatarUrl
      if (imageFile) {
        const result = await uploadCabEmployeeImage(employeeId, imageFile)
        avatarUrl = result.employee.imageUrl || undefined
        setImageFile(null)
      }
      for (const item of pendingQualFiles) {
        const { qualification: q } = await uploadCabEmployeeQualification(employeeId, item.file, item.category)
        setPendingQualFiles((prev) => prev.filter((pending) => pending.id !== item.id))
        setQualFiles((prev) => prev.map((file) => {
          if (file.id !== item.id) return file
          if (file.url) URL.revokeObjectURL(file.url)
          return {
            id: q.id, category: item.category, name: q.originalName || q.fileName || item.file.name,
            sizeLabel: formatFileSize(q.fileSize), url: q.fileUrl,
            dateLabel: formatDate(q.uploadedAt),
          }
        }))
      }
      onSaved({
        ...person, ...form, id: employeeId,
        code: person?.code || `PER-${employeeId.slice(0, 4).toUpperCase()}`,
        schemes: employee.schemes, avatarUrl: avatarUrl || undefined,
        name: form.name.trim() || employee.user.fullName,
        email: form.email.trim() || employee.user.email,
        role: (CAB_PROFESSIONAL_ROLES.find((r) => r.value === employee.professionalRole)?.label ?? form.role) as CompetencePerson['role'],
        phone: cleanPhone ? `${dialCode} ${cleanPhone}` : '',
        status: employee.status === 'ACTIVE' ? 'Authorized' : 'Under review',
        statusDot: employee.status === 'INACTIVE' ? 'Inactive' : 'Active',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : label('saveError')
      setError(personnelSaveErrorMessage(employeeId, message))
      if (err instanceof ApiError) setErrorDetails(err.errors ?? [])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-5" dir={i18n.dir()}>
      <CabTourStep steps={tourSteps} stepId="profile-personal-section">
        <div>
          <SectionHeading title={label('personalDetails')} accordion>
            <div className="grid gap-5 md:grid-cols-2">
                <label className={`block ${fieldLabelClassName}`}>{label('name')} *
                  <input id="personnel-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
                </label>
                <div>
                  <span className={`mb-1 block ${fieldLabelClassName}`}>{t('cab.competence.role')}</span>
                  <SelectField
                    id="personnel-job-title"
                    value={toBackendRole(form.role)}
                    onChange={(val) => setForm({ ...form, role: val as CompetencePerson['role'] })}
                    options={CAB_PROFESSIONAL_ROLES.map((r) => ({
                      value: r.value,
                      label: enumLabel(t, r.label),
                    }))}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2 md:col-span-2">
                  <label className={`block ${fieldLabelClassName}`}>{label('email')} {!person && '*'}
                    <input id="personnel-email" type="email" required={!person} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                  </label>
                  <div>
                    <label htmlFor="personnel-phone" className={`block ${fieldLabelClassName}`}>{label('phone')}</label>
                    <div className="mt-1">
                      <PhoneInputRow
                        rowClassName="gap-3"
                        value={form.phoneCountryCode}
                        onChange={(code) => setForm({ ...form, phoneCountryCode: code })}
                        aria-label={t('register.countryCode', 'Country code')}
                        className="border border-neutral-300"
                      >
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-primary-500">
                            <AppIcon icon={PhoneIcon} size={20} />
                          </span>
                          <input
                            id="personnel-phone"
                            type="tel"
                            lang="en"
                            dir="ltr"
                            placeholder={t('ui.phonePlaceholder')}
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className={cn(
                              fieldInputClassName,
                              fieldHeightClassName,
                              'ps-12',
                              phoneError && 'border-error-400 focus-within:ring-error-400',
                            )}
                          />
                        </div>
                      </PhoneInputRow>
                      {phoneError && <p className="mt-1 text-small-light text-error-700">{phoneError}</p>}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <span className={`mb-1.5 block ${fieldLabelClassName}`}>{label('image')}</span>
                  <div className="flex flex-wrap items-center gap-4 rounded-lg border border-dashed border-primary/30 bg-white p-4">
                    {form.avatarUrl ? (
                      <img src={form.avatarUrl} alt={form.name} className="size-16 shrink-0 rounded-full object-cover shadow-xs" />
                    ) : (
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-body font-bold text-primary">
                        {(form.name || 'EM').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={readingImage}
                        onChange={uploadImage}
                        className="block w-full text-body-sm text-neutral-700 file:me-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-body-sm file:font-semibold file:text-primary hover:file:bg-primary-100"
                      />
                      <span className="block text-caption font-normal text-neutral-600">{label('imageHelp')}</span>
                    </div>
                  </div>
                </div>
            </div>
          </SectionHeading>
        </div>
      </CabTourStep>

      <CabTourStep steps={tourSteps} stepId="profile-employment-section">
        <div>
          <SectionHeading title={label('employmentDetails')} accordion>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <span className={`block ${fieldLabelClassName}`}>{label('startDate')}</span>
                <div id="personnel-employment-start-date" className="mt-1">
                  <DatePicker
                    value={fromIsoDate(form.employmentStartDate)}
                    onChange={(date) => setForm({ ...form, employmentStartDate: toIsoDate(date) })}
                  />
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`block ${fieldLabelClassName}`}>{label('endDate')}</span>
                  <label className="flex cursor-pointer items-center gap-2 text-body-sm font-medium text-neutral-800">
                    <Checkbox
                      checked={currentlyEmployed}
                      onChange={() => {
                        const next = !currentlyEmployed
                        setCurrentlyEmployed(next)
                        if (next) setForm({ ...form, employmentEndDate: '' })
                      }}
                    />
                    {label('currentlyEmployed')}
                  </label>
                </div>
                <div id="personnel-end-date" className="mt-1">
                  {currentlyEmployed ? (
                    <div className="flex h-14 items-center gap-2 rounded-md border border-dashed border-primary-100 bg-primary-25 px-4 text-body font-semibold text-primary">
                      <span className="size-2 rounded-full bg-success-500" aria-hidden />
                      {label('present')}
                    </div>
                  ) : (
                    <DatePicker
                      value={fromIsoDate(form.employmentEndDate)}
                      onChange={(date) => setForm({ ...form, employmentEndDate: toIsoDate(date) })}
                    />
                  )}
                </div>
              </div>
            </div>
          </SectionHeading>
        </div>
      </CabTourStep>

      <CabTourStep steps={tourSteps} stepId="profile-competence-section">
        <div>
          <SectionHeading title={label('competenceDetails')} accordion>
            <div className="grid gap-5 md:grid-cols-2">
                <div id="personnel-competence-matrix" className="md:col-span-2">
                  {/* Targets of "complete this record" links (schemes and IAF codes are edited here). */}
                  <span id="personnel-schemes" aria-hidden className="block" />
                  <span id="personnel-iaf-codes" aria-hidden className="block" />
                  <SchemeCompetenceEditor
                    schemes={form.schemes}
                    schemeOptions={schemeOptions}
                    onSchemesChange={(schemes) => setForm({ ...form, schemes })}
                    matrix={matrix}
                    onMatrixChange={(next) => {
                      setMatrix(next)
                      setForm((prev) => ({ ...prev, iafCodes: Array.from(new Set(Object.values(next.schemeIafCodes).flat())) }))
                    }}
                    schemesHint={
                      <p className="mt-2 text-sm text-neutral-600">{t('ui.schemesConfigPrefix')} <Link className="text-primary underline" to={cabProfileFixLink('schemes', 'cab-setup-schemes', here)} onClick={saveReturnDraft}>{t('ui.cabCompanyProfile')}</Link> {t('ui.schemesConfigSuffix')}</p>
                    }
                  />
                </div>
                <SearchableSelect id="personnel-sector" label={t('cab.competence.authorizedScope')} value={form.authorizedScope} options={sectorOptions} onChange={(authorizedScope) => setForm({ ...form, authorizedScope })} placeholder={t('cab.competence.authorizedScope')} />
                <SearchableSelect id="personnel-country" label={t('cab.competence.country')} value={form.country} options={countryOptions} onChange={(country) => setForm({ ...form, country })} placeholder={t('cab.competence.country')} />
                <div className="md:col-span-2">
                  <span className={`block ${fieldLabelClassName}`}>{t('cab.competence.memberProfile.expiryDate', 'Expiry (optional)')}</span>
                  <div className="mt-1 sm:max-w-sm">
                    <DatePicker
                      value={fromIsoDate(form.expiryDate)}
                      onChange={(date) => setForm({ ...form, expiryDate: toIsoDate(date) })}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <span className={`mb-1.5 block ${fieldLabelClassName}`}>{label('qualifications')}</span>
                  <div className="flex flex-col gap-3">
                    {qualCategories.map((category) => (
                      <div key={category} className="rounded-md border border-dashed border-primary/30 bg-white p-2">
                        <DocumentUploadField
                          title={qualCategoryLabel(category)}
                          note={t('cab.competence.qualificationsDesc', 'PDF, Word, Images (max 20 MB)')}
                          files={qualFiles.filter((file) => file.category === category)}
                          busy={uploadingQual || isSubmitting}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onSelectFile={(file) => handleSelectQualFile(file, category)}
                          onDeleteFile={handleDeleteQualFile}
                          onOpenFile={handleOpenQualFile}
                        />
                      </div>
                    ))}

                    {/* Add a category of the user's own (e.g. professional licences, language certificates) */}
                    {addingQualCategory ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          autoFocus
                          value={newQualCategory}
                          onChange={(e) => setNewQualCategory(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addQualCategory()
                            }
                            if (e.key === 'Escape') setAddingQualCategory(false)
                          }}
                          placeholder={t('cab.competence.qualCategories.newPlaceholder', 'Category name, e.g. Professional licences')}
                          className={cn(fieldInputClassName, fieldHeightClassName, 'sm:max-w-sm')}
                        />
                        <div className="flex gap-2">
                          <Button type="button" onClick={addQualCategory} disabled={!newQualCategory.trim()}>
                            {t('common.add', 'Add')}
                          </Button>
                          <Button type="button" variant="tertiary" onClick={() => setAddingQualCategory(false)}>
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingQualCategory(true)}
                        className="self-start text-body-3-medium text-primary hover:text-primary-hover hover:underline"
                      >
                        + {t('cab.competence.qualCategories.add', 'Add another category')}
                      </button>
                    )}
                  </div>
                  {pendingQualFiles.length > 0 && <p className="mt-2 text-sm text-neutral-600">{t('ui.docsUploadOnSave')}</p>}
                </div>
            </div>
          </SectionHeading>
        </div>
      </CabTourStep>

      {schemesFailed && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning-100 bg-warning-50 px-4 py-3">
          <p className="text-body-3 text-warning-800">{t('cab.competence.schemesLoadWarning', 'Your CAB\'s own schemes could not be loaded, so only the standard scheme list is shown. You can still save.')}</p>
          <button type="button" onClick={() => setSchemesAttempt((n) => n + 1)} className="text-body-3-medium text-primary hover:underline">
            {t('common.retry', 'Try again')}
          </button>
        </div>
      )}

      <ErrorSummary issues={issues} />

      {(error || errorDetails.length > 0) && (
        <div role="alert" className="space-y-1 rounded-md border border-error-100 bg-error-50 p-4 text-body-3 text-error-700">
          {error && <p className="font-semibold">{error}</p>}
          {errorDetails.map((msg, i) => (
            <p key={i}>{'\u2022'} {msg}</p>
          ))}
        </div>
      )}

      <CabTourStep steps={tourSteps} stepId="profile-save-action">
        <div className="flex flex-wrap justify-end gap-3 rounded-lg border border-neutral-100 bg-white p-5">
          <Button variant="outline" type="button" disabled={isSubmitting || uploadingQual} onClick={onCancel}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={readingImage || isSubmitting || uploadingQual}>
            {isSubmitting ? t('common.saving', 'Saving...') : t('cab.competence.savePerson')}
          </Button>
        </div>
      </CabTourStep>
    </form>
  )
}

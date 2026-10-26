import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useValuesChanged } from "@/hooks/useValuesChanged";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { CountryCode } from "@/lib/countries";
import { useIpLocation } from "@/hooks/useIpLocation";
import { ApiError } from "@/lib/api/client";
import { getUserErrorMessage, isNetworkError, logTechnicalError } from "@/lib/errorMessages";
import { formatCertificationSubmitError } from "@/components/dashboard/entityData/applicationFieldErrors";
import { clearAuthSession } from "@/lib/authStorage";
import {
  createDraftApplication,
  deleteApplicationDocument,
  getApplication,
  submitApplication,
  updateDraftApplication,
  uploadApplicationDocument,
  type ApplicationStatus,
} from "@/lib/api/certificationApplicationApi";
import {
  getOrganizationProfile,
  saveOrganizationProfile,
  createBranch as createOrgBranch,
  type OrganizationProfileData,
  type OrgBranch,
} from "@/lib/api/organizationProfileApi";
import {
  formValuesFromApplication,
  payloadFromForm,
  prefillFromOrganization,
  profilePayloadFromForm,
} from "@/components/dashboard/entityData/applicationMappers";
import type { ApplicationFormContextValue } from "@/components/dashboard/entityData/ApplicationFormContext";
import {
  createEmptyBranch,
  DOCUMENT_SLOT_TYPES,
  EMPTY_APPLICATION_FORM,
  type ApplicationFormValues,
  type ApplicationNotification,
  type BranchFormValues,
} from "@/components/dashboard/entityData/applicationTypes";

const NOTIFICATION_TIMEOUT_MS = 5000;

export interface ApplicationState {
  contextValue: ApplicationFormContextValue;
  loading: boolean;
  saving: boolean;
  submitting: boolean;
  status: ApplicationStatus;
  orderNumber: string | null;
  notification: ApplicationNotification | null;
  loadError: "rateLimit" | "generic" | "notFound" | "forbidden" | "network" | null;
  reload: () => void;
  saveDraft: () => Promise<boolean>;
  submit: () => Promise<boolean>;
}

export function useApplicationState(): ApplicationState {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState<ApplicationFormValues>(
    EMPTY_APPLICATION_FORM,
  );
  const [applicationId, setApplicationId] = useState<string | null>(
    searchParams.get("id"),
  );
  const [status, setStatus] = useState<ApplicationStatus>("DRAFT");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(searchParams.get("id")));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] =
    useState<ApplicationNotification | null>(null);
  const [loadError, setLoadError] = useState<
    "rateLimit" | "generic" | "notFound" | "forbidden" | "network" | null
  >(
    null,
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [orgBranches, setOrgBranches] = useState<OrgBranch[]>([]);
  const orgBranchIdsRef = useRef<string[]>([]);
  const orgProfileRef = useRef<OrganizationProfileData | null>(null);
  const nextBranchIdRef = useRef(2);
  const ipLocation = useIpLocation();
  const ipDefaultsBlockedRef = useRef(false);

  // Marked true the moment the user (or a UI control) explicitly sets the
  // mobile country code, so the IP-based default below never overwrites it.
  const mobileCodeTouchedRef = useRef(false)

  const update = useCallback(
    <K extends keyof ApplicationFormValues>(key: K, value: ApplicationFormValues[K]) => {
      if (key === 'mobileCountryCode') mobileCodeTouchedRef.current = true
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    []
  );

  const notify = useCallback(
    (n: ApplicationNotification) => setNotification(n),
    [],
  );

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(
      () => setNotification(null),
      NOTIFICATION_TIMEOUT_MS,
    );
    return () => clearTimeout(timer);
  }, [notification]);

  const handleApiError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        clearAuthSession();
        navigate("/login", { replace: true });
        return;
      }
      setNotification({ type: "error", message: formatCertificationSubmitError(error, t) });
    },
    [navigate, t],
  );

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  // Load an existing application when arriving with ?id=… (e.g. continuing a draft)
  // Prime the loading flags in the render where a reload is requested, so the
  // effect below only sets state from its async callback.
  const reloadRequested = useValuesChanged([reloadKey]);
  if (reloadRequested && searchParams.get("id")) {
    setLoading(true);
    setLoadError(null);
  }

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const app = await getApplication(id);
        if (cancelled) return;
        setApplicationId(app.id);
        setStatus(app.status);
        setOrderNumber(app.orderNumber ?? null);
        const values = formValuesFromApplication(app);
        nextBranchIdRef.current = values.branches.length + 1;
        // A saved country/mobile wins over the IP-based default
        if (app.legalInfo?.country || app.legalInfo?.mobile) {
          ipDefaultsBlockedRef.current = true;
        }
        setForm(values);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }
        logTechnicalError(error);
        if (error instanceof ApiError) {
          if (error.status === 429) setLoadError("rateLimit");
          else if (error.status === 404) setLoadError("notFound");
          else if (error.status === 403) setLoadError("forbidden");
          else setLoadError("generic");
        } else {
          setLoadError(isNetworkError(error) ? "network" : "generic");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  // Default the country, city, and phone code from the visitor's IP until the
  // user (or a loaded draft) provides real values
  useEffect(() => {
    if (loading || ipDefaultsBlockedRef.current || !ipLocation?.countryCode) return
    ipDefaultsBlockedRef.current = true
    const code = ipLocation.countryCode as CountryCode
    setForm((prev) => ({
      ...prev,
      country: prev.country ?? code,
      city: prev.city || ipLocation.city || prev.city,
      mobileCountryCode: mobileCodeTouchedRef.current ? prev.mobileCountryCode : code,
    }))
  }, [ipLocation, loading]);

  // The organization profile supplies the branch ids that application branches
  // reference (sourceBranchId) and prefills a brand-new application's legal data
  useEffect(() => {
    const editingId = searchParams.get("id");
    let cancelled = false;
    (async () => {
      try {
        const data = await getOrganizationProfile();
        if (cancelled) return;
        orgProfileRef.current = data;
        setOrgBranches(data.branches ?? []);
        orgBranchIdsRef.current = (data.branches ?? []).map(
          (branch) => branch.id,
        );
        if (!editingId) {
          setForm((prev) => prefillFromOrganization(prev, data));
        }
      } catch {
        // Prefill is best-effort; the draft can still be saved without it
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateBranch = useCallback(
    (localId: number, patch: Partial<BranchFormValues>) => {
      setForm((prev) => ({
        ...prev,
        branches: prev.branches.map((branch) =>
          branch.localId === localId ? { ...branch, ...patch } : branch,
        ),
      }));
    },
    [],
  );

  const addBranch = useCallback((): number => {
    const localId = nextBranchIdRef.current++;
    setForm((prev) => ({
      ...prev,
      branches: [...prev.branches, createEmptyBranch(localId)],
    }));
    return localId;
  }, []);

  const removeBranch = useCallback((localId: number) => {
    setForm((prev) => ({
      ...prev,
      branches: prev.branches.filter((branch) => branch.localId !== localId),
    }));
  }, []);

  // Tracks in-flight saveOrgBranch calls (keyed by branch localId), so we can
  // both (a) skip a duplicate call for the same row while one is running, and
  // (b) let saveDraft/submit wait for them to finish before sending the payload.
  const pendingOrgBranchSavesRef = useRef<Map<number, Promise<void>>>(
    new Map(),
  );

  const saveOrgBranch = useCallback(
    (localId: number, branchName: string, address: string) => {
      const name = branchName.trim();
      if (!name) return;
      if (pendingOrgBranchSavesRef.current.has(localId)) return;

      const promise = (async () => {
        try {
          const created = await createOrgBranch({
            branchName: name,
            address: address || undefined,
            branchType: "PERMANENT",
            employeeCount: 0,
          });
          setOrgBranches((prev) => [...prev, created]);
          updateBranch(localId, { sourceBranchId: created.id });
        } catch (error) {
          notify({ type: "error", message: getUserErrorMessage(error, t) });
        } finally {
          pendingOrgBranchSavesRef.current.delete(localId);
        }
      })();

      pendingOrgBranchSavesRef.current.set(localId, promise);
    },
    [notify, t, updateBranch],
  );

  const waitForPendingBranchSaves = useCallback(async () => {
    await Promise.all(pendingOrgBranchSavesRef.current.values());
  }, []);

  const setSpecAnswer = useCallback((questionKey: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      specAnswers: { ...prev.specAnswers, [questionKey]: value },
    }));
  }, []);

  const uploadDocument = useCallback(
    async (slotId: string, file: File) => {
      setUploading(true);
      try {
        const result = await uploadApplicationDocument(file);
        setForm((prev) => ({
          ...prev,
          documents: [
            {
              localId: crypto.randomUUID(),
              slotId,
              documentType: DOCUMENT_SLOT_TYPES[slotId] ?? "OTHER",
              fileUrl: result.fileUrl,
              filePath: result.filePath,
              fileName: result.fileName,
              originalName: file.name,
              mimeType: result.mimeType,
              fileSize: result.sizeBytes,
            },
            ...prev.documents,
          ],
        }));
      } catch (error) {
        handleApiError(error);
      } finally {
        setUploading(false);
      }
    },
    [handleApiError],
  );

  const removeDocument = useCallback(
    async (localId: string) => {
      const doc = form.documents.find((entry) => entry.localId === localId);
      if (!doc) return;
      try {
        if (doc.fileName) await deleteApplicationDocument(doc.fileName);
      } catch (error) {
        // A missing file on the server should not block removing it from the form
        if (!(error instanceof ApiError && error.status === 404)) {
          handleApiError(error);
          return;
        }
      }
      setForm((prev) => ({
        ...prev,
        documents: prev.documents.filter((entry) => entry.localId !== localId),
      }));
    },
    [form.documents, handleApiError],
  );

  const uploadCommercialRegister = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const result = await uploadApplicationDocument(file);
        setForm((prev) => ({
          ...prev,
          commercialRegisterFile: result.fileUrl,
        }));
      } catch (error) {
        handleApiError(error);
      } finally {
        setUploading(false);
      }
    },
    [handleApiError],
  );

  // Mirror the shared legal-identity fields back to the company profile on Next.
  // Best-effort — a profile-save failure never blocks the application draft.
  const syncOrganizationProfile = useCallback(async () => {
    const snapshot = orgProfileRef.current;
    if (!snapshot) return;
    const payload = profilePayloadFromForm(form, snapshot);
    try {
      const updated = await saveOrganizationProfile(payload);
      orgProfileRef.current = {
        ...snapshot,
        profile: payload.profile ?? snapshot.profile,
        address: payload.address ?? snapshot.address,
        status: updated.status,
      };
    } catch {
      // Ignore — the application draft is the primary save here
    }
  }, [form]);

  const saveDraft = useCallback(async (): Promise<boolean> => {
    // Submitted applications can be browsed but no longer edited
    if (status !== "DRAFT") return true;
    setSaving(true);
    setNotification(null);
    try {
      await waitForPendingBranchSaves();
      const payload = payloadFromForm(form, t);
      let id = applicationId;
      if (id) {
        await updateDraftApplication(id, payload);
      } else {
        const created = await createDraftApplication(payload);
        id = created.id;
        setApplicationId(id);
        setSearchParams({ id }, { replace: true });
      }
      await syncOrganizationProfile();
      setNotification({
        type: "success",
        message: t("accreditation.messages.draftSaved"),
      });
      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    applicationId,
    form,
    handleApiError,
    setSearchParams,
    status,
    syncOrganizationProfile,
    t,
    waitForPendingBranchSaves,
  ]);

  const submit = useCallback(async (): Promise<boolean> => {
    if (status !== "DRAFT") return true;
    setSubmitting(true);
    setNotification(null);
    try {
      await waitForPendingBranchSaves();
      const payload = payloadFromForm(form, t);
      let id = applicationId;
      if (id) {
        await updateDraftApplication(id, payload);
      } else {
        const created = await createDraftApplication(payload);
        id = created.id;
        setApplicationId(id);
        setSearchParams({ id }, { replace: true });
      }
      const result = await submitApplication(id);
      setStatus(result.status);
      setOrderNumber(result.orderNumber);
      setNotification({
        type: "success",
        message: t("accreditation.messages.submitted", {
          orderNumber: result.orderNumber,
        }),
      });
      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [
    applicationId,
    form,
    handleApiError,
    setSearchParams,
    status,
    t,
    waitForPendingBranchSaves,
  ]);

  const contextValue = useMemo<ApplicationFormContextValue>(
    () => ({
      form,
      update,
      updateBranch,
      addBranch,
      removeBranch,
      saveOrgBranch,
      setSpecAnswer,
      uploadDocument,
      removeDocument,
      uploadCommercialRegister,
      orgBranches,
      applicationId,
      status,
      saving,
      uploading,
      notify,
      handleApiError,
      readOnly: status !== 'DRAFT',
    }),
    [
      form,
      update,
      updateBranch,
      addBranch,
      removeBranch,
      saveOrgBranch,
      setSpecAnswer,
      uploadDocument,
      removeDocument,
      uploadCommercialRegister,
      orgBranches,
      applicationId,
      status,
      saving,
      uploading,
      notify,
      handleApiError,
    ],
  );

  return {
    contextValue,
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
  };
}

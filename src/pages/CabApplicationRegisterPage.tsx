import { notSet } from '@/lib/emptyValue'
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CabLayout } from "@/components/layout/CabLayout";
import { CabHeader } from "@/components/dashboard/cab/CabHeader";
import { CabTourStep } from "@/components/dashboard/cab/CabDashboardTourStep";
import { useApplicationRegisterTourSteps } from "@/config/applicationRegisterTourSteps";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Select";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  AddCircleIcon,
  AppIcon,
  ChevronDownIcon,
  ExcelFileIcon,
  ExportIcon,
  MoreIcon,
  PdfFileIcon,
  SearchIcon,
} from "@/components/icons";
import {
  listCabApplications,
  type ApplicationRegisterItem,
  type ApplicationRegisterStatus,
} from "@/lib/api/cabApplicationRegisterApi";
import {
  APPLICATION_STATUS_LABEL_KEYS as STATUS_LABEL_KEYS,
  APPLICATION_STATUS_STYLES as statusStyles,
} from "@/lib/applicationStatus";
import { getCountryOptions } from "@/lib/countries";
import {
  downloadExcelCsv,
  downloadPdfFromTable,
  matchesSearch,
  type TableColumn,
} from "@/lib/tableTools";
import { cn } from "@/lib/utils";
import {
  ROUTES,
  cabApplicationInformationRequiredPath,
  cabApplicationReceiptPath,
  cabApplicationReviewPath,
  cabApplicationSubmissionPath,
} from "@/lib/routes";
import { buttonVariants } from "@/components/ui/buttonVariants";

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-neutral-500 rtl-flip"
      aria-hidden
    >
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function applicationViewPath(app: ApplicationRegisterItem): string {
  if (!app.clientId) return ROUTES.cabApplicationSubmission;
  return cabApplicationSubmissionPath(app.clientId, app.id);
}

function applicationPrimaryPath(app: ApplicationRegisterItem): string {
  if (app.status === "DRAFT") return applicationViewPath(app);
  if (app.status === "APPROVED" || app.status === "REJECTED") {
    return cabApplicationReceiptPath(app.id, app.clientId || undefined);
  }
  return cabApplicationReviewPath(app.id, app.clientId || undefined);
}

function dueFromUpdatedAt(iso: string) {
  const received = new Date(iso);
  const due = new Date(received);
  due.setDate(due.getDate() + 14);
  const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  return { due, daysLeft };
}

export function CabApplicationRegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const tourSteps = useApplicationRegisterTourSteps();

  const [applications, setApplications] = useState<ApplicationRegisterItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [searchParams] = useSearchParams();
  // ?q= pre-fills the search (e.g. from an application breadcrumb).
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [createdFrom, setCreatedFrom] = useState<Date | null>(null);
  const [createdTo, setCreatedTo] = useState<Date | null>(null);
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const pageSize = 10;
  const [page, setPage] = useState(1);

  const countryOptions = useMemo(
    () => getCountryOptions(i18n.language),
    [i18n.language],
  );

  // Runs once on mount; `loading`/`loadError` already start as true/false.
  useEffect(() => {
    let cancelled = false;
    listCabApplications()
      .then((data) => {
        if (!cancelled) setApplications(data);
      })
      .catch(() => {
        if (!cancelled) {
          setApplications([]);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const next = applications.filter((app) => {
      const countryName =
        countryOptions.find((option) => option.code === app.countryCode)?.name ?? app.countryCode
      const matchesQuery = matchesSearch(
        [app.applicationCode, app.clientCode, app.clientName, app.standards.join(" "), countryName],
        query,
      );
      const matchesCountry =
        countryFilter === "all" || app.countryCode === countryFilter;
      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;
      const createdAt = new Date(app.updatedAt);
      const matchesFrom = !createdFrom || createdAt >= startOfDay(createdFrom);
      const matchesTo = !createdTo || createdAt <= endOfDay(createdTo);
      return (
        matchesQuery &&
        matchesCountry &&
        matchesStatus &&
        matchesFrom &&
        matchesTo
      );
    });

    return [...next].sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      if (sortBy === "dueSoonest") {
        return dueFromUpdatedAt(a.updatedAt).due.getTime() - dueFromUpdatedAt(b.updatedAt).due.getTime();
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [applications, query, countryFilter, statusFilter, createdFrom, createdTo, sortBy, countryOptions]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const rangeFrom =
    filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeTo = Math.min(currentPage * pageSize, filtered.length);

  const hasActiveFilters = Boolean(
    query ||
    createdFrom ||
    createdTo ||
    countryFilter !== "all" ||
    statusFilter !== "all",
  );

  const clearFilters = () => {
    setQuery("");
    setCreatedFrom(null);
    setCreatedTo(null);
    setCountryFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

  const exportColumns: TableColumn<ApplicationRegisterItem>[] = [
    {
      header: t("cab.applicationRegister.table.applicationCode"),
      value: (row) => row.applicationCode,
    },
    {
      header: t("cab.applicationRegister.table.clientCode"),
      value: (row) => row.clientCode,
    },
    {
      header: t("cab.applicationRegister.table.clientName"),
      value: (row) => row.clientName,
    },
    {
      header: t("cab.applicationRegister.table.standards"),
      value: (row) => row.standards.join(", "),
    },
    {
      header: t("cab.applicationRegister.table.stage"),
      value: (row) =>
        t(`cab.applicationRegister.status.${STATUS_LABEL_KEYS[row.status]}`),
    },
    {
      header: t("cab.applicationRegister.table.reviewer"),
      value: () => t("cab.applicationRegister.defaultReviewer"),
    },
    {
      header: t("cab.applicationRegister.table.due"),
      value: (row) =>
        row.status === "DRAFT"
          ? notSet()
          : formatDate(dueFromUpdatedAt(row.updatedAt).due.toISOString()),
    },
    {
      header: t("cab.applicationRegister.table.updated"),
      value: (row) => formatDate(row.updatedAt),
    },
  ];

  const handleExportPdf = () =>
    downloadPdfFromTable(
      "application-register.pdf",
      t("cab.applicationRegister.title"),
      exportColumns,
      filtered,
    );
  const handleExportExcel = () =>
    downloadExcelCsv("application-register.csv", exportColumns, filtered);

  return (
    <CabLayout tourId="cab-application-register" tourSteps={tourSteps}>
      <CabTourStep steps={tourSteps} stepId="application-register-header">
        <div>
          <CabHeader
            title={t("cab.applicationRegister.title")}
            notificationCount={3}
          />
        </div>
      </CabTourStep>
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <nav
          className="flex min-w-0 flex-wrap items-center gap-2 text-body-sm"
          aria-label={t('common.breadcrumb')}
        >
          <Link
            to={ROUTES.workspace}
            className="font-light text-neutral-500 hover:text-primary"
          >
            {t("cab.applicationRegister.breadcrumbParent")}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-800">
            {t("cab.applicationRegister.title")}
          </span>
        </nav>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-page-title text-text-primary">
              {t("cab.applicationRegister.title")}
            </h1>
            <p className="mt-1 text-body-sm text-neutral-600">
              {t("cab.applicationRegister.subtitle")}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
            <CabTourStep
              steps={tourSteps}
              stepId="application-register-new-btn"
              className="w-auto shrink-0"
            >
              <Button
                variant="primary"
                icon={<AppIcon icon={AddCircleIcon} size={20} />}
                onClick={() => navigate(ROUTES.cabApplicationSubmission)}
              >
                {t("cab.applicationRegister.newApplication")}
              </Button>
            </CabTourStep>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  variant="outline"
                  icon={<AppIcon icon={ExportIcon} size={20} />}
                  disabled={filtered.length === 0}
                >
                  {t("cab.applicationRegister.export")}
                  <AppIcon icon={ChevronDownIcon} size={16} />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={4}
                  className="z-50 min-w-[180px] rounded-md border border-neutral-100 bg-white p-1 shadow-lg"
                >
                  <DropdownMenu.Item
                    onSelect={handleExportPdf}
                    className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                  >
                    <AppIcon icon={PdfFileIcon} size={18} />
                    {t("cab.applicationRegister.exportPdf")}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={handleExportExcel}
                    className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                  >
                    <AppIcon icon={ExcelFileIcon} size={18} />
                    {t("cab.applicationRegister.exportExcel")}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>

        <CabTourStep steps={tourSteps} stepId="application-register-filters">
        <section className="rounded-lg border border-neutral-100 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
            <div className="flex flex-col gap-2">
              <span className="text-body-sm font-semibold text-neutral-800">
                {t("cab.applicationRegister.filters.search")}
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-500">
                  <AppIcon icon={SearchIcon} size={18} />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => {
                    setPage(1);
                    setQuery(event.target.value);
                  }}
                  placeholder={t(
                    "cab.applicationRegister.filters.searchPlaceholder",
                  )}
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white ps-10 pe-3 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-body-sm font-semibold text-neutral-800">
                {t("cab.applicationRegister.filters.createdFrom")}
              </span>
              <DatePicker
                value={createdFrom}
                onChange={(next) => {
                  setPage(1);
                  setCreatedFrom(next);
                }}
                placeholder={t(
                  "cab.applicationRegister.filters.createdPeriodPlaceholder",
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-body-sm font-semibold text-neutral-800">
                {t("cab.applicationRegister.filters.createdTo")}
              </span>
              <DatePicker
                value={createdTo}
                onChange={(next) => {
                  setPage(1);
                  setCreatedTo(next);
                }}
                placeholder={t(
                  "cab.applicationRegister.filters.createdPeriodPlaceholder",
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-body-sm font-semibold text-neutral-800">
                {t("cab.applicationRegister.filters.country")}
              </span>
              <SearchableSelect
                value={countryFilter}
                onChange={(value) => {
                  setPage(1);
                  setCountryFilter(value);
                }}
                options={[
                  {
                    value: "all",
                    label: t("cab.applicationRegister.filters.allCountries"),
                  },
                  ...countryOptions.map((option) => ({
                    value: option.code,
                    label: `${option.flag} ${option.name}`,
                  })),
                ]}
                searchPlaceholder={t("common.search")}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-body-sm font-semibold text-neutral-800">
                {t("cab.applicationRegister.filters.status")}
              </span>
              <SelectField
                value={statusFilter}
                onChange={(value) => {
                  setPage(1);
                  setStatusFilter(value);
                }}
                options={[
                  {
                    value: "all",
                    label: t("cab.applicationRegister.filters.allStatuses"),
                  },
                  ...(
                    Object.keys(
                      STATUS_LABEL_KEYS,
                    ) as ApplicationRegisterStatus[]
                  ).map((status) => ({
                    value: status,
                    label: t(
                      `cab.applicationRegister.status.${STATUS_LABEL_KEYS[status]}`,
                    ),
                  })),
                ]}
              />
            </div>

            <div className="flex items-end justify-start lg:justify-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="h-11 whitespace-nowrap text-body-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline"
              >
                {t("cab.applicationRegister.clearFilters")}
              </button>
            </div>
          </div>
        </section>
        </CabTourStep>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-sm font-semibold text-neutral-900">
            {filtered.length}{" "}
            {filtered.length === 1
              ? t("cab.applicationRegister.singleResult")
              : t("cab.applicationRegister.multipleResults")}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-caption text-neutral-600">{t("cab.applicationRegister.sortBy")}</span>
            <select
              value={sortBy}
              onChange={(event) => {
                setPage(1);
                setSortBy(event.target.value);
              }}
              className="h-10 rounded-md border border-neutral-100 bg-white px-3 text-body-sm font-medium text-neutral-800 focus:border-primary focus:outline-none"
            >
              <option value="newest">{t("cab.applicationRegister.sort.newest")}</option>
              <option value="oldest">{t("cab.applicationRegister.sort.oldest")}</option>
              <option value="dueSoonest">{t("cab.applicationRegister.sort.dueSoonest")}</option>
            </select>
          </div>
        </div>

        <CabTourStep steps={tourSteps} stepId="application-register-table">
        <section className="flex flex-col rounded-lg border border-neutral-100 bg-white py-5">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1100px] border-collapse text-center">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-4 py-4 text-body-sm font-medium">
                    {t("cab.applicationRegister.table.applicationCode")}
                  </th>
                  <th className="px-4 py-4 text-body-sm font-medium">
                    {t("cab.applicationRegister.table.clientName")}
                  </th>
                  <th className="px-4 py-4 text-body-sm font-medium">
                    {t("cab.applicationRegister.table.standards")}
                  </th>
                  <th className="px-4 py-4 text-body-sm font-medium">
                    {t("cab.applicationRegister.table.reviewer")}
                  </th>
                  <th className="px-4 py-4 text-body-sm font-medium">
                    {t("cab.applicationRegister.table.due")}
                  </th>
                  <th className="px-4 py-4 text-body-sm font-medium">
                    {t("cab.applicationRegister.table.stage")}
                  </th>
                  <th className="px-4 py-4 text-body-sm font-medium">
                    {t("cab.applicationRegister.table.updated")}
                  </th>
                  <th className="px-4 py-4 text-body-sm font-medium">
                    {paginated.length === 0 ? (
                      <CabTourStep steps={tourSteps} stepId="application-register-actions">
                        <span>{t("cab.applicationRegister.table.actions")}</span>
                      </CabTourStep>
                    ) : (
                      t("cab.applicationRegister.table.actions")
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-body text-neutral-600"
                    >
                      {t("common.loading")}
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-body text-neutral-600"
                    >
                      {t(
                        loadError
                          ? "cab.applicationRegister.loadError"
                          : "cab.applicationRegister.empty",
                      )}
                    </td>
                  </tr>
                ) : (
                  paginated.map((app, index) => (
                    <tr
                      key={app.id}
                      onClick={() => navigate(applicationPrimaryPath(app))}
                      className={cn(
                        "cursor-pointer",
                        index % 2 ? "bg-neutral-25" : "",
                      )}
                    >
                      <td
                        className="px-4 py-4 font-medium text-body text-primary"
                        dir="ltr"
                      >
                        {app.applicationCode}
                      </td>
                      <td className="px-4 py-4 text-start">
                        <p className="font-medium text-body text-neutral-900">
                          {app.clientName}
                        </p>
                        <p className="text-caption text-neutral-600" dir="ltr">
                          {app.clientCode}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-body text-neutral-800">
                        {app.standards.join(", ") || notSet()}
                      </td>
                      <td className="px-4 py-4 text-body text-neutral-800">
                        {app.status === "DRAFT"
                          ? notSet()
                          : t("cab.applicationRegister.defaultReviewer")}
                      </td>
                      <td className="px-4 py-4 text-body text-neutral-800">
                        {app.status === "DRAFT" ? (
                          notSet()
                        ) : (
                          <div>
                            <p>
                              {formatDate(dueFromUpdatedAt(app.updatedAt).due.toISOString())}
                            </p>
                            <p className="text-caption text-neutral-500">
                              {t("cab.applicationRegister.daysLeft", {
                                count: dueFromUpdatedAt(app.updatedAt).daysLeft,
                              })}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-caption font-medium",
                            statusStyles[app.status],
                          )}
                        >
                          {t(
                            `cab.applicationRegister.status.${STATUS_LABEL_KEYS[app.status]}`,
                          )}
                        </span>
                      </td>
                      <td
                        className="px-4 py-4 text-body text-neutral-800"
                        dir="ltr"
                      >
                        {formatDate(app.updatedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <CabTourStep
                          steps={tourSteps}
                          stepId={index === 0 ? "application-register-actions" : undefined}
                        >
                        <div
                          className="flex items-center justify-center gap-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {app.status !== "DRAFT" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    cabApplicationReviewPath(
                                      app.id,
                                      app.clientId || undefined,
                                    ),
                                  )
                                }
                                className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
                              >
                                {t("cab.applicationRegister.rowActions.openReview")}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    cabApplicationInformationRequiredPath(
                                      app.id,
                                      app.clientId || undefined,
                                    ),
                                  )
                                }
                                className="rounded-md border border-primary-100 bg-white px-3 py-1.5 text-caption font-semibold text-primary hover:bg-primary-25"
                              >
                                {t("cab.applicationRegister.rowActions.requestClarification")}
                              </button>
                            </>
                          )}
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button
                                type="button"
                                aria-label={t(
                                  "cab.applicationRegister.table.actions",
                                )}
                                className="flex size-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-50 hover:text-primary"
                              >
                                <AppIcon
                                  icon={MoreIcon}
                                  size={20}
                                  className="rotate-90"
                                />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content
                                align="end"
                                sideOffset={4}
                                className="z-50 min-w-[170px] rounded-md border border-neutral-100 bg-white p-1 shadow-lg"
                              >
                                <DropdownMenu.Item
                                  onSelect={() =>
                                    navigate(applicationViewPath(app))
                                  }
                                  className="cursor-pointer select-none rounded-sm px-3 py-2.5 text-start text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                                >
                                  {app.status === "DRAFT"
                                    ? t(
                                        "cab.applicationRegister.rowActions.continueDraft",
                                      )
                                    : t(
                                        "cab.applicationRegister.rowActions.view",
                                      )}
                                </DropdownMenu.Item>
                                {app.status !== "DRAFT" && (
                                  <>
                                    <DropdownMenu.Item
                                      onSelect={() =>
                                        navigate(
                                          cabApplicationReviewPath(
                                            app.id,
                                            app.clientId || undefined,
                                          ),
                                        )
                                      }
                                      className="cursor-pointer select-none rounded-sm px-3 py-2.5 text-start text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                                    >
                                      {t(
                                        "cab.applicationRegister.rowActions.review",
                                      )}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                      onSelect={() =>
                                        navigate(
                                          cabApplicationInformationRequiredPath(
                                            app.id,
                                            app.clientId || undefined,
                                          ),
                                        )
                                      }
                                      className="cursor-pointer select-none rounded-sm px-3 py-2.5 text-start text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                                    >
                                      {t(
                                        "cab.applicationRegister.rowActions.requestClarification",
                                      )}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                      onSelect={() =>
                                        navigate(
                                          cabApplicationReceiptPath(
                                            app.id,
                                            app.clientId || undefined,
                                          ),
                                        )
                                      }
                                      className="cursor-pointer select-none rounded-sm px-3 py-2.5 text-start text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                                    >
                                      {t(
                                        "cab.applicationRegister.rowActions.receipt",
                                      )}
                                    </DropdownMenu.Item>
                                  </>
                                )}
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
                        </div>
                        </CabTourStep>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 px-5 md:hidden">
            {loading ? (
              <p className="py-6 text-center text-body-sm text-neutral-600">
                {t("common.loading")}
              </p>
            ) : paginated.length === 0 ? (
              <p className="py-6 text-center text-body-sm text-neutral-600">
                  {t(
                    loadError
                      ? "cab.applicationRegister.loadError"
                      : "cab.applicationRegister.empty",
                  )}
              </p>
            ) : (
              paginated.map((app) => (
                <div
                  key={app.id}
                  className="w-full rounded-lg border border-neutral-100 p-4"
                >
                  <button
                    type="button"
                    onClick={() => navigate(applicationPrimaryPath(app))}
                    className="w-full text-start"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="font-semibold text-body-sm text-primary"
                        dir="ltr"
                      >
                        {app.applicationCode}
                      </p>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center justify-center rounded-md px-3 py-1 text-caption font-medium",
                          statusStyles[app.status],
                        )}
                      >
                        {t(
                          `cab.applicationRegister.status.${STATUS_LABEL_KEYS[app.status]}`,
                        )}
                      </span>
                    </div>
                    <p className="text-body-sm text-neutral-600" dir="ltr">
                      {app.clientCode}
                    </p>
                    <p className="mt-2 text-body-sm font-medium text-neutral-900">
                      {app.clientName}
                    </p>
                    <p className="text-body-sm text-neutral-600">
                      {app.standards.join(", ")}
                    </p>
                    <p className="mt-2 text-body-sm text-neutral-600" dir="ltr">
                      {formatDate(app.updatedAt)}
                    </p>
                  </button>
                </div>
              ))
            )}
          </div>

          {!loading && filtered.length > 0 && (
            <div className="mt-5 flex flex-col gap-3 border-t border-neutral-100 px-5 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-body-sm text-neutral-600">
                {t("cab.applicationRegister.showingRange", {
                  from: rangeFrom,
                  to: rangeTo,
                  total: filtered.length,
                })}
              </p>
              <TablePagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </section>
        </CabTourStep>
      </main>
    </CabLayout>
  );
}

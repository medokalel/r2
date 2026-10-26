import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { enumLabel } from '@/lib/enumLabel'
import { useNavigate } from "react-router-dom";
import { AirplaneIcon, TrainIcon, RoadIcon } from "@/components/icons";
import { CabLayout } from "@/components/layout/CabLayout";
import { CabHeader } from "@/components/dashboard/cab/CabHeader";
import { ApplicationStepper } from "@/components/dashboard/cab/ApplicationStepper";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { FormField, SelectField, Checkbox } from "@/components/ui";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  emptyMultiSiteRuleForm,
  isMultiSiteRuleFormComplete,
  calculateMandays,
  MULTI_SITE_STRUCTURE_OPTIONS,
  CENTRAL_FUNCTION_OPTIONS,
  APPLICABLE_RULE_OPTIONS,
  MANDAYS_MODEL_OPTIONS,
  type MultiSiteRuleForm,
  type MultiSiteConsiderations,
} from "@/lib/multiSiteRuleForm";
import {
  loadApplicationDraftSnapshot,
  savePendingMultiSiteRule,
} from "@/lib/applicationDraftSession";

const PAGE_SIZE = 3;

const TRAVEL_ICON_BY_OPTION: Record<string, typeof AirplaneIcon> = {
  "Airplane Required": AirplaneIcon,
  "Train Required": TrainIcon,
  "Airplane & Train Required": RoadIcon,
};

function InfoDot() {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-neutral-400 text-[11px] font-bold text-neutral-500">
      i
    </span>
  );
}

function SectionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-alabaster-150 bg-white p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-body-1-medium text-neutral-900">{title}</h3>
        <InfoDot />
      </div>
      {children}
    </div>
  );
}

function Column({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "py-5 first:pt-0 sm:px-5 sm:py-0 sm:first:ps-0 sm:first:pt-0",
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-[16px] font-bold text-primary">{title}</h3>
        <InfoDot />
      </div>
      {children}
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "green" | "red" | "neutral";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[6px] px-2.5 py-1 text-[12px] font-medium",
        tone === "green" && "bg-success-100 text-success-600",
        tone === "red" && "bg-error-50 text-error-600",
        tone === "neutral" && "bg-neutral-50 text-neutral-600",
      )}
    >
      {children}
    </span>
  );
}

export function ApplyMultiSiteRulePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sites] = useState(
    () => loadApplicationDraftSnapshot()?.sitesFacilitiesForm.sites ?? [],
  );

  const [form, setForm] = useState<MultiSiteRuleForm>(() =>
    emptyMultiSiteRuleForm(sites),
  );
  const [editingHeadOffice, setEditingHeadOffice] = useState(false);
  const [page, setPage] = useState(1);

  const patch = (f: Partial<MultiSiteRuleForm>) =>
    setForm((prev) => ({ ...prev, ...f }));
  const patchConsiderations = (f: Partial<MultiSiteConsiderations>) =>
    setForm((prev) => ({
      ...prev,
      considerations: { ...prev.considerations, ...f },
    }));

  const toggleIncluded = (siteId: string, included: boolean) =>
    setForm((prev) => ({
      ...prev,
      excludedSiteIds: included
        ? prev.excludedSiteIds.filter((id) => id !== siteId)
        : [...prev.excludedSiteIds, siteId],
    }));

  const result = useMemo(() => calculateMandays(sites, form), [sites, form]);
  const canApply = isMultiSiteRuleFormComplete(form);
  const headOfficeSite = sites.find((s) => s.id === form.headOfficeSiteId);
  const headOfficeOptions = sites.map((s) => ({ value: s.id, label: s.name }));

  const totalPages = Math.max(1, Math.ceil(result.rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = result.rows.slice(pageStart, pageStart + PAGE_SIZE);

  const handleBack = () => navigate("/cab/applications/draft");

  const handleApply = () => {
    if (!canApply) return;
    savePendingMultiSiteRule(result);
    navigate("/cab/applications/draft/sites/multi-site-rule/preview");
  };

  return (
    <CabLayout>
      <CabHeader
        title={t("cab.applicationDraft.title")}
        notificationCount={3}
      />
      <ApplicationStepper current={3} />

      <div className="flex flex-1 flex-col overflow-auto page-main">
        <div className="space-y-5 rounded-[var(--radius-lg)] border border-alabaster-150 bg-white p-5">
          <SectionTitle
            title={t(
              "cab.applicationDraft.sitesFacilities.multiSiteRule.title",
            )}
            subtitle={t(
              "cab.applicationDraft.sitesFacilities.multiSiteRule.subtitle",
            )}
          />

          <div className="grid grid-cols-1 divide-y divide-alabaster-150 rounded-[var(--radius-md)] border border-alabaster-150 bg-white p-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            <Column
              title={t(
                "cab.applicationDraft.sitesFacilities.multiSiteRule.sections.structure",
              )}
            >
              <div className="space-y-4">
                {MULTI_SITE_STRUCTURE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-start gap-2"
                  >
                    <input
                      type="radio"
                      name="structureType"
                      checked={form.structureType === option.value}
                      onChange={() => patch({ structureType: option.value })}
                      className="mt-1 size-4 shrink-0 accent-primary"
                    />
                    <span>
                      <span
                        className={cn(
                          "block text-[14px] font-medium",
                          form.structureType === option.value
                            ? "text-primary"
                            : "text-neutral-900",
                        )}
                      >
                        {t(option.labelKey)}
                      </span>
                      <span className="block text-[13px] text-neutral-500">
                        {t(option.descriptionKey)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </Column>

            <Column
              title={t(
                "cab.applicationDraft.sitesFacilities.multiSiteRule.sections.headOffice",
              )}
            >
              {editingHeadOffice || !headOfficeSite ? (
                <div className="space-y-4">
                  <FormField
                    label={t(
                      "cab.applicationDraft.sitesFacilities.multiSiteRule.headOfficeSite",
                    )}
                    required
                  >
                    <SelectField
                      value={form.headOfficeSiteId}
                      options={headOfficeOptions}
                      onChange={(value) => {
                        patch({ headOfficeSiteId: value });
                        setEditingHeadOffice(false);
                      }}
                      placeholder={
                        sites.length === 0
                          ? t(
                              "cab.applicationDraft.sitesFacilities.multiSiteRule.noSitesYet",
                            )
                          : t(
                              "cab.applicationDraft.sitesFacilities.multiSiteRule.headOfficeSitePlaceholder",
                            )
                      }
                      disabled={sites.length === 0}
                    />
                  </FormField>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-0.5 w-[3px] shrink-0 self-stretch rounded-full bg-primary"
                      aria-hidden
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-neutral-900">
                          {headOfficeSite.name}
                        </span>
                        <Badge tone="neutral">
                          {t("cab.applicationDraft.sitesFacilities.multiSiteRule.role.centralFunction")}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[13px] text-neutral-500">
                        {[headOfficeSite.country, headOfficeSite.address].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[13px] font-medium text-neutral-700">
                      {t(
                        "cab.applicationDraft.sitesFacilities.multiSiteRule.centralFunctionsApplicable",
                      )}
                    </p>
                    <ul className="space-y-1">
                      {CENTRAL_FUNCTION_OPTIONS.map((fn) => (
                        <li key={fn} className="text-[13px] text-neutral-600">
                          · {enumLabel(t, fn)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    className="h-[38px] w-full rounded-[var(--radius-sm)]"
                    onClick={() => setEditingHeadOffice(true)}
                  >
                    {t(
                      "cab.applicationDraft.sitesFacilities.multiSiteRule.editHeadOffice",
                    )}
                  </Button>
                </div>
              )}
            </Column>

            <Column
              title={t(
                "cab.applicationDraft.sitesFacilities.multiSiteRule.sections.ruleModel",
              )}
            >
              <div className="space-y-4">
                <FormField
                  label={t(
                    "cab.applicationDraft.sitesFacilities.multiSiteRule.applicableRule",
                  )}
                  required
                >
                  <SelectField
                    value={form.applicableRule}
                    options={APPLICABLE_RULE_OPTIONS}
                    onChange={(value) => patch({ applicableRule: value })}
                  />
                </FormField>
                <FormField
                  label={t(
                    "cab.applicationDraft.sitesFacilities.multiSiteRule.mandaysModel",
                  )}
                  required
                >
                  <SelectField
                    value={form.mandaysModel}
                    options={MANDAYS_MODEL_OPTIONS}
                    onChange={(value) => patch({ mandaysModel: value })}
                  />
                </FormField>
                <p className="rounded-[var(--radius-sm)] bg-neutral-25 p-3 text-[12px] text-neutral-500">
                  {t(
                    "cab.applicationDraft.sitesFacilities.multiSiteRule.ruleModelHint",
                  )}
                </p>
              </div>
            </Column>

            <Column
              title={t(
                "cab.applicationDraft.sitesFacilities.multiSiteRule.sections.considerations",
              )}
            >
              <div className="space-y-3">
                {(
                  [
                    "sameScopeDevelopment",
                    "includeHeadOfficeFunctions",
                    "allowSamplingBetweenSites",
                    "considerTravelAccess",
                    "includePermitAccess",
                  ] as const
                ).map((key) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Checkbox
                      checked={form.considerations[key]}
                      onChange={() =>
                        patchConsiderations({
                          [key]: !form.considerations[key],
                        })
                      }
                    />
                    <span className="text-[14px] text-neutral-700">
                      {t(
                        `cab.applicationDraft.sitesFacilities.multiSiteRule.considerationOptions.${key}`,
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </Column>
          </div>

          {/* 5–6: sites table + mandays summary */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <SectionCard
              title={t(
                "cab.applicationDraft.sitesFacilities.multiSiteRule.sections.sitesCovered",
              )}
              className="min-w-0 flex-1"
            >
              {result.rows.length === 0 ? (
                <p className="py-8 text-center text-[14px] text-neutral-500">
                  {t("cab.applicationDraft.sitesFacilities.empty")}
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] border-collapse text-center">
                      <thead className="bg-primary text-white">
                        <tr className="bg-primary text-white">
                          <th className="w-10 p-3 text-center text-[13px] font-medium">
                            #
                          </th>
                          <th className="p-3 text-start text-[13px] font-medium">
                            {t(
                              "cab.applicationDraft.sitesFacilities.multiSiteRule.columns.siteNameLocation",
                            )}
                          </th>
                          <th className="p-3 text-center text-[13px] font-medium">
                            {t(
                              "cab.applicationDraft.sitesFacilities.multiSiteRule.columns.roleMultiSite",
                            )}
                          </th>
                          <th className="p-3 text-center text-[13px] font-medium">
                            {t(
                              "cab.applicationDraft.sitesFacilities.multiSiteRule.columns.travelAccess",
                            )}
                          </th>
                          <th className="p-3 text-center text-[13px] font-medium">
                            {t(
                              "cab.applicationDraft.sitesFacilities.multiSiteRule.columns.permitRequired",
                            )}
                          </th>
                          <th className="p-3 text-center text-[13px] font-medium">
                            {t(
                              "cab.applicationDraft.sitesFacilities.multiSiteRule.columns.sampledThisCycle",
                            )}
                          </th>
                          <th className="p-3 text-center text-[13px] font-medium">
                            {t(
                              "cab.applicationDraft.sitesFacilities.multiSiteRule.columns.samplingFactor",
                            )}
                          </th>
                          <th className="p-3 text-center text-[13px] font-medium">
                            {t(
                              "cab.applicationDraft.sitesFacilities.multiSiteRule.columns.includedInCalculation",
                            )}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((row, index) => (
                          <tr
                            key={row.site.id}
                            className={
                              index % 2 === 1 ? "bg-neutral-25" : "bg-white"
                            }
                          >
                            <td className="px-3 py-3 text-[13px] text-neutral-500">
                              {pageStart + index + 1}
                            </td>
                            <td className="px-3 py-3 text-start">
                              <p className="text-[14px] font-medium text-neutral-900">
                                {row.site.name}
                              </p>
                              <span className="mt-0.5 inline-block rounded-[6px] bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary">
                                {row.isHeadOffice
                                  ? t(
                                      "cab.applicationDraft.sitesFacilities.multiSiteRule.role.centralFunction",
                                    )
                                  : enumLabel(t, row.site.siteType)}
                              </span>
                              <p className="mt-0.5 text-[12px] text-neutral-500">
                                {[row.site.country, row.site.address]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-[13px] text-neutral-700">
                              {t(row.role)}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-center gap-1.5 text-neutral-500">
                                {row.travelRequirements.length === 0 ? (
                                  <RoadIcon size={18} />
                                ) : (
                                  row.travelRequirements.map((req) => {
                                    const Icon =
                                      TRAVEL_ICON_BY_OPTION[req] ?? RoadIcon;
                                    return (
                                      <Icon
                                        key={req}
                                        size={18}
                                      />
                                    );
                                  })
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <Badge
                                tone={row.permitRequired ? "red" : "green"}
                              >
                                {row.permitRequired
                                  ? t(
                                      "cab.applicationDraft.sitesFacilities.multiSiteRule.yes",
                                    )
                                  : t(
                                      "cab.applicationDraft.sitesFacilities.multiSiteRule.no",
                                    )}
                              </Badge>
                            </td>
                            <td className="px-3 py-3">
                              <Badge
                                tone={row.sampledThisCycle ? "green" : "red"}
                              >
                                {row.sampledThisCycle
                                  ? t(
                                      "cab.applicationDraft.sitesFacilities.multiSiteRule.yes",
                                    )
                                  : t(
                                      "cab.applicationDraft.sitesFacilities.multiSiteRule.no",
                                    )}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 text-[13px] font-medium text-neutral-900">
                              {row.included
                                ? row.samplingFactor.toFixed(1)
                                : "--"}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex justify-center">
                                <Toggle
                                  size="sm"
                                  checked={row.included}
                                  onChange={(checked) =>
                                    toggleIncluded(row.site.id, checked)
                                  }
                                  aria-label={t(
                                    "cab.applicationDraft.sitesFacilities.multiSiteRule.columns.includedInCalculation",
                                  )}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[13px] text-neutral-500">
                      {t(
                        "cab.applicationDraft.sitesFacilities.multiSiteRule.showing",
                        {
                          from: pageStart + 1,
                          to: pageStart + pageRows.length,
                          total: result.rows.length,
                        },
                      )}
                    </p>
                    <TablePagination
                      page={currentPage}
                      totalPages={totalPages}
                      onPageChange={setPage}
                    />
                  </div>
                </>
              )}
            </SectionCard>

            <SectionCard
              title={t(
                "cab.applicationDraft.sitesFacilities.multiSiteRule.sections.calculationSummary",
              )}
              className="w-full shrink-0 lg:w-[320px]"
            >
              <div className="space-y-3 text-[14px]">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">
                    {t(
                      "cab.applicationDraft.sitesFacilities.multiSiteRule.calculationSummary.totalBase",
                    )}
                  </span>
                  <span className="font-medium text-neutral-900">
                    {result.totalBaseMandays.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">
                    {t(
                      "cab.applicationDraft.sitesFacilities.multiSiteRule.calculationSummary.samplingAdjustment",
                    )}
                  </span>
                  <span className="font-medium text-success-600">
                    {result.samplingAdjustment.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">
                    {t(
                      "cab.applicationDraft.sitesFacilities.multiSiteRule.calculationSummary.travelAdjustment",
                    )}
                  </span>
                  <span className="font-medium text-neutral-900">
                    {result.travelAdjustment > 0 ? "+" : ""}
                    {result.travelAdjustment.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">
                    {t(
                      "cab.applicationDraft.sitesFacilities.multiSiteRule.calculationSummary.permitAdjustment",
                    )}
                  </span>
                  <span className="font-medium text-neutral-900">
                    {result.permitAdjustment > 0 ? "+" : ""}
                    {result.permitAdjustment.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-[var(--radius-sm)] border border-dashed border-primary/40 bg-primary-25 p-4 text-center">
                <p className="text-[13px] text-neutral-600">
                  {t(
                    "cab.applicationDraft.sitesFacilities.multiSiteRule.calculationSummary.total",
                  )}{" "}
                  <span className="text-[20px] font-bold text-primary">
                    {result.totalEstimatedMandays.toFixed(1)}
                  </span>{" "}
                  <span className="text-[13px] text-neutral-500">
                    {t(
                      "cab.applicationDraft.sitesFacilities.multiSiteRule.calculationSummary.mandaysUnit",
                    )}
                  </span>
                </p>
                <p className="mt-2 text-[11px] text-neutral-400">
                  {t(
                    "cab.applicationDraft.sitesFacilities.multiSiteRule.calculationSummary.totalHint",
                  )}
                </p>
              </div>
            </SectionCard>
          </div>

          {/* Legends */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <SectionCard
              title={t(
                "cab.applicationDraft.sitesFacilities.multiSiteRule.ruleSummary.title",
              )}
            >
              <ul className="space-y-2.5">
                {(
                  ["point1", "point2", "point3", "point4", "point5"] as const
                ).map((key) => (
                  <li
                    key={key}
                    className="flex items-start gap-2 text-[13px] text-neutral-700"
                  >
                    <svg
                      className="mt-0.5 shrink-0 text-success-600"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8.5 12.5l2.5 2.5 5-5" />
                    </svg>
                    {t(
                      `cab.applicationDraft.sitesFacilities.multiSiteRule.ruleSummary.${key}`,
                    )}
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              title={t(
                "cab.applicationDraft.sitesFacilities.multiSiteRule.travelAccessLegend.title",
              )}
            >
              <div className="space-y-3 text-[13px] text-neutral-700">
                <div className="flex items-center gap-2">
                  <AirplaneIcon size={18} className="text-neutral-500" />
                  {t(
                    "cab.applicationDraft.sitesFacilities.multiSiteRule.travelAccessLegend.airplane",
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <TrainIcon size={18} className="text-neutral-500" />
                  {t(
                    "cab.applicationDraft.sitesFacilities.multiSiteRule.travelAccessLegend.train",
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <AirplaneIcon size={18} className="text-neutral-500" />
                  <TrainIcon size={18} className="-ms-1 text-neutral-500" />
                  {t(
                    "cab.applicationDraft.sitesFacilities.multiSiteRule.travelAccessLegend.both",
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <RoadIcon size={18} className="text-neutral-500" />
                  {t(
                    "cab.applicationDraft.sitesFacilities.multiSiteRule.travelAccessLegend.road",
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title={t(
                "cab.applicationDraft.sitesFacilities.multiSiteRule.permitLegend.title",
              )}
            >
              <div className="space-y-3 text-[13px] text-neutral-700">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full bg-success-600" />
                  {t(
                    "cab.applicationDraft.sitesFacilities.multiSiteRule.permitLegend.yes",
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full bg-neutral-300" />
                  {t(
                    "cab.applicationDraft.sitesFacilities.multiSiteRule.permitLegend.no",
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full bg-warning-500" />
                  {t(
                    "cab.applicationDraft.sitesFacilities.multiSiteRule.permitLegend.partial",
                  )}
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      <DashboardFooter
        onBack={handleBack}
        backDisabled={false}
        onSaveDraft={() => {}}
        onNext={handleApply}
        nextDisabled={!canApply}
      />
    </CabLayout>
  );
}
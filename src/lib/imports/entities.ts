/**
 * The import catalogue: one template per entity a CAB can migrate in bulk. Each definition lists
 * its columns (technical key, EN/AR label, type, identity or "needed later"), the natural key
 * used to find duplicates, and where an imported record is completed by hand (edit route plus
 * the DOM id of the field or section to focus).
 *
 * The backend (`GET /cab/imports/entities`, `/cab/imports/:entity/template`) uses the same
 * technical keys, so a file downloaded in one place is read the same way everywhere.
 */
import type {
  ImportAllowedValue,
  ImportColumn,
  ImportDefinitionKey,
  ImportEntityKey,
} from '@/lib/imports/types'

export const IMPORT_TEMPLATE_VERSION = 'v1'

/** URL params that reopen the import wizard on a batch's result (the way back from "Complete"). */
export const IMPORT_BATCH_PARAM = 'importBatch'
export const IMPORT_DEF_PARAM = 'importDef'

export interface ImportDefinition {
  key: ImportDefinitionKey
  /** Entity sent to the API. */
  apiEntity: ImportEntityKey
  labelEn: string
  labelAr: string
  /** What the template is for (one sentence each). */
  descriptionEn: string
  descriptionAr: string
  columns: ImportColumn[]
  /** Columns whose values form the natural key (duplicates are matched on it, case-insensitive). */
  naturalKey: string[]
  /** Rows sharing the natural key are lines of one record (invoices), not duplicates. */
  repeatedKeyIsLine?: boolean
  /** Column used as the record label in lists. */
  labelColumns: string[]
  /** Page where the Import button lives. */
  route: string
  /** DOM ids of the edit form fields follow `<fieldPrefix>-<kebab-key>` (same rule as the API). */
  fieldPrefix: string
  /** Field ids that do not follow the rule (e.g. critical codes → the competence matrix). */
  fieldIds?: Record<string, string>
  /** Edit page of an imported record (`:id` = record id, `:parentId` = owner id). */
  editRoute: string
}

const v = (value: string, labelEn: string, labelAr: string): ImportAllowedValue => ({ value, labelEn, labelAr })

export const IMPORT_DEFINITIONS: Record<ImportDefinitionKey, ImportDefinition> = {
  accreditation_scope: {
    key: 'accreditation_scope',
    apiEntity: 'accreditation_scope',
    labelEn: "Accredited scope",
    labelAr: "نطاق الاعتماد",
    descriptionEn: "Scope codes you are accredited for, per scheme (e.g. ISO 9001:2015 → IAF 03, IAF 29).",
    descriptionAr: "رموز النطاق المعتمدة لكل مخطط (مثل ISO 9001:2015 ← IAF 03، IAF 29).",
    route: "/cab/company-profile?page=schemes",
    naturalKey: ["scheme", "scopeCode"],
    labelColumns: ["scheme", "scopeCode"],
    fieldPrefix: 'scope',
    editRoute: "/cab/company-profile?page=schemes",
    columns: [
      { key: "scheme", labelEn: "Scheme", labelAr: "المخطط", type: 'text', required: true, listSource: 'standards', max: 200, example: "ISO 9001:2015" },
      { key: "scopeCode", labelEn: "Scope code", labelAr: "رمز النطاق", type: 'text', required: true, max: 50, example: "IAF 03" },
      { key: "location", labelEn: "Accredited location", labelAr: "الموقع المعتمد", type: 'text', max: 200, example: "", hintEn: "Used only when the scheme is created", hintAr: "يُستخدم فقط عند إنشاء المخطط" },
    ],
  },

  personnel: {
    key: 'personnel',
    apiEntity: 'personnel',
    labelEn: "Personnel",
    labelAr: "الموظفون والمدققون",
    descriptionEn: "Auditors and staff of the CAB with their job title, schemes, IAF codes and authorisation details.",
    descriptionAr: "مدققو وموظفو جهة المطابقة مع المسمى الوظيفي والمخططات ورموز IAF وبيانات التفويض.",
    route: "/cab/competence",
    naturalKey: ["email"],
    labelColumns: ["fullName"],
    fieldPrefix: 'personnel',
    fieldIds: {"criticalIafCodes": "personnel-competence-matrix"},
    editRoute: "/cab/competence/persons/:id/edit",
    columns: [
      { key: "fullName", labelEn: "Full name", labelAr: "الاسم الكامل", type: 'text', required: true, max: 200, example: "Ahmed Saleh" },
      { key: "email", labelEn: "E-mail", labelAr: "البريد الإلكتروني", type: 'email', required: true, example: "ahmed.saleh@cab-example.com" },
      { key: "phone", labelEn: "Phone (with country code)", labelAr: "الهاتف (مع رمز الدولة)", type: 'phone', later: true, example: "+966 55 000 1111" },
      { key: "jobTitle", labelEn: "Job title", labelAr: "المسمى الوظيفي", type: 'enum', later: true, listSource: 'roles', example: "Lead Auditor" },
      { key: "competenceRole", labelEn: "Competence role", labelAr: "دور الكفاءة", type: 'enum', allowed: [v("Auditor", "Auditor", "مدقق"), v("Lead Auditor", "Lead Auditor", "قائد فريق التدقيق"), v("Technical Expert", "Technical Expert", "خبير فني"), v("Decision Maker", "Decision Maker", "صانع القرار"), v("Reviewer", "Reviewer", "مراجع")], example: "" },
      { key: "schemes", labelEn: "Schemes", labelAr: "المخططات", type: 'list', later: true, listSource: 'standards', example: "ISO 9001:2015", hintEn: "Scheme names configured in your CAB profile, separated by commas", hintAr: "أسماء المخططات المعرفة في ملف الجهة مفصولة بفواصل" },
      { key: "iafCodes", labelEn: "IAF codes", labelAr: "رموز IAF", type: 'list', later: true, listSource: 'iafCodes', example: "IAF 03, IAF 29" },
      { key: "employmentStartDate", labelEn: "Employment start date", labelAr: "تاريخ بدء العمل", type: 'date', later: true, example: "2021-03-01" },
      { key: "employmentEndDate", labelEn: "Employment end date", labelAr: "تاريخ انتهاء العمل", type: 'date', example: "" },
      { key: "country", labelEn: "Country", labelAr: "الدولة", type: 'country', example: "" },
      { key: "authorizedScope", labelEn: "Authorised scope", labelAr: "النطاق المعتمد", type: 'longtext', max: 500, example: "" },
      { key: "authorizationExpiry", labelEn: "Authorisation expiry", labelAr: "انتهاء التفويض", type: 'date', example: "" },
      { key: "highestQualification", labelEn: "Highest qualification", labelAr: "أعلى مؤهل", type: 'text', max: 200, example: "" },
      { key: "status", labelEn: "Status", labelAr: "الحالة", type: 'enum', allowed: [v("ACTIVE", "Active", "نشط"), v("INACTIVE", "Inactive", "غير نشط")], example: "" },
    ],
  },

  trainings: {
    key: 'trainings',
    apiEntity: 'trainings',
    labelEn: "Trainings",
    labelAr: "التدريبات",
    descriptionEn: "Training records of your auditors and staff (date, course, provider, result).",
    descriptionAr: "سجلات تدريب المدققين والموظفين (التاريخ والدورة والجهة المدربة والنتيجة).",
    route: "/cab/competence",
    naturalKey: ["person", "date", "course"],
    labelColumns: ["course", "person"],
    fieldPrefix: 'training',
    editRoute: "/cab/competence/persons/:parentId/evaluation?tab=trainings",
    columns: [
      { key: "person", labelEn: "Person (e-mail or full name)", labelAr: "الشخص (البريد أو الاسم الكامل)", type: 'text', required: true, listSource: 'personnel', example: "ahmed.saleh@cab-example.com" },
      { key: "date", labelEn: "Training date", labelAr: "تاريخ التدريب", type: 'date', required: true, example: "2024-05-12" },
      { key: "course", labelEn: "Course", labelAr: "الدورة", type: 'text', required: true, max: 300, example: "ISO 9001:2015 Lead Auditor (CQI/IRCA)" },
      { key: "provider", labelEn: "Provider", labelAr: "الجهة المدربة", type: 'text', later: true, max: 300, example: "TÜV SÜD Academy" },
      { key: "result", labelEn: "Result", labelAr: "النتيجة", type: 'enum', required: true, allowed: [v("Completed", "Completed", "مكتمل"), v("Pending", "Pending", "قيد الانتظار"), v("Failed", "Failed", "لم يجتز")], example: "Completed" },
    ],
  },

  clients: {
    key: 'clients',
    apiEntity: 'clients',
    labelEn: "Audit clients",
    labelAr: "عملاء التدقيق",
    descriptionEn: "Your audit clients: legal identity, address and primary contact. Each client gets a portal account on the contact e-mail.",
    descriptionAr: "عملاء التدقيق لديك: الهوية القانونية والعنوان وجهة الاتصال الرئيسية. يحصل كل عميل على حساب في البوابة على بريد جهة الاتصال.",
    route: "/cab/audit-clients",
    naturalKey: ["legalName"],
    labelColumns: ["legalName"],
    fieldPrefix: 'client',
    editRoute: "/cab/clients/:id/edit",
    columns: [
      { key: "legalName", labelEn: "Legal name", labelAr: "الاسم القانوني", type: 'text', required: true, max: 200, example: "Al Noor Food Industries Co." },
      { key: "tradeName", labelEn: "Trade name", labelAr: "الاسم التجاري", type: 'text', later: true, max: 200, example: "Al Noor Foods" },
      { key: "registrationNumber", labelEn: "Commercial registration no.", labelAr: "رقم السجل التجاري", type: 'text', later: true, max: 50, example: "4030123456" },
      { key: "unifiedNumber", labelEn: "Unified number (700)", labelAr: "الرقم الموحد (700)", type: 'text', max: 50, example: "" },
      { key: "vatNumber", labelEn: "VAT number", labelAr: "الرقم الضريبي", type: 'text', max: 15, example: "", hintEn: "15 digits starting and ending with 3", hintAr: "15 رقماً تبدأ وتنتهي بالرقم 3" },
      { key: "activity", labelEn: "Main activity", labelAr: "النشاط الرئيسي", type: 'text', later: true, max: 300, example: "Manufacturing of dairy products" },
      { key: "legalCapacity", labelEn: "Legal form", labelAr: "الشكل القانوني", type: 'text', max: 200, example: "" },
      { key: "industries", labelEn: "Industries", labelAr: "القطاعات", type: 'list', freeList: true, example: "" },
      { key: "employeeCount", labelEn: "Number of employees", labelAr: "عدد الموظفين", type: 'integer', later: true, example: "120" },
      { key: "country", labelEn: "Country", labelAr: "الدولة", type: 'country', later: true, example: "SA" },
      { key: "city", labelEn: "City", labelAr: "المدينة", type: 'text', later: true, max: 100, example: "Jeddah" },
      { key: "district", labelEn: "District", labelAr: "الحي", type: 'text', max: 100, example: "" },
      { key: "street", labelEn: "Street", labelAr: "الشارع", type: 'text', max: 200, example: "" },
      { key: "buildingNumber", labelEn: "Building no.", labelAr: "رقم المبنى", type: 'text', max: 20, example: "" },
      { key: "postalCode", labelEn: "Postal code", labelAr: "الرمز البريدي", type: 'text', max: 20, example: "" },
      { key: "contactName", labelEn: "Primary contact name", labelAr: "اسم جهة الاتصال الرئيسية", type: 'text', later: true, max: 200, example: "Sara Al Harbi" },
      { key: "contactEmail", labelEn: "Primary contact e-mail", labelAr: "البريد الإلكتروني لجهة الاتصال", type: 'email', required: true, example: "sara@alnoor-example.com", hintEn: "Becomes the client's portal login", hintAr: "يصبح اسم الدخول لبوابة العميل" },
      { key: "contactPhone", labelEn: "Primary contact phone", labelAr: "هاتف جهة الاتصال", type: 'phone', later: true, example: "+966 55 123 4567" },
      { key: "contactJobTitle", labelEn: "Primary contact job title", labelAr: "المسمى الوظيفي لجهة الاتصال", type: 'text', max: 200, example: "" },
      { key: "website", labelEn: "Website", labelAr: "الموقع الإلكتروني", type: 'text', example: "" },
    ],
  },

  client_sites: {
    key: 'client_sites',
    apiEntity: 'client_sites',
    labelEn: "Client sites",
    labelAr: "مواقع العملاء",
    descriptionEn: "Sites and branches of your audit clients (address, type, manager, headcount).",
    descriptionAr: "مواقع وفروع عملاء التدقيق (العنوان والنوع والمسؤول وعدد الموظفين).",
    route: "/cab/clients",
    naturalKey: ["client", "siteName"],
    labelColumns: ["siteName", "client"],
    fieldPrefix: 'site',
    editRoute: "/cab/clients/:parentId/profile?tab=sites&site=:id",
    columns: [
      { key: "client", labelEn: "Client (legal name or CR no.)", labelAr: "العميل (الاسم القانوني أو رقم السجل)", type: 'text', required: true, listSource: 'clients', example: "Al Noor Food Industries Co." },
      { key: "siteName", labelEn: "Site name", labelAr: "اسم الموقع", type: 'text', required: true, max: 200, example: "Jeddah plant" },
      { key: "address", labelEn: "Site address", labelAr: "عنوان الموقع", type: 'longtext', later: true, max: 1000, example: "Industrial City 2, Jeddah" },
      { key: "siteType", labelEn: "Site type", labelAr: "نوع الموقع", type: 'enum', later: true, allowed: [v("PERMANENT", "Permanent", "دائم"), v("TEMPORARY", "Temporary", "مؤقت")], example: "Permanent" },
      { key: "managerName", labelEn: "Site manager", labelAr: "مدير الموقع", type: 'text', later: true, max: 200, example: "Khalid Omar" },
      { key: "phone", labelEn: "Site phone", labelAr: "هاتف الموقع", type: 'phone', later: true, example: "+966 12 600 0000" },
      { key: "employeeCount", labelEn: "Employees at site", labelAr: "عدد الموظفين بالموقع", type: 'integer', later: true, example: "80" },
      { key: "activity", labelEn: "Site activity", labelAr: "نشاط الموقع", type: 'text', later: true, max: 300, example: "Production and packing" },
      { key: "registrationNumber", labelEn: "Site CR no.", labelAr: "رقم سجل الفرع", type: 'text', max: 50, example: "" },
      { key: "googleMapUrl", labelEn: "Google Maps link", labelAr: "رابط خرائط جوجل", type: 'text', example: "" },
      { key: "latitude", labelEn: "Latitude", labelAr: "خط العرض", type: 'number', example: "" },
      { key: "longitude", labelEn: "Longitude", labelAr: "خط الطول", type: 'number', example: "" },
    ],
  },

  contacts: {
    key: 'contacts',
    apiEntity: 'contacts',
    labelEn: "Client contacts",
    labelAr: "جهات اتصال العملاء",
    descriptionEn: "People at your clients you deal with: quality managers, signatories, site contacts.",
    descriptionAr: "الأشخاص الذين تتعامل معهم لدى العملاء: مديرو الجودة والمفوضون بالتوقيع وجهات الاتصال بالمواقع.",
    route: "/cab/contacts",
    naturalKey: ["client", "email"],
    labelColumns: ["firstName", "lastName"],
    fieldPrefix: 'contact',
    editRoute: "/cab/contacts?contact=:id&edit=1",
    columns: [
      { key: "client", labelEn: "Client (legal name or CR no.)", labelAr: "العميل (الاسم القانوني أو رقم السجل)", type: 'text', required: true, listSource: 'clients', example: "Al Noor Food Industries Co." },
      { key: "firstName", labelEn: "First name", labelAr: "الاسم الأول", type: 'text', required: true, max: 100, example: "Omar" },
      { key: "lastName", labelEn: "Last name", labelAr: "اسم العائلة", type: 'text', required: true, max: 100, example: "Haddad" },
      { key: "fullName", labelEn: "Full name (instead of first + last)", labelAr: "الاسم الكامل (بدل الاسم الأول والعائلة)", type: 'text', max: 200, example: "" },
      { key: "email", labelEn: "E-mail", labelAr: "البريد الإلكتروني", type: 'email', required: true, example: "omar.haddad@alnoor-example.com" },
      { key: "jobTitle", labelEn: "Job title", labelAr: "المسمى الوظيفي", type: 'text', later: true, max: 200, example: "Quality Manager" },
      { key: "phone", labelEn: "Phone (with country code)", labelAr: "الهاتف (مع رمز الدولة)", type: 'phone', later: true, example: "+966 50 111 2222" },
      { key: "isPrimary", labelEn: "Primary contact", labelAr: "جهة الاتصال الرئيسية", type: 'boolean', example: "No" },
      { key: "isSignatory", labelEn: "Authorised signatory", labelAr: "مفوض بالتوقيع", type: 'boolean', example: "" },
      { key: "sites", labelEn: "Linked sites", labelAr: "المواقع المرتبطة", type: 'list', freeList: true, example: "", hintEn: "Site names of the client, separated by commas", hintAr: "أسماء مواقع العميل مفصولة بفواصل" },
      { key: "status", labelEn: "Status", labelAr: "الحالة", type: 'enum', allowed: [v("ACTIVE", "Active", "نشط"), v("PENDING", "Pending", "معلق"), v("INACTIVE", "Inactive", "غير نشط")], example: "" },
    ],
  },

  certificates: {
    key: 'certificates',
    apiEntity: 'certificates',
    labelEn: "Certificates (migrated)",
    labelAr: "الشهادات (المرحّلة)",
    descriptionEn: "Certificates you issued in your previous system, with their numbers, dates and status.",
    descriptionAr: "الشهادات التي أصدرتها في نظامك السابق بأرقامها وتواريخها وحالتها.",
    route: "/cab/certificates",
    naturalKey: ["certificateNumber"],
    labelColumns: ["certificateNumber", "client"],
    fieldPrefix: 'certificate',
    editRoute: "/cab/certificates?certificate=:id",
    columns: [
      { key: "certificateNumber", labelEn: "Certificate no.", labelAr: "رقم الشهادة", type: 'text', required: true, max: 100, example: "CAS-QMS-2023-0142" },
      { key: "client", labelEn: "Client (legal name or CR no.)", labelAr: "العميل (الاسم القانوني أو رقم السجل)", type: 'text', required: true, listSource: 'clients', example: "Al Noor Food Industries Co." },
      { key: "standard", labelEn: "Standard", labelAr: "المعيار", type: 'text', required: true, listSource: 'standards', max: 200, example: "ISO 9001:2015" },
      { key: "scope", labelEn: "Certified scope", labelAr: "نطاق الشهادة", type: 'longtext', required: true, max: 5000, example: "Manufacturing and distribution of dairy products" },
      { key: "status", labelEn: "Status", labelAr: "الحالة", type: 'enum', required: true, allowed: [v("ISSUED", "Issued", "صادرة"), v("SUSPENDED", "Suspended", "معلقة"), v("WITHDRAWN", "Withdrawn", "مسحوبة"), v("EXPIRED", "Expired", "منتهية")], example: "Issued" },
      { key: "issueDate", labelEn: "Issue date", labelAr: "تاريخ الإصدار", type: 'date', required: true, example: "2023-06-15" },
      { key: "expiryDate", labelEn: "Expiry date", labelAr: "تاريخ الانتهاء", type: 'date', required: true, example: "2026-06-14" },
      { key: "effectiveDate", labelEn: "Effective date", labelAr: "تاريخ السريان", type: 'date', example: "", hintEn: "Defaults to the issue date", hintAr: "يساوي تاريخ الإصدار إن تُرك فارغاً" },
      { key: "initialCertificationDate", labelEn: "Initial certification date", labelAr: "تاريخ المنح الأول", type: 'date', later: true, example: "2020-06-15", hintEn: "First certification of the client for this standard (cycle start)", hintAr: "أول منح للعميل لهذا المعيار (بداية الدورة)" },
      { key: "statusReason", labelEn: "Suspension / withdrawal reason", labelAr: "سبب التعليق / السحب", type: 'longtext', max: 1000, example: "" },
      { key: "createCycle", labelEn: "Create certification cycle", labelAr: "إنشاء دورة الشهادة", type: 'boolean', example: "Yes", hintEn: "Yes (default) opens a manual cycle for issued / suspended certificates", hintAr: "نعم (افتراضي) ينشئ دورة يدوية للشهادات الصادرة أو المعلقة" },
    ],
  },

  certification_cycles: {
    key: 'certification_cycles',
    apiEntity: 'certification_cycles',
    labelEn: "Certification cycles",
    labelAr: "دورات الشهادات",
    descriptionEn: "Three-year cycles of your migrated certificates: initial certification date and the next surveillance / recertification due dates.",
    descriptionAr: "الدورات الثلاثية للشهادات المرحّلة: تاريخ المنح الأول ومواعيد المراقبة وإعادة المنح القادمة.",
    route: "/cab/certification",
    naturalKey: ["certificateNumber"],
    labelColumns: ["certificateNumber"],
    fieldPrefix: 'cycle',
    editRoute: "/cab/certification/:id",
    columns: [
      { key: "certificateNumber", labelEn: "Certificate no.", labelAr: "رقم الشهادة", type: 'text', required: true, max: 100, example: "CAS-QMS-2023-0142" },
      { key: "initialCertificationDate", labelEn: "Initial certification date", labelAr: "تاريخ المنح الأول", type: 'date', required: true, example: "2020-06-15" },
      { key: "cycleType", labelEn: "Cycle type", labelAr: "نوع الدورة", type: 'enum', allowed: [v("initial", "Initial", "أولية"), v("recertification", "Recertification", "إعادة منح")], example: "Recertification" },
      { key: "surveillance1DueDate", labelEn: "Surveillance 1 due", labelAr: "موعد المراقبة الأولى", type: 'date', later: true, example: "2024-06-14" },
      { key: "surveillance2DueDate", labelEn: "Surveillance 2 due", labelAr: "موعد المراقبة الثانية", type: 'date', later: true, example: "2025-06-14" },
      { key: "recertificationDueDate", labelEn: "Recertification due", labelAr: "موعد إعادة المنح", type: 'date', later: true, example: "2026-04-14" },
      { key: "notes", labelEn: "Notes", labelAr: "ملاحظات", type: 'longtext', max: 2000, example: "" },
    ],
  },

  audit_plans: {
    key: 'audit_plans',
    apiEntity: 'audit_plans',
    labelEn: "Audit schedule",
    labelAr: "جدول التدقيقات",
    descriptionEn: "Planned audits: client, standard, stage, dates, lead auditor and team. Each row drafts an audit plan.",
    descriptionAr: "التدقيقات المخططة: العميل والمعيار والمرحلة والتواريخ وقائد الفريق والفريق. كل صف ينشئ مسودة خطة تدقيق.",
    route: "/cab/audit-planning/schedule",
    naturalKey: ["client", "standard", "stage", "startDate"],
    labelColumns: ["client", "stage"],
    fieldPrefix: 'plan',
    editRoute: "/cab/audit-planning/build/:id",
    columns: [
      { key: "client", labelEn: "Client (legal name or CR no.)", labelAr: "العميل (الاسم القانوني أو رقم السجل)", type: 'text', required: true, listSource: 'clients', example: "Al Noor Food Industries Co." },
      { key: "standard", labelEn: "Standard", labelAr: "المعيار", type: 'text', required: true, listSource: 'standards', max: 300, example: "ISO 9001:2015" },
      { key: "stage", labelEn: "Audit stage", labelAr: "مرحلة التدقيق", type: 'enum', required: true, allowed: [v("Planning", "Planning", "تخطيط"), v("Stage 1", "Stage 1", "المرحلة الأولى"), v("Stage 2", "Stage 2", "المرحلة الثانية"), v("Surveillance 1", "Surveillance 1", "المراقبة الأولى"), v("Surveillance 2", "Surveillance 2", "المراقبة الثانية"), v("Recertification", "Recertification", "إعادة المنح"), v("Special Audit", "Special Audit", "تدقيق خاص")], example: "Surveillance 1" },
      { key: "startDate", labelEn: "Start date", labelAr: "تاريخ البدء", type: 'date', required: true, example: "2026-11-10" },
      { key: "endDate", labelEn: "End date", labelAr: "تاريخ الانتهاء", type: 'date', required: true, example: "2026-11-11" },
      { key: "leadAuditor", labelEn: "Lead auditor", labelAr: "قائد فريق التدقيق", type: 'text', later: true, listSource: 'personnel', max: 200, example: "Ahmed Saleh" },
      { key: "auditTeam", labelEn: "Audit team", labelAr: "فريق التدقيق", type: 'list', listSource: 'personnel', freeList: true, example: "", hintEn: "Names or e-mails separated by commas", hintAr: "أسماء أو بريد مفصولة بفواصل" },
      { key: "scope", labelEn: "Audit scope", labelAr: "نطاق التدقيق", type: 'longtext', later: true, max: 5000, example: "Production of dairy products at the Jeddah plant" },
      { key: "siteName", labelEn: "Site name", labelAr: "اسم الموقع", type: 'text', max: 300, example: "" },
      { key: "siteAddress", labelEn: "Site address", labelAr: "عنوان الموقع", type: 'longtext', max: 1000, example: "" },
      { key: "objectives", labelEn: "Audit objectives", labelAr: "أهداف التدقيق", type: 'longtext', max: 5000, example: "" },
    ],
  },

  audit_plan_sections: {
    key: 'audit_plan_sections',
    apiEntity: 'audit_plans',
    labelEn: "Audit plan sections",
    labelAr: "أقسام خطة التدقيق",
    descriptionEn: "Agenda, site allocation, remote activities and travel notes of one audit plan.",
    descriptionAr: "جدول الأعمال وتوزيع المواقع والأنشطة عن بعد وملاحظات السفر لخطة تدقيق واحدة.",
    route: "/cab/audit-planning/schedule",
    naturalKey: [],
    labelColumns: ["section", "activity"],
    fieldPrefix: 'plan',
    editRoute: "/cab/audit-planning/build/:parentId",
    columns: [
      { key: "section", labelEn: "Section", labelAr: "القسم", type: 'enum', required: true, allowed: [v("agenda", "Agenda", "جدول الأعمال"), v("site", "Site", "الموقع"), v("remote", "Remote", "عن بعد"), v("travel", "Travel", "السفر")], example: "Agenda" },
      { key: "date", labelEn: "Date", labelAr: "التاريخ", type: 'date', requiredIf: { field: 'section', in: ["agenda"] }, example: "2026-11-10", hintEn: "Agenda: required", hintAr: "جدول الأعمال: إلزامي" },
      { key: "startTime", labelEn: "Start time", labelAr: "وقت البدء", type: 'time', requiredIf: { field: 'section', in: ["agenda"] }, example: "09:00", hintEn: "Agenda: required (HH:mm)", hintAr: "جدول الأعمال: إلزامي (HH:mm)" },
      { key: "endTime", labelEn: "End time", labelAr: "وقت الانتهاء", type: 'time', requiredIf: { field: 'section', in: ["agenda"] }, example: "09:30", hintEn: "Agenda: required (HH:mm)", hintAr: "جدول الأعمال: إلزامي (HH:mm)" },
      { key: "activity", labelEn: "Activity", labelAr: "النشاط", type: 'text', requiredIf: { field: 'section', in: ["agenda"] }, max: 500, example: "Opening meeting", hintEn: "Agenda: required", hintAr: "جدول الأعمال: إلزامي" },
      { key: "auditors", labelEn: "Auditors", labelAr: "المدققون", type: 'list', laterIf: { field: 'section', in: ["agenda"] }, listSource: 'personnel', freeList: true, example: "Ahmed Saleh" },
      { key: "durationHours", labelEn: "Duration (hours)", labelAr: "المدة (ساعات)", type: 'number', example: "" },
      { key: "siteCode", labelEn: "Site code", labelAr: "رمز الموقع", type: 'text', max: 100, example: "" },
      { key: "siteName", labelEn: "Site name", labelAr: "اسم الموقع", type: 'text', requiredIf: { field: 'section', in: ["site"] }, max: 300, example: "", hintEn: "Site: required", hintAr: "الموقع: إلزامي" },
      { key: "siteAddress", labelEn: "Site address", labelAr: "عنوان الموقع", type: 'longtext', laterIf: { field: 'section', in: ["site"] }, max: 1000, example: "" },
      { key: "onSitePersonnel", labelEn: "On-site personnel", labelAr: "الفريق بالموقع", type: 'list', laterIf: { field: 'section', in: ["site"] }, listSource: 'personnel', freeList: true, example: "" },
      { key: "remoteEnabled", labelEn: "Remote audit", labelAr: "تدقيق عن بعد", type: 'boolean', requiredIf: { field: 'section', in: ["remote"] }, example: "", hintEn: "Remote: required (Yes / No)", hintAr: "عن بعد: إلزامي (نعم / لا)" },
      { key: "remoteActivities", labelEn: "Remote activities", labelAr: "الأنشطة عن بعد", type: 'list', laterIf: { field: 'section', in: ["remote"] }, freeList: true, example: "" },
      { key: "remotePlatform", labelEn: "Remote platform", labelAr: "منصة الاتصال", type: 'text', laterIf: { field: 'section', in: ["remote"] }, max: 100, example: "" },
      { key: "remoteNotes", labelEn: "Remote notes", labelAr: "ملاحظات العمل عن بعد", type: 'longtext', max: 2000, example: "" },
      { key: "travelDetails", labelEn: "Travel details", labelAr: "تفاصيل السفر", type: 'longtext', requiredIf: { field: 'section', in: ["travel"] }, max: 5000, example: "", hintEn: "Travel: required", hintAr: "السفر: إلزامي" },
    ],
  },

  nonconformities: {
    key: 'nonconformities',
    apiEntity: 'nonconformities',
    labelEn: "Nonconformities",
    labelAr: "حالات عدم المطابقة",
    descriptionEn: "Open (or historic) findings from your previous system: client, audit reference, clause, grade, description, due date and status.",
    descriptionAr: "حالات عدم المطابقة المفتوحة (أو السابقة) من نظامك السابق: العميل ومرجع التدقيق والبند والدرجة والوصف وتاريخ الاستحقاق والحالة.",
    route: "/cab/nonconformities",
    naturalKey: ["reference"],
    labelColumns: ["reference", "client"],
    fieldPrefix: 'nc',
    editRoute: "/cab/nonconformities/:id",
    columns: [
      { key: "client", labelEn: "Client (legal name or CR no.)", labelAr: "العميل (الاسم القانوني أو رقم السجل)", type: 'text', required: true, listSource: 'clients', example: "Al Noor Food Industries Co." },
      { key: "reference", labelEn: "NC reference (previous system)", labelAr: "مرجع الحالة (النظام السابق)", type: 'text', later: true, max: 100, example: "NC-2025-031" },
      { key: "auditReference", labelEn: "Audit reference", labelAr: "مرجع التدقيق", type: 'text', max: 100, example: "SV1-2025-AL-NOOR" },
      { key: "certificateNumber", labelEn: "Certificate no.", labelAr: "رقم الشهادة", type: 'text', max: 100, example: "" },
      { key: "standard", labelEn: "Standard", labelAr: "المعيار", type: 'text', later: true, max: 200, example: "ISO 9001:2015" },
      { key: "clause", labelEn: "Clause", labelAr: "البند", type: 'text', required: true, max: 100, example: "8.5.1" },
      { key: "grade", labelEn: "Grade", labelAr: "الدرجة", type: 'enum', required: true, allowed: [v("CRITICAL", "Critical", "حرجة"), v("MAJOR", "Major", "رئيسية"), v("MINOR", "Minor", "ثانوية")], example: "Minor" },
      { key: "description", labelEn: "Description", labelAr: "الوصف", type: 'longtext', required: true, max: 5000, example: "Production records of line 2 were not completed for March." },
      { key: "raisedDate", labelEn: "Raised on", labelAr: "تاريخ الرصد", type: 'date', later: true, example: "2025-09-20" },
      { key: "dueDate", labelEn: "Due date", labelAr: "تاريخ الاستحقاق", type: 'date', required: true, example: "2025-12-20" },
      { key: "status", labelEn: "Status", labelAr: "الحالة", type: 'enum', allowed: [v("OPEN", "Open", "مفتوحة"), v("IN_PROGRESS", "In progress", "قيد المعالجة"), v("SUBMITTED", "Submitted", "مقدمة"), v("CLOSED", "Closed", "مغلقة")], example: "Open" },
      { key: "owner", labelEn: "CAB owner", labelAr: "المسؤول لدى الجهة", type: 'text', later: true, max: 200, example: "Ahmed Saleh" },
      { key: "responsiblePerson", labelEn: "Client responsible person", labelAr: "المسؤول لدى العميل", type: 'text', max: 200, example: "" },
      { key: "correction", labelEn: "Correction", labelAr: "التصحيح", type: 'longtext', max: 5000, example: "" },
      { key: "rootCause", labelEn: "Root cause", labelAr: "السبب الجذري", type: 'longtext', max: 5000, example: "" },
      { key: "correctiveAction", labelEn: "Corrective action", labelAr: "الإجراء التصحيحي", type: 'longtext', max: 5000, example: "" },
    ],
  },

  invoices: {
    key: 'invoices',
    apiEntity: 'invoices',
    labelEn: "Invoices",
    labelAr: "الفواتير",
    descriptionEn: "Open and historic invoices of your previous system, with their lines and the amount already paid.",
    descriptionAr: "الفواتير المفتوحة والسابقة من نظامك السابق مع بنودها والمبلغ المدفوع.",
    route: "/cab/invoices",
    naturalKey: ["invoiceNumber"],
    repeatedKeyIsLine: true,
    labelColumns: ["invoiceNumber", "client"],
    fieldPrefix: 'invoice',
    editRoute: "/cab/invoices/:id",
    columns: [
      { key: "invoiceNumber", labelEn: "Invoice no.", labelAr: "رقم الفاتورة", type: 'text', required: true, max: 60, example: "INV-2025-0412" },
      { key: "client", labelEn: "Client (legal name or CR no.)", labelAr: "العميل (الاسم القانوني أو رقم السجل)", type: 'text', required: true, listSource: 'clients', example: "Al Noor Food Industries Co." },
      { key: "issueDate", labelEn: "Issue date", labelAr: "تاريخ الإصدار", type: 'date', required: true, example: "2025-09-01" },
      { key: "dueDate", labelEn: "Due date", labelAr: "تاريخ الاستحقاق", type: 'date', later: true, example: "2025-10-01" },
      { key: "currency", labelEn: "Currency", labelAr: "العملة", type: 'enum', required: true, listSource: 'currencies', example: "SAR" },
      { key: "description", labelEn: "Line description", labelAr: "وصف البند", type: 'text', required: true, max: 300, example: "Surveillance 1 audit, ISO 9001" },
      { key: "lineDetails", labelEn: "Line details", labelAr: "تفاصيل البند", type: 'longtext', max: 1000, example: "" },
      { key: "quantity", labelEn: "Quantity", labelAr: "الكمية", type: 'integer', example: "1" },
      { key: "unitPrice", labelEn: "Unit price (net)", labelAr: "سعر الوحدة (صافي)", type: 'number', required: true, example: "8500" },
      { key: "taxPercent", labelEn: "Tax %", labelAr: "نسبة الضريبة %", type: 'number', later: true, example: "15" },
      { key: "paidAmount", labelEn: "Paid amount (gross)", labelAr: "المبلغ المدفوع (شامل)", type: 'number', example: "0" },
      { key: "paymentDate", labelEn: "Payment date", labelAr: "تاريخ الدفع", type: 'date', example: "" },
      { key: "paymentMethod", labelEn: "Payment method", labelAr: "طريقة الدفع", type: 'text', max: 50, example: "" },
      { key: "paymentReference", labelEn: "Payment reference", labelAr: "مرجع الدفع", type: 'text', max: 100, example: "" },
      { key: "status", labelEn: "Status", labelAr: "الحالة", type: 'enum', allowed: [v("ISSUED", "Issued", "صادرة"), v("DRAFT", "Draft", "مسودة")], example: "Issued" },
      { key: "poReference", labelEn: "PO reference", labelAr: "رقم أمر الشراء", type: 'text', max: 100, example: "" },
    ],
  },

  fee_items: {
    key: 'fee_items',
    apiEntity: 'fee_items',
    labelEn: "Fee catalog",
    labelAr: "كتالوج الرسوم",
    descriptionEn: "Your standard fees (audit days, certificates, travel …) offered when adding invoice lines.",
    descriptionAr: "رسومك المعتادة (أيام التدقيق والشهادات والسفر …) المقترحة عند إضافة بنود الفواتير.",
    route: "/cab/invoices",
    naturalKey: ["code"],
    labelColumns: ["name"],
    fieldPrefix: 'fee-item',
    editRoute: "/cab/invoices?feeCatalog=1&feeItem=:id",
    columns: [
      { key: "name", labelEn: "Name (English)", labelAr: "الاسم (بالإنجليزية)", type: 'text', required: true, max: 200, example: "Stage 2 audit day" },
      { key: "nameAr", labelEn: "Name (Arabic)", labelAr: "الاسم (بالعربية)", type: 'text', later: true, max: 200, example: "يوم تدقيق المرحلة الثانية" },
      { key: "code", labelEn: "Code", labelAr: "الرمز", type: 'text', later: true, max: 30, example: "S2-DAY" },
      { key: "defaultAmount", labelEn: "Default amount", labelAr: "المبلغ الافتراضي", type: 'number', required: true, example: "3500" },
      { key: "currency", labelEn: "Currency", labelAr: "العملة", type: 'enum', required: true, listSource: 'currencies', example: "SAR" },
      { key: "unit", labelEn: "Unit", labelAr: "الوحدة", type: 'text', later: true, max: 100, example: "per auditor day" },
      { key: "description", labelEn: "Description", labelAr: "الوصف", type: 'longtext', max: 1000, example: "" },
      { key: "isActive", labelEn: "Active", labelAr: "نشط", type: 'boolean', example: "Yes" },
      { key: "sortOrder", labelEn: "Order", labelAr: "الترتيب", type: 'integer', example: "" },
    ],
  },

  checklists: {
    key: 'checklists',
    apiEntity: 'checklists',
    labelEn: "Audit checklists",
    labelAr: "قوائم التحقق للتدقيق",
    descriptionEn: "Your own checklist items per standard (clause, requirement summary, guidance, evidence prompts, stages).",
    descriptionAr: "بنود قوائم التحقق الخاصة بكم لكل معيار (البند وملخص المتطلب والإرشادات وأمثلة الأدلة والمراحل).",
    route: "/cab/checklists",
    naturalKey: ["checklistCode", "clause", "title"],
    labelColumns: ["checklistCode", "clause"],
    fieldPrefix: 'checklist-item',
    editRoute: "/cab/checklists?item=:id",
    columns: [
      { key: "checklistCode", labelEn: "Checklist code", labelAr: "رمز قائمة التحقق", type: 'text', required: true, max: 40, example: "QMS-INTERNAL" },
      { key: "checklistName", labelEn: "Checklist name", labelAr: "اسم قائمة التحقق", type: 'text', later: true, max: 200, example: "ISO 9001 internal checklist" },
      { key: "standardCode", labelEn: "Standard code", labelAr: "رمز المعيار", type: 'text', later: true, max: 40, example: "ISO_9001" },
      { key: "itemCode", labelEn: "Item code", labelAr: "رمز البند", type: 'text', max: 40, example: "Q-01" },
      { key: "clause", labelEn: "Clause", labelAr: "رقم البند", type: 'text', required: true, max: 60, example: "8.4" },
      { key: "title", labelEn: "Title", labelAr: "العنوان", type: 'text', required: true, max: 300, example: "Control of external providers" },
      { key: "titleAr", labelEn: "Title (Arabic)", labelAr: "العنوان (بالعربية)", type: 'text', later: true, max: 300, example: "ضبط المزودين الخارجيين" },
      { key: "requirement", labelEn: "Requirement summary", labelAr: "ملخص المتطلب", type: 'longtext', required: true, max: 3000, example: "Suppliers are evaluated and monitored on criteria." },
      { key: "requirementAr", labelEn: "Requirement summary (Arabic)", labelAr: "ملخص المتطلب (بالعربية)", type: 'longtext', later: true, max: 3000, example: "" },
      { key: "guidance", labelEn: "Guidance", labelAr: "الإرشادات", type: 'longtext', max: 3000, example: "" },
      { key: "guidanceAr", labelEn: "Guidance (Arabic)", labelAr: "الإرشادات (بالعربية)", type: 'longtext', max: 3000, example: "" },
      { key: "evidencePrompts", labelEn: "Evidence prompts", labelAr: "أمثلة الأدلة", type: 'longtext', max: 3000, example: "", hintEn: "One per line or separated by |", hintAr: "مثال في كل سطر أو مفصولة بالرمز |" },
      { key: "evidencePromptsAr", labelEn: "Evidence prompts (Arabic)", labelAr: "أمثلة الأدلة (بالعربية)", type: 'longtext', max: 3000, example: "" },
      { key: "stages", labelEn: "Stages", labelAr: "المراحل", type: 'list', allowed: [v("stage1", "Stage 1", "المرحلة الأولى"), v("stage2", "Stage 2", "المرحلة الثانية"), v("surveillance", "Surveillance", "المراقبة"), v("recertification", "Recertification", "إعادة الشهادة"), v("special", "Special audit", "تدقيق خاص")], example: "Stage 2, Surveillance", hintEn: "Empty = every stage", hintAr: "فارغ يعني جميع المراحل" },
      { key: "samplingHint", labelEn: "Sampling hint", labelAr: "إرشاد أخذ العينات", type: 'longtext', max: 1000, example: "" },
      { key: "mandatory", labelEn: "Mandatory", labelAr: "إلزامي", type: 'boolean', example: "Yes" },
    ],
  },
}

/** Suggested order on the migration hub (each step relies on the previous ones). */
export const MIGRATION_ORDER: ImportEntityKey[] = [
  'accreditation_scope',
  'personnel',
  'trainings',
  'clients',
  'client_sites',
  'contacts',
  'certificates',
  'certification_cycles',
  'audit_plans',
  'nonconformities',
  'invoices',
  'fee_items',
  'checklists',
]

export function importDefinition(key: ImportDefinitionKey): ImportDefinition {
  return IMPORT_DEFINITIONS[key]
}

/** Definition of a record listed by the API (entity key), audit plan sections included. */
export function definitionForEntity(entity: ImportEntityKey, context?: { auditPlanId?: string }): ImportDefinition {
  return entity === 'audit_plans' && context?.auditPlanId ? IMPORT_DEFINITIONS.audit_plan_sections : IMPORT_DEFINITIONS[entity]
}

export function columnLabel(definition: ImportDefinition, key: string, lang: string): string {
  const column = definition.columns.find((c) => c.key === key)
  if (!column) return key
  return lang.startsWith('ar') ? column.labelAr : column.labelEn
}

export function definitionLabel(definition: ImportDefinition, lang: string): string {
  return lang.startsWith('ar') ? definition.labelAr : definition.labelEn
}

export function templateFileName(key: ImportDefinitionKey): string {
  return `iCASCO_${key}_template_${IMPORT_TEMPLATE_VERSION}.xlsx`
}

function fillRoute(route: string, ids: { id: string; parentId?: string | null }): string {
  return route.replace(':id', encodeURIComponent(ids.id)).replace(':parentId', encodeURIComponent(ids.parentId ?? ids.id))
}

/** Edit page of a record, without the field / returnTo params. */
export function recordEditRoute(definition: ImportDefinition, ids: { id: string; parentId?: string | null }): string {
  return fillRoute(definition.editRoute, ids)
}

const kebab = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase()

/** DOM id of the form field that edits a column (`client-legal-name`, `personnel-iaf-codes` …). */
export function fieldIdOf(definition: ImportDefinition, key: string): string {
  return definition.fieldIds?.[key] ?? `${definition.fieldPrefix}-${kebab(key)}`
}

/**
 * Edit link of an imported record: its edit page with the first missing field focused
 * (`?field=`) and a way back (`returnTo`). `serverRoute` (from the API) wins over the local route.
 */
export function editLinkFor(
  definition: ImportDefinition,
  record: { id: string; parentId?: string | null; missing: string[]; editRoute?: string | null },
  returnTo: string,
): { to: string; fieldIds: string[] } {
  const fieldIds = Array.from(new Set(record.missing.map((f) => fieldIdOf(definition, f))))
  const route = record.editRoute || fillRoute(definition.editRoute, record)
  const [path, query = ''] = route.split('?')
  const params = new URLSearchParams(query)
  if (fieldIds[0]) params.set('field', fieldIds[0])
  if (fieldIds.length > 1) params.set('fields', fieldIds.slice(1).join(','))
  params.set('returnTo', returnTo)
  return { to: `${path}?${params.toString()}`, fieldIds }
}

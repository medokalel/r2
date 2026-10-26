/**
 * Team selection rule engine (TypeScript port of the backend's team-selection.rules.js) used by the
 * preview (demo mode). The real API runs the same rules on the server; keep both in step.
 *
 *   personIssues(member, context)       issues of one member in its role
 *   evaluateTeam(context, members, …)   member + team issues, coverage matrix, canConfirm
 *   scoreCandidate / rankCandidates     0..100 suitability with explained components
 *
 * Texts avoid long dashes (product owner rule).
 */
import type {
  CriterionStatus,
  IssueSeverity,
  Localized,
  ScoreComponent,
  TeamAlternative,
  TeamCoverage,
  TeamCriterion,
  TeamIssue,
  TeamMemberResult,
  TeamRole,
  TeamSettings,
  TeamValidation,
} from '@/lib/api/teamSelectionApi'

export interface IssueDef {
  severity: IssueSeverity
  mandatory: boolean
  criterion: string
  en: string
  ar: string
}

export interface EngineContext {
  kind: 'plan' | 'application'
  auditPlanId: string | null
  applicationId: string | null
  reference: string
  organizationId: string | null
  clientName: string
  standards: Array<{ key: string; label: string }>
  iafCodes: string[]
  startDate: Date | null
  endDate: Date | null
  country: string | null
  city: string | null
  languages: string[]
  settings: TeamSettings
  today: Date
}

export interface EnginePerson {
  id: string
  name: string
  jobTitle: string | null
  competenceRole: string
  active: boolean
  employmentEndDate: Date | null
  authorizationExpiry: Date | null
  registerStatus: string
  restrictions: Array<{ type: string; details: string; expiry: Date | null }>
  schemes: Map<string, { standardKey: string; codes: string[] }>
  passedExams: Set<string>
  avatarUrl: string | null
  country: string | null
  languages: string[]
  baseCity: string | null
  baseCountry: string | null
  bookings: Array<{ planId: string; planNumber: string; start: Date; end: Date }>
  unavailability: Array<{ start: Date; end: Date; reason: string }>
  relationships: Array<{ id: string; type: string; startDate: Date | null; endDate: Date | null; reviewStatus: string }>
  annualDeclarationValidUntil: Date | null
  auditDeclarationSigned: boolean
  workloadDays: number
  sectorAudits: number
}

export interface EngineMember {
  personId: string | null
  name: string
  role: TeamRole
  person: EnginePerson | null
}

export interface EngineException {
  id: string
  issueCode: string
  personId: string | null
  status: string
}

export const CRITICAL_IAF_CODES = ['03', '11', '12', '13', '28', '38']
export const isCriticalIafCode = (code: string) => CRITICAL_IAF_CODES.includes(code)
export const COMPETENCE_ROLES: TeamRole[] = ['TEAM_LEADER', 'AUDITOR', 'TECHNICAL_EXPERT']
const LEAD_JOB_TITLES = ['LEAD_AUDITOR', 'TECHNICAL_MANAGER']
const AUDITOR_JOB_TITLES = ['LEAD_AUDITOR', 'TECHNICAL_MANAGER', 'AUDITOR']
const COOLING_OFF_TYPES = ['CONSULTANCY', 'INTERNAL_AUDIT', 'EMPLOYMENT']
const ONGOING_BLOCK_TYPES = ['CONSULTANCY', 'INTERNAL_AUDIT', 'EMPLOYMENT', 'FAMILY', 'FINANCIAL_INTEREST']
const CRITERIA = ['role', 'standards', 'codes', 'criticalCodes', 'authorisation', 'availability', 'impartiality', 'workload']
const EXPERIENCE_FULL_AT = 5

export const ROLE_LABEL: Record<TeamRole, { en: string; ar: string; log: string }> = {
  TEAM_LEADER: { en: "Team leader", ar: "قائد الفريق", log: "Lead Auditor" },
  AUDITOR: { en: "Auditor", ar: "مدقق", log: "Auditor" },
  TECHNICAL_EXPERT: { en: "Technical expert", ar: "خبير فني", log: "Technical Expert" },
  TRAINEE: { en: "Trainee auditor", ar: "مدقق متدرب", log: "Trainee Auditor" },
  OBSERVER: { en: "Observer", ar: "مراقب", log: "Observer" },
}

export const DEFAULT_SETTINGS: TeamSettings = {
  coolingOffMonths: 24,
  travelBufferDays: 1,
  workloadWindowDays: 90,
  maxAuditDaysInWindow: 30,
  declarationValidityMonths: 12,
  requireAnnualDeclaration: true,
  requireAuditDeclaration: false,
  exceptionSecondApprover: false,
  expiryWarningDays: 30,
}

export const SCORE_WEIGHTS = {
  competence: 40,
  availability: 20,
  workload: 15,
  experience: 15,
  location: 5,
  language: 5,
}

export const RELATIONSHIP_LABEL: Record<string, Localized> = {
  CONSULTANCY: { en: "consultancy", ar: "استشارات" },
  INTERNAL_AUDIT: { en: "internal audit service", ar: "خدمة تدقيق داخلي" },
  EMPLOYMENT: { en: "employment", ar: "توظيف" },
  FAMILY: { en: "family relationship", ar: "صلة قرابة" },
  FINANCIAL_INTEREST: { en: "financial interest", ar: "مصلحة مالية" },
  CERTIFICATION_DECISION: { en: "previous certification decision", ar: "قرار منح شهادة سابق" },
  OTHER: { en: "other relationship", ar: "علاقة أخرى" },
}

export const UNAVAILABILITY_LABEL: Record<string, Localized> = {
  LEAVE: { en: "leave", ar: "إجازة" },
  TRAINING: { en: "training", ar: "تدريب" },
  SICK: { en: "sick leave", ar: "إجازة مرضية" },
  OTHER_ASSIGNMENT: { en: "other assignment", ar: "مهمة أخرى" },
  OTHER: { en: "unavailable", ar: "غير متاح" },
}

export const ISSUES: Record<string, IssueDef> = {
  // ── Person ───────────────────────────────────────────────────────────────
  NOT_REGISTERED: {
    severity: "block", mandatory: true, criterion: "competence",
    en: "{{name}} is not registered in the personnel register.",
    ar: "{{name}} غير مسجل في سجل الموظفين.",
  },
  INACTIVE: {
    severity: "block", mandatory: true, criterion: "competence",
    en: "{{name}} is inactive in the personnel register.",
    ar: "{{name}} غير نشط في سجل الموظفين.",
  },
  EMPLOYMENT_ENDED: {
    severity: "block", mandatory: true, criterion: "competence",
    en: "{{name}}'s engagement ends on {{date}}, before the audit.",
    ar: "ينتهي ارتباط {{name}} بالجهة في {{date}} قبل موعد التدقيق.",
  },
  ROLE_NOT_QUALIFIED: {
    severity: "block", mandatory: true, criterion: "role",
    en: "{{name}} is not qualified for the {{role}} role (registered as {{registeredRole}}).",
    ar: "{{name}} غير مؤهل لدور {{role}} (مسجل بصفة {{registeredRole}}).",
  },
  NOT_APPROVED_FOR_STANDARD: {
    severity: "block", mandatory: true, criterion: "standards",
    en: "{{name}} is not approved for {{standards}}.",
    ar: "{{name}} غير معتمد للمواصفة {{standards}}.",
  },
  PARTIAL_STANDARDS: {
    severity: "info", mandatory: false, criterion: "standards",
    en: "{{name}} is approved for {{covered}} only, not for {{missing}}.",
    ar: "{{name}} معتمد للمواصفة {{covered}} فقط، وليس للمواصفة {{missing}}.",
  },
  NOT_APPROVED_FOR_CODES: {
    severity: "info", mandatory: false, criterion: "codes",
    en: "{{name}} is not approved for {{scope}}.",
    ar: "{{name}} غير معتمد لـ {{scope}}.",
  },
  CRITICAL_CODE_NO_EXAM: {
    severity: "warn", mandatory: false, criterion: "criticalCodes",
    en: "IAF {{codes}} of {{name}} is not counted: a critical code needs a passed exam (80% or more).",
    ar: "لا يُحتسب رمز IAF {{codes}} لـ {{name}}: الرمز الحرج يتطلب اجتياز اختبار (80% أو أكثر).",
  },
  AUTHORISATION_EXPIRED: {
    severity: "block", mandatory: true, criterion: "authorisation",
    en: "{{name}}'s competence approval expired on {{date}}.",
    ar: "انتهى اعتماد كفاءة {{name}} في {{date}}.",
  },
  AUTHORISATION_EXPIRES_DURING_AUDIT: {
    severity: "block", mandatory: true, criterion: "authorisation",
    en: "{{name}}'s competence approval expires on {{date}}, before the audit ends.",
    ar: "ينتهي اعتماد كفاءة {{name}} في {{date}} قبل انتهاء التدقيق.",
  },
  AUTHORISATION_EXPIRING: {
    severity: "warn", mandatory: false, criterion: "authorisation",
    en: "{{name}}'s competence approval expires soon ({{date}}).",
    ar: "يقترب انتهاء اعتماد كفاءة {{name}} ({{date}}).",
  },
  EVALUATION_NOT_AUTHORISED: {
    severity: "warn", mandatory: false, criterion: "authorisation",
    en: "{{name}}'s competence evaluation is {{status}}, not yet authorised.",
    ar: "تقييم كفاءة {{name}} بحالة {{status}} ولم يُعتمد بعد.",
  },
  RESTRICTION_ACTIVE: {
    severity: "warn", mandatory: false, criterion: "authorisation",
    en: "{{name}} has an active restriction: {{restriction}}.",
    ar: "لدى {{name}} قيد ساري: {{restriction}}.",
  },
  TECHNICAL_EXPERT_ONLY: {
    severity: "info", mandatory: false, criterion: "role",
    en: "{{name}} counts for sector knowledge only and does not audit independently.",
    ar: "يُحتسب {{name}} للمعرفة القطاعية فقط ولا يدقق بشكل مستقل.",
  },
  UNAVAILABLE: {
    severity: "block", mandatory: true, criterion: "availability",
    en: "{{name}} is unavailable from {{from}} to {{to}} ({{reason}}).",
    ar: "{{name}} غير متاح من {{from}} إلى {{to}} ({{reason}}).",
  },
  DOUBLE_BOOKED: {
    severity: "block", mandatory: true, criterion: "availability",
    en: "{{name}} is already assigned to Audit {{plan}} on the selected dates ({{from}} to {{to}}).",
    ar: "{{name}} مكلف بالفعل بالتدقيق {{plan}} في التواريخ المختارة ({{from}} إلى {{to}}).",
  },
  TRAVEL_BUFFER: {
    severity: "block", mandatory: false, criterion: "availability",
    en: "{{name}} has Audit {{plan}} ({{from}} to {{to}}) within the {{days}} day travel buffer.",
    ar: "لدى {{name}} التدقيق {{plan}} ({{from}} إلى {{to}}) ضمن مهلة السفر البالغة {{days}} يوم.",
  },
  WORKLOAD_HIGH: {
    severity: "warn", mandatory: false, criterion: "workload",
    en: "{{name}} audited {{days}} days in the last {{window}} days (limit {{max}}).",
    ar: "دقق {{name}} {{days}} يوماً خلال آخر {{window}} يوماً (الحد {{max}}).",
  },
  IMPARTIALITY_CONFLICT: {
    severity: "block", mandatory: true, criterion: "impartiality",
    en: "{{name}} has a recorded {{type}} relationship with this client{{until}}.",
    ar: "لدى {{name}} علاقة {{type}} مسجلة مع هذا العميل{{until}}.",
  },
  IMPARTIALITY_DECLARED: {
    severity: "warn", mandatory: false, criterion: "impartiality",
    en: "{{name}} declared a past {{type}} relationship with this client (ended {{date}}, outside the cooling-off period).",
    ar: "صرّح {{name}} بعلاقة {{type}} سابقة مع هذا العميل (انتهت في {{date}} خارج فترة التهدئة).",
  },
  IMPARTIALITY_NOTE: {
    severity: "warn", mandatory: false, criterion: "impartiality",
    en: "{{name}} has a recorded {{type}} with this client. Review it before confirming.",
    ar: "لدى {{name}} {{type}} مسجل مع هذا العميل. راجعه قبل التأكيد.",
  },
  DECLARATION_MISSING: {
    severity: "block", mandatory: false, criterion: "impartiality",
    en: "{{name}} has no valid annual impartiality declaration.",
    ar: "لا يوجد لدى {{name}} إقرار حياد سنوي ساري.",
  },
  AUDIT_DECLARATION_MISSING: {
    severity: "block", mandatory: false, criterion: "impartiality",
    en: "{{name}} has not signed the impartiality declaration for this audit.",
    ar: "لم يوقّع {{name}} إقرار الحياد الخاص بهذا التدقيق.",
  },
  // ── Team ─────────────────────────────────────────────────────────────────
  NO_TEAM_LEADER: {
    severity: "block", mandatory: true, criterion: "team",
    en: "The team has no team leader.",
    ar: "لا يوجد قائد للفريق.",
  },
  MULTIPLE_TEAM_LEADERS: {
    severity: "block", mandatory: true, criterion: "team",
    en: "The team can have only one team leader.",
    ar: "يجب أن يكون للفريق قائد واحد فقط.",
  },
  DUPLICATE_MEMBER: {
    severity: "block", mandatory: true, criterion: "team",
    en: "{{name}} appears more than once in the team.",
    ar: "{{name}} مكرر في الفريق.",
  },
  LEAD_STANDARD_NOT_COVERED: {
    severity: "block", mandatory: true, criterion: "team",
    en: "The team leader is not approved for {{standards}} and no co-lead in the team is.",
    ar: "قائد الفريق غير معتمد للمواصفة {{standards}} ولا يوجد قائد مشارك معتمد لها في الفريق.",
  },
  CO_LEAD: {
    severity: "warn", mandatory: false, criterion: "team",
    en: "{{name}} co-leads {{standards}}, which the team leader is not approved for.",
    ar: "يتولى {{name}} القيادة المشاركة للمواصفة {{standards}} التي لا يعتمد لها قائد الفريق.",
  },
  IAF_CODE_NOT_COVERED: {
    severity: "block", mandatory: true, criterion: "team",
    en: "IAF {{code}} in scope is not covered by any competent team member.",
    ar: "رمز IAF {{code}} ضمن النطاق غير مغطى من أي عضو كفء في الفريق.",
  },
  CRITICAL_CODE_NOT_COVERED: {
    severity: "block", mandatory: true, criterion: "team",
    en: "Critical IAF {{code}} needs a team member with a passed exam for it.",
    ar: "رمز IAF الحرج {{code}} يتطلب عضواً في الفريق اجتاز الاختبار الخاص به.",
  },
  CODE_BY_TECHNICAL_EXPERT: {
    severity: "info", mandatory: false, criterion: "team",
    en: "IAF {{code}} is covered by a technical expert only; the auditors lead the audit of it.",
    ar: "رمز IAF {{code}} مغطى من خبير فني فقط، ويتولى المدققون تدقيقه.",
  },
  TRAINEE_WITHOUT_AUDITOR: {
    severity: "block", mandatory: true, criterion: "team",
    en: "Trainee auditors need a qualified auditor or team leader in the team.",
    ar: "يحتاج المدققون المتدربون إلى مدقق مؤهل أو قائد فريق ضمن الفريق.",
  },
  NO_DATES: {
    severity: "info", mandatory: false, criterion: "availability",
    en: "No audit dates yet: availability is checked when the audit plan is built.",
    ar: "لا توجد تواريخ للتدقيق بعد: يُتحقق من التوافر عند إعداد خطة التدقيق.",
  },
}

export const CRITERION_LABEL: Record<string, Localized> = {
  role: { en: "Role qualification", ar: "التأهل للدور" },
  standards: { en: "Approved standards", ar: "المواصفات المعتمدة" },
  codes: { en: "IAF codes / technical sectors", ar: "رموز IAF والقطاعات الفنية" },
  criticalCodes: { en: "Critical codes (exam)", ar: "الرموز الحرجة (الاختبار)" },
  authorisation: { en: "Competence approval validity", ar: "سريان اعتماد الكفاءة" },
  availability: { en: "Availability", ar: "التوافر" },
  impartiality: { en: "Impartiality", ar: "الحياد" },
  workload: { en: "Workload balance", ar: "توازن عبء العمل" },
}

const DAY_MS = 86_400_000
const iso = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : '')
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS)
export const addMonths = (date: Date, months: number) => {
  const next = new Date(date.getTime())
  next.setUTCMonth(next.getUTCMonth() + months)
  return next
}
const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart <= bEnd && bStart <= aEnd
const norm = (text: unknown) => String(text ?? '').trim().toLowerCase()

// ── Messages ──────────────────────────────────────────────────────────────────

type ParamValue = string | number | Localized | Array<string | Localized>
const SEPARATOR = { en: ', ', ar: '، ' }

const valueIn = (value: ParamValue | undefined, lang: 'en' | 'ar'): string => {
  if (Array.isArray(value)) return value.map((v) => valueIn(v, lang)).join(SEPARATOR[lang])
  if (value && typeof value === 'object') return value[lang] ?? value.en ?? ''
  return value == null ? '' : String(value)
}
const fill = (template: string, params: Record<string, ParamValue>, lang: 'en' | 'ar') =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => valueIn(params[key], lang))

export const issue = (
  code: string,
  params: Record<string, ParamValue> = {},
  extra: { personId?: string | null; severity?: IssueSeverity; alternatives?: TeamAlternative[] } = {},
): TeamIssue => {
  const def = ISSUES[code]
  const severity = extra.severity ?? def.severity
  return {
    code,
    severity,
    mandatory: def.mandatory,
    overridable: severity === 'block' && !def.mandatory,
    criterion: def.criterion,
    personId: extra.personId ?? null,
    params: Object.fromEntries(Object.entries(params).map(([k, v]) => [k, valueIn(v, 'en')])),
    message: { en: fill(def.en, params, 'en'), ar: fill(def.ar, params, 'ar') },
    alternatives: extra.alternatives ?? [],
    excepted: false,
    exceptionId: null,
  }
}

const roleText = (role: TeamRole): Localized => ({ en: ROLE_LABEL[role].en.toLowerCase(), ar: ROLE_LABEL[role].ar })

// ── Competence ────────────────────────────────────────────────────────────────

export function roleQualified(person: EnginePerson, role: TeamRole): boolean {
  if (role === 'OBSERVER' || role === 'TRAINEE') return true
  const lead = LEAD_JOB_TITLES.includes(person.jobTitle ?? '') || person.competenceRole === 'Lead Auditor'
  const auditor = lead || AUDITOR_JOB_TITLES.includes(person.jobTitle ?? '') || person.competenceRole === 'Auditor'
  if (role === 'TEAM_LEADER') return lead
  if (role === 'AUDITOR') return auditor
  return auditor || person.competenceRole === 'Technical Expert'
}

export const suggestedRole = (person: EnginePerson): TeamRole =>
  (['TEAM_LEADER', 'AUDITOR', 'TECHNICAL_EXPERT'] as TeamRole[]).find((role) => roleQualified(person, role)) ?? 'OBSERVER'

export interface Competence {
  standardsCovered: string[]
  standardsMissing: string[]
  auditorCodes: string[]
  anyCodes: string[]
  unexaminedCritical: string[]
}

export function competenceOf(person: EnginePerson, context: EngineContext): Competence {
  const keys = context.standards.map((s) => s.key)
  const covered = new Set<string>()
  const auditorCodes = new Set<string>()
  const anyCodes = new Set<string>()
  const unexamined = new Set<string>()
  for (const { standardKey, codes } of person.schemes.values()) {
    const audited = keys.includes(standardKey)
    if (audited) covered.add(standardKey)
    for (const code of codes) {
      if (!context.iafCodes.includes(code)) continue
      const critical = isCriticalIafCode(code)
      if (!critical || person.passedExams.has(`${standardKey}|${code}`)) {
        anyCodes.add(code)
        if (audited) auditorCodes.add(code)
      } else if (person.passedExams.has(`*|${code}`)) {
        anyCodes.add(code)
      } else {
        unexamined.add(code)
      }
    }
  }
  return {
    standardsCovered: keys.filter((k) => covered.has(k)),
    standardsMissing: keys.filter((k) => !covered.has(k)),
    auditorCodes: context.iafCodes.filter((c) => auditorCodes.has(c)),
    anyCodes: context.iafCodes.filter((c) => anyCodes.has(c)),
    unexaminedCritical: context.iafCodes.filter((c) => unexamined.has(c) && !anyCodes.has(c)),
  }
}

const labelsOf = (context: EngineContext, keys: string[]) => keys.map((k) => context.standards.find((s) => s.key === k)?.label ?? k)

// ── Impartiality ──────────────────────────────────────────────────────────────

function relationshipIssue(person: EnginePerson, rel: EnginePerson['relationships'][number], context: EngineContext): TeamIssue | null {
  if (rel.reviewStatus === 'DISMISSED') return null
  const reference = context.startDate ?? context.today
  const type = RELATIONSHIP_LABEL[rel.type] ?? RELATIONSHIP_LABEL.OTHER
  const ongoing = !rel.endDate || rel.endDate >= reference
  if (ONGOING_BLOCK_TYPES.includes(rel.type) && ongoing) {
    return issue('IMPARTIALITY_CONFLICT', { name: person.name, type, until: { en: ' (ongoing)', ar: ' (قائمة)' } }, { personId: person.id })
  }
  if (COOLING_OFF_TYPES.includes(rel.type) && rel.endDate) {
    const coolingEnds = addMonths(rel.endDate, context.settings.coolingOffMonths)
    if (coolingEnds >= reference) {
      return issue(
        'IMPARTIALITY_CONFLICT',
        {
          name: person.name,
          type,
          until: { en: ` (ended ${iso(rel.endDate)}; cooling-off until ${iso(coolingEnds)})`, ar: ` (انتهت في ${iso(rel.endDate)}، وفترة التهدئة حتى ${iso(coolingEnds)})` },
        },
        { personId: person.id },
      )
    }
    return issue('IMPARTIALITY_DECLARED', { name: person.name, type, date: iso(rel.endDate) }, { personId: person.id })
  }
  if (rel.endDate) return issue('IMPARTIALITY_DECLARED', { name: person.name, type, date: iso(rel.endDate) }, { personId: person.id })
  return issue('IMPARTIALITY_NOTE', { name: person.name, type }, { personId: person.id })
}

// ── One member ────────────────────────────────────────────────────────────────

export function personIssues(member: EngineMember, context: EngineContext): TeamIssue[] {
  const { person, role } = member
  const issues: TeamIssue[] = []
  if (!person) {
    if (role !== 'OBSERVER') issues.push(issue('NOT_REGISTERED', { name: member.name }, { personId: member.personId }))
    return issues
  }
  const add = (code: string, params: Record<string, ParamValue> = {}, extra: { severity?: IssueSeverity } = {}) =>
    issues.push(issue(code, { name: person.name, ...params }, { personId: person.id, ...extra }))
  const { startDate: start, endDate: end } = context
  const reference = start ?? context.today

  if (!person.active) add('INACTIVE')
  if (person.employmentEndDate && person.employmentEndDate < (end ?? reference)) add('EMPLOYMENT_ENDED', { date: iso(person.employmentEndDate) })

  if (COMPETENCE_ROLES.includes(role)) {
    if (!roleQualified(person, role)) add('ROLE_NOT_QUALIFIED', { role: roleText(role), registeredRole: person.competenceRole || person.jobTitle || '' })
    const c = competenceOf(person, context)
    if (role === 'TEAM_LEADER' || role === 'AUDITOR') {
      if (context.standards.length && !c.standardsCovered.length) add('NOT_APPROVED_FOR_STANDARD', { standards: labelsOf(context, c.standardsMissing) })
      else if (c.standardsMissing.length) add('PARTIAL_STANDARDS', { covered: labelsOf(context, c.standardsCovered), missing: labelsOf(context, c.standardsMissing) })
      const missing = context.iafCodes.filter((code) => !c.auditorCodes.includes(code) && !c.unexaminedCritical.includes(code))
      if (missing.length && c.standardsCovered.length) add('NOT_APPROVED_FOR_CODES', { scope: [...labelsOf(context, c.standardsCovered), ...missing.map((code) => `IAF ${code}`)] })
    } else {
      add('TECHNICAL_EXPERT_ONLY')
      const missing = context.iafCodes.filter((code) => !c.anyCodes.includes(code) && !c.unexaminedCritical.includes(code))
      if (missing.length) add('NOT_APPROVED_FOR_CODES', { scope: missing.map((code) => `IAF ${code}`) })
    }
    if (c.unexaminedCritical.length) add('CRITICAL_CODE_NO_EXAM', { codes: c.unexaminedCritical })

    const expiry = person.authorizationExpiry
    if (expiry) {
      if (expiry < context.today || expiry < reference) add('AUTHORISATION_EXPIRED', { date: iso(expiry) })
      else if (end && expiry < end) add('AUTHORISATION_EXPIRES_DURING_AUDIT', { date: iso(expiry) })
      else if (expiry <= addDays(end ?? reference, context.settings.expiryWarningDays)) add('AUTHORISATION_EXPIRING', { date: iso(expiry) })
    }
    if (person.active && ['Under review', 'Pending'].includes(person.registerStatus)) {
      add('EVALUATION_NOT_AUTHORISED', { status: { en: person.registerStatus.toLowerCase(), ar: person.registerStatus === 'Pending' ? 'معلّق' : 'قيد المراجعة' } })
    }
    for (const r of person.restrictions) if (!r.expiry || r.expiry >= reference) add('RESTRICTION_ACTIVE', { restriction: `${r.type}: ${r.details}` })
  }

  if (start && end) {
    for (const u of person.unavailability) {
      if (overlaps(u.start, u.end, start, end)) add('UNAVAILABLE', { from: iso(u.start), to: iso(u.end), reason: UNAVAILABILITY_LABEL[u.reason] ?? UNAVAILABILITY_LABEL.OTHER })
    }
    const buffer = context.settings.travelBufferDays
    for (const b of person.bookings) {
      if (overlaps(b.start, b.end, start, end)) add('DOUBLE_BOOKED', { plan: b.planNumber, from: iso(b.start), to: iso(b.end) })
      else if (buffer > 0 && overlaps(b.start, b.end, addDays(start, -buffer), addDays(end, buffer))) {
        add('TRAVEL_BUFFER', { plan: b.planNumber, from: iso(b.start), to: iso(b.end), days: buffer })
      }
    }
  }
  if (person.workloadDays > context.settings.maxAuditDaysInWindow) {
    add('WORKLOAD_HIGH', { days: person.workloadDays, window: context.settings.workloadWindowDays, max: context.settings.maxAuditDaysInWindow })
  }
  for (const rel of person.relationships) {
    const found = relationshipIssue(person, rel, context)
    if (found) issues.push(found)
  }
  const declarationValid = person.annualDeclarationValidUntil && person.annualDeclarationValidUntil >= reference
  if (!declarationValid) add('DECLARATION_MISSING', {}, { severity: context.kind === 'plan' && context.settings.requireAnnualDeclaration ? 'block' : 'warn' })
  if (context.kind === 'plan' && !person.auditDeclarationSigned) add('AUDIT_DECLARATION_MISSING', {}, { severity: context.settings.requireAuditDeclaration ? 'block' : 'info' })
  return issues
}

// ── Criteria ──────────────────────────────────────────────────────────────────

const PASS_TEXT: Record<string, Localized> = {
  role: { en: 'Qualified for the role', ar: 'مؤهل للدور' },
  standards: { en: 'Approved for every standard', ar: 'معتمد لكل المواصفات' },
  codes: { en: 'Approved for every IAF code in scope', ar: 'معتمد لكل رموز IAF ضمن النطاق' },
  criticalCodes: { en: 'No unexamined critical code', ar: 'لا توجد رموز حرجة دون اختبار' },
  authorisation: { en: 'Competence approval valid', ar: 'اعتماد الكفاءة ساري' },
  availability: { en: 'Available on the audit dates', ar: 'متاح في تواريخ التدقيق' },
  impartiality: { en: 'No conflict of interest recorded', ar: 'لا يوجد تعارض مصالح مسجل' },
  workload: { en: 'Workload within the limit', ar: 'عبء العمل ضمن الحد' },
}
const NOT_APPLICABLE: Localized = { en: 'Not checked for this role', ar: 'لا يُتحقق منه لهذا الدور' }

export function criteriaOf(issues: TeamIssue[], role: TeamRole, context: EngineContext): TeamCriterion[] {
  return CRITERIA.map((key) => {
    const label = CRITERION_LABEL[key]
    const own = issues.filter((i) => i.criterion === key)
    const competenceKey = ['role', 'standards', 'codes', 'criticalCodes', 'authorisation'].includes(key)
    if ((competenceKey && !COMPETENCE_ROLES.includes(role)) || (key === 'standards' && role === 'TECHNICAL_EXPERT')) return { key, label, status: 'na', message: NOT_APPLICABLE }
    if (key === 'availability' && !(context.startDate && context.endDate)) return { key, label, status: 'na', message: { en: ISSUES.NO_DATES.en, ar: ISSUES.NO_DATES.ar } }
    const effective = own.filter((i) => !i.excepted)
    const status: CriterionStatus = effective.some((i) => i.severity === 'block')
      ? 'fail'
      : effective.some((i) => i.severity === 'warn')
        ? 'warn'
        : own.some((i) => i.severity === 'info' && i.code !== 'TECHNICAL_EXPERT_ONLY' && i.code !== 'AUDIT_DECLARATION_MISSING')
          ? 'partial'
          : 'pass'
    const shown = effective.find((i) => i.severity === 'block') ?? effective.find((i) => i.severity === 'warn') ?? own[0]
    return { key, label, status, message: status === 'pass' ? PASS_TEXT[key] : (shown?.message ?? PASS_TEXT[key]) }
  })
}

// ── Scoring ───────────────────────────────────────────────────────────────────

const ARABIC_COUNTRIES = ['sa', 'saudi arabia', 'eg', 'egypt', 'ae', 'united arab emirates', 'jo', 'jordan', 'kw', 'kuwait', 'qa', 'qatar', 'bh', 'bahrain', 'om', 'oman']
export const languagesForCountry = (country: string | null) => (ARABIC_COUNTRIES.includes(norm(country)) ? ['ar', 'en'] : ['en'])
const COUNTRY_ALIASES: Record<string, string> = { sa: 'saudi arabia', eg: 'egypt', ae: 'united arab emirates', jo: 'jordan', kw: 'kuwait', qa: 'qatar', bh: 'bahrain', om: 'oman', tr: 'turkey' }
const countryKey = (country: string | null) => COUNTRY_ALIASES[norm(country)] ?? norm(country)
const round1 = (n: number) => Math.round(n * 10) / 10

export function scoreCandidate(person: EnginePerson, role: TeamRole, context: EngineContext, issues: TeamIssue[]): { score: number; components: ScoreComponent[] } {
  const W = SCORE_WEIGHTS
  const c = competenceOf(person, context)
  const totalCodes = context.iafCodes.length
  const critical = context.iafCodes.filter(isCriticalIafCode)
  const expert = role === 'TECHNICAL_EXPERT'
  const held = expert ? c.anyCodes : c.auditorCodes
  const standardShare = context.standards.length ? c.standardsCovered.length / context.standards.length : 1
  const codeShare = totalCodes ? held.length / totalCodes : 1
  const criticalShare = critical.length ? critical.filter((code) => held.includes(code)).length / critical.length : 1
  const competenceScore = expert ? codeShare * 35 + criticalShare * 5 : standardShare * 20 + codeShare * 15 + criticalShare * 5

  const blocked = issues.some((i) => i.code === 'UNAVAILABLE' || i.code === 'DOUBLE_BOOKED')
  const buffer = issues.some((i) => i.code === 'TRAVEL_BUFFER')
  const dated = Boolean(context.startDate && context.endDate)
  const availabilityScore = !dated ? W.availability : blocked ? 0 : buffer ? W.availability / 2 : W.availability
  const max = Math.max(1, context.settings.maxAuditDaysInWindow)
  const workloadScore = W.workload * (1 - Math.min(person.workloadDays, max) / max)
  const experienceScore = W.experience * (Math.min(person.sectorAudits, EXPERIENCE_FULL_AT) / EXPERIENCE_FULL_AT)

  let locationScore = W.location / 2
  let locationText: Localized = { en: 'No base location recorded', ar: 'لا يوجد موقع أساسي مسجل' }
  const personCountry = person.baseCountry || person.country
  if (person.baseCity && context.city && norm(person.baseCity) === norm(context.city)) {
    locationScore = W.location
    locationText = { en: `Based in ${person.baseCity}, the audit city`, ar: `مقيم في ${person.baseCity}، مدينة التدقيق` }
  } else if (personCountry && context.country && countryKey(personCountry) === countryKey(context.country)) {
    locationScore = W.location * 0.7
    locationText = { en: `Based in ${personCountry}, the audit country`, ar: `مقيم في ${personCountry}، دولة التدقيق` }
  } else if (personCountry && context.country) {
    locationScore = W.location * 0.2
    locationText = { en: `Based in ${personCountry}; travel to ${context.country} needed`, ar: `مقيم في ${personCountry}، ويلزم السفر إلى ${context.country}` }
  }

  let languageScore = W.language / 2
  let languageText: Localized = { en: 'Languages not recorded', ar: 'اللغات غير مسجلة' }
  const spoken = person.languages.map(norm)
  if (spoken.length) {
    const [primary, ...others] = context.languages
    if (primary && spoken.includes(primary)) {
      languageScore = W.language
      languageText = { en: `Speaks ${primary.toUpperCase()}, the main audit language`, ar: `يتحدث ${primary.toUpperCase()}، لغة التدقيق الرئيسية` }
    } else if (others.some((l) => spoken.includes(l))) {
      languageScore = W.language * 0.6
      languageText = { en: 'Speaks an accepted audit language', ar: 'يتحدث لغة تدقيق مقبولة' }
    } else {
      languageScore = 0
      languageText = { en: 'Does not speak the audit language', ar: 'لا يتحدث لغة التدقيق' }
    }
  }

  const components: ScoreComponent[] = [
    {
      key: 'competence',
      score: round1(competenceScore),
      max: W.competence,
      explanation: expert
        ? { en: `Covers ${held.length} of ${totalCodes} IAF codes in scope`, ar: `يغطي ${held.length} من ${totalCodes} من رموز IAF ضمن النطاق` }
        : {
            en: `Approved for ${c.standardsCovered.length} of ${context.standards.length} standards and ${held.length} of ${totalCodes} IAF codes${critical.length ? `; critical codes ${Math.round(criticalShare * 100)}%` : ''}`,
            ar: `معتمد لـ ${c.standardsCovered.length} من ${context.standards.length} مواصفات و ${held.length} من ${totalCodes} من رموز IAF${critical.length ? `، والرموز الحرجة ${Math.round(criticalShare * 100)}%` : ''}`,
          },
    },
    {
      key: 'availability',
      score: round1(availabilityScore),
      max: W.availability,
      explanation: !dated
        ? { en: 'No audit dates yet', ar: 'لا توجد تواريخ للتدقيق بعد' }
        : blocked
          ? { en: 'Not available on the audit dates', ar: 'غير متاح في تواريخ التدقيق' }
          : buffer
            ? { en: 'Available, but another audit falls within the travel buffer', ar: 'متاح، لكن يوجد تدقيق آخر ضمن مهلة السفر' }
            : { en: 'Available on the audit dates', ar: 'متاح في تواريخ التدقيق' },
    },
    {
      key: 'workload',
      score: round1(workloadScore),
      max: W.workload,
      explanation: {
        en: `${person.workloadDays} audit days in the last ${context.settings.workloadWindowDays} days (limit ${context.settings.maxAuditDaysInWindow})`,
        ar: `${person.workloadDays} يوم تدقيق خلال آخر ${context.settings.workloadWindowDays} يوماً (الحد ${context.settings.maxAuditDaysInWindow})`,
      },
    },
    {
      key: 'experience',
      score: round1(experienceScore),
      max: W.experience,
      explanation: { en: `${person.sectorAudits} completed audits in the same IAF codes`, ar: `${person.sectorAudits} عملية تدقيق مكتملة في رموز IAF نفسها` },
    },
    { key: 'location', score: round1(locationScore), max: W.location, explanation: locationText },
    { key: 'language', score: round1(languageScore), max: W.language, explanation: languageText },
  ]
  return { score: Math.round(components.reduce((sum, x) => sum + x.score, 0)), components }
}

// ── Exceptions, ranking, team ─────────────────────────────────────────────────

export function applyExceptions(issues: TeamIssue[], exceptions: EngineException[] = []): TeamIssue[] {
  for (const i of issues) {
    if (!i.overridable) continue
    const match = exceptions.find((e) => e.status === 'APPROVED' && e.issueCode === i.code && (e.personId ?? null) === (i.personId ?? null))
    if (match) {
      i.excepted = true
      i.exceptionId = match.id
    }
  }
  return issues
}

const isBlocking = (i: TeamIssue) => i.severity === 'block' && !i.excepted

export interface RankedCandidate {
  person: EnginePerson
  role: TeamRole
  eligible: boolean
  score: number
  components: ScoreComponent[]
  issues: TeamIssue[]
  criteria: TeamCriterion[]
  competence: Competence
}

export function rankCandidates(pool: EnginePerson[], role: TeamRole, context: EngineContext, exceptions: EngineException[] = []): RankedCandidate[] {
  return pool
    .map((person) => {
      const issues = applyExceptions(personIssues({ personId: person.id, name: person.name, role, person }, context), exceptions)
      const { score, components } = scoreCandidate(person, role, context, issues)
      return { person, role, eligible: !issues.some(isBlocking), score, components, issues, criteria: criteriaOf(issues, role, context), competence: competenceOf(person, context) }
    })
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score || a.person.name.localeCompare(b.person.name))
}

const alternativeOf = (c: RankedCandidate): TeamAlternative => ({ personId: c.person.id, name: c.person.name, score: c.score, role: c.role })

export function evaluateTeam(context: EngineContext, members: EngineMember[], { exceptions = [], pool = [] }: { exceptions?: EngineException[]; pool?: EnginePerson[] } = {}): TeamValidation {
  const teamIssues: TeamIssue[] = []
  const memberIds = new Set(members.map((m) => m.personId).filter(Boolean))
  const cache = new Map<TeamRole, RankedCandidate[]>()
  const ranked = (role: TeamRole) => {
    if (!cache.has(role)) cache.set(role, rankCandidates(pool.filter((p) => !memberIds.has(p.id)), role, context, exceptions))
    return cache.get(role) ?? []
  }
  const alternativesFor = (role: TeamRole, filter: (c: RankedCandidate) => boolean = () => true) => ranked(role).filter((c) => c.eligible && filter(c)).slice(0, 3).map(alternativeOf)

  const seen = new Set<string>()
  for (const m of members) {
    const key = m.personId ?? `name:${norm(m.name)}`
    if (seen.has(key)) teamIssues.push(issue('DUPLICATE_MEMBER', { name: m.name }, { personId: m.personId }))
    seen.add(key)
  }

  const results = members.map((m) => {
    const issues = applyExceptions(personIssues(m, context), exceptions)
    if (issues.some((i) => isBlocking(i) && (i.mandatory || i.criterion !== 'impartiality'))) {
      const alternatives = COMPETENCE_ROLES.includes(m.role) || m.role === 'TRAINEE' ? alternativesFor(m.role) : []
      for (const i of issues) if (isBlocking(i)) i.alternatives = alternatives
    }
    const status: TeamMemberResult['status'] = issues.some(isBlocking) ? 'block' : issues.some((i) => i.severity === 'warn' || (i.severity === 'block' && i.excepted)) ? 'warn' : 'ok'
    return { member: m, result: { personId: m.personId, name: m.name, role: m.role, registered: Boolean(m.person), status, issues, criteria: criteriaOf(issues, m.role, context) }, competence: m.person ? competenceOf(m.person, context) : null }
  })

  const leaders = results.filter((r) => r.member.role === 'TEAM_LEADER')
  if (!leaders.length) teamIssues.push(issue('NO_TEAM_LEADER', {}, { alternatives: alternativesFor('TEAM_LEADER') }))
  if (leaders.length > 1) teamIssues.push(issue('MULTIPLE_TEAM_LEADERS'))
  const leader = leaders[0]
  if (leader?.competence && leader.competence.standardsMissing.length && leader.competence.standardsCovered.length) {
    const missing = leader.competence.standardsMissing
    const coLeads = results.filter((r) => r !== leader && r.member.role === 'AUDITOR' && r.competence && r.member.person && roleQualified(r.member.person, 'TEAM_LEADER'))
    for (const co of coLeads) {
      const shared = missing.filter((key) => co.competence?.standardsCovered.includes(key))
      if (shared.length) teamIssues.push(issue('CO_LEAD', { name: co.member.name, standards: labelsOf(context, shared) }, { personId: co.member.personId }))
    }
    const uncovered = missing.filter((key) => !coLeads.some((co) => co.competence?.standardsCovered.includes(key)))
    if (uncovered.length) {
      teamIssues.push(issue('LEAD_STANDARD_NOT_COVERED', { standards: labelsOf(context, uncovered) }, { alternatives: alternativesFor('TEAM_LEADER', (c) => c.competence.standardsMissing.length === 0) }))
    }
  }

  const qualified = results.filter(
    (r) => (r.member.role === 'AUDITOR' || r.member.role === 'TEAM_LEADER') && r.result.registered && !r.result.issues.some((i) => isBlocking(i) && i.criterion !== 'impartiality' && i.criterion !== 'availability'),
  )
  if (results.some((r) => r.member.role === 'TRAINEE') && !qualified.length) teamIssues.push(issue('TRAINEE_WITHOUT_AUDITOR'))

  const competent = results.filter(
    (r) => r.competence && COMPETENCE_ROLES.includes(r.member.role) && !r.result.issues.some((i) => isBlocking(i) && ['role', 'standards', 'authorisation', 'competence'].includes(i.criterion)),
  )
  const coverage: TeamCoverage = {
    standards: context.standards.map((s) => ({
      key: s.key,
      label: s.label,
      coveredBy: competent.filter((r) => r.member.role !== 'TECHNICAL_EXPERT' && r.competence?.standardsCovered.includes(s.key)).map((r) => r.member.personId ?? ''),
    })),
    iafCodes: context.iafCodes.map((code) => ({
      code,
      critical: isCriticalIafCode(code),
      coveredBy: [
        ...competent.filter((r) => r.member.role !== 'TECHNICAL_EXPERT' && r.competence?.auditorCodes.includes(code)).map((r) => ({ personId: r.member.personId ?? '', via: 'auditor' as const })),
        ...competent.filter((r) => r.member.role === 'TECHNICAL_EXPERT' && r.competence?.anyCodes.includes(code)).map((r) => ({ personId: r.member.personId ?? '', via: 'technicalExpert' as const })),
      ],
    })),
    members: results.map((r) => ({
      personId: r.member.personId,
      name: r.member.name,
      role: r.member.role,
      standards: r.competence && COMPETENCE_ROLES.includes(r.member.role) && r.member.role !== 'TECHNICAL_EXPERT' ? r.competence.standardsCovered : [],
      iafCodes: r.competence && COMPETENCE_ROLES.includes(r.member.role) ? (r.member.role === 'TECHNICAL_EXPERT' ? r.competence.anyCodes : r.competence.auditorCodes) : [],
    })),
  }
  for (const row of coverage.iafCodes) {
    if (row.coveredBy.length) {
      if (row.coveredBy.every((x) => x.via === 'technicalExpert')) teamIssues.push(issue('CODE_BY_TECHNICAL_EXPERT', { code: row.code }))
      continue
    }
    const unexamined = row.critical && results.some((r) => r.competence?.unexaminedCritical.includes(row.code))
    const covers = (c: RankedCandidate) => (c.role === 'TECHNICAL_EXPERT' ? c.competence.anyCodes : c.competence.auditorCodes).includes(row.code)
    const alternatives = [...alternativesFor('AUDITOR', covers), ...alternativesFor('TECHNICAL_EXPERT', covers)].filter((a, i, list) => list.findIndex((x) => x.personId === a.personId) === i).slice(0, 3)
    teamIssues.push(issue(unexamined ? 'CRITICAL_CODE_NOT_COVERED' : 'IAF_CODE_NOT_COVERED', { code: row.code }, { alternatives }))
  }
  if (!(context.startDate && context.endDate)) teamIssues.push(issue('NO_DATES'))
  applyExceptions(teamIssues, exceptions)

  const memberResults = results.map((r) => r.result)
  const all = [...teamIssues, ...memberResults.flatMap((m) => m.issues)]
  const blocking = all.filter(isBlocking)
  return {
    valid: !blocking.length,
    canConfirm: !blocking.length,
    blockingCount: blocking.length,
    mandatoryBlockingCount: blocking.filter((i) => i.mandatory).length,
    overridableBlockingCount: blocking.filter((i) => !i.mandatory).length,
    warningCount: all.filter((i) => i.severity === 'warn' || (i.severity === 'block' && i.excepted)).length,
    members: memberResults,
    teamIssues,
    coverage,
  }
}

/** Issue codes an exception may cover (blocking, not mandatory). */
export const EXCEPTION_CODES = Object.entries(ISSUES)
  .filter(([, def]) => def.severity === 'block' && !def.mandatory)
  .map(([code]) => code)

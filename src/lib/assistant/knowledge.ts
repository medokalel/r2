import { ROUTES } from '@/lib/routes'

/**
 * Help content for the in-app assistant: what each page is for, the steps,
 * the problems people usually hit there and where to go next. It is the
 * assistant's offline answer and the context sent with every AI question.
 */

export interface Bilingual {
  en: string
  ar: string
}

export interface PageIssue {
  q: Bilingual
  a: Bilingual
  /** Optional page that fixes it. */
  route?: string
}

export interface PageHelp {
  key: string
  match: RegExp
  title: Bilingual
  purpose: Bilingual
  steps: Bilingual[]
  issues: PageIssue[]
  next?: { route: string; label: Bilingual }
}

const b = (en: string, ar: string): Bilingual => ({ en, ar })

export const PAGE_HELP: PageHelp[] = [
  {
    key: 'dashboard',
    match: /^\/cab\/dashboard/,
    title: b('Analytics and reports', 'التحليلات والتقارير'),
    purpose: b('Live picture of the work: what is waiting, what is late and where each file stands.', 'صورة حية للعمل: ما الذي ينتظر، وما المتأخر، وأين يقف كل ملف.'),
    steps: [
      b('Read the line under each number: it names the oldest or next item.', 'اقرأ السطر أسفل كل رقم؛ فهو يذكر أقدم عنصر أو أقربه.'),
      b('Click a card or a chart row to open the records behind it.', 'اضغط على أي بطاقة أو سطر في الرسم البياني لفتح السجلات التي خلفه.'),
      b('Work the queue from the top: most urgent first.', 'ابدأ قائمة المهام من الأعلى؛ الأكثر استعجالًا أولًا.'),
    ],
    issues: [
      { q: b('A number looks wrong', 'رقم يبدو غير صحيح'), a: b('Press the (i) next to it to see exactly what it counts, then open the card to check the records.', 'اضغط (i) بجانبه لتعرف ما يحسبه بالضبط، ثم افتح البطاقة وراجع السجلات.') },
      { q: b('Where do I start?', 'من أين أبدأ؟'), a: b('Start with red items in the work queue, then decisions ready to take.', 'ابدأ بالعناصر الحمراء في قائمة المهام، ثم القرارات الجاهزة.') },
    ],
  },
  {
    key: 'workspace',
    match: /^\/(cab\/)?workspace/,
    title: b('Workspace', 'مساحة العمل'),
    purpose: b('All modules in the order of the certification flow, from setup to invoicing.', 'جميع الوحدات بترتيب مسار منح الشهادة، من الإعداد إلى الفوترة.'),
    steps: [
      b('New body? Start with phase 1: company profile, schemes and personnel.', 'جهة جديدة؟ ابدأ بالمرحلة 1: ملف الجهة والمخططات والأفراد.'),
      b('Then register clients, receive applications, quote, audit, decide, certify.', 'بعد ذلك سجّل العملاء، واستلم الطلبات، وسعّر، ودقّق، واتخذ القرار، وأصدر الشهادة.'),
    ],
    issues: [
      { q: b('Which module do I need?', 'أي وحدة أحتاج؟'), a: b('Tell me what you are trying to do and I will point you to it.', 'أخبرني بما تريد فعله، وسأرشدك إلى الوحدة المناسبة.') },
    ],
  },
  {
    key: 'companyProfile',
    match: /^\/cab\/(company-profile|onboarding)/,
    title: b('Company profile', 'ملف الجهة'),
    purpose: b('Your body\'s legal data, accreditation, schemes and sites. Everything else reads from here.', 'البيانات القانونية للجهة والاعتماد والمخططات والمواقع. يعتمد عليها باقي النظام.'),
    steps: [
      b('Fill the legal data and upload the commercial register.', 'املأ البيانات القانونية وارفع السجل التجاري.'),
      b('Add the accreditation and the schemes you certify.', 'أضف الاعتماد والمخططات التي تمنح الشهادات عليها.'),
      b('Save; schemes then appear in personnel competence.', 'احفظ؛ ستظهر المخططات بعد ذلك في كفاءة الأفراد.'),
    ],
    issues: [
      { q: b('Save does nothing', 'الحفظ لا يعمل'), a: b('A required field is empty or invalid. Look for fields outlined in red; the first one is scrolled into view.', 'يوجد حقل مطلوب فارغ أو غير صحيح. ابحث عن الحقول المحاطة باللون الأحمر.') },
    ],
    next: { route: ROUTES.cabCompetence, label: b('Personnel & competence', 'الأفراد والكفاءة') },
  },
  {
    key: 'competence',
    match: /^\/cab\/competence/,
    title: b('Personnel & competence', 'الأفراد والكفاءة'),
    purpose: b('Who can audit what: roles, standards and IAF codes per person.', 'من يمكنه التدقيق على ماذا: الأدوار والمواصفات ورموز IAF لكل شخص.'),
    steps: [
      b('Add a person or import many from Excel.', 'أضف شخصًا أو استورد مجموعة من ملف Excel.'),
      b('Per standard, choose the IAF codes. Critical codes need the exam first.', 'اختر رموز IAF لكل مواصفة. الرموز الحرجة تتطلب اجتياز اختبار أولًا.'),
      b('Upload qualifications: academic, training, others.', 'ارفع المؤهلات: أكاديمية وتدريب وغيرها.'),
    ],
    issues: [
      { q: b('A code will not stay selected', 'رمز لا يمكن اختياره'), a: b('It is a critical code. Pass its MCQ exam (80%) and it is added automatically.', 'هذا رمز حرج. اجتز اختباره (80%) وسيُضاف تلقائيًا.') },
      { q: b('Excel import rejected rows', 'الاستيراد رفض بعض الصفوف'), a: b('Each rejected row shows the reason. Fix the email, role or IAF code in the file and import again.', 'يظهر سبب الرفض بجانب كل صف. صحّح البريد الإلكتروني أو الدور أو الرمز ثم أعد الرفع.') },
    ],
  },
  {
    key: 'clients',
    match: /^\/cab\/(audit-clients|clients)/,
    title: b('Audit clients', 'عملاء التدقيق'),
    purpose: b('Organisations you certify, with their sites and contacts.', 'المنشآت التي تمنحها الشهادة، مع مواقعها وجهات اتصالها.'),
    steps: [
      b('Register the client with its legal data and sites.', 'سجّل العميل ببياناته القانونية ومواقعه.'),
      b('Add contacts and give portal access to the right person.', 'أضف جهات الاتصال وامنح صلاحية البوابة للشخص المناسب.'),
    ],
    issues: [
      { q: b('Client cannot log in to the portal', 'العميل لا يستطيع الدخول إلى البوابة'), a: b('Check that the contact has portal access and a valid email.', 'تأكد أن لجهة الاتصال صلاحية دخول البوابة وبريدًا إلكترونيًا صحيحًا.'), route: ROUTES.cabContacts },
    ],
    next: { route: ROUTES.cabApplicationRegister, label: b('Applications', 'الطلبات') },
  },
  {
    key: 'contacts',
    match: /^\/cab\/contacts/,
    title: b('Contacts', 'جهات الاتصال'),
    purpose: b('People at your clients: who signs, who receives the portal access.', 'الأشخاص لدى عملائك: من يوقّع ومن لديه صلاحية دخول البوابة.'),
    steps: [b('Search or filter, tick contacts to export, or add a new one.', 'ابحث أو صفِّ النتائج، أو حدّد الأسماء للتصدير، أو أضف جهة اتصال جديدة.')],
    issues: [
      { q: b('Phone number is rejected', 'رقم الهاتف مرفوض'), a: b('Choose the country code first, then type the number without the leading zero.', 'اختر رمز الدولة أولًا، ثم اكتب الرقم دون الصفر في بدايته.') },
    ],
  },
  {
    key: 'applications',
    match: /^\/cab\/applications\/?$/,
    title: b('Application register', 'سجل الطلبات'),
    purpose: b('Every certification application and the stage it is at.', 'جميع طلبات منح الشهادات والمرحلة التي بلغها كل طلب.'),
    steps: [
      b('Search or filter by date, country or stage.', 'ابحث أو صفِّ النتائج حسب التاريخ أو الدولة أو المرحلة.'),
      b('Open an application with its action button to continue its stage.', 'افتح الطلب من زر الإجراء لإكمال مرحلته.'),
    ],
    issues: [
      { q: b('I cannot find an application', 'لا أجد طلبًا'), a: b('Clear the date and country filters and search by order number or client name.', 'امسح عامل تصفية التاريخ والدولة، وابحث برقم الطلب أو اسم العميل.') },
    ],
    next: { route: '/cab/applications/receipt', label: b('Application receipt', 'استلام الطلب') },
  },
  {
    key: 'receipt',
    match: /^\/cab\/applications\/(.*\/)?receipt/,
    title: b('Application receipt', 'استلام الطلب'),
    purpose: b('Check the submitted application is complete before review.', 'التحقق من اكتمال الطلب المقدَّم قبل المراجعة.'),
    steps: [
      b('Open the application and check documents and scope.', 'افتح الطلب وراجع المستندات والنطاق.'),
      b('Accept it to move it to review, or return it with a reason.', 'اقبله لينتقل إلى المراجعة، أو أعده مع ذكر السبب.'),
    ],
    issues: [
      { q: b('A document is missing', 'يوجد مستند ناقص'), a: b('Send an information request to the client instead of rejecting.', 'أرسل طلب معلومات إلى العميل بدلًا من الرفض.'), route: ROUTES.cabApplicationInformationRequired },
    ],
    next: { route: ROUTES.cabApplicationReviewQueue, label: b('Review queue', 'قائمة المراجعة') },
  },
  {
    key: 'review',
    match: /^\/cab\/applications\/(.*\/)?(review|review-queue)/,
    title: b('Application review', 'مراجعة الطلب'),
    purpose: b('Review each section against the standard (ISO/IEC 17021-1, 9.1.2).', 'مراجعة كل قسم مقابل المواصفة (ISO/IEC 17021-1 بند 9.1.2).'),
    steps: [
      b('Mark each section complete, partial or missing, with a comment.', 'حدّد حالة كل قسم: مكتمل أو جزئي أو ناقص، مع تعليق.'),
      b('Partial or missing sections become an information request.', 'تتحول الأقسام الجزئية أو الناقصة إلى طلب معلومات.'),
      b('When all are complete, approve to go to technical feasibility.', 'عند اكتمال جميع الأقسام، اعتمد الطلب لينتقل إلى الجدوى الفنية.'),
    ],
    issues: [
      { q: b('Approve is disabled', 'زر الاعتماد غير مفعّل'), a: b('Every section needs a status. Look for sections still marked "not reviewed".', 'يجب تحديد حالة لكل قسم. ابحث عن الأقسام التي ما زالت "لم تتم مراجعتها".') },
    ],
    next: { route: ROUTES.cabApplicationTechnicalFeasibility, label: b('Technical feasibility', 'الجدوى الفنية') },
  },
  {
    key: 'informationRequired',
    match: /^\/cab\/applications\/(.*\/)?information-required/,
    title: b('Information required', 'المعلومات المطلوبة'),
    purpose: b('Questions to the client and their answers, with due dates.', 'الأسئلة الموجهة إلى العميل وردوده، مع تواريخ الاستحقاق.'),
    steps: [
      b('Add the item, the clause and the due date.', 'أضف البند والبند المرجعي وتاريخ الاستحقاق.'),
      b('Accept the client\'s answer or ask again.', 'اقبل رد العميل أو اطلب الإيضاح مرة أخرى.'),
    ],
    issues: [
      { q: b('Client has not answered', 'العميل لم يرد'), a: b('Overdue items show in red on the dashboard. Remind the primary contact.', 'تظهر البنود المتأخرة باللون الأحمر في لوحة التحكم. ذكّر جهة الاتصال الرئيسية.') },
    ],
  },
  {
    key: 'feasibility',
    match: /^\/cab\/applications\/(.*\/)?technical-feasibility/,
    title: b('Technical feasibility', 'الجدوى الفنية'),
    purpose: b('Confirm you have competent auditors for the scope and IAF codes, and set the audit time.', 'تأكد من توفر مدققين أكفاء للنطاق ورموز IAF، وحدّد مدة التدقيق.'),
    steps: [
      b('Check competence coverage for every IAF code in scope.', 'راجع تغطية الكفاءة لكل رمز IAF في النطاق.'),
      b('Confirm audit days, then move to quotation.', 'أكّد أيام التدقيق ثم انتقل إلى التسعير.'),
    ],
    issues: [
      { q: b('No competent auditor for a code', 'لا يوجد مدقق كفء لأحد الرموز'), a: b('Add the code to a qualified person (critical codes need the exam) or use a technical expert.', 'أضف الرمز إلى شخص مؤهل (الرمز الحرج يتطلب اختبارًا) أو استعن بخبير فني.'), route: ROUTES.cabCompetence },
    ],
    next: { route: ROUTES.cabApplicationQuotation, label: b('Quotation', 'عرض السعر') },
  },
  {
    key: 'quotation',
    match: /^\/cab\/(applications\/(.*\/)?quotation|quotations)/,
    title: b('Quotation', 'عرض السعر'),
    purpose: b('Audit programme per standard for the 3-year cycle, priced by audit day.', 'برنامج التدقيق لكل مواصفة لدورة مدتها 3 سنوات، مسعّر بيوم التدقيق.'),
    steps: [
      b('Check each standard: initial, surveillance 1 and 2, recertification.', 'راجع كل مواصفة: المنح الأولي، المراقبة 1 و2، إعادة المنح.'),
      b('Adjust days while it is a draft, add travel and extra items.', 'عدّل الأيام ما دام العرض مسودة، وأضف السفر والبنود الإضافية.'),
      b('Issue it to the client; issued quotations cannot be edited.', 'أصدره للعميل؛ لا يمكن تعديل العرض بعد إصداره.'),
    ],
    issues: [
      { q: b('I cannot edit the days', 'لا أستطيع تعديل الأيام'), a: b('Only draft quotations are editable. Cancel and create a new one if it was issued.', 'التعديل متاح في المسودة فقط. إذا صدر العرض، فألغه وأنشئ عرضًا جديدًا.') },
      { q: b('Provisional warning', 'تحذير مؤقت'), a: b('Some durations use a provisional policy; review them before issuing.', 'بعض المدد محسوبة بسياسة مؤقتة؛ راجعها قبل الإصدار.') },
    ],
    next: { route: ROUTES.cabOffers, label: b('Offers', 'العروض') },
  },
  {
    key: 'offers',
    match: /^\/cab\/offers/,
    title: b('Offers & contracts', 'العروض والعقود'),
    purpose: b('Offers sent to clients and their signature status.', 'العروض المرسلة إلى العملاء وحالة توقيعها.'),
    steps: [b('Follow up unsigned offers; a signed offer opens audit planning.', 'تابع العروض غير الموقعة؛ فالعرض الموقع يفتح تخطيط التدقيق.')],
    issues: [],
    next: { route: ROUTES.cabAuditPlanning, label: b('Audit planning', 'تخطيط التدقيق') },
  },
  {
    key: 'auditPlanning',
    match: /^\/cab\/audit-planning/,
    title: b('Audit planning', 'تخطيط التدقيق'),
    purpose: b('Team, dates, agenda and sites for each audit.', 'الفريق والمواعيد والأجندة والمواقع لكل تدقيق.'),
    steps: [
      b('Propose the team from competent people; the client may object.', 'اقترح الفريق من الأشخاص الأكفاء؛ ويحق للعميل الاعتراض.'),
      b('Build the plan: agenda, site and remote parts, travel, declarations.', 'أعدّ الخطة: جدول الأعمال، والجزء الميداني وعن بُعد، والسفر، والإقرارات.'),
      b('Send the plan to the client before the audit.', 'أرسل الخطة إلى العميل قبل التدقيق.'),
    ],
    issues: [
      { q: b('Auditor not in the list', 'المدقق غير ظاهر'), a: b('Only people competent for the standard and IAF codes appear. Update their competence.', 'يظهر فقط الأكفاء للمواصفة ورموز IAF. حدّث بيانات كفاءته.'), route: ROUTES.cabCompetence },
    ],
    next: { route: ROUTES.cabAuditReporting, label: b('Audit reporting', 'تقارير التدقيق') },
  },
  {
    key: 'auditReporting',
    match: /^\/cab\/audit-reporting/,
    title: b('Audit reporting', 'تقارير التدقيق'),
    purpose: b('Record findings during the audit and finalise the report.', 'تسجيل الملاحظات أثناء التدقيق وإنهاء التقرير.'),
    steps: [
      b('Add findings with clause, evidence and grade (major, minor, observation).', 'أضف الملاحظات بالبند والدليل والدرجة (كبرى، صغرى، ملاحظة).'),
      b('Finalise the report; nonconformities go to the client for action.', 'أنهِ التقرير؛ تُرسل حالات عدم المطابقة إلى العميل لاتخاذ الإجراء.'),
    ],
    issues: [],
    next: { route: ROUTES.cabNonconformities, label: b('Nonconformities', 'عدم المطابقة') },
  },
  {
    key: 'nonconformities',
    match: /^\/cab\/nonconformities/,
    title: b('Nonconformities', 'حالات عدم المطابقة'),
    purpose: b('Correction, root cause, corrective action and verification for each finding.', 'التصحيح والسبب الجذري والإجراء التصحيحي والتحقق لكل ملاحظة.'),
    steps: [
      b('Review the client\'s response for each stage.', 'راجع رد العميل في كل مرحلة.'),
      b('Verify effectiveness; majors must be verified before the decision.', 'تحقق من الفعالية؛ يجب التحقق من الحالات الكبرى قبل القرار.'),
    ],
    issues: [
      { q: b('Overdue nonconformity', 'عدم مطابقة متأخرة'), a: b('Contact the client; an unresolved major blocks certification.', 'تواصل مع العميل؛ فالحالة الكبرى غير المعالجة توقف المنح.') },
    ],
    next: { route: ROUTES.cabDecisions, label: b('Decisions', 'القرارات') },
  },
  {
    key: 'decisions',
    match: /^\/cab\/decisions/,
    title: b('Certification decisions', 'قرارات المنح'),
    purpose: b('The decision maker grants, defers or refuses, based on the full file.', 'يمنح صاحب القرار الشهادة أو يؤجلها أو يرفضها بناءً على الملف كاملًا.'),
    steps: [
      b('Complete the technical review of the file first.', 'أكمل المراجعة الفنية للملف أولًا.'),
      b('The decision maker must not have taken part in the audit.', 'يجب ألا يكون صاحب القرار قد شارك في التدقيق.'),
      b('Record the decision; a grant prepares the certificate.', 'سجّل القرار؛ يؤدي المنح إلى تجهيز الشهادة.'),
    ],
    issues: [
      { q: b('Decision button is disabled', 'زر القرار غير مفعّل'), a: b('The technical review is not complete or a major nonconformity is still open.', 'المراجعة الفنية غير مكتملة، أو توجد حالة عدم مطابقة كبرى مفتوحة.'), route: ROUTES.cabNonconformities },
    ],
    next: { route: ROUTES.cabCertificates, label: b('Certificates', 'الشهادات') },
  },
  {
    key: 'certificates',
    match: /^\/cab\/certificates/,
    title: b('Certificates', 'الشهادات'),
    purpose: b('Prepare, preview and issue certificates; suspend or withdraw when needed.', 'تجهيز ومعاينة وإصدار الشهادات؛ وتعليقها أو سحبها عند اللزوم.'),
    steps: [b('Open a draft, check name, scope and sites in both languages, then issue.', 'افتح المسودة، وراجع الاسم والنطاق والمواقع باللغتين، ثم أصدر الشهادة.')],
    issues: [],
    next: { route: ROUTES.cabCertificationCycles, label: b('Certification cycles', 'دورات الشهادة') },
  },
  {
    key: 'cycles',
    match: /^\/cab\/certification/,
    title: b('Certification cycles', 'دورات الشهادة'),
    purpose: b('Surveillance and recertification dates for each certificate.', 'مواعيد المراقبة وإعادة المنح لكل شهادة.'),
    steps: [b('First surveillance is due within 12 months of the decision; plan each visit early.', 'يجب أن تتم المراقبة الأولى خلال 12 شهرًا من القرار؛ خطط لكل زيارة مبكرًا.')],
    issues: [],
  },
  {
    key: 'invoices',
    match: /^\/cab\/invoices/,
    title: b('Invoices', 'الفواتير'),
    purpose: b('Invoices, payments and balances per client.', 'الفواتير والمدفوعات والأرصدة لكل عميل.'),
    steps: [b('Record payments against an invoice; overdue balances show on the dashboard.', 'سجّل المدفوعات على الفاتورة؛ تظهر الأرصدة المتأخرة في لوحة التحكم.')],
    issues: [],
  },
  {
    key: 'portal',
    match: /^\/portal/,
    title: b('Client portal', 'بوابة العميل'),
    purpose: b('Where the client follows applications, answers requests, sees audits, findings, certificates and invoices.', 'المكان الذي يتابع فيه العميل طلباته، ويرد على الطلبات، ويطّلع على التدقيق والملاحظات والشهادات والفواتير.'),
    steps: [
      b('Answer open information requests before their due date.', 'رد على طلبات المعلومات المفتوحة قبل موعد استحقاقها.'),
      b('Check the audit plan and prepare the site.', 'راجع خطة التدقيق وجهّز الموقع.'),
      b('Respond to findings: correction, root cause, corrective action.', 'رد على الملاحظات: التصحيح، والسبب الجذري، والإجراء التصحيحي.'),
    ],
    issues: [],
  },
]

export const GENERIC_HELP: PageHelp = {
  key: 'generic',
  match: /.*/,
  title: b('This page', 'هذه الصفحة'),
  purpose: b('Part of the iCASCO certification system.', 'جزء من نظام iCASCO لمنح الشهادات.'),
  steps: [],
  issues: [],
}

/** Global questions that apply anywhere. */
export const GLOBAL_ISSUES: PageIssue[] = [
  { q: b('Something did not save', 'لم يُحفظ شيء ما'), a: b('Look for a red message near the button or a field outlined in red. Fix it and save again.', 'ابحث عن رسالة حمراء بجانب الزر أو حقل محاط باللون الأحمر. صحّحه ثم احفظ مرة أخرى.') },
  { q: b('Switch language', 'تغيير اللغة'), a: b('Use the globe in the header. Arabic switches the whole page to right-to-left.', 'استخدم رمز الكرة الأرضية في الترويسة. تعرض العربية الصفحة كاملة من اليمين إلى اليسار.') },
  { q: b('What comes next?', 'ما الخطوة التالية؟'), a: b('Follow the numbered phases in the sidebar; each page tells you the next step here.', 'اتبع المراحل المرقمة في القائمة الجانبية؛ وأذكر لك هنا الخطوة التالية في كل صفحة.') },
]

export function helpForPath(pathname: string): PageHelp {
  return PAGE_HELP.find((page) => page.match.test(pathname)) ?? GENERIC_HELP
}

/** Pages the assistant may send people to (route + name), given to the AI so links stay valid. */
export function assistantDestinations(lang: 'en' | 'ar'): Array<{ route: string; name: string }> {
  const routes: Array<[string, Bilingual]> = [
    [ROUTES.cabDashboard, b('Analytics and reports', 'التحليلات والتقارير')],
    [ROUTES.cabWorkspace, b('Workspace', 'مساحة العمل')],
    [ROUTES.cabCompanyProfile, b('Company profile', 'ملف الجهة')],
    [ROUTES.cabCompetence, b('Personnel & competence', 'الأفراد والكفاءة')],
    [ROUTES.cabAuditClients, b('Audit clients', 'عملاء التدقيق')],
    [ROUTES.cabContacts, b('Contacts', 'جهات الاتصال')],
    [ROUTES.cabApplicationRegister, b('Applications', 'الطلبات')],
    ['/cab/applications/receipt', b('Application receipt', 'استلام الطلب')],
    [ROUTES.cabApplicationReviewQueue, b('Review queue', 'قائمة المراجعة')],
    [ROUTES.cabApplicationInformationRequired, b('Information required', 'المعلومات المطلوبة')],
    [ROUTES.cabApplicationTechnicalFeasibility, b('Technical feasibility', 'الجدوى الفنية')],
    [ROUTES.cabApplicationQuotation, b('Quotation', 'عرض السعر')],
    [ROUTES.cabOffers, b('Offers', 'العروض')],
    [ROUTES.cabAuditPlanning, b('Audit planning', 'تخطيط التدقيق')],
    [ROUTES.cabAuditReporting, b('Audit reporting', 'تقارير التدقيق')],
    [ROUTES.cabNonconformities, b('Nonconformities', 'عدم المطابقة')],
    [ROUTES.cabDecisions, b('Decisions', 'القرارات')],
    [ROUTES.cabCertificates, b('Certificates', 'الشهادات')],
    [ROUTES.cabCertificationCycles, b('Certification cycles', 'دورات الشهادة')],
    [ROUTES.cabInvoices, b('Invoices', 'الفواتير')],
    [ROUTES.portalHome, b('Client portal', 'بوابة العميل')],
  ]
  return routes.map(([route, name]) => ({ route, name: name[lang] }))
}

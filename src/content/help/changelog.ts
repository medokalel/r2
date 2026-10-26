import type { HelpChangelogEntry } from '@/lib/help/types'

/**
 * "What's new" in iHelp. Append one entry per release, newest first is not required (the
 * overview sorts by date). Write both languages; never use em or en dashes.
 * See docs/IHELP.md.
 */
export const HELP_CHANGELOG: HelpChangelogEntry[] = [
  {
    id: '2026-10-28-iaf-md5-mapping-confirmed',
    date: '2026-10-28',
    audience: ['cab'],
    article: 'audit-time',
    module: 'cab.sidebar.quotation',
    text: {
      en: { title: 'IAF code to MD 5 category mapping confirmed', body: 'The product owner confirmed the link of every IAF code to its IAF MD 5 risk or complexity category on 25 October 2026. The Needs confirmation badge is gone: each code with a category shows Confirmed, and the confirmation is stated once in the classification panel and the PDF. Mixed, Partial and Interpreted notes stay as information with their alternatives. A code with no MD 5 entry now reads No MD 5 category; table time used.' },
      ar: { title: 'تأكيد ربط رموز IAF بفئات MD 5', body: 'أكّد مالك المنتج بتاريخ 25 أكتوبر 2026 ربط كل رمز IAF بفئة المخاطر أو التعقيد في IAF MD 5. وأُزيلت علامة «يحتاج إلى تأكيد»: يظهر لكل رمز له فئة «مؤكَّد»، ويُذكر التأكيد مرة واحدة في لوحة التصنيف وفي ملف PDF. وتبقى ملاحظات «مختلط» و«جزئي» و«تفسيري» للمعلومية مع بدائلها. ويظهر للرمز الذي ليس له مدخل في MD 5 «لا توجد فئة في MD 5، ويُستخدم وقت الجدول».' },
    },
  },
  {
    id: '2026-10-28-checklist-library-approved',
    date: '2026-10-28',
    audience: ['cab'],
    article: 'checklist-library',
    module: 'execution.nav.checklists',
    text: {
      en: { title: 'Checklist library approved', body: 'The product owner approved the iCASCO checklist library on 25 October 2026: 15 checklists with 401 items. The draft warning is replaced by an approval note, and library checklists carry the badge iCASCO library, approved, in the library and during audits. Items remain summaries in our own words with the clause number.' },
      ar: { title: 'اعتماد مكتبة قوائم التحقق', body: 'اعتمد مالك المنتج مكتبة قوائم التحقق في iCASCO بتاريخ 25 أكتوبر 2026: 15 قائمة تحقق تضم 401 بند. وحلّت ملاحظة الاعتماد محل تنبيه المسودة، وتحمل قوائم المكتبة علامة «مكتبة iCASCO المعتمدة» في المكتبة وأثناء التدقيق. وتبقى البنود ملخصات بصياغتنا مع رقم البند.' },
    },
  },
  {
    id: '2026-10-28-exception-second-approver-optional',
    date: '2026-10-28',
    audience: ['cab'],
    article: 'impartiality-register',
    module: 'team.nav.impartiality',
    text: {
      en: { title: 'Second approver for exceptions is optional', body: 'A second approver for team-selection exceptions is optional and off by default. Turn on Second approver for exceptions in Impartiality and availability, Rules, if the admin who requested an exception must not decide it.' },
      ar: { title: 'المعتمد الثاني للاستثناءات اختياري', body: 'المعتمد الثاني لاستثناءات اختيار الفريق اختياري وغير مفعّل افتراضياً. فعّل «معتمد ثانٍ للاستثناءات (اختياري)» في الحياد والتوافر، القواعد، إذا كان المسؤول الذي طلب الاستثناء لا يجوز أن يقرر فيه.' },
    },
  },
  {
    id: '2026-10-28-travel-providers-phase-2',
    date: '2026-10-28',
    audience: ['cab'],
    article: 'travel-estimate',
    module: 'travel.nav.policy',
    text: {
      en: { title: 'Travel price providers move to phase 2', body: 'Provider integration (flight, hotel and FX APIs) and your CAB\'s own confirmed rates come in phase 2. Until then, travel estimates use the configurable sample rates of the travel policy and every price is labelled an estimate, never a live price. A Phase 2 note is shown in Travel policy, Pricing providers.' },
      ar: { title: 'نقل مزودي أسعار السفر إلى المرحلة الثانية', body: 'يأتي ربط المزودين (واجهات برمجة الرحلات الجوية والفنادق وأسعار الصرف) والأسعار المؤكدة الخاصة بجهتك في المرحلة الثانية. وحتى ذلك الحين تعتمد تقديرات السفر على الأسعار النموذجية القابلة للتعديل في سياسة السفر، ويُوسم كل سعر بأنه تقدير وليس سعراً مباشراً. وتظهر ملاحظة المرحلة الثانية في سياسة السفر، مزودو الأسعار.' },
    },
  },
  {
    id: '2026-10-28-audit-time-recalculate',
    date: '2026-10-28',
    audience: ['cab'],
    article: 'audit-time',
    module: 'cab.sidebar.quotation',
    text: {
      en: { title: 'Recalculate a quotation and IAF MD 1 sample size', body: 'An open quotation can be recalculated with the current application data, sites and classification, with a recorded reason and the totals before and after. The multi-site sample now follows IAF MD 1 literally: x counts all sites under sampling with the central function, and the central function and new sites count inside the sample.' },
      ar: { title: 'إعادة حساب عرض السعر وحجم العينة وفق IAF MD 1', body: 'يمكن إعادة حساب عرض السعر المفتوح ببيانات الطلب والمواقع والتصنيف الحالية، مع سبب يُسجَّل والإجماليات قبل الحساب وبعده. وتتبع عينة المواقع المتعددة الآن IAF MD 1 حرفياً: يشمل x جميع المواقع الخاضعة للعينة مع الوظيفة المركزية، وتُحتسب الوظيفة المركزية والمواقع الجديدة ضمن العينة.' },
    },
  },
  {
    id: '2026-10-27-team-selection',
    date: '2026-10-27',
    audience: ['cab'],
    article: 'team-selection',
    text: {
      en: { title: 'Intelligent audit team selection and impartiality register', body: 'Audit plans and the technical feasibility review now recommend the team from the competence register, ranked by competence fit, availability, workload, sector experience, location and language, and explain why each person is eligible or not. The team is validated in real time (standards, IAF codes, critical-code exams, approval expiry, leave, double booking, impartiality) with qualified alternatives; mandatory requirements cannot be overridden and other issues need an approved exception. A plan is sent or started only with a confirmed team. New: impartiality register with annual and per audit declarations and a cooling-off rule, availability calendar, and the audit trail of every assignment.' },
      ar: { title: 'اختيار ذكي لفريق التدقيق وسجل للحياد', body: 'أصبحت خطط التدقيق ومراجعة الجدوى الفنية تقترح الفريق من سجل الكفاءة مرتباً حسب ملاءمة الكفاءة والتوافر وعبء العمل والخبرة القطاعية والموقع واللغة، مع توضيح سبب أهلية كل شخص أو عدمها. ويُفحص الفريق فورياً (المواصفات ورموز IAF واختبارات الرموز الحرجة وانتهاء الاعتماد والإجازات والحجز المزدوج والحياد) مع بدائل مؤهلة، ولا يمكن تجاوز المتطلبات الإلزامية، بينما تحتاج المسائل الأخرى إلى استثناء معتمد. ولا تُرسل الخطة ولا تبدأ إلا بفريق مؤكد. والجديد أيضاً: سجل الحياد مع الإقرارات السنوية وإقرارات كل تدقيق وقاعدة فترة التهدئة، وتقويم التوافر، وسجل التدقيق لكل تكليف.' },
    },
  },
  {
    id: '2026-10-27-audit-time-sectors-sites',
    date: '2026-10-27',
    audience: ['cab'],
    article: 'audit-time',
    module: 'cab.sidebar.quotation',
    text: {
      en: { title: 'Audit time: sector classification and multi-site register', body: 'The quotation suggests the IAF MD 5 risk or complexity category of ISO 9001, ISO 14001 and ISO 45001 from the IAF codes, explains why and how it changes the days, and lets authorised users change it with a recorded justification. The multi-site register evaluates each IAF MD 1 criterion, separates sampled sites from sites audited individually and shows the three-year cycle, with a printable breakdown.' },
      ar: { title: 'وقت التدقيق: تصنيف القطاع وسجل المواقع المتعددة', body: 'يقترح عرض السعر فئة المخاطر أو التعقيد وفق IAF MD 5 لمواصفات ISO 9001 وISO 14001 وISO 45001 من رموز IAF، ويوضح سببها وأثرها على الأيام، ويتيح للمستخدمين المخوّلين تغييرها مع مبرر يُسجَّل. ويقيّم سجل المواقع المتعددة كل معيار من IAF MD 1، ويفصل مواقع العينة عن المواقع التي تُدقَّق على حدة، ويعرض دورة السنوات الثلاث مع تفصيل قابل للطباعة.' },
    },
  },
  {
    id: '2026-10-27-travel-costs',
    date: '2026-10-27',
    audience: ['cab'],
    article: 'travel-estimate',
    module: 'travel.nav.policy',
    text: {
      en: { title: 'Smart travel and logistics cost calculator', body: 'The travel expenses of a quotation now come from a travel estimate: sites and auditor bases are located, itineraries by car, train and air are compared, and every line shows where its price comes from (live provider, benchmark, policy rate, manual or demo) with its validity. Adjustments need a justification, large ones a second approver. Audit plans record actual costs against the estimate. Set your rules and rates in Travel policy.' },
      ar: { title: 'حاسبة ذكية لتكاليف السفر والخدمات اللوجستية', body: 'أصبحت مصاريف السفر في عرض السعر تأتي من تقدير للسفر: تُحدَّد المواقع ومقار المدققين، وتُقارن خطط الرحلة بالسيارة والقطار والطيران، ويوضح كل بند مصدر سعره (مزود مباشر أو سعر مرجعي أو سعر السياسة أو يدوي أو تجريبي) مع صلاحيته. ويحتاج كل تعديل إلى مبرر، والتعديل الكبير إلى معتمد ثانٍ. وتسجل خطط التدقيق التكاليف الفعلية مقابل التقدير. اضبط قواعدك وأسعارك في سياسة السفر.' },
    },
  },
  {
    id: '2026-10-25-icasco-brand',
    date: '2026-10-25',
    audience: ['cab', 'client', 'platform'],
    text: {
      en: { title: 'One brand: iCASCO', body: 'The platform is now branded iCASCO everywhere: sign in and registration pages, sidebars, headers, the platform console, mobile views, browser tab icon, emails and documents generated by the platform. The logo keeps the same C mark, colours and lettering with a lowercase i added. Your own CAB logo, your certificates and your client data are not changed.' },
      ar: { title: 'علامة واحدة: iCASCO', body: 'أصبحت المنصة تحمل اسم iCASCO في كل مكان: صفحات تسجيل الدخول والتسجيل، والقوائم الجانبية، والترويسات، ولوحة إدارة المنصة، وواجهات الهاتف، وأيقونة تبويب المتصفح، والرسائل والمستندات التي تنشئها المنصة. ويحتفظ الشعار بعلامة C نفسها وبالألوان والحروف ذاتها مع إضافة حرف i صغير. ولا يتغير شعار جهتك ولا شهاداتك ولا بيانات عملائك.' },
    },
  },
  {
    id: '2026-10-27-audit-execution',
    date: '2026-10-27',
    audience: ['cab', 'client'],
    article: 'audit-execution',
    module: 'execution.nav.checklists',
    text: {
      en: { title: 'Audit execution, checklists and stage reports', body: 'Run an audit in six steps on a phone or a computer, even with a weak connection: opening meeting with signatures, checklists for 13 standards plus IMS and Stage 1 readiness, photos, time against the planned audit days, team review and closing meeting. A nonconforming item opens the finding form already filled. Stage reports follow ISO/IEC 17021-1 9.4.8, go through an independent technical review and are issued as a bilingual PDF that the client acknowledges in the portal.' },
      ar: { title: 'تنفيذ التدقيق وقوائم التحقق وتقارير المراحل', body: 'نفّذ التدقيق في ست خطوات على الهاتف أو الحاسوب حتى مع ضعف الاتصال: الاجتماع الافتتاحي مع التوقيعات، وقوائم تحقق لثلاثة عشر معياراً مع القائمة المتكاملة وجاهزية المرحلة الأولى، والصور، والوقت مقابل أيام التدقيق المخططة، ومراجعة الفريق، والاجتماع الختامي. ويفتح البند غير المطابق نموذج الملاحظة معبأً. وتتبع تقارير المراحل البند 9.4.8 من ISO/IEC 17021-1، وتمر بمراجعة فنية مستقلة، وتصدر بملف PDF ثنائي اللغة يؤكد العميل استلامه في البوابة.' },
    },
  },
  {
    id: '2026-10-27-certification-agreements',
    date: '2026-10-27',
    audience: ['cab', 'client'],
    article: 'agreements',
    module: 'agreements.nav.cab',
    text: {
      en: { title: 'Electronic certification agreements', body: 'A certification agreement is drafted when the client accepts the offer. Edit your bilingual template with variables, send the agreement, let the client sign it with an emailed code and countersign it. Every version is sealed with a SHA-256 fingerprint and the signed PDF has an audit-trail page. Stage 1, Stage 2 and recertification plans wait for an active agreement (or only warn, if you prefer).' },
      ar: { title: 'اتفاقيات منح الشهادة الإلكترونية', body: 'تُعدّ اتفاقية منح الشهادة عند قبول العميل للعرض. عدّل قالبك ثنائي اللغة بالمتغيرات، وأرسل الاتفاقية، ودع العميل يوقّعها برمز يصله بالبريد الإلكتروني، ثم وقّعها توقيعاً مقابلاً. يُختم كل إصدار ببصمة SHA-256، ويتضمن ملف PDF الموقع صفحة لسجل التدقيق. وتنتظر خطط المرحلة الأولى والثانية وإعادة منح الشهادة اتفاقية سارية (أو تكتفي بالتنبيه إن فضّلت ذلك).' },
    },
  },
  {
    id: '2026-10-25-excel-import',
    date: '2026-10-25',
    audience: ['cab'],
    article: 'data-migration',
    module: 'cab.sidebar.migration',
    text: {
      en: { title: 'Excel import and the data migration hub', body: 'Every register now has an Import menu with a template made for it. Upload the filled file, see the completeness of each row and what is missing, import what is usable and complete the rest from one list. The Build audit plan page imports the sections of a plan, and its site, remote and travel cards now edit and save.' },
      ar: { title: 'الاستيراد من Excel ومركز ترحيل البيانات', body: 'أصبح لكل سجل قائمة «استيراد» بقالب مُعدّ له. ارفع الملف بعد تعبئته، واطّلع على نسبة اكتمال كل صف وما ينقصه، واستورد ما يمكن استخدامه، واستكمل الباقي من قائمة واحدة. وتستورد صفحة إعداد خطة التدقيق أقسام الخطة، وأصبحت بطاقات الموقع والأنشطة عن بُعد والسفر قابلة للتعديل والحفظ.' },
    },
  },
  {
    id: '2026-10-26-sso',
    date: '2026-10-26',
    audience: ['cab', 'platform'],
    article: 'sso-setup',
    module: 'sso.nav',
    text: {
      en: { title: 'Single sign-on (SSO)', body: 'Staff can sign in with Microsoft Entra ID, Google Workspace, Okta or any SAML 2.0 provider. Administrators verify their email domains, test the connection, create users on first sign-in and can require single sign-on. Included in the Enterprise plan.' },
      ar: { title: 'تسجيل الدخول الموحد (SSO)', body: 'يمكن للموظفين الدخول عبر Microsoft Entra ID أو Google Workspace أو Okta أو أي مزود SAML 2.0. ويوثّق المسؤولون نطاقات البريد ويختبرون الاتصال وينشئون المستخدمين عند أول دخول ويمكنهم اشتراط الدخول الموحد. مشمول في الباقة المؤسسية.' },
    },
  },
  {
    id: '2026-10-25-ihelp',
    date: '2026-10-25',
    audience: ['cab', 'client', 'platform'],
    article: 'ihelp',
    module: 'iHelp',
    text: {
      en: { title: 'iHelp: the help center inside iCASCO', body: 'A guide for every screen in English and Arabic, with instant search, a ? button on every page and status tables taken from the app itself.' },
      ar: { title: 'iHelp: مركز المساعدة داخل iCASCO', body: 'دليل لكل شاشة بالعربية والإنجليزية، مع بحث فوري، وزر ؟ في كل صفحة، وجداول حالات مأخوذة من النظام نفسه.' },
    },
  },
  {
    id: '2026-10-25-platform-console',
    date: '2026-10-25',
    audience: ['platform'],
    article: 'platform-roles',
    module: 'platform.nav.dashboard',
    text: {
      en: { title: 'Platform admin console', body: 'Tenants, plans, invoices and payments, announcements, staff roles, an audit log, settings and support sign-in, in one console for the iCASCO team.' },
      ar: { title: 'لوحة إدارة المنصة', body: 'الجهات المشتركة والباقات والفواتير والمدفوعات والإعلانات وأدوار الفريق وسجل التدقيق والإعدادات والدخول بصفة الدعم الفني، في لوحة واحدة لفريق iCASCO.' },
    },
  },
  {
    id: '2026-10-25-subscriptions',
    date: '2026-10-25',
    audience: ['cab'],
    article: 'my-subscription',
    module: 'subscription.menuItem',
    text: {
      en: { title: 'My subscription and plan limits', body: 'See your plan, usage against user and certificate limits, included modules and iCASCO invoices, and request an upgrade. Modules outside your plan show a lock.' },
      ar: { title: 'اشتراكي وحدود الباقة', body: 'اطّلع على باقتك واستخدامك مقارنة بحدود المستخدمين والشهادات والوحدات المشمولة وفواتير iCASCO، واطلب الترقية. وتظهر الوحدات غير المشمولة بقفل.' },
    },
  },
  {
    id: '2026-10-24-quotation-approval',
    date: '2026-10-24',
    audience: ['cab'],
    article: 'quotation-approval',
    module: 'cab.sidebar.quotationApproval',
    text: {
      en: { title: 'Internal approval of quotations', body: 'Quotations are submitted for approval and approved by a second person before they can be issued. The approval queue shows what waits, what was returned and what is ready to issue.' },
      ar: { title: 'الاعتماد الداخلي لعروض الأسعار', body: 'تُرسل عروض الأسعار للاعتماد ويعتمدها شخص ثانٍ قبل إصدارها، وتعرض قائمة الاعتماد ما ينتظر وما أُعيد وما هو جاهز للإصدار.' },
    },
  },
  {
    id: '2026-10-24-offers',
    date: '2026-10-24',
    audience: ['cab', 'client'],
    article: 'offer-lifecycle',
    module: 'cab.sidebar.offers',
    text: {
      en: { title: 'Offers lifecycle', body: 'Offers move from draft to approval, issue and the client’s acceptance or rejection; accepted offers raise the advance invoice, and offers can be revised or voided.' },
      ar: { title: 'دورة حياة العروض', body: 'تنتقل العروض من المسودة إلى الاعتماد ثم الإصدار ثم قبول العميل أو رفضه، وينشئ العرض المقبول فاتورة الدفعة المقدمة، ويمكن تعديل العروض أو إلغاؤها.' },
    },
  },
  {
    id: '2026-10-24-certificate-lifecycle',
    date: '2026-10-24',
    audience: ['cab', 'client'],
    article: 'certificate-lifecycle',
    module: 'cab.sidebar.certificates',
    text: {
      en: { title: 'Reissue, reinstate and extend certificates', body: 'Reissue a certificate as a new revision, reinstate it after a suspension or extend its validity by up to six months, with every change kept in its history.' },
      ar: { title: 'إعادة إصدار الشهادات وإعادة تفعيلها وتمديدها', body: 'أعد إصدار الشهادة بمراجعة جديدة، أو أعد تفعيلها بعد التعليق، أو مدّد صلاحيتها حتى ستة أشهر، مع حفظ كل تغيير في سجلها.' },
    },
  },
  {
    id: '2026-10-24-cycles',
    date: '2026-10-24',
    audience: ['cab'],
    article: 'cycle-requests',
    module: 'cab.sidebar.certification',
    text: {
      en: { title: 'Certification cycles: requests and actions', body: 'Log scope changes, site changes and transfers on a certification cycle, then approve, reject and complete them from the cycle.' },
      ar: { title: 'دورات الشهادات: الطلبات والإجراءات', body: 'سجّل طلبات تغيير النطاق وتغيير المواقع والنقل على دورة الشهادة، ثم اعتمدها أو ارفضها وأكملها من الدورة.' },
    },
  },
  {
    id: '2026-10-23-audit-time',
    date: '2026-10-23',
    audience: ['cab'],
    article: 'audit-time',
    module: 'cab.sidebar.quotation',
    text: {
      en: { title: 'Audit-time engine (IAF MD 5, MD 1, MD 11)', body: 'Audit days are calculated per standard with adjustment factors, multi-site sampling, integrated-system reduction and remote share, and every step is shown in the quotation.' },
      ar: { title: 'محرك وقت التدقيق (IAF MD 5 وMD 1 وMD 11)', body: 'تُحسب أيام التدقيق لكل مواصفة مع عوامل التعديل وعيّنات المواقع المتعددة وتخفيض الأنظمة المتكاملة ونسبة التدقيق عن بُعد، وتظهر كل خطوة في عرض السعر.' },
    },
  },
  {
    id: '2026-10-23-notifications',
    date: '2026-10-23',
    audience: ['cab', 'client'],
    article: 'notification-preferences',
    module: 'notifications',
    text: {
      en: { title: 'Notifications by email and SMS', body: 'Choose in My profile which notifications also reach you by email or by SMS (through Unifonic). In-app notifications stay on.' },
      ar: { title: 'الإشعارات بالبريد الإلكتروني والرسائل النصية', body: 'اختر من ملفك الشخصي الإشعارات التي تصلك أيضاً بالبريد الإلكتروني أو بالرسائل النصية (عبر Unifonic)، وتبقى إشعارات النظام مفعّلة.' },
    },
  },
  {
    id: '2026-10-23-zatca',
    date: '2026-10-23',
    audience: ['cab', 'client'],
    article: 'zatca-einvoice',
    module: 'cab.sidebar.invoices',
    text: {
      en: { title: 'ZATCA e-invoicing and Saudi national address', body: 'Tax invoices of CABs registered in Saudi Arabia carry the ZATCA QR code and e-invoice, and the national address can be filled from Saudi Post (SPL) with the short address.' },
      ar: { title: 'الفوترة الإلكترونية مع زاتكا والعنوان الوطني', body: 'تحمل الفواتير الضريبية لجهات منح الشهادات المسجلة في المملكة رمز زاتكا والفاتورة الإلكترونية، ويمكن تعبئة العنوان الوطني من البريد السعودي (سبل) بالعنوان المختصر.' },
    },
  },
  {
    id: '2026-10-22-fee-catalog',
    date: '2026-10-22',
    audience: ['cab'],
    article: 'fee-catalog',
    module: 'cab.sidebar.invoices',
    text: {
      en: { title: 'Fee catalog and AED invoices', body: 'Keep your fee items and invoice currencies in one catalog, now including the UAE dirham (AED).' },
      ar: { title: 'كتالوج الرسوم والفواتير بالدرهم', body: 'احفظ بنود الرسوم وعملات الفوترة في كتالوج واحد، ويشمل الآن الدرهم الإماراتي.' },
    },
  },
  {
    id: '2026-10-22-cab-profile',
    date: '2026-10-22',
    audience: ['cab'],
    article: 'cab-profile',
    module: 'cab.sidebar.companyProfile',
    text: {
      en: { title: 'CAB Profile improvements', body: 'Schemes show their companion certification body standard, man-day rates per currency and per standard in any world currency, upload tiles, clickable error summaries and clearer messages.' },
      ar: { title: 'تحسينات ملف جهة المنح', body: 'تعرض المخططات متطلب جهة منح الشهادات المرافق لها، وأسعار يوم العمل لكل عملة ولكل مواصفة بأي عملة في العالم، ومربعات رفع الملفات، وقوائم أخطاء قابلة للنقر، ورسائل أوضح.' },
    },
  },
  {
    id: '2026-10-22-accreditation-bodies',
    date: '2026-10-22',
    audience: ['cab'],
    article: 'cab-profile',
    module: 'cab.sidebar.companyProfile',
    text: {
      en: { title: 'Global catalog of 133 accreditation bodies', body: 'Choose your accreditation body from a worldwide list showing IAF MLA and ILAC MRA recognition.' },
      ar: { title: 'دليل عالمي يضم 133 جهة اعتماد', body: 'اختر جهة الاعتماد من قائمة عالمية تعرض الاعتراف ضمن IAF MLA وILAC MRA.' },
    },
  },
  {
    id: '2026-10-21-arabic-review',
    date: '2026-10-21',
    audience: ['cab', 'client'],
    text: {
      en: { title: 'Arabic language review', body: 'The Arabic interface was reviewed end to end in Modern Standard Arabic, with consistent terms across every screen.' },
      ar: { title: 'مراجعة اللغة العربية', body: 'رُوجعت الواجهة العربية كاملةً بالعربية الفصحى مع توحيد المصطلحات في جميع الشاشات.' },
    },
  },
]

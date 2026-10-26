/**
 * Critical IAF codes and their qualification exams.
 *
 * Which codes count as "critical" is the CAB's own policy (set out in its competence
 * procedure / accreditation scope), not an IAF list. The defaults below are the sectors
 * CABs most often treat as high-risk; change CRITICAL_IAF_CODES to match your procedure.
 *
 * Each exam is multiple choice, scored on the share of correct answers. A person is
 * authorised for a critical code under a standard only after passing its exam.
 */

export const CRITICAL_IAF_CODES = ['03', '11', '12', '13', '28', '38'] as const

/** Share of correct answers needed to pass (80 %). */
export const EXAM_PASS_MARK = 0.8

export interface ExamQuestion {
  id: string
  en: { q: string; options: string[] }
  ar: { q: string; options: string[] }
  /** Index of the correct option (same order in both languages). */
  answer: number
}

/** "14", "IAF 14", "IAF_14" → "14" */
export function iafDigits(code: string): string {
  const match = code.match(/(\d{1,2})/)
  return match ? match[1].padStart(2, '0') : code.trim()
}

export function isCriticalIafCode(code: string): boolean {
  return (CRITICAL_IAF_CODES as readonly string[]).includes(iafDigits(code))
}

const BANK: Record<string, ExamQuestion[]> = {
  '03': [
    {
      id: '03-1', answer: 0,
      en: { q: 'Which hazard groups must a food safety hazard analysis cover?', options: ['Biological, chemical (including allergens) and physical', 'Biological only', 'Chemical and environmental only', 'Packaging and labelling only'] },
      ar: { q: 'ما مجموعات المخاطر التي يجب أن يغطيها تحليل مخاطر سلامة الغذاء؟', options: ['البيولوجية والكيميائية (بما فيها مسببات الحساسية) والفيزيائية', 'البيولوجية فقط', 'الكيميائية والبيئية فقط', 'التعبئة والتغليف وبطاقات البيان فقط'] },
    },
    {
      id: '03-2', answer: 2,
      en: { q: 'What does HACCP stand for?', options: ['Health and Allergen Control Check Point', 'Hygiene Assessment and Critical Cleaning Plan', 'Hazard Analysis and Critical Control Point', 'Hazard Audit and Corrective Control Process'] },
      ar: { q: 'ماذا يعني اختصار HACCP؟', options: ['نقطة فحص الصحة ومسببات الحساسية', 'تقييم النظافة وخطة التنظيف الحرجة', 'تحليل المخاطر ونقاط التحكم الحرجة', 'تدقيق المخاطر وعملية التحكم التصحيحي'] },
    },
    {
      id: '03-3', answer: 1,
      en: { q: 'A critical control point (CCP) is a step where…', options: ['Any quality check is recorded', 'Control is essential to prevent, eliminate or reduce a food safety hazard to an acceptable level', 'Raw materials are received', 'The product is labelled'] },
      ar: { q: 'نقطة التحكم الحرجة (CCP) هي خطوة…', options: ['يُسجَّل فيها أي فحص للجودة', 'يكون التحكم فيها ضرورياً لمنع خطر على سلامة الغذاء أو إزالته أو خفضه إلى مستوى مقبول', 'تُستلم فيها المواد الخام', 'يُوضع فيها الملصق على المنتج'] },
    },
    {
      id: '03-4', answer: 3,
      en: { q: 'Prerequisite programmes (PRPs) are…', options: ['Steps of the HACCP plan', 'Customer complaint procedures', 'Marketing approvals', 'Basic conditions and activities that keep a hygienic environment, e.g. cleaning and pest control'] },
      ar: { q: 'البرامج الأولية (PRPs) هي…', options: ['خطوات خطة HACCP', 'إجراءات شكاوى العملاء', 'موافقات تسويقية', 'الشروط والأنشطة الأساسية للحفاظ على بيئة صحية، مثل التنظيف ومكافحة الآفات'] },
    },
    {
      id: '03-5', answer: 0,
      en: { q: 'Which evidence best shows a CCP was under control during an audit?', options: ['Monitoring records against the critical limit, with corrections when limits were exceeded', 'The HACCP team list', 'A signed food safety policy', 'Supplier price lists'] },
      ar: { q: 'ما الدليل الأفضل أثناء التدقيق على أن نقطة التحكم الحرجة كانت تحت السيطرة؟', options: ['سجلات المراقبة مقابل الحد الحرج، مع التصحيحات عند تجاوز الحدود', 'قائمة فريق HACCP', 'سياسة سلامة غذاء موقّعة', 'قوائم أسعار الموردين'] },
    },
  ],
  '11': [
    {
      id: '11-1', answer: 1,
      en: { q: 'The ALARA principle means radiation exposure is kept…', options: ['Always at zero', 'As low as reasonably achievable', 'At the legal limit', 'Equal for all workers'] },
      ar: { q: 'مبدأ ALARA يعني إبقاء التعرض للإشعاع…', options: ['صفراً دائماً', 'عند أدنى مستوى يمكن تحقيقه بشكل معقول', 'عند الحد القانوني', 'متساوياً لجميع العاملين'] },
    },
    {
      id: '11-2', answer: 2,
      en: { q: 'The three basic means of external radiation protection are…', options: ['Speed, height and light', 'Training, signage and audits', 'Time, distance and shielding', 'Gloves, masks and boots'] },
      ar: { q: 'الوسائل الأساسية الثلاث للحماية من الإشعاع الخارجي هي…', options: ['السرعة والارتفاع والضوء', 'التدريب واللافتات والتدقيق', 'الزمن والمسافة والتدريع', 'القفازات والأقنعة والأحذية'] },
    },
    {
      id: '11-3', answer: 0,
      en: { q: 'A personal dosimeter is used to…', options: ['Measure the radiation dose a worker receives', 'Detect gas leaks', 'Measure noise', 'Check air humidity'] },
      ar: { q: 'يُستخدم مقياس الجرعة الشخصي من أجل…', options: ['قياس جرعة الإشعاع التي يتلقاها العامل', 'كشف تسرب الغاز', 'قياس الضوضاء', 'قياس رطوبة الهواء'] },
    },
    {
      id: '11-4', answer: 3,
      en: { q: 'Nuclear criticality safety aims to…', options: ['Reduce electricity costs', 'Speed up fuel production', 'Improve fuel appearance', 'Prevent an uncontrolled nuclear chain reaction'] },
      ar: { q: 'تهدف سلامة الحرجية النووية إلى…', options: ['خفض تكاليف الكهرباء', 'تسريع إنتاج الوقود', 'تحسين مظهر الوقود', 'منع تفاعل نووي متسلسل غير متحكم فيه'] },
    },
    {
      id: '11-5', answer: 1,
      en: { q: 'Radioactive waste must be…', options: ['Mixed with general waste', 'Classified, segregated and stored or disposed of under regulatory control', 'Diluted and released', 'Kept on the production floor'] },
      ar: { q: 'يجب أن تكون النفايات المشعة…', options: ['مخلوطة بالنفايات العامة', 'مصنفة ومفصولة ومخزنة أو متخلَّصاً منها تحت رقابة تنظيمية', 'مخففة ومطلقة', 'محفوظة في صالة الإنتاج'] },
    },
  ],
  '12': [
    {
      id: '12-1', answer: 2,
      en: { q: 'Under the GHS, a safety data sheet (SDS) has how many sections?', options: ['8', '12', '16', '20'] },
      ar: { q: 'وفق النظام المتوافق عالمياً (GHS)، كم قسماً في صحيفة بيانات السلامة (SDS)؟', options: ['8', '12', '16', '20'] },
    },
    {
      id: '12-2', answer: 0,
      en: { q: 'Incompatible chemicals in storage should be…', options: ['Segregated so they cannot react together', 'Stored alphabetically', 'Stored on the same shelf to save space', 'Kept in unlabelled containers'] },
      ar: { q: 'يجب تخزين المواد الكيميائية غير المتوافقة…', options: ['منفصلة بحيث لا يمكن أن تتفاعل معاً', 'بترتيب أبجدي', 'على الرف نفسه لتوفير المساحة', 'في عبوات بلا ملصقات'] },
    },
    {
      id: '12-3', answer: 3,
      en: { q: 'Before changing a process or equipment in a chemical plant, the site should apply…', options: ['A price review', 'A marketing plan', 'An HR interview', 'Management of change, including a hazard review'] },
      ar: { q: 'قبل تغيير عملية أو معدّة في مصنع كيميائي، يجب أن يطبق الموقع…', options: ['مراجعة للأسعار', 'خطة تسويق', 'مقابلة موارد بشرية', 'إدارة التغيير، بما فيها مراجعة المخاطر'] },
    },
    {
      id: '12-4', answer: 1,
      en: { q: 'GHS pictograms on a label communicate…', options: ['The manufacturer’s brand', 'The hazard classes of the chemical', 'The product price', 'The storage temperature only'] },
      ar: { q: 'رموز GHS على الملصق تبيّن…', options: ['العلامة التجارية للمصنّع', 'فئات الخطورة للمادة الكيميائية', 'سعر المنتج', 'درجة حرارة التخزين فقط'] },
    },
    {
      id: '12-5', answer: 0,
      en: { q: 'Batch traceability in chemical production links…', options: ['Raw material lots to finished product batches and their customers', 'Employees to their shifts only', 'Invoices to payments only', 'Machines to their suppliers only'] },
      ar: { q: 'التتبع بالدفعات في الإنتاج الكيميائي يربط…', options: ['دفعات المواد الخام بدفعات المنتج النهائي وعملائها', 'العاملين بورديّاتهم فقط', 'الفواتير بالمدفوعات فقط', 'الآلات بمورديها فقط'] },
    },
  ],
  '13': [
    {
      id: '13-1', answer: 1,
      en: { q: 'In pharmaceuticals, GMP stands for…', options: ['General Medical Policy', 'Good Manufacturing Practice', 'Global Market Permit', 'Good Marketing Plan'] },
      ar: { q: 'في الصناعات الدوائية، يعني GMP…', options: ['السياسة الطبية العامة', 'ممارسات التصنيع الجيدة', 'تصريح السوق العالمي', 'خطة التسويق الجيدة'] },
    },
    {
      id: '13-2', answer: 2,
      en: { q: 'Cleanroom classes are defined by…', options: ['Room size', 'Number of operators', 'The concentration of airborne particles', 'Wall colour'] },
      ar: { q: 'تُحدَّد فئات الغرف النظيفة بحسب…', options: ['مساحة الغرفة', 'عدد المشغلين', 'تركيز الجسيمات العالقة في الهواء', 'لون الجدران'] },
    },
    {
      id: '13-3', answer: 0,
      en: { q: 'Process validation shows that…', options: ['The process consistently produces product meeting its specifications', 'The equipment is new', 'Staff attended induction', 'The site has a quality policy'] },
      ar: { q: 'يُثبت التحقق من صحة العملية (Process validation) أن…', options: ['العملية تنتج باستمرار منتجاً مطابقاً لمواصفاته', 'المعدات جديدة', 'العاملين حضروا التدريب التعريفي', 'لدى الموقع سياسة جودة'] },
    },
    {
      id: '13-4', answer: 3,
      en: { q: 'A batch can be released for sale only after…', options: ['The sales team approves it', 'It is packed', 'One unit is tested', 'The batch record is reviewed and the batch certified by the authorised (qualified) person'] },
      ar: { q: 'لا يمكن الإفراج عن دفعة للبيع إلا بعد…', options: ['موافقة فريق المبيعات', 'تعبئتها', 'فحص وحدة واحدة', 'مراجعة سجل الدفعة واعتمادها من الشخص المفوض (المؤهل)'] },
    },
    {
      id: '13-5', answer: 1,
      en: { q: 'A deviation from an approved procedure must be…', options: ['Ignored if the product looks fine', 'Documented, investigated for root cause and followed by CAPA', 'Reported only at year end', 'Corrected without records'] },
      ar: { q: 'يجب التعامل مع أي انحراف عن إجراء معتمد بأن…', options: ['يُتجاهل إذا بدا المنتج سليماً', 'يُوثَّق ويُحقَّق في سببه الجذري ويُتبع بإجراءات تصحيحية ووقائية (CAPA)', 'يُبلَّغ عنه في نهاية العام فقط', 'يُصحَّح دون سجلات'] },
    },
  ],
  '28': [
    {
      id: '28-1', answer: 0,
      en: { q: 'The most frequent cause of fatal accidents in construction is…', options: ['Falls from height', 'Paper cuts', 'Noise', 'Poor lighting in offices'] },
      ar: { q: 'السبب الأكثر شيوعاً للحوادث المميتة في الإنشاءات هو…', options: ['السقوط من المرتفعات', 'الجروح الورقية', 'الضوضاء', 'ضعف الإضاءة في المكاتب'] },
    },
    {
      id: '28-2', answer: 2,
      en: { q: 'A "hold point" in an inspection and test plan (ITP) means…', options: ['Work may continue while waiting', 'Only the client may inspect', 'Work must not proceed until the inspection is done and released', 'The item is on hold for payment'] },
      ar: { q: 'نقطة التوقف (Hold point) في خطة الفحص والاختبار (ITP) تعني…', options: ['يمكن استمرار العمل أثناء الانتظار', 'يفحص العميل فقط', 'لا يُستكمل العمل قبل إجراء الفحص والإفراج عنه', 'البند معلّق لحين الدفع'] },
    },
    {
      id: '28-3', answer: 1,
      en: { q: 'Before excavating, a key control is to…', options: ['Order the concrete', 'Locate underground services and support or slope the trench sides', 'Paint the site boundary', 'Remove the site office'] },
      ar: { q: 'قبل الحفر، من الضوابط الأساسية…', options: ['طلب الخرسانة', 'تحديد مواقع الخدمات تحت الأرض وتدعيم جوانب الخندق أو تمييلها', 'طلاء حدود الموقع', 'إزالة مكتب الموقع'] },
    },
    {
      id: '28-4', answer: 3,
      en: { q: 'A permit-to-work system is used for…', options: ['Paying subcontractors', 'Recording attendance', 'Ordering materials', 'High-risk tasks such as hot work or confined space entry'] },
      ar: { q: 'يُستخدم نظام تصريح العمل من أجل…', options: ['الدفع لمقاولي الباطن', 'تسجيل الحضور', 'طلب المواد', 'المهام عالية الخطورة مثل الأعمال الساخنة أو دخول الأماكن المحصورة'] },
    },
    {
      id: '28-5', answer: 0,
      en: { q: 'Which documents show that construction work is executed under control?', options: ['Approved method statements, ITPs and signed inspection records against current drawings', 'The company brochure', 'Bank statements', 'The organisation chart only'] },
      ar: { q: 'ما المستندات التي تثبت أن أعمال الإنشاء تُنفَّذ تحت السيطرة؟', options: ['بيانات طرق العمل المعتمدة وخطط الفحص والاختبار وسجلات الفحص الموقّعة مقابل المخططات السارية', 'كتيب الشركة', 'كشوف الحساب البنكية', 'الهيكل التنظيمي فقط'] },
    },
  ],
  '38': [
    {
      id: '38-1', answer: 1,
      en: { q: 'Healthcare waste should be…', options: ['Mixed with household waste', 'Segregated at source by category (e.g. sharps, infectious) in marked containers', 'Burned on site in open air', 'Stored in patient rooms'] },
      ar: { q: 'يجب التعامل مع نفايات الرعاية الصحية بأن…', options: ['تُخلط بالنفايات المنزلية', 'تُفصل من المصدر حسب الفئة (مثل الأدوات الحادة والمعدية) في حاويات مميزة', 'تُحرق في الموقع في الهواء الطلق', 'تُحفظ في غرف المرضى'] },
    },
    {
      id: '38-2', answer: 0,
      en: { q: 'Evidence that a steriliser works correctly includes…', options: ['Cycle records and chemical/biological indicator results', 'The purchase invoice', 'The room temperature log only', 'Staff rota'] },
      ar: { q: 'من أدلة عمل جهاز التعقيم بشكل صحيح…', options: ['سجلات الدورات ونتائج المؤشرات الكيميائية والبيولوجية', 'فاتورة الشراء', 'سجل حرارة الغرفة فقط', 'جدول مناوبات العاملين'] },
    },
    {
      id: '38-3', answer: 2,
      en: { q: 'Patient records must be…', options: ['Open to all staff and visitors', 'Kept only on paper', 'Confidential, with access limited to authorised people', 'Deleted after each visit'] },
      ar: { q: 'يجب أن تكون سجلات المرضى…', options: ['متاحة لجميع العاملين والزوار', 'ورقية فقط', 'سرية، ويقتصر الوصول إليها على المصرّح لهم', 'محذوفة بعد كل زيارة'] },
    },
    {
      id: '38-4', answer: 3,
      en: { q: 'The competence of clinical staff is shown by…', options: ['Years at the company only', 'Their job title', 'A uniform', 'Valid professional licences and training records'] },
      ar: { q: 'تثبت كفاءة الكوادر السريرية من خلال…', options: ['سنوات العمل في الشركة فقط', 'المسمى الوظيفي', 'الزي الموحد', 'التراخيص المهنية السارية وسجلات التدريب'] },
    },
    {
      id: '38-5', answer: 1,
      en: { q: 'A key safety risk to monitor in healthcare is…', options: ['Office supply costs', 'Healthcare-associated infections and patient safety incidents', 'Car park size', 'Website traffic'] },
      ar: { q: 'من أهم مخاطر السلامة الواجب مراقبتها في الرعاية الصحية…', options: ['تكلفة المستلزمات المكتبية', 'العدوى المرتبطة بالرعاية الصحية وحوادث سلامة المرضى', 'مساحة موقف السيارات', 'زيارات الموقع الإلكتروني'] },
    },
  ],
}

/** Used for a code marked critical by the CAB that has no sector bank yet. */
const GENERIC: ExamQuestion[] = [
  {
    id: 'g-1', answer: 0,
    en: { q: 'Before an auditor is assigned to a technical area, the CAB must…', options: ['Have evidence of the auditor’s competence in that technical area', 'Only check availability', 'Ask the client', 'Check the auditor’s nationality'] },
    ar: { q: 'قبل تكليف مدقق بمجال فني، يجب على جهة منح الشهادات…', options: ['امتلاك دليل على كفاءة المدقق في ذلك المجال الفني', 'التحقق من توفره فقط', 'سؤال العميل', 'التحقق من جنسية المدقق'] },
  },
  {
    id: 'g-2', answer: 2,
    en: { q: 'In a high-risk sector, audit time and sampling should…', options: ['Always be minimum', 'Be the same as a low-risk office', 'Reflect the sector risk and the complexity of the processes', 'Be decided by the client'] },
    ar: { q: 'في القطاعات عالية المخاطر، يجب أن يكون وقت التدقيق وحجم العينة…', options: ['عند الحد الأدنى دائماً', 'مثل مكتب منخفض المخاطر', 'متناسبين مع مخاطر القطاع وتعقيد العمليات', 'بقرار من العميل'] },
  },
  {
    id: 'g-3', answer: 1,
    en: { q: 'Legal and regulatory requirements for the sector should be…', options: ['Ignored by the auditor', 'Understood by the auditor so their implementation can be audited', 'Checked only by the client', 'Audited only at recertification'] },
    ar: { q: 'المتطلبات القانونية والتنظيمية الخاصة بالقطاع يجب أن…', options: ['يتجاهلها المدقق', 'يفهمها المدقق ليتمكن من تدقيق تطبيقها', 'يتحقق منها العميل فقط', 'تُدقَّق عند إعادة منح الشهادة فقط'] },
  },
  {
    id: 'g-4', answer: 3,
    en: { q: 'Objective evidence in an audit is…', options: ['The auditor’s opinion', 'A rumour from staff', 'A future plan', 'Records, statements of fact or other information that can be verified'] },
    ar: { q: 'الدليل الموضوعي في التدقيق هو…', options: ['رأي المدقق', 'كلام متداول بين العاملين', 'خطة مستقبلية', 'سجلات أو بيانات حقائق أو معلومات أخرى يمكن التحقق منها'] },
  },
  {
    id: 'g-5', answer: 0,
    en: { q: 'A major nonconformity in a critical process means…', options: ['The system may not achieve its intended results; certification cannot be granted until it is corrected', 'A small typo', 'An opportunity for improvement', 'Nothing until the next audit'] },
    ar: { q: 'عدم المطابقة الرئيسية في عملية حرجة تعني…', options: ['أن النظام قد لا يحقق نتائجه المرجوة، ولا يمكن منح الشهادة قبل تصحيحها', 'خطأ مطبعي بسيط', 'فرصة للتحسين', 'لا شيء حتى التدقيق القادم'] },
  },
]

export function getExamQuestions(code: string): ExamQuestion[] {
  return BANK[iafDigits(code)] ?? GENERIC
}

import type { HelpArticleSource } from '@/lib/help/types'

/** CAB articles, converted from the bilingual user guide. Edit freely: this file is the source now. */
export const CAB_GUIDE_ARTICLES: HelpArticleSource[] = [
  {
    "id": "login",
    "audience": "cab",
    "section": "start",
    "routes": [
      "/login",
      "/forgot-password"
    ],
    "updated": "2026-10-24",
    "capture": {
      "as": "client",
      "route": "/login"
    },
    "text": {
      "en": {
        "title": "Sign in",
        "summary": "The single entry point to iCASCO. CAB staff and audit-client users sign in here, and each user is taken straight to their own workspace.",
        "who": "CAB administrators and staff, and audit-client users such as the client’s quality manager.",
        "when": "At the start of every session, or after the session expired or you signed out.",
        "nav": "Open the platform link → Log In page (/login)",
        "handoff": "Audit clients use this same screen to reach their portal once the CAB has registered them.",
        "screen": [
          "Globe icon: switch the interface between Arabic and English.",
          "E-mail field (or user name).",
          "Password field with a show/hide button.",
          "Remember Me keeps the session on this device.",
          "Forgot Password? starts account recovery.",
          "Log In stays disabled until the entries are valid."
        ],
        "steps": [
          "Pick the interface language from the globe icon if needed.",
          "Type your work e-mail in E-mail.",
          "Type your password; use the eye icon to check it.",
          "Tick Remember Me only on a trusted personal device.",
          "Click Log In.",
          "CAB users land on the Application Hub; client users land on the client portal Home."
        ],
        "rules": [
          "An invalid format shows “Please enter a valid email address” under the field.",
          "Log In is disabled until the identifier is valid and the password has 6+ characters.",
          "A failed sign-in shows an error message; your entries are kept.",
          "With a valid session already open, the page skips straight to your workspace."
        ],
        "after": [
          "CAB admin → Application Hub (/workspace).",
          "Client user → client portal Home.",
          "If the CAB setup is not finished, the user is sent to the setup wizard."
        ],
        "tips": [
          "Do not use Remember Me on shared computers.",
          "A client registered by the CAB receives a welcome e-mail with a temporary password; they can change it with Forgot Password?.",
          "“Register now” is for registering a new organisation, not for existing CAB staff."
        ],
        "fields": [
          [
            "E-mail",
            "Your registered work e-mail. A user name of 3+ characters is also accepted and completed with @icasco.co."
          ],
          [
            "Password",
            "Log In is enabled only once at least 6 characters are typed."
          ],
          [
            "Remember Me",
            "On: the session survives closing the browser. Off: it ends when the window closes."
          ]
        ],
        "sections": [
          {
            "id": "login-forgot",
            "title": "Reset a forgotten password",
            "bullets": [
              "Open it from Forgot Password? on the Log In screen.",
              "Step 1: enter your e-mail and click Send Code.",
              "Step 2 (Enter OTP Code): type the 6-digit code and click Confirm.",
              "Resend code becomes active when the countdown ends.",
              "Step 3 (Reset Password): type the new password and confirm it.",
              "Both passwords must match or the button stays disabled.",
              "Success shows “Password reset successfully” with Back to login.",
              "Failure shows “Password reset failed” with Try again."
            ]
          },
          {
            "id": "login-language",
            "title": "Switch the interface language",
            "bullets": [
              "Click the globe icon at the top of the page.",
              "Choose English or العربية.",
              "All labels change at once; Arabic switches the layout to right-to-left.",
              "The browser remembers your choice for the next visit.",
              "The same icon sits in every page header, next to notifications.",
              "Switching language does not translate your data; client names and documents stay as entered."
            ]
          }
        ]
      },
      "ar": {
        "title": "تسجيل الدخول",
        "summary": "بوابة الدخول الموحدة إلى iCASCO. يدخل منها موظفو جهة منح الشهادات وعملاء التدقيق، ويُوجَّه كل مستخدم تلقائياً إلى مساحة عمله.",
        "who": "مدير جهة منح الشهادات وموظفوها، ومستخدمو العميل (مثل مدير الجودة لدى المنشأة).",
        "when": "في بداية كل جلسة عمل، أو بعد انتهاء الجلسة أو تسجيل الخروج.",
        "nav": "افتح رابط المنصة ← صفحة تسجيل الدخول (/login)",
        "handoff": "الشاشة نفسها يستخدمها العميل للدخول إلى بوابته بعد أن تسجله الجهة.",
        "screen": [
          "أيقونة الكرة الأرضية لتبديل لغة الواجهة بين العربية والإنجليزية.",
          "حقل البريد الإلكتروني (أو اسم المستخدم).",
          "حقل كلمة المرور مع زر إظهار/إخفاء.",
          "خيار «تذكرني» لإبقاء الجلسة محفوظة على هذا الجهاز.",
          "رابط «نسيت كلمة المرور؟» لاستعادة الحساب.",
          "زر «تسجيل الدخول»، ويبقى معطلاً حتى تكتمل البيانات."
        ],
        "steps": [
          "اختر لغة الواجهة من أيقونة الكرة الأرضية إن لزم.",
          "أدخل بريدك الإلكتروني في حقل «البريد الإلكتروني».",
          "أدخل كلمة المرور، واضغط أيقونة العين للتأكد منها.",
          "فعّل «تذكرني» إذا كنت على جهاز شخصي موثوق.",
          "اضغط «تسجيل الدخول».",
          "ينقلك النظام إلى «مركز التطبيقات» إن كنت من جهة المنح، أو إلى الصفحة الرئيسية لبوابة العميل إن كنت عميلاً."
        ],
        "rules": [
          "تظهر رسالة «يرجى إدخال بريد إلكتروني صالح» إذا كانت الصيغة غير صحيحة.",
          "زر «تسجيل الدخول» معطل حتى يكون المعرّف صالحاً وكلمة المرور 6 أحرف فأكثر.",
          "عند فشل الدخول تظهر رسالة خطأ منبثقة دون مسح البيانات المدخلة.",
          "إذا كانت لديك جلسة سارية، يتجاوز النظام هذه الصفحة وينقلك مباشرة إلى مساحة عملك."
        ],
        "after": [
          "مدير جهة المنح يصل إلى «مركز التطبيقات» (/workspace).",
          "مستخدم العميل يصل إلى الصفحة الرئيسية لبوابة العميل.",
          "إذا لم يكتمل إعداد الجهة بعد، يُوجَّه المستخدم إلى معالج الإعداد."
        ],
        "tips": [
          "لا تفعّل «تذكرني» على الأجهزة المشتركة.",
          "عميل التدقيق الذي سجّلته الجهة يستلم بريد ترحيب بكلمة مرور مؤقتة، ويمكنه تغييرها من «نسيت كلمة المرور؟».",
          "رابط «سجّل الآن» مخصص لتسجيل منشأة جديدة، وليس لموظفي الجهة الحاليين."
        ],
        "fields": [
          [
            "البريد الإلكتروني",
            "بريد العمل المسجل. يقبل النظام أيضاً اسم مستخدم من 3 أحرف فأكثر ويكمله تلقائياً بنطاق @icasco.co."
          ],
          [
            "كلمة المرور",
            "لا يتفعّل زر الدخول قبل إدخال 6 أحرف على الأقل."
          ],
          [
            "تذكرني",
            "عند تفعيله تبقى الجلسة بعد إغلاق المتصفح؛ وبدونه تنتهي بإغلاق النافذة."
          ]
        ],
        "sections": [
          {
            "id": "login-forgot",
            "title": "استعادة كلمة المرور",
            "bullets": [
              "افتح الصفحة من رابط «نسيت كلمة المرور؟» في شاشة الدخول.",
              "الخطوة 1: أدخل بريدك ثم اضغط «إرسال الرمز».",
              "الخطوة 2: «أدخل كود OTP»: اكتب الكود المكون من 6 أرقام ثم اضغط «تأكيد».",
              "يتفعّل «إعادة الإرسال» بعد انتهاء العدّاد إذا لم يصلك الكود.",
              "الخطوة 3: «إعادة تعيين كلمة المرور»: أدخل كلمة المرور الجديدة وأكّدها.",
              "يجب أن تتطابق كلمتا المرور، وإلا يبقى الزر معطلاً.",
              "عند النجاح تظهر «تمت إعادة تعيين كلمة المرور» مع زر «العودة لتسجيل الدخول».",
              "عند الفشل تظهر «فشل إعادة تعيين كلمة المرور» مع زر «حاول مرة أخرى»."
            ]
          },
          {
            "id": "login-language",
            "title": "تبديل لغة الواجهة",
            "bullets": [
              "اضغط أيقونة الكرة الأرضية في أعلى الصفحة.",
              "اختر «العربية» أو «English» من القائمة.",
              "تتغير جميع النصوص فوراً، وينقلب اتجاه الصفحة إلى اليمين لليسار في العربية.",
              "يتذكر المتصفح اختيارك في الزيارات التالية.",
              "الأيقونة نفسها متاحة في رأس كل صفحة داخل النظام بجوار الإشعارات.",
              "تغيير اللغة لا يغيّر البيانات المدخلة؛ أسماء العملاء والمستندات تبقى كما أُدخلت."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "workspace",
    "audience": "cab",
    "section": "start",
    "routes": [
      "/workspace",
      "/cab/workspace"
    ],
    "open": "/workspace",
    "navIds": [
      "nav.home"
    ],
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/workspace"
    },
    "text": {
      "en": {
        "title": "Application hub",
        "summary": "The CAB home page. It shows 22 applications in 7 groups ordered as the work flows, from setting up the body to invoicing and analytics, plus the iHelp tile for help on every screen.",
        "who": "The CAB administrator and all CAB staff.",
        "when": "Right after signing in, and whenever you move to another module.",
        "nav": "Log In → Application Hub (/workspace), or Home in any breadcrumb.",
        "screen": [
          "Search applications filters the tiles by name or description.",
          "Group 1 “Set up your body” carries the Start here badge.",
          "A numbered tile; the number is its place in the workflow.",
          "Language icon in the header, next to the notification bell.",
          "The ? button in the header opens iHelp on the guide of the current page.",
          "Account menu: My profile, CAB Profile, My subscription, Body setup, iHelp help center, Take a tour, Sign out."
        ],
        "steps": [
          "On first use start with group 1: complete CAB Profile, then Competence.",
          "Register clients and contacts in group 2.",
          "Handle applications in group 3, then pricing and offers in group 4.",
          "Click a tile to open that application.",
          "Type part of a name in the search box to jump to it.",
          "If nothing matches, click Clear search."
        ],
        "rules": [
          "Only CAB users see this page; client users are redirected to their portal.",
          "Search matches the tile title and description in the current interface language.",
          "A tile outside your plan shows a lock and opens My subscription."
        ],
        "after": [
          "Each tile opens its module; Home in the breadcrumb brings you back.",
          "The bell badge shows unread notifications (for example a new application or a client reply)."
        ],
        "tips": [
          "Follow the tile numbers 1 to 22; they trace the full certification cycle.",
          "Start Take a tour from the account menu to learn any screen."
        ],
        "fields": [
          [
            "1 · Set up your body",
            "CAB Profile, Competence, Settings (Settings also opens CAB Profile)."
          ],
          [
            "2 · Clients",
            "Audit Clients, Contacts, Client Portal."
          ],
          [
            "3 · Application",
            "Applications, Application Receipt, Application Review, Information Required, Technical Feasibility."
          ],
          [
            "4 · Quotation & contract",
            "Quotation, Quotation Approval, Offers."
          ],
          [
            "5 · Audit",
            "Audit Planning, Audit Reporting, Nonconformities."
          ],
          [
            "6 · Decision & certification",
            "Decisions, Certificates, Certification."
          ],
          [
            "7 · Finance & insight",
            "Invoices, Analytics and reports, My subscription."
          ],
          [
            "8 · Help",
            "iHelp: guides for every screen and what is new."
          ]
        ],
        "sections": [
          {
            "id": "workspace-groups-1-3",
            "title": "Groups 1 to 3: setup, clients, application",
            "bullets": [
              "1 CAB Profile: identity, accreditation, schemes, pricing and certificate settings.",
              "2 Competence: auditors and staff with their authorisations.",
              "3 Settings: opens the same CAB Profile.",
              "4 Audit Clients: client register, New client and Excel import.",
              "5 Contacts: client representatives and their roles.",
              "6 Client Portal: opens the client-facing interface.",
              "7 Applications: application register; start an application for a client.",
              "8 Application Receipt and 9 Application Review: pick an application, then open its receipt or review.",
              "10 Information Required and 11 Technical Feasibility: follow the application up to pricing."
            ]
          },
          {
            "id": "workspace-groups-4-7",
            "title": "Groups 4 to 7: contract, audit, certification, finance",
            "bullets": [
              "12 Quotation: pick a reviewed application and prepare its quotation.",
              "13 Quotation Approval: the internal approval queue; a second person approves each quotation before it can be issued.",
              "14 Offers: offers mirrored from quotations or prepared by hand.",
              "15 Audit Planning, 16 Audit Reporting, 17 Nonconformities: the audit phase.",
              "18 Decisions, 19 Certificates, 20 Certification: decision, issue and surveillance.",
              "21 Invoices: the advance invoice and recorded payments.",
              "22 Analytics and reports: metrics, tasks and recent activity."
            ]
          }
        ]
      },
      "ar": {
        "title": "مركز التطبيقات",
        "summary": "الصفحة الرئيسية لجهة منح الشهادات. تعرض 22 تطبيقاً مرتبة في 7 مجموعات حسب تسلسل العمل، من إعداد الجهة حتى الفوترة والتحليلات، إضافة إلى مربع iHelp للمساعدة في كل شاشة.",
        "who": "مدير جهة منح الشهادات وجميع موظفي الجهة.",
        "when": "بعد تسجيل الدخول مباشرة، وكلما أردت الانتقال إلى وحدة أخرى.",
        "nav": "تسجيل الدخول ← مركز التطبيقات (/workspace)، أو رابط «الرئيسية» في مسار التنقل.",
        "screen": [
          "مربع «البحث في التطبيقات» يصفّي البطاقات بالاسم أو الوصف.",
          "المجموعة 1 «إعداد الجهة» وعليها شارة «ابدأ من هنا».",
          "بطاقة تطبيق مرقمة؛ الرقم يوضح ترتيبها في تسلسل العمل.",
          "أيقونة اللغة في رأس الصفحة، وبجوارها جرس الإشعارات.",
          "زر ؟ في رأس الصفحة يفتح iHelp على دليل الصفحة الحالية.",
          "قائمة الحساب: ملفي الشخصي، ملف جهة المنح، اشتراكي، إعداد الجهة، مركز المساعدة iHelp، الجولة الإرشادية، تسجيل الخروج."
        ],
        "steps": [
          "ابدأ بالمجموعة 1 عند أول استخدام: أكمل «ملف جهة المنح» ثم «الكفاءة».",
          "سجّل عملاءك وجهات الاتصال من المجموعة 2.",
          "تابع الطلبات من المجموعة 3، ثم التسعير والعروض من المجموعة 4.",
          "اضغط أي بطاقة لفتح التطبيق.",
          "اكتب جزءاً من اسم التطبيق في مربع البحث للوصول السريع.",
          "إذا لم تظهر نتائج، اضغط «مسح البحث»."
        ],
        "rules": [
          "تظهر الصفحة لمستخدمي جهة المنح فقط؛ مستخدم العميل يُحوَّل إلى بوابته.",
          "البحث يطابق عنوان البطاقة ووصفها بلغة الواجهة الحالية.",
          "البطاقة غير المشمولة في باقتك تظهر بقفل وتفتح صفحة «اشتراكي»."
        ],
        "after": [
          "كل بطاقة تفتح وحدتها مباشرة، ويمكن العودة عبر «الرئيسية» في مسار التنقل.",
          "الرقم على الجرس يوضح عدد الإشعارات غير المقروءة (مثل طلب جديد أو رد العميل)."
        ],
        "tips": [
          "اتبع ترقيم البطاقات من 1 إلى 22؛ فهو يطابق دورة منح الشهادة كاملة.",
          "ابدأ «الجولة الإرشادية» من قائمة الحساب للتعرّف على أي شاشة."
        ],
        "fields": [
          [
            "1 · إعداد الجهة",
            "ملف جهة المنح، الكفاءة، الإعدادات (تفتح ملف جهة المنح أيضاً)."
          ],
          [
            "2 · العملاء",
            "عملاء التدقيق، جهات الاتصال، بوابة العميل."
          ],
          [
            "3 · الطلب",
            "الطلبات، استلام الطلبات، مراجعة الطلبات، طلب معلومات إضافية، الجدوى الفنية."
          ],
          [
            "4 · عرض السعر والعقد",
            "عروض الأسعار، اعتماد عروض الأسعار، العروض."
          ],
          [
            "5 · التدقيق",
            "تخطيط التدقيق، تقارير التدقيق، حالات عدم المطابقة."
          ],
          [
            "6 · القرار ومنح الشهادة",
            "القرارات، الشهادات، دورات الشهادات."
          ],
          [
            "7 · المالية والتحليلات",
            "الفواتير، التقارير والتحليلات، اشتراكي."
          ],
          [
            "8 · المساعدة",
            "iHelp: أدلة لكل شاشة وما الجديد."
          ]
        ],
        "sections": [
          {
            "id": "workspace-groups-1-3",
            "title": "المجموعات 1 إلى 3: الإعداد والعملاء والطلب",
            "bullets": [
              "1 ملف جهة المنح: الهوية والاعتماد والمخططات والتسعير وإعدادات الشهادة.",
              "2 الكفاءة: سجل المدققين والموظفين وتفويضاتهم.",
              "3 الإعدادات: تفتح ملف جهة المنح نفسه.",
              "4 عملاء التدقيق: سجل العملاء، وإضافة عميل جديد واستيراد من Excel.",
              "5 جهات الاتصال: ممثلو العملاء وأدوارهم.",
              "6 بوابة العميل: تفتح الواجهة التي يراها العميل.",
              "7 الطلبات: سجل الطلبات وإنشاء طلب جديد نيابة عن العميل.",
              "8 استلام الطلبات و9 مراجعة الطلبات: اختر طلباً ثم افتح الإيصال أو المراجعة.",
              "10 طلب معلومات إضافية و11 الجدوى الفنية: متابعة الطلب قبل التسعير."
            ]
          },
          {
            "id": "workspace-groups-4-7",
            "title": "المجموعات 4 إلى 7: العرض والتدقيق والمنح والمالية",
            "bullets": [
              "12 عروض الأسعار: اختر طلباً تمت مراجعته وأعدّ عرض السعر.",
              "13 اعتماد عروض الأسعار: قائمة الاعتماد الداخلي؛ يعتمد شخص ثانٍ كل عرض سعر قبل إصداره.",
              "14 العروض: العروض التجارية المرتبطة بعروض الأسعار أو المعدّة يدوياً.",
              "15 تخطيط التدقيق و16 تقارير التدقيق و17 حالات عدم المطابقة: مرحلة التدقيق.",
              "18 القرارات و19 الشهادات و20 دورات الشهادات: القرار والإصدار والمراقبة.",
              "21 الفواتير: الدفعة المقدمة وتسجيل المدفوعات.",
              "22 التقارير والتحليلات: المؤشرات والمهام والأنشطة الحديثة."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "cab-profile",
    "audience": "cab",
    "section": "setup",
    "routes": [
      "/cab/company-profile"
    ],
    "open": "/cab/company-profile",
    "navIds": [
      "cab.sidebar.companyProfile",
      "cab.sidebar.settings",
      "companyProfile",
      "settings"
    ],
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/company-profile"
    },
    "text": {
      "en": {
        "title": "CAB Profile",
        "summary": "A nine-page wizard that builds your body’s profile: who you are, where you operate, your accreditation, what you certify, how you price, your marks and your certificates. Every later module reads from it.",
        "who": "The CAB administrator, or a delegate who manages the body’s settings.",
        "when": "When you start using the platform, and whenever accreditation, schemes, prices or the certificate template change.",
        "nav": "Application Hub → Set up your body → CAB Profile (/cab/company-profile)",
        "screen": [
          "Profile completed: rises with each page you save.",
          "The nine pages; click one to jump to it. Saved pages show a tick.",
          "Title and short description of the current page.",
          "Current page number out of 9.",
          "Fields of the current page; Save and next at the bottom saves them and opens the next page."
        ],
        "steps": [
          "Open CAB Profile from the Application Hub.",
          "Fill in the current page only; fields marked * are required.",
          "Click Save and next to save and move on.",
          "Use Back to return without losing saved data.",
          "Jump to any page from the page list.",
          "On page 9 click Save and finish to save the whole profile."
        ],
        "rules": [
          "E-mail and phone come from your account and cannot be changed here.",
          "Profile completed = saved pages out of 9.",
          "If saving fails, an error message appears and you stay on the page.",
          "If a page has errors, a summary lists them at the top; select an error to jump to its field."
        ],
        "after": [
          "“CAB profile saved.” appears after the last page.",
          "Schemes saved here are the only ones you can assign to auditors in the Competence register.",
          "The default currency, man-day rate and tax feed every new quotation.",
          "The trading name appears on applications, receipts and quotations."
        ],
        "tips": [
          "On the Accredited scope page, Import adds the scope codes of each scheme from Excel.",
          "Complete pages 5, 6 and 7 before your first application; a quotation cannot be prepared without them.",
          "Add each accreditation body as its own record; schemes, dates and marks can differ between them."
        ],
        "fields": [
          [
            "1 Identity",
            "Legal and trading names, CAB activity, registration number, website, year established."
          ],
          [
            "2 Locations",
            "Head office, branches and the activities at each location."
          ],
          [
            "3 Accreditation status",
            "Accredited / Applicant / Unaccredited, and how many accreditation records."
          ],
          [
            "4 Accreditation records",
            "Accreditation body, number, validity dates and certificate file."
          ],
          [
            "5 Schemes & services",
            "Standards you certify against and the services you offer."
          ],
          [
            "6 Accredited scope",
            "Approved IAF codes per scheme and location."
          ],
          [
            "7 Pricing",
            "Pricing: default man-day rate and tax per currency, and optional rates per standard."
          ],
          [
            "8 Marks & branding",
            "CAB logo, accreditation mark, scheme mark and usage rules."
          ],
          [
            "9 Certificate settings",
            "Numbering format, validity, language, template and signatory."
          ]
        ],
        "sections": [
          {
            "id": "cab-profile-identity",
            "title": "Page 1: Identity",
            "bullets": [
              "The Account block at the top shows e-mail and phone, read-only.",
              "Trading / brand name is optional and appears on documents when set.",
              "Website is optional; its format is checked.",
              "Tax invoice details (ZATCA): VAT registration number and the seller national address printed on every tax invoice; Look up National Address fills the address from Saudi Post.",
              "Click Save and next to go to Locations."
            ]
          },
          {
            "id": "cab-profile-locations",
            "title": "Page 2: Locations",
            "bullets": [
              "Each branch card holds Location name, Location type, Country, City, Address and Activities at this location.",
              "Location types: Head Office, Branch, Critical Location, Laboratory, Inspection Office, Remote Office.",
              "+ Add location adds a card; Delete removes one.",
              "Locations are later linked to each accredited scope."
            ]
          },
          {
            "id": "cab-profile-accreditation-status",
            "title": "Page 3: Accreditation status",
            "bullets": [
              "Pick the one card that describes your body.",
              "Set the number of records; you can change it later.",
              "Records are separate because accreditation bodies may cover different standards, countries, dates and marks.",
              "Not accredited yet? Choose Applicant and save the application reference on the next page."
            ]
          },
          {
            "id": "cab-profile-accreditation-records",
            "title": "Page 4: Accreditation records",
            "bullets": [
              "Choose the accreditation body from the global catalog of 133 bodies, each shown with its IAF MLA or ILAC MRA recognition; pick Other (not listed) only when yours is missing.",
              "Each record has its own tab: Accreditation 1, Accreditation 2...",
              "Upload the certificate or decision file as PDF on its upload tile; the tile shows the file name and lets you replace or remove it.",
              "Turn on Covered by IAF MLA / ILAC MRA when it applies.",
              "Turn on Set expiry reminders to be warned before expiry."
            ]
          },
          {
            "id": "cab-profile-schemes",
            "title": "Page 5: Schemes & services",
            "bullets": [
              "Available schemes: ISO 9001, 14001, 45001, 22000, 27001, 50001, 22301, 13485, 37001, 41001.",
              "Next to each standard you tick is its certification body requirement, the companion standard the accreditation body assesses you against (e.g. ISO/IEC 17021-3 for ISO 9001); ISO/IEC 17021-1 applies on its own when there is none.",
              "A custom scheme needs Scheme name *, Scheme owner, Normative document, Version.",
              "Selected services: Initial certification, Surveillance, Recertification, Transfer, Scope extension / reduction, Special audit, Suspension / withdrawal.",
              "Primary service market: local, international, or both.",
              "Only schemes saved here can be assigned to auditors and requested by clients."
            ]
          },
          {
            "id": "cab-profile-scope",
            "title": "Page 6: Accredited scope",
            "bullets": [
              "Each scope holds Scheme *, Accreditation record, Location *, Approved scope codes.",
              "+ Add scope adds a card.",
              "Upload scope list (optional): a PDF or XLSX you can map later.",
              "Allow applications only within approved scope limits applications to approved IAF codes.",
              "Require technical review for scope exceptions forces a technical review for anything outside scope."
            ]
          },
          {
            "id": "cab-profile-pricing",
            "title": "Page 7: Pricing and man-day rates",
            "bullets": [
              "Set a default man-day rate and a tax rate for each currency you quote in; any world currency can be chosen (search by name or code).",
              "Make default marks the currency new quotations start from.",
              "Rates per standard (optional): a rate set for a standard wins over the default rate of the same currency.",
              "In the quotation, the man-day rate is prefilled from these rates; changing it there applies to that quotation only.",
              "In the quotation, audit fee = audit days × man-day rate.",
              "Tax = (audit fee + travel expenses + additional costs) × tax rate.",
              "Without a saved rate, the quotation asks you to set one in the CAB profile or to enter a currency and rate for that quotation.",
              "A quotation keeps a snapshot of the rate and tax when created; later pricing changes do not alter it."
            ]
          },
          {
            "id": "cab-profile-marks",
            "title": "Page 8: Marks & branding",
            "bullets": [
              "Use Change Logo or Delete Logo to manage the logo.",
              "Each mark has Mark reference / approval no., Valid from and Valid until.",
              "Allowed document use *: Certificates, Reports, Portal, Email, Website.",
              "Usage rule: Apply accreditation mark only to accredited schemes.",
              "Usage rule: Block mark use after expiry.",
              "Usage rule: Keep a mark-use audit trail."
            ]
          },
          {
            "id": "cab-profile-certificate",
            "title": "Page 9: Certificate settings",
            "bullets": [
              "Pick the scheme from the tabs at the top; each scheme has its own settings.",
              "Format tokens: {CAB} {SCHEME} {YEAR} {COUNTRY} {SEQ} {BRANCH}.",
              "Validity: 1 to 5 years, or Custom.",
              "Certificate language: English, Arabic, or English + Arabic.",
              "Template: Use iCASCO default, Upload our own template, or Design later.",
              "Signatory: name *, title *, signature image * (PNG or JPEG, max 2 MB).",
              "Certificate display: show CAB logo, accreditation mark when eligible, QR verification code.",
              "Certificate setup is optional; click Save and finish to save the whole profile."
            ]
          }
        ]
      },
      "ar": {
        "title": "ملف جهة المنح",
        "summary": "معالج من 9 صفحات قصيرة يبني ملف الجهة: من هي، وأين تعمل، واعتمادها، وما تمنحه من شهادات، وكيف تسعّر، وعلاماتها، وإعداد شهاداتها. كل وحدة لاحقة تقرأ من هذا الملف.",
        "who": "مدير جهة منح الشهادات أو من يفوضه لإدارة إعدادات الجهة.",
        "when": "عند بدء استخدام المنصة، ثم كلما تغيّر الاعتماد أو المخططات أو الأسعار أو قالب الشهادة.",
        "nav": "مركز التطبيقات ← إعداد الجهة ← ملف جهة المنح (/cab/company-profile)",
        "screen": [
          "نسبة «اكتمال الملف»: تزيد مع كل صفحة تحفظها.",
          "قائمة الصفحات التسع؛ اضغط أي صفحة للانتقال إليها، وتظهر علامة صح على المحفوظة.",
          "عنوان الصفحة الحالية ووصفها المختصر.",
          "رقم الصفحة الحالية من أصل 9.",
          "حقول الصفحة الحالية؛ «حفظ والتالي» أسفل الصفحة يحفظها ويفتح التالية."
        ],
        "steps": [
          "افتح ملف جهة المنح من مركز التطبيقات.",
          "املأ الصفحة الحالية فقط؛ الحقول المعلّمة بـ * إلزامية.",
          "اضغط «حفظ والتالي» لحفظ الصفحة والانتقال.",
          "استخدم «السابق» للرجوع دون فقدان ما حفظته.",
          "يمكنك القفز لأي صفحة من القائمة الجانبية.",
          "في الصفحة 9 اضغط «حفظ وإنهاء» لحفظ الملف كله."
        ],
        "rules": [
          "البريد الإلكتروني والهاتف مرتبطان بحسابك ولا يُعدَّلان من هنا.",
          "نسبة الاكتمال تُحسب من عدد الصفحات المحفوظة من أصل 9.",
          "عند فشل الحفظ تظهر رسالة خطأ وتبقى في الصفحة نفسها.",
          "إذا احتوت الصفحة على أخطاء تظهر قائمة بها في الأعلى، واختيار أي خطأ ينقلك إلى حقله."
        ],
        "after": [
          "تظهر رسالة «تم حفظ ملف جهة المنح» بعد الصفحة الأخيرة.",
          "المخططات المحفوظة هنا هي التي يمكن إسنادها للمدققين في سجل الكفاءة.",
          "العملة الافتراضية وسعر يوم العمل والضريبة تُطبَّق تلقائياً على كل عرض سعر جديد.",
          "الاسم التجاري للجهة يظهر في الطلبات والإيصالات وعروض الأسعار."
        ],
        "tips": [
          "في صفحة النطاق المعتمد، يتيح زر «استيراد» إضافة رموز النطاق لكل مخطط من Excel.",
          "أكمل الصفحات 5 و6 و7 قبل استقبال أول طلب؛ فبدونها لا يمكن تجهيز عرض السعر.",
          "أضف كل جهة اعتماد كسجل مستقل؛ فقد تختلف المخططات والتواريخ والعلامات بينها."
        ],
        "fields": [
          [
            "1 الهوية",
            "الاسم القانوني والتجاري، نشاط الجهة، رقم التسجيل، الموقع، سنة التأسيس."
          ],
          [
            "2 المواقع",
            "المقر الرئيسي والفروع وأنشطة كل موقع."
          ],
          [
            "3 حالة الاعتماد",
            "معتمد / مقدم طلب / غير معتمد، وعدد سجلات الاعتماد."
          ],
          [
            "4 سجلات الاعتماد",
            "جهة الاعتماد ورقم الاعتماد وتواريخ الصلاحية والملف."
          ],
          [
            "5 المخططات والخدمات",
            "المواصفات التي تمنح عليها والخدمات المقدمة."
          ],
          [
            "6 النطاق المعتمد",
            "رموز IAF المعتمدة لكل مخطط وموقع."
          ],
          [
            "7 التسعير",
            "التسعير: سعر يوم العمل والضريبة الافتراضيان لكل عملة، وأسعار اختيارية لكل مواصفة."
          ],
          [
            "8 العلامات والهوية البصرية",
            "شعار الجهة وعلامة الاعتماد وعلامة المخطط وقواعد الاستخدام."
          ],
          [
            "9 إعدادات الشهادة",
            "صيغة الترقيم والصلاحية واللغة والقالب والمخوّل بالتوقيع."
          ]
        ],
        "sections": [
          {
            "id": "cab-profile-identity",
            "title": "الصفحة 1: الهوية",
            "bullets": [
              "قسم «الحساب» أعلى الصفحة يعرض البريد والهاتف للعرض فقط.",
              "الاسم التجاري اختياري، ويظهر في المستندات إن أُدخل.",
              "الموقع الإلكتروني اختياري ويُتحقق من صيغته.",
              "بيانات الفاتورة الضريبية (زاتكا): رقم التسجيل في ضريبة القيمة المضافة والعنوان الوطني للبائع المطبوع في كل فاتورة ضريبية، و«البحث في العنوان الوطني» يعبّئ العنوان من البريد السعودي.",
              "اضغط «حفظ والتالي» للانتقال إلى «المواقع»."
            ]
          },
          {
            "id": "cab-profile-locations",
            "title": "الصفحة 2: المواقع",
            "bullets": [
              "لكل فرع بطاقة: اسم الموقع، نوع الموقع، الدولة، المدينة، العنوان، والأنشطة في هذا الموقع.",
              "أنواع المواقع: المقر الرئيسي، فرع، موقع حرج، مختبر، مكتب فحص، مكتب عن بُعد.",
              "اضغط «+ إضافة موقع» لبطاقة جديدة، و«حذف» لإزالة بطاقة.",
              "المواقع تُستخدم لاحقاً لربط كل نطاق معتمد بموقعه."
            ]
          },
          {
            "id": "cab-profile-accreditation-status",
            "title": "الصفحة 3: حالة الاعتماد",
            "bullets": [
              "اختر بطاقة واحدة تصف وضع الجهة.",
              "حدد عدد سجلات الاعتماد؛ يمكنك تغييره لاحقاً.",
              "سجلات منفصلة لأن جهات الاعتماد قد تغطي مواصفات ودولاً وتواريخ وعلامات مختلفة.",
              "إذا لم تحصل على الاعتماد بعد، اختر «مقدم طلب» واحفظ رقم مرجع الطلب في الصفحة التالية."
            ]
          },
          {
            "id": "cab-profile-accreditation-records",
            "title": "الصفحة 4: سجلات الاعتماد",
            "bullets": [
              "اختر جهة الاعتماد من الدليل العالمي الذي يضم 133 جهة، ويظهر بجانب كل منها اعترافها ضمن IAF MLA أو ILAC MRA، ولا تختر «أخرى (غير مدرجة)» إلا إذا لم تجد جهتك.",
              "كل سجل في تبويب مستقل: «اعتماد 1»، «اعتماد 2»...",
              "ارفع ملف الشهادة أو القرار بصيغة PDF في مربع الرفع الخاص به، ويعرض المربع اسم الملف ويتيح استبداله أو إزالته.",
              "فعّل «مشمول باتفاقية IAF MLA / ILAC MRA» إن انطبق.",
              "فعّل «تفعيل تذكيرات انتهاء الصلاحية» لتنبيهك قبل انتهاء الاعتماد."
            ]
          },
          {
            "id": "cab-profile-schemes",
            "title": "الصفحة 5: المخططات والخدمات",
            "bullets": [
              "المخططات المتاحة: ISO 9001، 14001، 45001، 22000، 27001، 50001، 22301، 13485، 37001، 41001.",
              "بجانب كل مواصفة تحددها يظهر متطلب جهة منح الشهادات المرافق لها الذي تقيّمك جهة الاعتماد على أساسه (مثل ISO/IEC 17021-3 لمواصفة ISO 9001)، وإن لم يوجد تُطبَّق ISO/IEC 17021-1 وحدها.",
              "المخطط المخصص يحتاج: اسم المخطط *، الجهة المالكة، الوثيقة المرجعية، الإصدار.",
              "«الخدمات المختارة»: التصديق الأولي، المراقبة، إعادة التصديق، نقل الشهادة، توسيع / تقليص النطاق، تدقيق خاص، التعليق / السحب.",
              "«السوق الرئيسي للخدمة»: عملاء محليون، عملاء دوليون، أو كلاهما.",
              "المخططات المحفوظة هنا فقط يمكن إسنادها للمدققين وطلبها من العملاء."
            ]
          },
          {
            "id": "cab-profile-scope",
            "title": "الصفحة 6: النطاق المعتمد",
            "bullets": [
              "لكل نطاق: المخطط *، سجل الاعتماد، الموقع *، رموز النطاق المعتمدة.",
              "اضغط «+ إضافة نطاق» لإضافة بطاقة جديدة.",
              "«رفع قائمة النطاق (اختياري)»: ملف PDF أو XLSX يمكن ربطه لاحقاً.",
              "«السماح بالطلبات ضمن النطاق المعتمد فقط» يقيّد الطلبات برموز IAF المعتمدة.",
              "«طلب مراجعة فنية لاستثناءات النطاق» يفرض مراجعة فنية لأي طلب خارج النطاق."
            ]
          },
          {
            "id": "cab-profile-pricing",
            "title": "الصفحة 7: التسعير وأسعار يوم العمل",
            "bullets": [
              "حدّد سعر يوم العمل الافتراضي ونسبة الضريبة لكل عملة تُصدر بها عروض الأسعار، ويمكن اختيار أي عملة في العالم (ابحث باسمها أو رمزها).",
              "«جعلها افتراضية» يحدد العملة التي تبدأ بها عروض الأسعار الجديدة.",
              "الأسعار لكل مواصفة (اختياري): السعر المحدد لمواصفة يتقدّم على السعر الافتراضي للعملة نفسها.",
              "في عرض السعر يُعبّأ سعر يوم العمل من هذه الأسعار، وتغييره هناك يسري على ذلك العرض فقط.",
              "في عرض السعر: رسوم التدقيق = أيام التدقيق × سعر يوم العمل.",
              "الضريبة = (رسوم التدقيق + مصاريف السفر + التكاليف الإضافية) × نسبة الضريبة.",
              "إذا لم يُحفظ سعر بعد، يطلب عرض السعر تحديده في ملف جهة المنح أو إدخال عملة وسعر لذلك العرض.",
              "يحتفظ عرض السعر بنسخة من السعر والضريبة وقت إنشائه، وتغيير التسعير لاحقاً لا يغيّر العروض السابقة."
            ]
          },
          {
            "id": "cab-profile-marks",
            "title": "الصفحة 8: العلامات والهوية البصرية",
            "bullets": [
              "استخدم «تغيير الشعار» أو «حذف الشعار» لإدارة الشعار.",
              "لكل علامة: رقم مرجع / اعتماد العلامة، صالحة من، صالحة حتى.",
              "«الاستخدام المسموح في المستندات *»: الشهادات، التقارير، البوابة، البريد الإلكتروني، الموقع الإلكتروني.",
              "قواعد الاستخدام: تطبيق علامة الاعتماد على المخططات المعتمدة فقط.",
              "منع استخدام العلامة بعد انتهاء الصلاحية.",
              "الاحتفاظ بسجل تدقيق لاستخدام العلامة."
            ]
          },
          {
            "id": "cab-profile-certificate",
            "title": "الصفحة 9: إعدادات الشهادة",
            "bullets": [
              "اختر المخطط من التبويبات أعلى الصفحة؛ لكل مخطط إعداده.",
              "رموز الصيغة: {CAB} {SCHEME} {YEAR} {COUNTRY} {SEQ} {BRANCH}.",
              "الصلاحية: سنة واحدة إلى 5 سنوات أو «مخصص».",
              "لغة الشهادة: الإنجليزية، العربية، أو الإنجليزية + العربية.",
              "القالب: قالب iCASCO الافتراضي، رفع قالب خاص بنا، أو التصميم لاحقًا.",
              "المخوّل بالتوقيع: الاسم *، المسمى الوظيفي *، صورة التوقيع * (PNG أو JPEG حتى 2 ميجابايت).",
              "عرض الشهادة: إظهار شعار الجهة، علامة الاعتماد عند استيفاء الشروط، رمز QR للتحقق.",
              "إعداد الشهادة اختياري؛ اضغط «حفظ وإنهاء» لحفظ الملف كله."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "competence",
    "audience": "cab",
    "section": "setup",
    "routes": [
      "/cab/competence"
    ],
    "open": "/cab/competence",
    "updated": "2026-10-27",
    "capture": {
      "as": "cab",
      "route": "/cab/competence"
    },
    "related": [
      "team-selection"
    ],
    "text": {
      "en": {
        "title": "Competence register",
        "summary": "Every auditor, expert and staff member with their role, authorised schemes, IAF codes and authorisation expiry. Audit teams are proposed from it in Technical Feasibility and the quotation.",
        "who": "CAB administrator, technical manager and competence officer.",
        "when": "When you hire an auditor, renew or suspend authorisations, and before building audit teams.",
        "nav": "Application Hub → Set up your body → Competence (/cab/competence)",
        "screen": [
          "Import many people at once from an Excel file.",
          "Export the current list to Excel or PDF.",
          "Add a new person by hand.",
          "Search by name, personnel code or sector.",
          "Status switch: Active / Inactive.",
          "Actions menu: Competence Profile, Edit profile."
        ],
        "steps": [
          "Narrow the list with the filters: Role, Country, Authorization status, Expiry period.",
          "Click Clear to reset all filters.",
          "Click a name, or Actions → Competence Profile, to open the profile.",
          "Choose Edit profile to update details and authorisations.",
          "Flip the status switch to suspend or re-activate a person.",
          "Click Add person to register a new member."
        ],
        "rules": [
          "Expiry period shows people expiring within 30 or 90 days.",
          "Switching off sets the person to Suspended; switching on sets Authorized.",
          "If saving the status fails, the switch returns to its previous position.",
          "Export includes the filtered rows only.",
          "The competence register feeds audit team selection: approved standards and IAF codes, critical-code exams and the approval expiry decide who is eligible for each audit."
        ],
        "after": [
          "Active people authorised for the application’s scheme are the ones proposed in Technical Feasibility.",
          "Auditor and expert names feed the audit-team pickers in the quotation."
        ],
        "tips": [
          "Import from Excel adds people with their role, standards and IAF codes. Critical codes are never imported: the person adds them after passing the exam.",
          "Check “Expiring in 30 days” every month to renew on time.",
          "Critical codes (such as 03 and 28) are added only after the qualification exam is passed."
        ],
        "fields": [
          [
            "Person",
            "Name, personnel code (PER-0001) and country."
          ],
          [
            "Role",
            "Lead Auditor, Auditor, Technical Manager, Certification Manager..."
          ],
          [
            "Schemes",
            "Authorised standards (ISO 9001:2015...)."
          ],
          [
            "Authorized scope",
            "IAF codes with sector names; “+1” means more codes."
          ],
          [
            "Start date / Expiry",
            "Employment start and authorisation expiry."
          ],
          [
            "Status",
            "Active / Inactive switch."
          ]
        ],
        "statuses": [
          [
            "Active",
            "Authorised; can be proposed for audit teams."
          ],
          [
            "Inactive",
            "Suspended; not proposed for teams."
          ]
        ],
        "sections": [
          {
            "id": "competence-import",
            "title": "Import from Excel",
            "bullets": [
              "One person per row; keep the header row.",
              "Required: full name, e-mail and role.",
              "The role must match a value on the template’s Roles sheet.",
              "Phones need the country code; dates use YYYY-MM-DD.",
              "IAF codes are 01 to 39, comma-separated.",
              "Critical codes are not imported; the person adds them after passing the exam.",
              "A preview marks each row Ready or gives the error, e.g. “Email already exists”.",
              "Rows with errors are skipped; fix them in the file and import again."
            ]
          },
          {
            "id": "competence-actions",
            "title": "Row actions and status switch",
            "bullets": [
              "Competence Profile: the person’s details, evaluation details and documents.",
              "Edit profile: opens the details and authorisations form.",
              "The status switch in the row suspends or restores authorisation at once.",
              "Off = Suspended; on = Authorized.",
              "Export → Export as Excel or Export as PDF for the filtered personnel list."
            ]
          }
        ]
      },
      "ar": {
        "title": "سجل الكفاءة",
        "summary": "سجل جميع المدققين والخبراء والموظفين مع أدوارهم والمخططات المفوَّضين بها ورموز IAF وتواريخ انتهاء التفويض. منه يُقترح فريق التدقيق في الجدوى الفنية وعرض السعر.",
        "who": "مدير الجهة والمدير الفني ومسؤول الكفاءة.",
        "when": "عند تعيين مدقق جديد، وعند تجديد التفويضات أو إيقافها، وقبل تشكيل فرق التدقيق.",
        "nav": "مركز التطبيقات ← إعداد الجهة ← الكفاءة (/cab/competence)",
        "screen": [
          "استيراد عدة أشخاص دفعة واحدة من ملف Excel.",
          "تصدير القائمة الحالية إلى Excel أو PDF.",
          "إضافة شخص جديد يدوياً.",
          "البحث بالاسم أو كود الموظف أو القطاع.",
          "مفتاح الحالة: نشط / غير نشط.",
          "قائمة الإجراءات: ملف الكفاءة، تعديل الملف الشخصي."
        ],
        "steps": [
          "استخدم الفلاتر لتضييق القائمة: الدور، الدولة، حالة الاعتماد، فترة الانتهاء.",
          "اضغط «مسح» لإلغاء كل الفلاتر.",
          "اضغط اسم الشخص أو «الإجراءات» ← «ملف الكفاءة» لعرض ملفه.",
          "اختر «تعديل الملف الشخصي» لتحديث بياناته وتفويضاته.",
          "حرّك مفتاح الحالة لإيقاف تفويض شخص أو إعادة تفعيله.",
          "اضغط «إضافة شخص» لتسجيل عضو جديد."
        ],
        "rules": [
          "فلتر «فترة الانتهاء» يعرض من ينتهي تفويضه خلال 30 أو 90 يوماً.",
          "إيقاف الشخص يغيّر حالته إلى «موقوف»، وإعادة تفعيله تجعلها «معتمد».",
          "إذا فشل حفظ الحالة يعود المفتاح إلى وضعه السابق تلقائياً.",
          "التصدير يشمل الصفوف المصفّاة فقط.",
          "يغذي سجل الكفاءة اختيار فريق التدقيق: فالمواصفات ورموز IAF المعتمدة واختبارات الرموز الحرجة وتاريخ انتهاء الاعتماد تحدد من هو مؤهل لكل تدقيق."
        ],
        "after": [
          "الأشخاص النشطون المفوَّضون بمخطط الطلب هم من يقترحهم النظام في «الجدوى الفنية».",
          "أسماء المدققين والخبراء تظهر في قوائم فريق التدقيق داخل عرض السعر."
        ],
        "tips": [
          "يضيف الاستيراد من Excel الأشخاص مع الدور والمواصفات ورموز IAF، ولا تُستورد الرموز الحرجة أبداً، إذ يضيفها الشخص بعد اجتياز الاختبار.",
          "راجع فلتر «تنتهي خلال 30 يوماً» شهرياً لتجديد التفويضات في وقتها.",
          "الرموز الحرجة (مثل 03 و28) لا تُضاف إلا بعد اجتياز اختبار التأهيل."
        ],
        "fields": [
          [
            "الشخص",
            "الاسم وكود الموظف (PER-0001) والدولة."
          ],
          [
            "الدور",
            "المدقق الرئيسي، المدقق، المدير الفني، مدير منح الشهادات..."
          ],
          [
            "المخططات",
            "المواصفات المفوَّض بها (ISO 9001:2015...)."
          ],
          [
            "المجال المعتمد",
            "رموز IAF مع اسم القطاع؛ «+1» تعني رموزاً إضافية."
          ],
          [
            "تاريخ البدء / الانتهاء",
            "بداية العمل وتاريخ انتهاء التفويض."
          ],
          [
            "الحالة",
            "مفتاح نشط / غير نشط."
          ]
        ],
        "statuses": [
          [
            "نشط",
            "مفوَّض ويمكن اقتراحه في فرق التدقيق."
          ],
          [
            "غير نشط",
            "موقوف ولا يُقترح في الفرق."
          ]
        ],
        "sections": [
          {
            "id": "competence-import",
            "title": "الاستيراد من Excel",
            "bullets": [
              "شخص واحد في كل صف، ولا تحذف صف العناوين.",
              "الحقول المطلوبة: الاسم الكامل والبريد الإلكتروني والدور.",
              "يجب أن يطابق الدور إحدى القيم في ورقة Roles داخل القالب.",
              "الهاتف يجب أن يبدأ بكود الدولة، والتاريخ بصيغة YYYY-MM-DD.",
              "رموز IAF أرقام من 01 إلى 39 مفصولة بفواصل.",
              "الرموز الحرجة لا تُستورد؛ يضيفها الشخص بعد اجتياز الاختبار.",
              "تظهر معاينة لكل صف: «جاهز» أو سبب الخطأ، مثل «البريد الإلكتروني مسجّل مسبقاً».",
              "الصفوف التي بها أخطاء تُتخطى؛ صحّحها في الملف ثم استورده مرة أخرى."
            ]
          },
          {
            "id": "competence-actions",
            "title": "إجراءات الصف وتفعيل الحالة",
            "bullets": [
              "«ملف الكفاءة»: يعرض بيانات الشخص وتفاصيل التقييم ومستنداته.",
              "«تعديل الملف الشخصي»: يفتح نموذج البيانات والتفويضات.",
              "مفتاح الحالة في العمود نفسه يوقف التفويض أو يعيده فوراً.",
              "الإيقاف يجعل الحالة «موقوف»، والتفعيل يجعلها «معتمد».",
              "من «تصدير» اختر «تصدير كملف Excel» أو «تصدير PDF» لقائمة الأفراد المصفّاة."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "personnel-profile",
    "audience": "cab",
    "section": "setup",
    "routes": [
      "/cab/competence/persons/new",
      "/cab/competence/persons/:id/edit"
    ],
    "open": "/cab/competence/persons/new",
    "updated": "2026-10-27",
    "capture": {
      "as": "cab",
      "route": "/cab/competence/persons/emp-0001/edit"
    },
    "related": [
      "impartiality-register"
    ],
    "text": {
      "en": {
        "title": "Personnel profile",
        "summary": "The form to add or edit a person: personal details, employment dates (or Present), authorised standards and IAF codes, and qualifications with their documents.",
        "who": "CAB administrator or competence officer.",
        "when": "When hiring someone, or changing a role, authorisations or uploading new certificates.",
        "nav": "Competence → Add person (/cab/competence/persons/new) or → Actions → Edit profile",
        "screen": [
          "The Personal details section.",
          "Name (required).",
          "Role from the list.",
          "Phone number with country code.",
          "Profile image: JPEG, PNG or WebP, up to 1 MB."
        ],
        "steps": [
          "Enter the name and choose the role.",
          "Enter the e-mail (required for a new person) and phone.",
          "Upload a profile image if you wish.",
          "In Employment details set the start date, then tick Currently works here or set an end date.",
          "In Competence and authorizations choose the standards, then the IAF codes for each.",
          "Set the country and the authorisation expiry.",
          "Upload qualifications in their categories, then click Save Person."
        ],
        "rules": [
          "Missing name: “Enter a name.”.",
          "New person without e-mail: “Email is required”.",
          "An invalid phone number blocks saving.",
          "The end date must be on or after the start date.",
          "Without an end date, Currently works here must be ticked.",
          "A scheme not configured in the CAB Profile cannot be assigned.",
          "An existing person's profile also shows Impartiality declarations (annual and per audit, declared relationships) and Availability (leave, languages, base city), both used by audit team selection."
        ],
        "after": [
          "After saving you return to the Competence register with the person listed.",
          "The saved standards and IAF codes decide which applications the person can be proposed for."
        ],
        "tips": [
          "Opened from Complete after an import, the missing field is highlighted; saving takes you back to the import.",
          "Cancel or Back to competence register leaves without saving.",
          "Check the authorisation expiry; it drives the Expiry period filter."
        ],
        "fields": [
          [
            "Name *",
            "Full name."
          ],
          [
            "Role",
            "General Manager, Applications Receiver, Technical Manager, Certification Manager, Business Development Manager, Lead Auditor, Auditor, Accountant, Committee Member, Freelance Auditor."
          ],
          [
            "Email",
            "Required when adding a person."
          ],
          [
            "Phone number",
            "A valid number with country code."
          ],
          [
            "Profile image",
            "JPEG, PNG or WebP, up to 1 MB."
          ]
        ],
        "sections": [
          {
            "id": "personnel-new",
            "title": "Add a new person",
            "bullets": [
              "Open it with Add person in the Competence register.",
              "The role defaults to Auditor; change it as needed.",
              "Employment start date defaults to today.",
              "Standards start empty: choose standards first, then each one’s IAF codes appear.",
              "Default qualification categories: Academic certificates and Training certificates.",
              "Click Save Person to create it, or Cancel to go back."
            ]
          },
          {
            "id": "personnel-employment",
            "title": "Employment details and the Present option",
            "bullets": [
              "With Currently works here ticked, the end date is replaced by “Present”.",
              "Unticking it requires an end date.",
              "Error text: “Choose the end date, or tick \"Currently works here\".”.",
              "An end date before the start date is rejected.",
              "The start date is optional; an empty one is not sent."
            ]
          },
          {
            "id": "personnel-competence",
            "title": "Standards and IAF codes (competence matrix)",
            "bullets": [
              "Choose the standards the person works on in Standards.",
              "Each standard gets a card with its code count (“4 codes”).",
              "Pick the IAF codes for each standard; all of them roll up into Authorized Scope / Sector.",
              "A critical code carries the tag “critical · exam”.",
              "Default critical codes: 03, 11, 12, 13, 28, 38.",
              "A pass shows under the standard: “IAF 28 exam passed”.",
              "Any extra scheme must be configured in the CAB Profile before it can be assigned."
            ]
          },
          {
            "id": "personnel-exam",
            "title": "Qualification exam for a critical code",
            "bullets": [
              "The window opens by itself when you pick a critical code not yet passed.",
              "Multiple-choice questions specific to the code’s sector.",
              "Pass mark: 80%.",
              "Pass: “Passed. The code has been added.” and the code joins the standard.",
              "Fail: “Not passed. The code was not added.” with Retake the exam.",
              "Cancel closes the window without adding the code.",
              "The score and date are kept with the person’s record."
            ]
          },
          {
            "id": "personnel-documents",
            "title": "Qualifications and documents",
            "bullets": [
              "Each category has Select File and shows Awaiting Upload or Uploaded.",
              "Accepted: PDF, Word or images, up to 20 MB per file.",
              "A file over 20 MB is refused with an error.",
              "Add a category (e.g. Lead Auditor certificate) with + Add another category.",
              "Uploaded files appear in the Competence Profile under Qualification Documents.",
              "If the person is saved but an upload fails, you can retry without losing data."
            ]
          }
        ]
      },
      "ar": {
        "title": "الملف الوظيفي للشخص",
        "summary": "نموذج إضافة شخص أو تعديل بياناته: البيانات الشخصية، تواريخ العمل (أو «حتى الآن»)، المواصفات ورموز IAF المفوَّض بها، والمؤهلات ومستنداتها.",
        "who": "مدير الجهة أو مسؤول الكفاءة.",
        "when": "عند تعيين شخص جديد، أو تغيير دوره أو تفويضاته أو رفع شهادات جديدة.",
        "nav": "الكفاءة ← «إضافة شخص» (/cab/competence/persons/new) أو ← الإجراءات ← «تعديل الملف الشخصي»",
        "screen": [
          "قسم «البيانات الشخصية».",
          "الاسم (إلزامي).",
          "الدور الوظيفي من القائمة.",
          "رقم الهاتف مع كود الدولة.",
          "الصورة الشخصية: JPEG أو PNG أو WebP حتى 1 ميجابايت."
        ],
        "steps": [
          "أدخل الاسم واختر الدور.",
          "أدخل البريد الإلكتروني (إلزامي للشخص الجديد) ورقم الهاتف.",
          "ارفع صورة شخصية إن رغبت.",
          "في «بيانات العمل» حدّد تاريخ البدء، وعلّم «لا يزال يعمل هنا» أو أدخل تاريخ الانتهاء.",
          "في «الكفاءة والصلاحيات» اختر المواصفات ثم رموز IAF لكل مواصفة.",
          "حدد الدولة وتاريخ انتهاء التفويض.",
          "ارفع المؤهلات في تصنيفاتها، ثم اضغط «حفظ الشخص»."
        ],
        "rules": [
          "بدون اسم تظهر «أدخل الاسم.».",
          "الشخص الجديد بدون بريد: «البريد الإلكتروني مطلوب».",
          "رقم هاتف غير صالح يمنع الحفظ.",
          "يجب أن يكون تاريخ انتهاء العمل في تاريخ البدء أو بعده.",
          "بدون تاريخ انتهاء يجب تعليم «لا يزال يعمل هنا».",
          "لا يمكن إسناد مخطط غير مُعدّ في ملف جهة المنح.",
          "يعرض ملف الشخص الحالي أيضاً إقرارات الحياد (السنوية ولكل تدقيق والعلاقات المصرّح بها) والتوافر (الإجازات واللغات والمدينة الأساسية)، ويستخدم اختيار فريق التدقيق كليهما."
        ],
        "after": [
          "بعد الحفظ يعود النظام إلى سجل الكفاءة ويظهر الشخص في القائمة.",
          "المواصفات ورموز IAF المحفوظة تحدد في أي طلبات يمكن اقتراحه للفريق."
        ],
        "tips": [
          "عند الفتح من «استكمال» بعد الاستيراد يظهر الحقل الناقص محدداً، ويعيدك الحفظ إلى الاستيراد.",
          "استخدم «إلغاء» أو «العودة إلى سجل الكفاءة» للخروج دون حفظ.",
          "تحقق من تاريخ انتهاء التفويض؛ فهو يظهر في فلتر «فترة الانتهاء»."
        ],
        "fields": [
          [
            "الاسم *",
            "الاسم الكامل."
          ],
          [
            "الدور",
            "General Manager، Applications Receiver، Technical Manager، Certification Manager، Business Development Manager، Lead Auditor، Auditor، Accountant، Committee Member، Freelance Auditor."
          ],
          [
            "البريد الإلكتروني",
            "إلزامي عند الإضافة."
          ],
          [
            "رقم الهاتف",
            "رقم صحيح مع كود الدولة."
          ],
          [
            "الصورة الشخصية",
            "JPEG أو PNG أو WebP حتى 1 ميجابايت."
          ]
        ],
        "sections": [
          {
            "id": "personnel-new",
            "title": "إضافة شخص جديد",
            "bullets": [
              "افتح الصفحة من زر «إضافة شخص» في سجل الكفاءة.",
              "الدور الافتراضي «Auditor» ويمكن تغييره.",
              "تاريخ بدء العمل يُقترح بتاريخ اليوم.",
              "المواصفات فارغة: اختر المواصفات أولاً ثم تظهر رموز IAF الخاصة بكل منها.",
              "تصنيفا المؤهلات الافتراضيان: الشهادات الأكاديمية وشهادات التدريب.",
              "اضغط «حفظ الشخص» لإنشائه، أو «إلغاء» للعودة."
            ]
          },
          {
            "id": "personnel-employment",
            "title": "بيانات العمل وخيار «حتى الآن»",
            "bullets": [
              "عند تعليم «لا يزال يعمل هنا» يختفي تاريخ الانتهاء ويظهر «حتى الآن».",
              "إلغاء التعليم يتطلب اختيار تاريخ الانتهاء.",
              "رسالة الخطأ: «اختر تاريخ انتهاء العمل، أو علّم على \"لا يزال يعمل هنا\"».",
              "تاريخ الانتهاء قبل تاريخ البدء يرفضه النظام.",
              "تاريخ البدء اختياري؛ إذا تُرك فارغاً لا يُرسل."
            ]
          },
          {
            "id": "personnel-competence",
            "title": "المواصفات ورموز IAF (مصفوفة الكفاءة)",
            "bullets": [
              "اختر المواصفات التي يعمل عليها الشخص من «المواصفات».",
              "تظهر بطاقة لكل مواصفة مع عدد الرموز («4 رموز»).",
              "اختر رموز IAF لكل مواصفة؛ وتُجمع كلها في «المجال / القطاع المعتمد».",
              "الرمز الحرج يحمل وسم «حرج · يتطلب اختباراً».",
              "الرموز الحرجة الافتراضية: 03، 11، 12، 13، 28، 38.",
              "تظهر نتيجة الاجتياز تحت المواصفة: «اجتاز اختبار IAF 28».",
              "يجب إعداد أي مخطط إضافي في ملف جهة المنح قبل إسناده."
            ]
          },
          {
            "id": "personnel-exam",
            "title": "اختبار التأهيل للرمز الحرج",
            "bullets": [
              "تفتح النافذة تلقائياً عند اختيار رمز حرج لم يُجتز اختباره.",
              "الاختبار أسئلة اختيار من متعدد خاصة بقطاع الرمز.",
              "نسبة النجاح المطلوبة 80%.",
              "عند النجاح: «ناجح. تمت إضافة الرمز.» ويُضاف الرمز للمواصفة.",
              "عند الرسوب: «لم تجتز الاختبار. لم تتم إضافة الرمز.» مع زر «إعادة الاختبار».",
              "«إلغاء» يغلق النافذة دون إضافة الرمز.",
              "تُحفظ نتيجة الاختبار وتاريخه مع ملف الشخص."
            ]
          },
          {
            "id": "personnel-documents",
            "title": "المؤهلات والمستندات",
            "bullets": [
              "لكل تصنيف زر «حدد الملف»، والحالة «بإنتظار الرفع» أو «تم الرفع».",
              "الصيغ المقبولة: PDF أو Word أو صور، بحد أقصى 20 ميجابايت للملف.",
              "ملف أكبر من 20 ميجابايت يُرفض برسالة خطأ.",
              "أضف تصنيفاً جديداً (مثل شهادة مدقق رئيسي) من «+ إضافة تصنيف آخر».",
              "المستندات المرفوعة تظهر لاحقاً في «ملف الكفاءة» تحت «مستندات المؤهلات».",
              "إذا حُفظ الشخص وفشل رفع ملف، يمكنك إعادة المحاولة دون فقد البيانات."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "competence-evaluation",
    "audience": "cab",
    "section": "setup",
    "routes": [
      "/cab/competence/persons/:id/evaluation"
    ],
    "open": "/cab/competence",
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/competence/persons/emp-0001/evaluation"
    },
    "text": {
      "en": {
        "title": "Competence Profile (evaluation)",
        "summary": "A single view of a person’s competence: authorisation status, role and contacts, general information, evaluation details (scheme, proposed sector, evaluation date, evaluator) and qualification documents.",
        "who": "Technical manager, competence officer and certification manager.",
        "when": "Before approving someone for an audit team, and at periodic authorisation reviews.",
        "nav": "Competence → a name, or Actions → Competence Profile (/cab/competence/persons/emp-0001/evaluation)",
        "screen": [
          "The Competence Profile title.",
          "Evaluation status: Authorized / In progress / Under review.",
          "Edit profile opens the edit form.",
          "Active / Inactive status switch.",
          "The General information & Evaluation details section."
        ],
        "steps": [
          "Open the profile from the Competence register.",
          "Check the person card: status, role, e-mail and phone.",
          "Expand General information & Evaluation details to review the evaluation.",
          "Expand Qualification Documents and click a file to open it.",
          "To change anything, click Edit profile.",
          "To suspend the authorisation, flip the status switch."
        ],
        "rules": [
          "Evaluation fields on this screen are read-only; edits are made in Edit profile.",
          "The status switch saves at once and reverts if saving fails."
        ],
        "after": [
          "An authorised, active person can be proposed in Technical Feasibility.",
          "When an audit plan is completed, the audit is added to each team member’s audit log (stored on the server)."
        ],
        "tips": [
          "Import above the records tabs brings training records for many people at once from the trainings template.",
          "The detailed matrix (standards × IAF codes) and exams are managed in Edit profile.",
          "Competence records at the bottom have three tabs: Trainings, Witnessed audits and Audit log; add, edit or delete records there. Completed audit plans are added to the audit log automatically."
        ],
        "fields": [
          [
            "Person ID",
            "For example PER-0001."
          ],
          [
            "Full name / Role / Email / Phone",
            "Read-only."
          ],
          [
            "Scheme",
            "Authorised schemes."
          ],
          [
            "Proposed sector",
            "Sectors matching the IAF codes."
          ],
          [
            "Evaluation date",
            "Date of the latest evaluation."
          ],
          [
            "Evaluator",
            "Who evaluated the person; otherwise the current user’s name."
          ]
        ],
        "statuses": [
          [
            "Authorized",
            "Evaluation complete; the person is authorised."
          ],
          [
            "In progress",
            "Evaluation not finished."
          ],
          [
            "Under review",
            "Evaluation awaiting review."
          ]
        ],
        "sections": [
          {
            "id": "competence-evaluation-details",
            "title": "General information and evaluation details",
            "bullets": [
              "General information: Person ID, Full name, Role, Email, Phone.",
              "Evaluation details: Scheme, Proposed sector, Evaluation date, Evaluator.",
              "All fields are locked so the evaluation record stays stable.",
              "Use Edit profile to update standards, codes or dates."
            ]
          },
          {
            "id": "competence-evaluation-documents",
            "title": "Qualification documents",
            "bullets": [
              "Lists every file uploaded in the person form, with size and upload date.",
              "Click a file to open it in a new tab.",
              "Formats: PDF, Word or images, up to 20 MB.",
              "These documents are the competence evidence for reviews and accreditation assessments."
            ]
          }
        ]
      },
      "ar": {
        "title": "ملف الكفاءة (تقييم الكفاءة)",
        "summary": "صفحة عرض موحدة لكفاءة الشخص: حالة التفويض، الدور وبيانات التواصل، المعلومات العامة، تفاصيل التقييم (المخطط، القطاع المقترح، تاريخ التقييم، المقيّم)، ومستندات المؤهلات.",
        "who": "المدير الفني ومسؤول الكفاءة ومدير منح الشهادات.",
        "when": "قبل اعتماد شخص في فريق تدقيق، وعند المراجعة الدورية للتفويضات.",
        "nav": "الكفاءة ← اسم الشخص أو الإجراءات ← «ملف الكفاءة» (/cab/competence/persons/emp-0001/evaluation)",
        "screen": [
          "عنوان «ملف الكفاءة».",
          "حالة التقييم: معتمد / قيد التنفيذ / قيد المراجعة.",
          "«تعديل الملف الشخصي» يفتح نموذج التعديل.",
          "مفتاح الحالة نشط / غير نشط.",
          "قسم «المعلومات العامة & تفاصيل التقييم»."
        ],
        "steps": [
          "افتح الملف من سجل الكفاءة.",
          "راجع بطاقة الشخص: الحالة والدور والبريد والهاتف.",
          "افتح قسم «المعلومات العامة & تفاصيل التقييم» لمراجعة بيانات التقييم.",
          "افتح «مستندات المؤهلات» واضغط أي ملف لفتحه.",
          "لتغيير أي بيانات اضغط «تعديل الملف الشخصي».",
          "لإيقاف التفويض حرّك مفتاح الحالة."
        ],
        "rules": [
          "حقول التقييم في هذه الشاشة للعرض فقط؛ التعديل يتم من «تعديل الملف الشخصي».",
          "تغيير مفتاح الحالة يُحفظ فوراً، ويعود لوضعه إذا فشل الحفظ."
        ],
        "after": [
          "الشخص المعتمد والنشط يمكن اقتراحه في فريق الجدوى الفنية.",
          "عند إغلاق خطة تدقيق تُضاف المهمة إلى سجل عمليات التدقيق لكل عضو في الفريق (يُخزَّن في الخادم)."
        ],
        "tips": [
          "يتيح زر «استيراد» فوق تبويبات السجلات إضافة سجلات التدريب لعدة أشخاص دفعة واحدة من قالب الدورات التدريبية.",
          "المصفوفة التفصيلية (المواصفات × رموز IAF) والاختبارات تُدار في «تعديل الملف الشخصي».",
          "في أسفل الصفحة «سجلات الكفاءة» بثلاثة تبويبات: «التدريبات» و«التدقيقات المشهودة» و«سجل التدقيقات»، ومنها تُضاف السجلات وتُعدَّل وتُحذف. وتُضاف خطط التدقيق المكتملة إلى سجل التدقيقات تلقائيًا."
        ],
        "fields": [
          [
            "كود الموظف",
            "مثل PER-0001."
          ],
          [
            "الاسم الكامل / الدور الفني / البريد / الهاتف",
            "تُعرض للقراءة فقط."
          ],
          [
            "النظام / المواصفة",
            "المخططات المفوَّض بها."
          ],
          [
            "القطاع المقترح",
            "القطاعات المقابلة لرموز IAF."
          ],
          [
            "تاريخ التقييم",
            "تاريخ آخر تقييم مسجل."
          ],
          [
            "المقيّم",
            "من قيّم الشخص؛ وإلا يظهر اسم المستخدم الحالي."
          ]
        ],
        "statuses": [
          [
            "معتمد",
            "التقييم مكتمل والشخص مفوَّض."
          ],
          [
            "قيد التنفيذ",
            "التقييم لم يكتمل بعد."
          ],
          [
            "قيد المراجعة",
            "التقييم بانتظار المراجعة."
          ]
        ],
        "sections": [
          {
            "id": "competence-evaluation-details",
            "title": "المعلومات العامة وتفاصيل التقييم",
            "bullets": [
              "المعلومات العامة: كود الموظف، الاسم الكامل، الدور الفني، البريد، الهاتف.",
              "تفاصيل التقييم: النظام / المواصفة، القطاع المقترح، تاريخ التقييم، المقيّم.",
              "كل الحقول مقفلة للقراءة لضمان ثبات سجل التقييم.",
              "ارجع إلى «تعديل الملف الشخصي» لتحديث المواصفات أو الرموز أو التواريخ."
            ]
          },
          {
            "id": "competence-evaluation-documents",
            "title": "مستندات المؤهلات",
            "bullets": [
              "يعرض كل ملف رُفع في نموذج الشخص مع الحجم وتاريخ الرفع.",
              "اضغط الملف لفتحه في نافذة جديدة.",
              "الصيغ: PDF أو Word أو صور حتى 20 ميجابايت.",
              "هذه المستندات هي دليل الكفاءة عند المراجعة أو تقييم جهة الاعتماد."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "audit-clients",
    "audience": "cab",
    "section": "clients",
    "routes": [
      "/cab/audit-clients",
      "/cab/clients",
      "/cab/clients/:clientId"
    ],
    "open": "/cab/audit-clients",
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/audit-clients"
    },
    "text": {
      "en": {
        "title": "Audit client register",
        "summary": "The central directory of every organisation the CAB certifies: code, location, primary contact and date added. Client registration, the client profile and applications all start here.",
        "who": "Applications receiver, CAB administrator and client-service staff.",
        "when": "When registering a client, looking one up, or importing a client list.",
        "nav": "Application Hub → Clients → Audit Clients (/cab/audit-clients)",
        "handoff": "The new client receives the “Your iCASCO Account is Ready” e-mail and signs in to the portal from the Log In page.",
        "screen": [
          "New client opens the registration form.",
          "Import: Import from Excel or Download template.",
          "Export to Excel or PDF (all rows or the selected ones).",
          "Search by client name or code.",
          "Row actions: View client, Edit client."
        ],
        "steps": [
          "Search by name or code, or filter by Added period and Country.",
          "Click a row to view the client’s basic data.",
          "Actions → Edit client opens the full client profile.",
          "Tick rows and use Export to export only those.",
          "Clear filters shows the full list again."
        ],
        "rules": [
          "The client code is the first 8 characters of its id and is shown everywhere.",
          "Import shows a preview of valid and invalid rows with each issue before you confirm.",
          "Imported clients are created as profile drafts."
        ],
        "after": [
          "A registered client appears in “Select client” when starting a new application.",
          "Registering a client creates a portal account for the facility owner and e-mails a temporary password."
        ],
        "tips": [
          "Import from Excel: select Import, download the clients template, fill one client per row and upload it. You review every row before anything is saved (see Excel import).",
          "Check the owner / manager e-mail: it becomes the portal login and must be unique.",
          "Use Download template before importing to get the right columns."
        ],
        "fields": [
          [
            "Client Name",
            "Name, code (e.g. C1A00001) and sector."
          ],
          [
            "Location",
            "City and country."
          ],
          [
            "Primary Contact",
            "Name and e-mail."
          ],
          [
            "Added",
            "Date the client was registered."
          ]
        ],
        "sections": [
          {
            "id": "audit-clients-import",
            "title": "Importing clients",
            "bullets": [
              "Download the template first; one client per row.",
              "Choose Import from Excel, then Choose Excel file.",
              "The preview shows total rows, valid rows and rows with issues, with an Issues column.",
              "Click Confirm import to register the valid rows.",
              "Result: “Imported N client draft(s) (M failed).”"
            ]
          },
          {
            "id": "audit-client-details",
            "title": "Viewing a client",
            "bullets": [
              "Opens when you click a client row in the register.",
              "Shows organisation name, legal capacity, head office, country, city, activity, owner/manager, e-mail and phone.",
              "Back to clients returns to the register.",
              "To complete address, branches and documents, use Actions → Edit client in the register (client profile)."
            ]
          }
        ]
      },
      "ar": {
        "title": "سجل عملاء التدقيق",
        "summary": "دليل مركزي لكل المنشآت التي تمنحها الجهة الشهادات: الكود، الموقع، جهة الاتصال الرئيسية وتاريخ الإضافة. منه يبدأ تسجيل العميل وملفه ثم طلباته.",
        "who": "مستلم الطلبات ومدير الجهة وفريق خدمة العملاء.",
        "when": "عند تسجيل عميل جديد، أو البحث عن عميل، أو استيراد قائمة عملاء.",
        "nav": "مركز التطبيقات ← العملاء ← عملاء التدقيق (/cab/audit-clients)",
        "handoff": "العميل الجديد يستلم بريد «Your iCASCO Account is Ready» ويدخل بوابته من صفحة تسجيل الدخول.",
        "screen": [
          "«عميل جديد» يفتح نموذج تسجيل العميل.",
          "«استيراد»: استيراد من Excel أو تنزيل القالب.",
          "«تصدير» إلى Excel أو PDF (للكل أو للمحدد).",
          "البحث باسم العميل أو الكود.",
          "قائمة إجراءات الصف: عرض العميل، تعديل العميل."
        ],
        "steps": [
          "ابحث بالاسم أو الكود، أو صفِّ حسب «فترة الإضافة» و«الدولة».",
          "اضغط صف العميل لعرض بياناته الأساسية.",
          "من «الإجراءات» اختر «تعديل العميل» لفتح ملف العميل الكامل.",
          "حدد عملاء بمربعات الاختيار ثم «تصدير» لتصديرهم فقط.",
          "اضغط «مسح الفلاتر» لإعادة القائمة كاملة."
        ],
        "rules": [
          "كود العميل هو أول 8 أحرف من معرّفه، ويظهر في كل الشاشات.",
          "الاستيراد يعرض معاينة: الصفوف الصالحة وغير الصالحة وسبب كل مشكلة قبل التأكيد.",
          "الاستيراد ينشئ العملاء كمسودات ملفات."
        ],
        "after": [
          "العميل المسجّل يظهر في قائمة «اختر العميل» عند إنشاء طلب جديد.",
          "تسجيل عميل جديد ينشئ حساب بوابة لمالك المنشأة ويرسل له بريد ترحيب بكلمة مرور مؤقتة."
        ],
        "tips": [
          "الاستيراد من Excel: اختر «استيراد» ونزّل قالب العملاء واملأ عميلاً في كل صف ثم ارفعه، وتراجع كل صف قبل حفظ أي شيء (راجع مقال الاستيراد من Excel).",
          "تأكد من بريد مالك / مدير المنشأة؛ فهو حساب الدخول للبوابة ولا يمكن تكراره.",
          "استخدم «تنزيل القالب» قبل الاستيراد لضمان أسماء الأعمدة الصحيحة."
        ],
        "fields": [
          [
            "اسم العميل",
            "الاسم والكود (مثل C1A00001) والقطاع."
          ],
          [
            "الموقع",
            "المدينة والدولة."
          ],
          [
            "جهة الاتصال الرئيسية",
            "الاسم والبريد الإلكتروني."
          ],
          [
            "تاريخ الإضافة",
            "تاريخ تسجيل العميل."
          ]
        ],
        "sections": [
          {
            "id": "audit-clients-import",
            "title": "استيراد العملاء",
            "bullets": [
              "نزّل القالب أولاً واملأ عميلاً في كل صف.",
              "اختر «استيراد من Excel» ثم «اختيار ملف Excel».",
              "تظهر المعاينة: عدد الصفوف، الصالح، وما به مشاكل، مع عمود «المشاكل».",
              "اضغط «تأكيد الاستيراد» لتسجيل الصفوف الصالحة.",
              "الرسالة النهائية: «تم استيراد N مسودة عميل (فشل M)»."
            ]
          },
          {
            "id": "audit-client-details",
            "title": "عرض بيانات العميل",
            "bullets": [
              "تفتح بالضغط على صف العميل في السجل.",
              "تعرض: اسم المنشأة، الشكل القانوني، المقر، الدولة، المدينة، النشاط، المالك/المدير، البريد، الهاتف.",
              "«العودة إلى العملاء» ترجعك للسجل.",
              "لإكمال العنوان والفروع والمستندات استخدم «تعديل العميل» من قائمة الإجراءات في السجل (ملف العميل)."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "client-new",
    "audience": "cab",
    "section": "clients",
    "routes": [
      "/cab/clients/new"
    ],
    "open": "/cab/clients/new",
    "updated": "2026-10-24",
    "capture": {
      "as": "cab",
      "route": "/cab/clients/new"
    },
    "text": {
      "en": {
        "title": "Register a new client",
        "summary": "A short form that registers the organisation, its owner and contact details. Saving creates the client record and its portal account, then takes you to complete the company profile.",
        "who": "Applications receiver or CAB administrator.",
        "when": "When onboarding a new organisation, before any application is created for it.",
        "nav": "Audit Clients → New client (/cab/clients/new)",
        "handoff": "The client receives the welcome e-mail and can sign in to the portal to follow their applications.",
        "screen": [
          "The Client Information section.",
          "Organization Name.",
          "Facility Owner / Manager (the portal account holder).",
          "The ten-step Workflow Progress panel.",
          "View Registered Clients returns to the register."
        ],
        "steps": [
          "Enter Organization Name and Legal Capacity.",
          "Enter Administration / Head Office.",
          "Choose Country, then City.",
          "Enter Main Business Activity and Facility Owner / Manager.",
          "Enter E-mail and Phone Number with country code.",
          "Save as Draft to save and stay, or Save & Continue to move to the client profile."
        ],
        "rules": [
          "All * fields are required; otherwise “Please correct the highlighted fields before saving.” appears.",
          "An e-mail already registered is refused (Email already registered).",
          "After the first save the page becomes Edit Client."
        ],
        "after": [
          "“Client registered successfully.”",
          "An active portal account is created for the owner and a welcome e-mail with a temporary password is sent.",
          "Save & Continue opens the Client Profile to complete address, branches and documents."
        ],
        "tips": [
          "Workflow Progress shows the ten stages from application to surveillance programme.",
          "Save as Draft and Save & Continue sit at the bottom of the form."
        ],
        "fields": [
          [
            "Organization Name *",
            "2 to 200 characters."
          ],
          [
            "Legal Capacity *",
            "For example Limited Liability Company."
          ],
          [
            "Administration / Head Office *",
            "Head office address."
          ],
          [
            "Country * / City *",
            "City 2 to 100 characters."
          ],
          [
            "Main Business Activity *",
            "Up to 300 characters."
          ],
          [
            "Facility Owner / Manager *",
            "Name of the account holder."
          ],
          [
            "Email *",
            "A valid e-mail not already registered."
          ],
          [
            "Phone Number *",
            "Valid for the selected country code."
          ]
        ]
      },
      "ar": {
        "title": "تسجيل عميل جديد",
        "summary": "نموذج قصير يسجل المنشأة ومالكها وبيانات التواصل. الحفظ ينشئ ملف العميل وحساب بوابته، ثم ينقلك لإكمال ملف الشركة.",
        "who": "مستلم الطلبات أو مدير الجهة.",
        "when": "عند التعاقد المبدئي مع منشأة جديدة وقبل إنشاء أي طلب لها.",
        "nav": "عملاء التدقيق ← «عميل جديد» (/cab/clients/new)",
        "handoff": "يصل العميل بريد الترحيب ويستطيع الدخول إلى بوابته ومتابعة طلباته.",
        "screen": [
          "قسم «بيانات العميل».",
          "اسم المنشأة.",
          "مالك / مدير المنشأة (صاحب حساب البوابة).",
          "لوحة «تقدم سير العمل» العشرية.",
          "«عرض العملاء المسجلين» يعيدك للسجل."
        ],
        "steps": [
          "أدخل اسم المنشأة والشكل القانوني.",
          "أدخل عنوان الإدارة / المقر الرئيسي.",
          "اختر الدولة ثم المدينة.",
          "أدخل النشاط الرئيسي واسم المالك / المدير.",
          "أدخل البريد الإلكتروني ورقم الهاتف مع كود الدولة.",
          "اضغط «حفظ كمسودة» للحفظ والبقاء، أو «حفظ ومتابعة» للانتقال إلى ملف العميل."
        ],
        "rules": [
          "كل الحقول المعلّمة بـ * إلزامية؛ وإلا تظهر «يرجى تصحيح الحقول المحددة قبل الحفظ.».",
          "البريد المسجل مسبقاً يُرفض (Email already registered).",
          "بعد أول حفظ تتحول الصفحة إلى «تعديل العميل»."
        ],
        "after": [
          "رسالة «تم تسجيل العميل بنجاح».",
          "يُنشأ حساب بوابة للمالك بحالة نشطة ويُرسل بريد ترحيب بكلمة مرور مؤقتة.",
          "«حفظ ومتابعة» ينقلك إلى «ملف العميل» لإكمال العنوان والفروع والمستندات."
        ],
        "tips": [
          "لوحة «تقدم سير العمل» توضح المراحل العشر من الطلب حتى برنامج المراقبة.",
          "زرا «حفظ كمسودة» و«حفظ ومتابعة» في أسفل النموذج."
        ],
        "fields": [
          [
            "اسم المنشأة *",
            "من 2 إلى 200 حرف."
          ],
          [
            "الشكل القانوني *",
            "مثل شركة ذات مسؤولية محدودة."
          ],
          [
            "الإدارة / المقر الرئيسي *",
            "عنوان المقر."
          ],
          [
            "الدولة * / المدينة *",
            "المدينة من 2 إلى 100 حرف."
          ],
          [
            "النشاط الرئيسي *",
            "حتى 300 حرف."
          ],
          [
            "مالك / مدير المنشأة *",
            "اسم صاحب الحساب."
          ],
          [
            "البريد الإلكتروني *",
            "بريد صالح وغير مسجل مسبقاً."
          ],
          [
            "رقم الهاتف *",
            "رقم صالح لكود الدولة المختار."
          ]
        ]
      }
    }
  },
  {
    "id": "client-profile",
    "audience": "cab",
    "section": "clients",
    "routes": [
      "/cab/clients/:clientId/profile",
      "/cab/clients/:clientId/edit"
    ],
    "open": "/cab/audit-clients",
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/clients/c1a00001-4e2b-4c1a-9b11-000000000001/profile"
    },
    "text": {
      "en": {
        "title": "Client profile",
        "summary": "The client’s full company profile in 4 steps: Main Data, Address, Branches, Official Documents. The CAB fills it on the client’s behalf or completes it after registration.",
        "who": "Applications receiver or client-service officer.",
        "when": "After registering the client and before their first application.",
        "nav": "Audit Clients → Actions → Edit client (/cab/clients/<id>/profile)",
        "handoff": "The client sees the same profile in the portal under Company profile.",
        "screen": [
          "The four profile steps.",
          "Company Summary: sector, logo, production lines.",
          "Industrial Sector.",
          "Are all production lines active?"
        ],
        "steps": [
          "Fill in Main Data, then click Next.",
          "Enter the main address and the national address.",
          "Add branches if any.",
          "Upload the official documents.",
          "Click Submit Profile on the last step."
        ],
        "rules": [
          "Next is enabled once the current step is complete.",
          "Submit Profile needs Main Data, Address (and national address) and the Commercial Registry upload.",
          "Format errors block saving with “Please correct the highlighted fields before saving.”."
        ],
        "after": [
          "On submit: “Company profile submitted successfully” and back to the client register.",
          "Profile data (name, registry, branches, staff) pre-fills the application form."
        ],
        "tips": [
          "On the Branches step, Import brings the sites of your clients from the client sites template.",
          "Enter staff numbers per branch accurately; quotation audit days depend on them."
        ],
        "fields": [
          [
            "Industrial Sector *",
            "The client’s sector."
          ],
          [
            "Are all production lines active? *",
            "Yes / No."
          ],
          [
            "Company Name * / Trading Name *",
            "As in the commercial registry."
          ],
          [
            "Commercial Registry Number *",
            "Registry number."
          ],
          [
            "Serial Number from Issuing Authority",
            "Optional."
          ],
          [
            "Authorized Person Name * / Email * / Phone Number *",
            "The company representative."
          ],
          [
            "Company Status *",
            "For example ACTIVE."
          ],
          [
            "Total Number of Employees *",
            "Used later to calculate audit days."
          ],
          [
            "Registration Date *",
            "Company registration date."
          ]
        ],
        "statuses": [
          [
            "DRAFT",
            "Profile saved as draft."
          ],
          [
            "COMPLETED",
            "Profile submitted complete."
          ]
        ],
        "sections": [
          {
            "id": "client-profile-maindata",
            "title": "Step 1: Main data",
            "bullets": [
              "Data: Company Name, Trading Name, Commercial Registry Number, Serial Number, Authorized Person Name, Email, Phone Number, Company Status, Total Number of Employees, Registration Date.",
              "Save as Draft keeps progress on any step.",
              "Next is enabled once the required fields are complete.",
              "Previous returns to the earlier step."
            ]
          },
          {
            "id": "client-profile-address",
            "title": "Step 2: Address",
            "bullets": [
              "Pin the company on the map with Set Location on Map at the top of the step.",
              "Fields: Country *, City *, Neighborhood *, Street Address *, Building Number *, Sub Number, Postal Code *, Google Map Link.",
              "Click Save Address when done.",
              "Answer Do you have a national address? Yes or No.",
              "Connection Notes: data pulled from the National Address platform is verified; any change needs a justification."
            ]
          },
          {
            "id": "client-profile-branches",
            "title": "Step 3: Branches",
            "bullets": [
              "First answer Does the client have branches? with Yes to show the Add Branch form.",
              "Fields: Branch Name *, Branch Registry Number *, Branch Address *, Google Map Link *, Branch Manager *, Phone Number *, Sector *, Number of Employees *, Branch Type * (Permanent / Temporary).",
              "Saved branches are listed under Company Branches with their type.",
              "This step is optional; you can continue without branches.",
              "Branch staff numbers are summed to calculate audit days in the quotation."
            ]
          },
          {
            "id": "client-profile-documents",
            "title": "Step 4: Official documents",
            "bullets": [
              "Required documents: National Address Certificate, Activity License, Tax Card, Commercial Registry.",
              "Each shows Awaiting Upload or Uploaded.",
              "Attach more files with Attach Additional Document.",
              "Submit Profile saves and submits the profile and marks it completed."
            ]
          }
        ]
      },
      "ar": {
        "title": "ملف العميل",
        "summary": "ملف الشركة الكامل للعميل في 4 خطوات: البيانات الأساسية، العنوان، الفروع، المستندات الرسمية. تملؤه الجهة نيابة عن العميل أو تكمله بعد التسجيل.",
        "who": "مستلم الطلبات أو مسؤول خدمة العملاء في الجهة.",
        "when": "بعد تسجيل العميل، وقبل إنشاء أول طلب له.",
        "nav": "عملاء التدقيق ← الإجراءات ← «تعديل العميل» (/cab/clients/<id>/profile)",
        "handoff": "العميل يرى الملف نفسه في بوابته تحت «ملف الشركة».",
        "screen": [
          "خطوات الملف الأربع.",
          "ملخص الشركة: القطاع والشعار وحالة خطوط الإنتاج.",
          "المجال الصناعي.",
          "هل جميع خطوط الإنتاج نشطة؟"
        ],
        "steps": [
          "املأ البيانات الأساسية ثم اضغط «التالي».",
          "أدخل العنوان الرئيسي والعنوان الوطني.",
          "أضف الفروع إن وجدت.",
          "ارفع المستندات الرسمية.",
          "اضغط «إرسال الملف» في الخطوة الأخيرة."
        ],
        "rules": [
          "زر «التالي» يتفعّل عند اكتمال الخطوة الحالية.",
          "«إرسال الملف» يتطلب اكتمال البيانات الأساسية والعنوان (والعنوان الوطني) ورفع السجل التجاري.",
          "أخطاء الصيغ تمنع الحفظ وتظهر «يرجى تصحيح الحقول المحددة قبل الحفظ.»."
        ],
        "after": [
          "عند الإرسال: «تم إرسال ملف الشركة بنجاح» والعودة إلى سجل العملاء.",
          "بيانات الملف (الاسم، السجل، الفروع والموظفون) تُعبّأ تلقائياً في نموذج الطلب."
        ],
        "tips": [
          "في خطوة الفروع، يتيح زر «استيراد» إضافة مواقع العملاء من قالب مواقع العملاء.",
          "أدخل عدد الموظفين بدقة لكل فرع؛ يعتمد عليه حساب أيام التدقيق في عرض السعر."
        ],
        "fields": [
          [
            "المجال الصناعي *",
            "قطاع العميل."
          ],
          [
            "هل جميع خطوط الإنتاج نشطة؟ *",
            "نعم / لا."
          ],
          [
            "اسم الشركة * / الاسم التجاري *",
            "كما في السجل التجاري."
          ],
          [
            "رقم السجل التجاري *",
            "رقم السجل."
          ],
          [
            "الرقم التسلسلي من الجهة المانحة",
            "اختياري."
          ],
          [
            "اسم الشخص المخول * / البريد * / الهاتف *",
            "ممثل الشركة."
          ],
          [
            "حالة الشركة *",
            "مثل ACTIVE."
          ],
          [
            "إجمالي عدد الموظفين في الشركة *",
            "يُستخدم لاحقاً في حساب أيام التدقيق."
          ],
          [
            "تاريخ التسجيل *",
            "تاريخ تسجيل الشركة."
          ]
        ],
        "statuses": [
          [
            "DRAFT",
            "الملف محفوظ كمسودة."
          ],
          [
            "COMPLETED",
            "تم إرسال الملف بعد اكتماله."
          ]
        ],
        "sections": [
          {
            "id": "client-profile-maindata",
            "title": "الخطوة 1: البيانات الأساسية",
            "bullets": [
              "البيانات: اسم الشركة، الاسم التجاري، رقم السجل التجاري، الرقم التسلسلي، اسم الشخص المخول، البريد، الهاتف، حالة الشركة، عدد الموظفين، تاريخ التسجيل.",
              "«حفظ كمسودة» يحفظ التقدم في أي خطوة.",
              "«التالي» يتفعّل عند اكتمال الحقول الإلزامية.",
              "«السابق» يعيدك للخطوة السابقة."
            ]
          },
          {
            "id": "client-profile-address",
            "title": "الخطوة 2: العنوان",
            "bullets": [
              "حدد موقع الشركة من «تحديد الموقع على الخريطة» أعلى الخطوة.",
              "الحقول: البلد *، المدينة *، الحي *، عنوان الشارع *، رقم المبنى *، الرقم الفرعي، الرمز البريدي *، رابط Google Map.",
              "اضغط «حفظ العنوان» بعد التعبئة.",
              "أجب «هل لديك عنوان وطني» بنعم أو لا.",
              "ملاحظات الربط: البيانات المجلوبة من منصة العنوان الوطني معتمدة، وأي تعديل يحتاج مبرراً."
            ]
          },
          {
            "id": "client-profile-branches",
            "title": "الخطوة 3: الفروع",
            "bullets": [
              "أجب أولاً «هل لدى العميل فروع؟» بنعم لإظهار نموذج «إضافة فرع».",
              "الحقول: اسم الفرع *، رقم سجل الفرع *، عنوان الفرع *، رابط Google Map *، مدير الفرع *، رقم الهاتف *، المجال *، عدد الموظفين *، نوع الفرع * (دائم / مؤقت).",
              "تظهر الفروع المحفوظة في «الفروع التابعة للشركة» مع نوعها.",
              "الخطوة اختيارية؛ يمكن المتابعة بدون فروع.",
              "عدد موظفي الفروع يُجمع لحساب أيام التدقيق في عرض السعر."
            ]
          },
          {
            "id": "client-profile-documents",
            "title": "الخطوة 4: المستندات الرسمية",
            "bullets": [
              "المستندات المطلوبة: شهادة العنوان الوطني، رخصة مزاولة النشاط، البطاقة الضريبية، السجل التجاري.",
              "لكل مستند حالة: «بإنتظار الرفع» أو «تم الرفع».",
              "أرفق مستندات إضافية من «أرفق مستند إضافي».",
              "«إرسال الملف» يحفظ ويرسل الملف ويغيّر حالته إلى مكتمل."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "contacts",
    "audience": "cab",
    "section": "clients",
    "routes": [
      "/cab/contacts",
      "/cab/contacts/new"
    ],
    "open": "/cab/contacts",
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/contacts"
    },
    "text": {
      "en": {
        "title": "Contacts",
        "summary": "The register of client representatives: name, e-mail, client, job title, roles (primary contact, signatory) and status.",
        "who": "Client service, applications receiver and CAB administrator.",
        "when": "When adding a client representative, naming the signatory, or looking a contact up.",
        "nav": "Application Hub → Clients → Contacts (/cab/contacts)",
        "handoff": "A contact with portal invitation turned on is recorded as a candidate for client-portal access.",
        "screen": [
          "Search by contact, client or e-mail.",
          "Filter by client.",
          "Add contact.",
          "Roles: primary contact and signatory.",
          "Filter by status."
        ],
        "steps": [
          "Search or filter by Client and Status.",
          "Tick rows and use Export for Excel or PDF.",
          "Click Add contact for a new representative."
        ],
        "rules": [
          "One primary contact per client; setting a new one clears the previous.",
          "An e-mail is unique within the same client.",
          "Linked sites must be branches of that client."
        ],
        "after": [
          "The signatory is the person who signs the legal declarations in the application."
        ],
        "tips": [
          "Import from Excel adds client contacts in bulk; each row must name a client already in the register.",
          "View on a row opens the contact panel: details, linked sites and roles, with Edit contact to change them and Delete to remove the contact."
        ],
        "fields": [
          [
            "Contact",
            "Name and e-mail."
          ],
          [
            "Client",
            "Client name and code."
          ],
          [
            "Roles / Designation",
            "Job title, then roles."
          ],
          [
            "Phone",
            "With country code."
          ],
          [
            "Status",
            "Active / Pending / Inactive."
          ]
        ],
        "statuses": [
          [
            "Active",
            "Contact in use."
          ],
          [
            "Pending",
            "Awaiting activation."
          ],
          [
            "Inactive",
            "No longer used."
          ]
        ],
        "sections": [
          {
            "id": "contact-new",
            "title": "Add contact",
            "bullets": [
              "Choose Client *; its card shows name, code and country.",
              "Enter First name *, Last name *, Email address *, Job title and Phone number.",
              "Use + Add Site to link one or more sites; × removes one.",
              "Roles: Primary contact, Authorized signatory.",
              "Turn on Invite to portal to record that this contact should get portal access.",
              "The contact is saved Active with a sequential code (CNT-0001).",
              "After saving you return to the contacts list."
            ]
          }
        ]
      },
      "ar": {
        "title": "جهات الاتصال",
        "summary": "سجل ممثلي العملاء: الاسم والبريد والعميل والمسمى والأدوار (جهة اتصال أساسية، مفوّض بالتوقيع) والحالة.",
        "who": "خدمة العملاء ومستلم الطلبات ومدير الجهة.",
        "when": "عند إضافة ممثل جديد للعميل، أو تحديد المفوَّض بالتوقيع، أو البحث عن جهة اتصال.",
        "nav": "مركز التطبيقات ← العملاء ← جهات الاتصال (/cab/contacts)",
        "handoff": "جهة الاتصال المفعّل لها خيار البوابة تُسجَّل كمرشحة للدخول إلى بوابة العميل.",
        "screen": [
          "البحث بجهة الاتصال أو العميل أو البريد.",
          "تصفية حسب العميل.",
          "«إضافة جهة اتصال».",
          "الأدوار: جهة الاتصال الأساسية والمفوَّض بالتوقيع.",
          "تصفية حسب الحالة."
        ],
        "steps": [
          "ابحث أو صفِّ حسب العميل والحالة.",
          "حدد صفوفاً ثم «تصدير» لتصديرها إلى Excel أو PDF.",
          "اضغط «إضافة جهة اتصال» لإضافة ممثل جديد."
        ],
        "rules": [
          "جهة اتصال أساسية واحدة لكل عميل؛ تعيين جديدة يلغي السابقة.",
          "البريد لا يتكرر داخل العميل نفسه.",
          "المواقع المرتبطة يجب أن تكون من فروع العميل."
        ],
        "after": [
          "المفوَّض بالتوقيع هو من يوقّع الإقرارات القانونية في الطلب."
        ],
        "tips": [
          "يضيف الاستيراد من Excel جهات اتصال العملاء دفعة واحدة، ويجب أن يذكر كل صف عميلاً مسجلاً.",
          "«عرض» في الصف يفتح لوحة جهة الاتصال: البيانات والمواقع المرتبطة والأدوار، مع «تعديل جهة الاتصال» لتغييرها و«حذف» لإزالتها."
        ],
        "fields": [
          [
            "جهة الاتصال",
            "الاسم والبريد."
          ],
          [
            "العميل",
            "اسم العميل وكوده."
          ],
          [
            "الأدوار / المسمى الوظيفي",
            "المسمى ثم الأدوار."
          ],
          [
            "الهاتف",
            "مع كود الدولة."
          ],
          [
            "الحالة",
            "نشط / قيد الانتظار / غير نشط."
          ]
        ],
        "statuses": [
          [
            "نشط",
            "جهة اتصال فعالة."
          ],
          [
            "قيد الانتظار",
            "بانتظار التفعيل."
          ],
          [
            "غير نشط",
            "لم تعد مستخدمة."
          ]
        ],
        "sections": [
          {
            "id": "contact-new",
            "title": "إضافة جهة اتصال",
            "bullets": [
              "اختر العميل *؛ تظهر بطاقته بالاسم والكود والدولة.",
              "أدخل الاسم الأول * واسم العائلة * والبريد الإلكتروني * والمسمى الوظيفي ورقم الهاتف.",
              "من «+ إضافة موقع» اربط موقعاً أو أكثر، و«×» لإزالته.",
              "الأدوار: جهة الاتصال الرئيسية، المفوَّض بالتوقيع.",
              "فعّل «دعوة إلى البوابة» لتسجيل رغبة الجهة في منح جهة الاتصال دخول البوابة.",
              "تُحفظ جهة الاتصال بحالة نشطة وكود متسلسل (CNT-0001).",
              "بعد الحفظ تعود إلى قائمة جهات الاتصال."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "applications",
    "audience": "cab",
    "section": "application",
    "routes": [
      "/cab/applications"
    ],
    "open": "/cab/applications",
    "statusDomain": "application",
    "statusValues": [
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
      "QUOTATION_CREATED",
      "QUOTATION_ISSUED",
      "QUOTATION_ACCEPTED",
      "QUOTATION_REJECTED"
    ],
    "updated": "2026-10-24",
    "capture": {
      "as": "cab",
      "route": "/cab/applications"
    },
    "text": {
      "en": {
        "title": "Application register",
        "summary": "Every certification application: code, client, standards, reviewer, due date, stage and last update, with quick actions to review or ask for clarification.",
        "who": "Applications receiver, reviewer, certification manager.",
        "when": "Daily, to follow new and overdue applications, and when creating one for a client.",
        "nav": "Application Hub → Application → Applications (/cab/applications)",
        "handoff": "The client follows the same status of their application under Applications in the portal.",
        "screen": [
          "New application starts one for a client.",
          "Search by application code, client code or name.",
          "Filter by status.",
          "Due: 14 days after the last update, with days left.",
          "Open review.",
          "Request clarification opens Information Required."
        ],
        "steps": [
          "Use search and the From / To dates, Country and Status filters.",
          "Sort by Updated (newest / oldest first) or Due date (soonest first).",
          "Click a row to open the right screen for its status.",
          "Use Open review or Request clarification straight from the row.",
          "The Actions menu offers View / Continue draft / Review / View receipt.",
          "Click Export for Excel or PDF."
        ],
        "rules": [
          "A draft opens the submission form; it has no review or clarification buttons.",
          "Approved or rejected applications open their receipt; others open the review.",
          "Filters combine; Clear filters resets them."
        ],
        "after": [
          "Every step on the application updates the Stage column at once.",
          "The client sees the same applications and statuses under Applications in the portal."
        ],
        "tips": [
          "Sort by Due date (soonest first) to handle the applications closest to being late."
        ],
        "fields": [
          [
            "Application code",
            "For example APP-0149."
          ],
          [
            "Client name",
            "With the client code."
          ],
          [
            "Standards",
            "Standard and edition."
          ],
          [
            "Reviewer",
            "Assigned reviewer (default “CAB Admin”)."
          ],
          [
            "Due",
            "Last update + 14 days."
          ],
          [
            "Stage",
            "Current status."
          ],
          [
            "Updated",
            "Date and time of the last change."
          ]
        ],
        "statuses": [
          [
            "Draft",
            "Not submitted yet."
          ],
          [
            "Submitted",
            "Received; review not started."
          ],
          [
            "Under Review",
            "Review in progress or waiting for information."
          ],
          [
            "Approved",
            "Review complete; ready for feasibility / quotation."
          ],
          [
            "Rejected",
            "Rejected after review."
          ],
          [
            "Quotation drafted",
            "Quotation created, not issued."
          ],
          [
            "Quotation issued",
            "Sent to the client."
          ],
          [
            "Quotation accepted",
            "Client accepted."
          ],
          [
            "Quotation rejected",
            "Client rejected."
          ]
        ],
        "sections": [
          {
            "id": "applications-actions",
            "title": "Application actions menu",
            "bullets": [
              "View opens the application read-only (Continue draft for drafts).",
              "Review opens the application review.",
              "Request clarification opens the Information Required page.",
              "View receipt opens the application receipt."
            ]
          }
        ]
      },
      "ar": {
        "title": "سجل الطلبات",
        "summary": "قائمة كل طلبات منح الشهادات: الرمز، العميل، المعايير، المراجع، تاريخ الاستحقاق، المرحلة وآخر تحديث، مع إجراءات سريعة للمراجعة وطلب التوضيح.",
        "who": "مستلم الطلبات، المراجع، مدير منح الشهادات.",
        "when": "يومياً لمتابعة الطلبات الجديدة والمتأخرة، وعند إنشاء طلب نيابة عن عميل.",
        "nav": "مركز التطبيقات ← الطلب ← الطلبات (/cab/applications)",
        "handoff": "العميل يتابع الحالة نفسها لطلبه من «الطلبات» في البوابة.",
        "screen": [
          "«طلب جديد» لإنشاء طلب نيابة عن عميل.",
          "البحث برمز الطلب أو رمز العميل أو الاسم.",
          "تصفية حسب الحالة.",
          "الاستحقاق: 14 يوماً من آخر تحديث مع الأيام المتبقية.",
          "«فتح المراجعة».",
          "«طلب توضيح» يفتح صفحة المعلومات المطلوبة."
        ],
        "steps": [
          "استخدم البحث وفلاتر التاريخ (من / إلى) والدولة والحالة.",
          "رتّب حسب: التحديث (الأحدث أولاً / الأقدم أولاً) أو تاريخ الاستحقاق (الأقرب أولاً).",
          "اضغط صف الطلب لفتح الشاشة المناسبة لحالته.",
          "استخدم «فتح المراجعة» أو «طلب توضيح» مباشرة من الصف.",
          "من قائمة «إجراءات» اختر عرض / متابعة المسودة / مراجعة / عرض الإيصال.",
          "اضغط «تصدير» لتصدير القائمة إلى Excel أو PDF."
        ],
        "rules": [
          "المسودة تفتح نموذج التقديم لإكمالها، ولا يظهر لها زرّا المراجعة والتوضيح.",
          "الطلب المعتمد أو المرفوض يفتح إيصاله؛ وغيرهما يفتح صفحة المراجعة.",
          "الفلاتر تعمل معاً، و«مسح الفلاتر» يعيدها لوضعها الافتراضي."
        ],
        "after": [
          "كل تقدم في الطلب ينعكس هنا فوراً في عمود «المرحلة».",
          "العميل يرى طلباته وحالاتها في بوابته تحت «الطلبات»."
        ],
        "tips": [
          "رتّب حسب «تاريخ الاستحقاق (الأقرب أولاً)» لمعالجة الطلبات الأقرب للتأخير."
        ],
        "fields": [
          [
            "رمز الطلب",
            "مثل APP-0149."
          ],
          [
            "اسم العميل",
            "مع رمز العميل."
          ],
          [
            "المعايير",
            "المواصفة وإصدارها."
          ],
          [
            "المراجع",
            "المراجع المعيّن (افتراضياً «مسؤول جهة التصديق»)."
          ],
          [
            "الاستحقاق",
            "آخر تحديث + 14 يوماً."
          ],
          [
            "المرحلة",
            "حالة الطلب الحالية."
          ],
          [
            "آخر تحديث",
            "تاريخ ووقت آخر تغيير."
          ]
        ],
        "statuses": [
          [
            "مسودة",
            "لم يُقدَّم بعد."
          ],
          [
            "مُقدَّم",
            "استُلم ولم تبدأ مراجعته."
          ],
          [
            "قيد المراجعة",
            "المراجعة جارية أو بانتظار معلومات."
          ],
          [
            "معتمد",
            "اكتملت المراجعة وجاهز للجدوى الفنية / عرض السعر."
          ],
          [
            "مرفوض",
            "رُفض بعد المراجعة."
          ],
          [
            "مسودة عرض سعر",
            "أُنشئ عرض السعر ولم يُصدر."
          ],
          [
            "صدر عرض السعر",
            "أُرسل العرض للعميل."
          ],
          [
            "قُبل عرض السعر",
            "وافق العميل."
          ],
          [
            "رُفض عرض السعر",
            "رفض العميل."
          ]
        ],
        "sections": [
          {
            "id": "applications-actions",
            "title": "قائمة إجراءات الطلب",
            "bullets": [
              "«عرض»: يفتح الطلب للقراءة (أو «متابعة المسودة» للمسودات).",
              "«مراجعة»: يفتح صفحة مراجعة الطلب.",
              "«طلب توضيح»: يفتح صفحة المعلومات المطلوبة للطلب.",
              "«عرض الإيصال»: يفتح إيصال استلام الطلب."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "application-submission",
    "audience": "cab",
    "section": "application",
    "routes": [
      "/cab/applications/submission",
      "/cab/applications/draft",
      "/cab/applications/draft/sites/new"
    ],
    "open": "/cab/applications/submission",
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/applications/submission"
    },
    "text": {
      "en": {
        "title": "New application (submission)",
        "summary": "The CAB creates a certification application for a client: pick the client, fill the Entity data form section by section, then Field (sectors and IAF codes), then Documents, and submit.",
        "who": "Applications receiver or client-service staff.",
        "when": "When the client sends data outside the portal, or asks the CAB to fill the application for them.",
        "nav": "Applications → New application (/cab/applications/submission)",
        "handoff": "The application appears in the client portal under Applications with its current status.",
        "screen": [
          "Step “Select an audit client”.",
          "Client list with search by name or code.",
          "Start application creates a draft with a new number.",
          "Journey bar from application to surveillance."
        ],
        "steps": [
          "Click Select client and search by name or code.",
          "Pick the client and click Start application.",
          "A draft with a new number (e.g. APP-0153) opens on Entity data.",
          "Fill the five sections in order; Next after each one also saves the draft.",
          "In Field choose the sectors, then the IAF codes for each standard.",
          "In Documents upload the required files, then click Submit request."
        ],
        "rules": [
          "With no clients: “No audit clients found. Register a client first.”.",
          "On submit, “These fields still need to be completed:” lists each missing field and why.",
          "After submission the application can no longer be edited; it becomes read-only.",
          "Fill data fills every field with sample data for training and testing; replace it with the real data.",
          "The old Application draft link (/cab/applications/draft) now opens this submission flow and keeps the client and application it pointed to."
        ],
        "after": [
          "The application becomes Submitted and appears in the register.",
          "The CAB gets a “New application APP-xxxx” notification linking to the receipt.",
          "The client sees it in the portal under Applications."
        ],
        "tips": [
          "Click Save as Draft before leaving if the data is incomplete.",
          "Client profile data (name, registry, branches) is pre-filled."
        ],
        "fields": [
          [
            "Entity data",
            "Legal identity, scope of activity and branches, consulting and readiness, specification questions, legal declarations."
          ],
          [
            "Field",
            "Sectors and IAF codes per standard."
          ],
          [
            "Documents",
            "Mandatory documents and other files."
          ],
          [
            "Feedback",
            "Reviewer information requests and replies."
          ]
        ],
        "statuses": [
          [
            "Draft",
            "Being filled in."
          ],
          [
            "Submitted",
            "Sent; waiting for receipt and review."
          ]
        ],
        "sections": [
          {
            "id": "submission-client-picker",
            "title": "Choosing the client",
            "bullets": [
              "Search the list by client name or code.",
              "Only clients registered with the CAB are listed.",
              "After choosing, Start application becomes active."
            ]
          },
          {
            "id": "submission-entity-data",
            "title": "Entity data: legal identity",
            "bullets": [
              "Main data: Required Standard Specification *, Organization Name *, Website, Head Office Address *, Audit Site Address *, Commercial Registration No. *.",
              "Are all production lines or processes within the product range active? * (Yes / No).",
              "Regulatory data: E-mail, Country *, City *, Organization Representative Name * and Title *, Mobile number.",
              "Organization type: Government sector, Private sector, Third party.",
              "Main activity * and Request type * (new or renewal).",
              "The standards chosen here drive the specification questions, IAF codes and later the audit days."
            ]
          },
          {
            "id": "submission-scope",
            "title": "Scope of activity and branches",
            "bullets": [
              "The scope of work according to the commercial registration / license *.",
              "The question “Do you have any branches? *” sits at the bottom.",
              "The economic field of activity * (tags).",
              "Nature of products / services *, annual production capacity *, technical specifications used *.",
              "Answering Yes to branches adds branch cards with the employees in scope at each.",
              "The sum of employees in scope across branches is the basis for audit days in the quotation."
            ]
          },
          {
            "id": "submission-consulting",
            "title": "Consulting and management system readiness",
            "bullets": [
              "Was the organisation qualified by a consultant? Is the consultant’s profile attached?",
              "Consultant rating and recommendation on a 1 to 10 scale.",
              "Readiness: management-system language, easy site access, safety procedures for the audit team.",
              "Subcontracted activities, and previous certification by another body.",
              "Other management systems applied: ISO 9001, 14001, 45001, 22000, Another.",
              "Is design one of the activities? * If No, the exclusion reason * is required."
            ]
          },
          {
            "id": "submission-declarations",
            "title": "Legal declarations and signature",
            "bullets": [
              "Enter Authorized signatory * and Date *.",
              "Sign by drawing, typing the name or uploading an image, then Use this signature.",
              "Section Two: confidentiality terms and their exceptions.",
              "Data as it will appear on the certificate: name, address and field in Arabic and English (all required).",
              "The acknowledgement tick is required: “I acknowledge that I have read, understood and agree...”.",
              "Warning: the order cannot be modified after submission."
            ]
          },
          {
            "id": "submission-field",
            "title": "Field: sectors and IAF codes",
            "bullets": [
              "Sectors appear once a standard is chosen in the legal identity step.",
              "Phase 1: choose the sectors for each standard.",
              "Phase 2: choose the IAF codes inside those sectors.",
              "The codes are matched to the CAB’s accredited scope and auditor competence in Technical Feasibility."
            ]
          },
          {
            "id": "submission-documents",
            "title": "Documents and submitting",
            "bullets": [
              "Required: documentary system, organisational structure, commercial registry / licence, VAT certificate, brand image, national address, quality policy and objectives.",
              "Several files per item are allowed (PDF, JPG, PNG), up to 10 MB each.",
              "The HACCP plans item switches on automatically for food-safety standards.",
              "Click Submit request at the bottom to submit.",
              "After submitting, the status view shows and the data becomes read-only."
            ]
          },
          {
            "id": "submission-feedback",
            "title": "Feedback (information requests and replies)",
            "bullets": [
              "Reviewer information requests appear here with reference and due date.",
              "Replies are text, with bold, links and file attachments.",
              "The client sees the same section in the portal application and replies there.",
              "Each reply reaches the CAB as “Information received for…” and shows on the Information Required page."
            ]
          }
        ]
      },
      "ar": {
        "title": "طلب جديد (تقديم الطلب)",
        "summary": "تُنشئ الجهة طلب منح شهادة نيابة عن العميل: تختار العميل ثم تملأ نموذج «بيانات الجهة» بأقسامه، ثم المجال ورموز IAF، ثم المستندات، وتقدّم الطلب.",
        "who": "مستلم الطلبات أو موظف خدمة العملاء.",
        "when": "عندما يرسل العميل بياناته خارج البوابة، أو يطلب من الجهة تعبئة الطلب نيابة عنه.",
        "nav": "الطلبات ← «طلب جديد» (/cab/applications/submission)",
        "handoff": "يظهر الطلب في بوابة العميل تحت «الطلبات» بحالته الحالية.",
        "screen": [
          "خطوة «اختر عميل التدقيق».",
          "قائمة العملاء مع البحث بالاسم أو الرمز.",
          "«بدء الطلب» ينشئ مسودة برقم جديد.",
          "شريط مراحل الرحلة من الطلب حتى المراقبة."
        ],
        "steps": [
          "اضغط «اختر العميل» وابحث باسم العميل أو رمزه.",
          "اختر العميل ثم اضغط «بدء الطلب».",
          "تُنشأ مسودة برقم طلب جديد (مثل APP-0153) وتفتح «بيانات الجهة».",
          "املأ الأقسام الخمسة بالترتيب، واضغط «التالي» بعد كل قسم (يحفظ المسودة).",
          "في «المجال» اختر القطاعات ثم رموز IAF لكل مواصفة.",
          "في «المستندات» ارفع المستندات المطلوبة ثم اضغط «إرسال الطلب»."
        ],
        "rules": [
          "إذا لم يكن هناك عملاء تظهر «لا يوجد عملاء تدقيق. سجّل عميلاً أولاً.».",
          "عند الإرسال تُعرض قائمة «هذه الحقول ما زالت ناقصة» بكل حقل ناقص وسببه.",
          "لا يمكن تعديل الطلب بعد الإرسال؛ يصبح للعرض فقط.",
          "زر «تعبئة البيانات» يملأ كل الحقول ببيانات نموذجية للتدريب والاختبار؛ استبدلها بالبيانات الفعلية.",
          "رابط «مسودة الطلب» القديم (/cab/applications/draft) يفتح الآن مسار التقديم هذا مع الإبقاء على العميل والطلب المحددين فيه."
        ],
        "after": [
          "حالة الطلب تصبح «مُقدَّم» ويظهر في سجل الطلبات.",
          "يصل إشعار «طلب جديد APP-xxxx» لجهة المنح مع رابط الإيصال.",
          "العميل يرى الطلب في بوابته تحت «الطلبات»."
        ],
        "tips": [
          "اضغط «حفظ كمسودة» قبل مغادرة الصفحة إذا لم تكتمل البيانات.",
          "بيانات ملف العميل (الاسم، السجل، الفروع) تُملأ مسبقاً في النموذج."
        ],
        "fields": [
          [
            "بيانات الجهة",
            "الهوية القانونية، نطاق النشاط والفروع، الاستشارات والجاهزية، أسئلة المواصفات، الإقرارات القانونية."
          ],
          [
            "المجال",
            "القطاعات ورموز IAF لكل مواصفة."
          ],
          [
            "المستندات",
            "الوثائق الإلزامية ومستندات أخرى."
          ],
          [
            "الملاحظات",
            "طلبات المعلومات من المراجع والرد عليها."
          ]
        ],
        "statuses": [
          [
            "مسودة",
            "قيد التعبئة."
          ],
          [
            "مُقدَّم",
            "أُرسل وينتظر الاستلام والمراجعة."
          ]
        ],
        "sections": [
          {
            "id": "submission-client-picker",
            "title": "اختيار العميل",
            "bullets": [
              "ابحث في القائمة باسم العميل أو رمزه.",
              "تظهر فقط العملاء المسجلون لدى الجهة.",
              "بعد الاختيار يتفعّل زر «بدء الطلب»."
            ]
          },
          {
            "id": "submission-entity-data",
            "title": "بيانات الجهة: الهوية القانونية",
            "bullets": [
              "البيانات الرئيسية: المواصفة القياسية المطلوبة *، اسم المنظمة *، الموقع الإلكتروني، عنوان المقر الرئيسي *، عنوان مكان التدقيق *، رقم السجل التجاري *.",
              "هل جميع خطوط الإنتاج أو العمليات ضمن نطاق المنتج نشطة؟ * (نعم / لا).",
              "البيانات التنظيمية: البريد، الدولة *، المدينة *، اسم ممثل المنظمة * ومنصبه *، رقم الجوال.",
              "نوع المنظمة: القطاع الحكومي، القطاع الخاص، طرف ثالث.",
              "النشاط الرئيسي * ونوع الطلب * (جديد أو تجديد).",
              "المواصفات المختارة هنا تحدد أسئلة المواصفات ورموز IAF وأيام التدقيق لاحقاً."
            ]
          },
          {
            "id": "submission-scope",
            "title": "نطاق النشاط والفروع",
            "bullets": [
              "نطاق عمل المنظمة وفقاً للسجل التجاري / الترخيص *.",
              "سؤال «هل لديك أي فروع؟ *» أسفل القسم.",
              "المجال الاقتصادي لنشاط المؤسسة * (وسوم).",
              "طبيعة المنتجات / الخدمات *، القدرة الإنتاجية السنوية *، المواصفات الفنية المستخدمة في الإنتاج *.",
              "عند الإجابة بنعم على الفروع تُضاف بطاقات الفروع مع عدد الموظفين في النطاق لكل فرع.",
              "مجموع موظفي الفروع في النطاق هو أساس حساب أيام التدقيق في عرض السعر."
            ]
          },
          {
            "id": "submission-consulting",
            "title": "الاستشارات وجاهزية نظام الإدارة",
            "bullets": [
              "هل أُهّلت المنظمة عبر جهة استشارية؟ وهل أُرفق ملف الجهة المؤهِّلة؟",
              "تقييم المستشار والتوصية به على مقياس 1 إلى 10.",
              "الجاهزية: لغة نظام الإدارة، سهولة الوصول للمواقع، إجراءات السلامة لفريق التدقيق.",
              "التعاقد من الباطن، والحصول على منح سابقة من جهة أخرى.",
              "أنظمة إدارة أخرى مطبقة: ISO 9001، 14001، 45001، 22000، أخرى.",
              "هل التصميم أحد أنشطة المنظمة؟ * وعند «لا» يجب ذكر سبب الاستثناء *."
            ]
          },
          {
            "id": "submission-declarations",
            "title": "الإقرارات القانونية والتوقيع",
            "bullets": [
              "أدخل المفوَّض بالتوقيع * والتاريخ *.",
              "وقّع بالرسم أو بكتابة الاسم أو برفع صورة التوقيع، ثم «اعتماد هذا التوقيع».",
              "القسم الثاني: شروط السرية والاستثناءات منها.",
              "البيانات كما ستظهر في الشهادة: الاسم والعنوان والمجال بالعربية والإنجليزية (كلها إلزامية).",
              "تأكيد الإقرار إلزامي: «أقر بأنني قد قرأت وفهمت...».",
              "تنبيه: لا يمكن تعديل الطلب بعد الإرسال."
            ]
          },
          {
            "id": "submission-field",
            "title": "المجال: القطاعات ورموز IAF",
            "bullets": [
              "تظهر القطاعات بعد اختيار المواصفة في خطوة الهوية القانونية.",
              "المرحلة 1: اختر القطاعات لكل مواصفة.",
              "المرحلة 2: اختر رموز IAF داخل القطاعات.",
              "الرموز تُقارن بالنطاق المعتمد للجهة وبكفاءة المدققين عند الجدوى الفنية."
            ]
          },
          {
            "id": "submission-documents",
            "title": "المستندات وإرسال الطلب",
            "bullets": [
              "المطلوب: النظام الوثائقي، الهيكل التنظيمي، السجل التجاري / الترخيص، شهادة ضريبة القيمة المضافة، صورة العلامة التجارية، العنوان الوطني، سياسة الجودة والأهداف.",
              "يُسمح بأكثر من ملف لكل عنصر (PDF أو JPG أو PNG) حتى 10 ميجابايت للملف.",
              "عنصر خطط HACCP يتفعّل تلقائياً عند اختيار معايير سلامة الغذاء.",
              "اضغط «إرسال الطلب» أسفل الصفحة لتقديم الطلب.",
              "بعد الإرسال تُعرض حالة الطلب وتصبح البيانات للعرض فقط."
            ]
          },
          {
            "id": "submission-feedback",
            "title": "الملاحظات (طلبات المعلومات والرد عليها)",
            "bullets": [
              "هنا تظهر طلبات المعلومات التي يرسلها المراجع مع المرجع وتاريخ الاستحقاق.",
              "الرد يكون نصاً مع إمكانية الغامق والروابط وإرفاق ملفات.",
              "العميل يرى القسم نفسه في طلبه داخل البوابة ويرد منه.",
              "كل رد يصل للجهة بإشعار «وصلت المعلومات للطلب» ويظهر في صفحة المعلومات المطلوبة."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "application-receipt",
    "audience": "cab",
    "section": "application",
    "routes": [
      "/cab/applications/receipt",
      "/cab/applications/:applicationId/receipt"
    ],
    "open": "/cab/applications/receipt",
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/applications/a9000149-7d1e-4b5a-8c01-000000000149/receipt"
    },
    "text": {
      "en": {
        "title": "Application receipt",
        "summary": "Formal confirmation that the application was received and logged: who received it and when, the receipt reference, application details, client summary, scope, documents and the workflow position.",
        "who": "Applications receiver and CAB administrator.",
        "when": "As soon as a new application arrives (Submitted), and later as the application’s reference.",
        "nav": "Applications → row → View receipt, or Application Hub → Application Receipt → pick the application",
        "handoff": "The receipt states that a confirmation e-mail with the receipt details was sent to the client contact.",
        "screen": [
          "Page title and the Received badge.",
          "Who received it and when.",
          "Application Details.",
          "Reference No. in the form RCPT/year/month/number.",
          "Workflow Progress."
        ],
        "steps": [
          "Open the receipt from the register or the Application Receipt tile.",
          "Check application type, standard, number of sites, accreditation body and audit language.",
          "Review the client summary and the scope (View Full Scope).",
          "Check the documents summary: total, uploaded, pending, rejected.",
          "Move on to Application Review to start the review."
        ],
        "rules": [
          "The receipt is read-only; it does not change the status.",
          "Download Receipt and Print Receipt produce the branded receipt PDF; More Actions offers Resend acknowledgement e-mail, View application, Request information and Technical feasibility."
        ],
        "after": [
          "Next step: Application Review for completeness and eligibility."
        ],
        "tips": [
          "Quote the reference number when writing to the client about the application."
        ],
        "fields": [
          [
            "Application Type",
            "Initial certification or renewal."
          ],
          [
            "Primary Standard / Scheme",
            "For example ISO 9001:2015."
          ],
          [
            "Requested Certification Date",
            "As requested by the client."
          ],
          [
            "Number of Sites",
            "Sites in scope."
          ],
          [
            "Accreditation Body",
            "For example SAAC."
          ],
          [
            "Audit Language",
            "For example Arabic."
          ],
          [
            "Application Date / Received Date",
            "Submission and receipt dates."
          ],
          [
            "Reference No.",
            "Receipt number."
          ]
        ],
        "statuses": [
          [
            "Received",
            "Logged and under preliminary processing."
          ]
        ],
        "sections": [
          {
            "id": "application-receipt-summary",
            "title": "Client, scope and documents summary",
            "bullets": [
              "Client summary: client ID, organisation type, country, legal entity name, registration number, industry.",
              "Scope of certification as entered, with View Full Scope.",
              "Confirmation that the receipt e-mail went to the client contact.",
              "Documents summary: total, uploaded, pending, rejected, with View All Documents."
            ]
          }
        ]
      },
      "ar": {
        "title": "إيصال استلام الطلب",
        "summary": "تأكيد رسمي بأن الطلب استُلم وسُجّل: من استلمه ومتى، ورقم مرجع الإيصال، وتفاصيل الطلب، وملخص العميل والنطاق والمستندات، وموقع الطلب في سير العمل.",
        "who": "مستلم الطلبات ومدير الجهة.",
        "when": "فور وصول طلب جديد (حالة «مُقدَّم»)، وكمرجع لاحق للطلب.",
        "nav": "الطلبات ← صف الطلب ← «عرض الإيصال»، أو مركز التطبيقات ← استلام الطلبات ← اختر الطلب",
        "handoff": "يذكر الإيصال أن بريد تأكيد بتفاصيل الاستلام أُرسل إلى جهة اتصال العميل.",
        "screen": [
          "عنوان الصفحة وحالة «تم الاستلام».",
          "من استلم الطلب وتاريخ الاستلام.",
          "تفاصيل الطلب.",
          "رقم المرجع بصيغة RCPT/السنة/الشهر/الرقم.",
          "تقدم سير العمل."
        ],
        "steps": [
          "افتح الإيصال من سجل الطلبات أو من تطبيق «استلام الطلبات».",
          "تحقق من نوع الطلب والمعيار وعدد المواقع وجهة الاعتماد ولغة التدقيق.",
          "راجع ملخص العميل ونطاق الشهادة («عرض النطاق الكامل»).",
          "راجع ملخص المستندات: الإجمالي، المرفوع، قيد الانتظار، المرفوض.",
          "انتقل إلى «مراجعة الطلب» لبدء المراجعة."
        ],
        "rules": [
          "الإيصال للعرض فقط؛ لا يغيّر حالة الطلب.",
          "«تحميل الإيصال» و«طباعة الإيصال» يُنشئان ملف PDF للإيصال بهوية الجهة، و«المزيد من الإجراءات» يتيح «إعادة إرسال بريد الإقرار» و«عرض الطلب» و«طلب معلومات» و«الجدوى الفنية»."
        ],
        "after": [
          "الخطوة التالية: «مراجعة الطلب» للتحقق من الاكتمال والأهلية."
        ],
        "tips": [
          "استخدم رقم المرجع عند مراسلة العميل بشأن الطلب."
        ],
        "fields": [
          [
            "نوع الطلب",
            "منح أولي أو تجديد."
          ],
          [
            "المعيار / المخطط الأساسي",
            "مثل ISO 9001:2015."
          ],
          [
            "تاريخ منح الشهادة المطلوب",
            "كما طلبه العميل."
          ],
          [
            "عدد المواقع",
            "المواقع في النطاق."
          ],
          [
            "جهة الاعتماد",
            "مثل SAAC."
          ],
          [
            "لغة التدقيق",
            "مثل Arabic."
          ],
          [
            "تاريخ الطلب / تاريخ استلام الطلب",
            "تاريخ التقديم والاستلام."
          ],
          [
            "رقم المرجع",
            "رقم الإيصال."
          ]
        ],
        "statuses": [
          [
            "تم الاستلام",
            "الطلب مسجل وتحت المعالجة الأولية."
          ]
        ],
        "sections": [
          {
            "id": "application-receipt-summary",
            "title": "ملخص العميل والنطاق والمستندات",
            "bullets": [
              "ملخص العميل: معرف العميل، نوع المنظمة، الدولة، الاسم القانوني، رقم التسجيل، القطاع.",
              "نطاق الشهادة كما أدخله العميل، مع «عرض النطاق الكامل».",
              "تأكيد إرسال بريد الإيصال إلى جهة اتصال العميل.",
              "ملخص المستندات: الإجمالي، تم الرفع، قيد الانتظار، مرفوض، مع «عرض جميع المستندات»."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "application-review",
    "audience": "cab",
    "section": "application",
    "routes": [
      "/cab/applications/review",
      "/cab/applications/:applicationId/review",
      "/cab/applications/review-queue"
    ],
    "open": "/cab/applications/review",
    "updated": "2026-10-24",
    "capture": {
      "as": "cab",
      "route": "/cab/applications/a9000149-7d1e-4b5a-8c01-000000000149/review"
    },
    "text": {
      "en": {
        "title": "Application review",
        "summary": "The reviewer checks the application section by section (7 sections) for completeness, accuracy and eligibility, records a status and comment per section, then decides: technical feasibility, request information, or reject.",
        "who": "Application reviewer (e.g. applications receiver or technical manager).",
        "when": "After receipt (Submitted), and whenever the client replies.",
        "nav": "Applications → Open review, or Application Hub → Application Review → pick the application",
        "handoff": "With Partially Complete the client gets “Information needed for…” and sees the request in the Feedback section of the application.",
        "screen": [
          "Send for Technical Feasibility.",
          "Review tabs.",
          "First of the seven review sections.",
          "Last section: Documents.",
          "Download Application."
        ],
        "steps": [
          "Open Application Details and pick section 1.",
          "Read the section data.",
          "Choose Section status and write a Reviewer comment (both required).",
          "Click Save & continue to move to the next section.",
          "On the last section click Save & view checklist to open the Review Checklist.",
          "Choose the review decision or use Review Actions."
        ],
        "rules": [
          "The first save moves the application from Submitted to Under Review.",
          "Partially Complete automatically raises an information request to the client (Medium priority, due in one week) with your comment.",
          "Changing a section of an approved or rejected application returns it to Under Review.",
          "A quotation can be prepared only when every section is Complete or Not Applicable."
        ],
        "after": [
          "Approve Completeness marks every section Complete and opens Technical Feasibility.",
          "Reject Application marks the sections Incomplete and the application Rejected.",
          "Information requests reach the client as “Information needed for…”."
        ],
        "tips": [
          "Write a clear comment for Partially Complete; it is the text the client receives."
        ],
        "fields": [
          [
            "Sections",
            "1 Legal, 2 Operational, 3 Consultant, 4 Declaration, 5 Branches, 6 Certificates, 7 Documents."
          ],
          [
            "Section status *",
            "Complete, Partially Complete, Incomplete, Not Applicable."
          ],
          [
            "Reviewer comment *",
            "Your note on the section."
          ]
        ],
        "statuses": [
          [
            "Not reviewed",
            "Section not reviewed yet."
          ],
          [
            "Complete",
            "Section satisfactory."
          ],
          [
            "Partially Complete",
            "Needs information from the client."
          ],
          [
            "Incomplete",
            "Section not satisfactory."
          ],
          [
            "Not Applicable",
            "Does not apply; excluded from the score."
          ]
        ],
        "sections": [
          {
            "id": "review-section-form",
            "title": "Section status and reviewer comment",
            "bullets": [
              "Choose Complete, Partially Complete, Incomplete or Not Applicable.",
              "Write the Reviewer comment in the field below.",
              "No status: “Select a status for this section.”; no comment: “Write a comment for this section.”.",
              "Save & continue saves and opens the next section; Back goes back.",
              "The comment is kept in Review Comments and History."
            ]
          },
          {
            "id": "review-checklist",
            "title": "Review checklist and decision",
            "bullets": [
              "Score = (complete + half of partially complete) ÷ scored sections; Not Applicable is excluded.",
              "Summary: all complete, substantially complete (50%+), or incomplete.",
              "Review Decision: Proceed to Technical Feasibility, Request Information, Proceed to Quotation, Hold Review.",
              "Choosing a decision opens the matching screen.",
              "Note: once technical feasibility is approved, the application moves to the quotation phase."
            ]
          },
          {
            "id": "review-documents",
            "title": "Documents tab",
            "bullets": [
              "Lists every application document: commercial register, organisation chart, quality manual, authorisation letter...",
              "View opens the file; Download saves it.",
              "A missing document is recorded as Partially Complete on the Documents section."
            ]
          },
          {
            "id": "review-comments",
            "title": "Comments and history",
            "bullets": [
              "Review Comments: public comments on the sections.",
              "Internal Comments: notes for the CAB team only.",
              "History: Date & Time, By, Action and Details for each comment.",
              "Example: APP-0148 has Partially Complete comments on Branches and Documents."
            ]
          },
          {
            "id": "review-actions",
            "title": "Review actions",
            "bullets": [
              "Request Information opens the Information Required page.",
              "Approve Completeness marks every section Complete, then opens Technical Feasibility.",
              "Reject Application marks the sections Incomplete and sets the status to Rejected.",
              "A rejected application opens its receipt from the register and cannot be priced."
            ]
          }
        ]
      },
      "ar": {
        "title": "مراجعة الطلب",
        "summary": "يراجع المراجع الطلب قسماً قسماً (7 أقسام) من حيث الاكتمال والدقة والأهلية، ويسجل حالة وتعليقاً لكل قسم، ثم يقرر: الجدوى الفنية أو طلب معلومات أو الرفض.",
        "who": "مراجع الطلبات (مثل مستلم الطلبات أو المدير الفني).",
        "when": "بعد استلام الطلب (حالة «مُقدَّم»)، وكلما وصل رد من العميل.",
        "nav": "الطلبات ← «فتح المراجعة»، أو مركز التطبيقات ← مراجعة الطلبات ← اختر الطلب",
        "handoff": "عند «مكتمل جزئياً» يستلم العميل إشعار «مطلوب معلومات للطلب» ويرى الطلب في قسم الملاحظات بطلبه.",
        "screen": [
          "«إرسال للجدوى الفنية».",
          "تبويبات المراجعة.",
          "أول أقسام المراجعة السبعة.",
          "آخر قسم: المستندات.",
          "«تنزيل الطلب»."
        ],
        "steps": [
          "افتح تبويب «تفاصيل الطلب» واختر القسم 1.",
          "راجع بيانات القسم المعروضة.",
          "اختر «حالة القسم» واكتب «تعليق المراجع» (كلاهما إلزامي).",
          "اضغط «حفظ ومتابعة» للانتقال للقسم التالي.",
          "في القسم الأخير اضغط «حفظ وعرض القائمة» لفتح «قائمة المراجعة».",
          "اختر قرار المراجعة أو استخدم «إجراءات المراجعة»."
        ],
        "rules": [
          "أول حفظ يحوّل الطلب من «مُقدَّم» إلى «قيد المراجعة».",
          "اختيار «مكتمل جزئياً» ينشئ تلقائياً طلب معلومات للعميل (أولوية متوسطة، استحقاق بعد أسبوع) بنص تعليقك.",
          "تعديل قسم في طلب معتمد أو مرفوض يعيده إلى «قيد المراجعة».",
          "لا يمكن إعداد عرض السعر إلا عندما تكون كل الأقسام مكتملة أو غير منطبقة."
        ],
        "after": [
          "«الموافقة على الاكتمال» تجعل كل الأقسام مكتملة وتنقلك إلى الجدوى الفنية.",
          "«رفض الطلب» يجعل الأقسام غير مكتملة والطلب «مرفوض».",
          "طلبات المعلومات تصل للعميل بإشعار «مطلوب معلومات للطلب»."
        ],
        "tips": [
          "اكتب تعليقاً واضحاً عند «مكتمل جزئياً»؛ فهو النص الذي يصل للعميل."
        ],
        "fields": [
          [
            "الأقسام",
            "1 المعلومات القانونية، 2 التشغيلية، 3 المستشار، 4 الإقرار، 5 الفروع، 6 الشهادات، 7 المستندات."
          ],
          [
            "حالة القسم *",
            "مكتمل، مكتمل جزئياً، غير مكتمل، غير منطبق."
          ],
          [
            "تعليق المراجع *",
            "ملاحظتك على القسم."
          ]
        ],
        "statuses": [
          [
            "لم تتم المراجعة",
            "القسم لم يُراجع بعد."
          ],
          [
            "مكتمل",
            "القسم مستوفٍ."
          ],
          [
            "مكتمل جزئياً",
            "ينقصه معلومات من العميل."
          ],
          [
            "غير مكتمل",
            "القسم غير مستوفٍ."
          ],
          [
            "غير منطبق",
            "لا ينطبق ولا يُحتسب في النسبة."
          ]
        ],
        "sections": [
          {
            "id": "review-section-form",
            "title": "حالة القسم وتعليق المراجع",
            "bullets": [
              "اختر: مكتمل، مكتمل جزئياً، غير مكتمل، غير منطبق.",
              "اكتب «تعليق المراجع» في الحقل أسفلها.",
              "بدون حالة: «اختر حالة لهذا القسم.»؛ وبدون تعليق: «اكتب تعليقًا لهذا القسم.».",
              "«حفظ ومتابعة» يحفظ ويفتح القسم التالي؛ «السابق» للرجوع.",
              "يُحفظ التعليق في «تعليقات المراجعة» و«السجل»."
            ]
          },
          {
            "id": "review-checklist",
            "title": "قائمة المراجعة والقرار",
            "bullets": [
              "النسبة = (المكتمل + نصف المكتمل جزئياً) ÷ الأقسام المقيّمة؛ «غير منطبق» مستبعد.",
              "الملخص: كل الأقسام مكتملة، أو مكتمل إلى حد كبير (50% فأكثر)، أو غير مكتمل.",
              "قرار المراجعة: الانتقال إلى الجدوى الفنية، طلب معلومات، الانتقال إلى عرض السعر، إيقاف المراجعة.",
              "اختيار القرار ينقلك مباشرة للشاشة المقابلة.",
              "ملاحظة: بعد اعتماد الجدوى الفنية ينتقل الطلب إلى مرحلة عرض السعر."
            ]
          },
          {
            "id": "review-documents",
            "title": "تبويب المستندات",
            "bullets": [
              "يعرض كل مستندات الطلب: السجل التجاري، الهيكل التنظيمي، دليل الجودة، خطاب التفويض...",
              "«عرض» يفتح المستند، و«تحميل» يحفظه.",
              "نقص مستند يُسجَّل بحالة «مكتمل جزئياً» على قسم المستندات."
            ]
          },
          {
            "id": "review-comments",
            "title": "التعليقات والسجل",
            "bullets": [
              "«تعليقات المراجعة»: التعليقات العامة على الأقسام.",
              "«تعليقات داخلية»: ملاحظات لفريق الجهة فقط.",
              "«السجل»: جدول التاريخ والوقت، بواسطة، الإجراء، التفاصيل لكل تعليق.",
              "المثال: APP-0148 فيه تعليقات «مكتمل جزئياً» على الفروع والمستندات."
            ]
          },
          {
            "id": "review-actions",
            "title": "إجراءات المراجعة",
            "bullets": [
              "«طلب معلومات»: يفتح صفحة المعلومات المطلوبة للطلب.",
              "«الموافقة على الاكتمال»: يعلّم كل الأقسام مكتملة ثم يفتح الجدوى الفنية.",
              "«رفض الطلب»: يعلّم الأقسام غير مكتملة ويغير الحالة إلى «مرفوض».",
              "الطلب المرفوض يفتح إيصاله من السجل ولا يمكن تسعيره."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "information-required",
    "audience": "cab",
    "section": "application",
    "routes": [
      "/cab/applications/information-required",
      "/cab/applications/:applicationId/information-required"
    ],
    "open": "/cab/applications/information-required",
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/applications/a9000148-7d1e-4b5a-8c01-000000000148/information-required"
    },
    "text": {
      "en": {
        "title": "Information required",
        "summary": "Tracks every information or clarification request sent to the client during review: item, reference, requester, dates, priority and status, then the client’s responses and their approval.",
        "who": "Reviewer and applications receiver.",
        "when": "When the application lacks information or documents, until the client replies and the reply is approved.",
        "nav": "Applications → Request clarification, or Review → Request Information, or Application Hub → Information Required",
        "handoff": "The client sees the request with its reference and due date in the application’s Feedback section in the portal.",
        "screen": [
          "Page title and In Progress badge.",
          "Send Reminder to Client.",
          "Alert listing open requests.",
          "Earliest due date among the requests."
        ],
        "steps": [
          "Review the Requested Information table and its statuses.",
          "Click + Add Request to send a new request.",
          "Follow Responses from Client as they arrive.",
          "Choose Yes in Approve to accept a response, or No to keep it partially complete.",
          "Add internal comments for the team when needed.",
          "When the sections are complete, return to the review and approve completeness."
        ],
        "rules": [
          "A request on a Submitted application moves it to Under Review.",
          "An empty due date is set automatically to 7 days later.",
          "Approving a response with Yes marks the linked section Complete; No marks it Partially Complete.",
          "Send Reminder to Client notifies the client again about every open request; each request can be reminded once a day, and the dialog shows the last reminder."
        ],
        "after": [
          "The client gets “Information needed for…” and replies from the Feedback section of the application.",
          "The client’s reply reaches the CAB as “Information received for…”."
        ],
        "tips": [
          "Link each request to a clear reference (section or clause) so the client can answer easily."
        ],
        "fields": [
          [
            "Information / Clarification Required",
            "The request text."
          ],
          [
            "Reference (Clause)",
            "Section or standard clause."
          ],
          [
            "Requested By / Requested On",
            "Reviewer and date."
          ],
          [
            "Due Date",
            "Deadline for the reply."
          ],
          [
            "Priority",
            "High / Medium / Low."
          ],
          [
            "Status",
            "Pending / Submitted / Accepted / Rejected."
          ]
        ],
        "statuses": [
          [
            "Pending",
            "Sent; no client reply yet."
          ],
          [
            "Submitted",
            "Client replied; awaiting review."
          ],
          [
            "Accepted",
            "Response approved."
          ],
          [
            "Rejected",
            "Response rejected."
          ]
        ],
        "sections": [
          {
            "id": "information-required-add",
            "title": "Adding an information request",
            "bullets": [
              "Click + Add Request to open the form.",
              "Without a description: “Describe the information that is required.”.",
              "Choose priority High, Medium or Low (Medium by default).",
              "Leave the date empty to default to 7 days.",
              "After sending, the request shows as Pending and the client is notified."
            ]
          },
          {
            "id": "information-required-responses",
            "title": "Client responses and approval",
            "bullets": [
              "Each response shows Information Item, Response / Attachment, Submitted On, Submitted By, Status.",
              "Choose Yes to approve; the linked section becomes Complete.",
              "Choose No when the reply is not enough; the section stays Partially Complete.",
              "Add an internal comment with + Add Internal Comment; text is required and the client never sees it."
            ]
          }
        ]
      },
      "ar": {
        "title": "المعلومات المطلوبة",
        "summary": "تتبع كل طلبات المعلومات والتوضيحات المرسلة للعميل أثناء المراجعة: البند، المرجع، الطالب، التواريخ، الأولوية والحالة، ثم ردود العميل واعتمادها.",
        "who": "المراجع ومستلم الطلبات.",
        "when": "عندما ينقص الطلب معلومات أو مستندات، وحتى يرد العميل ويُعتمد الرد.",
        "nav": "الطلبات ← «طلب توضيح»، أو المراجعة ← «طلب معلومات»، أو مركز التطبيقات ← طلب معلومات إضافية",
        "handoff": "العميل يرى الطلب مع المرجع وتاريخ الاستحقاق في «الملاحظات» داخل طلبه بالبوابة.",
        "screen": [
          "عنوان الصفحة وحالة «قيد التنفيذ».",
          "«إرسال تذكير للعميل».",
          "تنبيه بعدد الطلبات المفتوحة.",
          "أقرب تاريخ استحقاق بين الطلبات."
        ],
        "steps": [
          "راجع جدول «المعلومات المطلوبة» وحالاته.",
          "اضغط «+ إضافة طلب» لإرسال طلب جديد.",
          "تابع «ردود العميل» عند وصولها.",
          "اختر «نعم» في عمود «اعتماد» لقبول الرد، أو «لا» لإبقائه مكتملاً جزئياً.",
          "أضف تعليقات داخلية للفريق عند الحاجة.",
          "بعد اكتمال الأقسام عد إلى المراجعة واعتمد الاكتمال."
        ],
        "rules": [
          "إنشاء طلب على طلب «مُقدَّم» يحوّله إلى «قيد المراجعة».",
          "إذا تُرك تاريخ الاستحقاق فارغاً يُحدَّد تلقائياً بعد 7 أيام.",
          "اعتماد الرد بـ «نعم» يجعل القسم المرتبط «مكتمل»، و«لا» يجعله «مكتمل جزئياً».",
          "«إرسال تذكير للعميل» يُشعر العميل مجددًا بكل طلب مفتوح؛ ويمكن التذكير بكل طلب مرة واحدة يوميًا، وتعرض النافذة آخر تذكير."
        ],
        "after": [
          "العميل يستلم إشعار «مطلوب معلومات للطلب» ويرد من قسم «الملاحظات» في طلبه.",
          "رد العميل يصل للجهة بإشعار «وصلت المعلومات للطلب»."
        ],
        "tips": [
          "اربط كل طلب بمرجع واضح (قسم أو بند مواصفة) ليسهل على العميل الرد."
        ],
        "fields": [
          [
            "المعلومات / التوضيحات المطلوبة",
            "نص الطلب."
          ],
          [
            "المرجع (البند)",
            "القسم أو بند المواصفة."
          ],
          [
            "طلب بواسطة / تاريخ الطلب",
            "المراجع والتاريخ."
          ],
          [
            "تاريخ الاستحقاق",
            "الموعد النهائي للرد."
          ],
          [
            "الأولوية",
            "عالية / متوسطة / منخفضة."
          ],
          [
            "الحالة",
            "قيد الانتظار / تم الإرسال / مقبول / مرفوض."
          ]
        ],
        "statuses": [
          [
            "قيد الانتظار",
            "أُرسل الطلب ولم يرد العميل."
          ],
          [
            "تم الإرسال",
            "رد العميل وينتظر المراجعة."
          ],
          [
            "مقبول",
            "اعتُمد الرد."
          ],
          [
            "مرفوض",
            "رُفض الرد."
          ]
        ],
        "sections": [
          {
            "id": "information-required-add",
            "title": "إضافة طلب معلومات",
            "bullets": [
              "اضغط «+ إضافة طلب» لفتح النموذج.",
              "بدون وصف تظهر «صف المعلومات المطلوبة.».",
              "اختر الأولوية: عالية، متوسطة، منخفضة (الافتراضي متوسطة).",
              "اترك التاريخ فارغاً ليُحدد بعد 7 أيام.",
              "بعد الإرسال يظهر الطلب في الجدول بحالة «قيد الانتظار» ويُشعَر العميل."
            ]
          },
          {
            "id": "information-required-responses",
            "title": "ردود العميل واعتمادها",
            "bullets": [
              "لكل رد: بند المعلومات، الرد / المرفق، تاريخ التقديم، قدّم بواسطة، الحالة.",
              "اختر «نعم» لاعتماد الرد؛ يصبح القسم المرتبط «مكتمل».",
              "اختر «لا» إذا كان الرد غير كافٍ؛ يبقى القسم «مكتمل جزئياً».",
              "أضف تعليقاً داخلياً من «+ إضافة تعليق داخلي»؛ التعليق إلزامي النص ولا يراه العميل."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "technical-feasibility",
    "audience": "cab",
    "section": "application",
    "routes": [
      "/cab/applications/technical-feasibility",
      "/cab/applications/:applicationId/technical-feasibility"
    ],
    "open": "/cab/applications/technical-feasibility",
    "updated": "2026-10-27",
    "capture": {
      "as": "cab",
      "route": "/cab/applications/technical-feasibility"
    },
    "related": [
      "team-selection"
    ],
    "text": {
      "en": {
        "title": "Technical feasibility",
        "summary": "The technical manager confirms the CAB can deliver the audit: 8 assessment areas, an audit team proposed from the competence register, available resources, then the recommendation to proceed to quotation.",
        "who": "Technical manager and the proposed lead auditor.",
        "when": "After completeness is approved and before pricing.",
        "nav": "Review → Send for Technical Feasibility, or Application Hub → Technical Feasibility (opens the first ready application, e.g. APP-0147)",
        "screen": [
          "The application shown.",
          "Technical Feasibility Assessment table.",
          "First area: Scope & Technical Complexity.",
          "Proceed to Quotation."
        ],
        "steps": [
          "Check the summary: client, type, standard, sites, requested on, requested by.",
          "Review the eight areas, each with status and comment.",
          "Review the proposed audit team and available resources.",
          "Read Comments & Justification and add an internal comment if needed.",
          "If the recommendation is feasible, click Proceed to Quotation."
        ],
        "rules": [
          "Applicable Standards, Audit Team Availability and Technical Expertise are assessed automatically from the CAB’s schemes and the proposed team’s competence.",
          "The team is proposed from the competence register: one lead auditor authorised for every standard, then auditors covering missing codes.",
          "A Feasible decision needs a lead auditor and no area marked Not Feasible.",
          "The assessment can be edited only while the application is Submitted, Under Review or Approved.",
          "Edit Team picks one lead auditor and up to five auditors authorised for the standards, and saves the team; Quick Actions add an internal comment, request information from the client, escalate to the technical manager or extend the assessment due date.",
          "Edit team uses the competence-based team selector: recommended people with scores and reasons, validation of standards, IAF codes, critical-code exams and impartiality, and the coverage matrix. A team with a blocking issue cannot be saved (see Audit team selection)."
        ],
        "after": [
          "Proceed to Quotation opens the quotation editor for the same application.",
          "The proposed team is the natural choice in the quotation’s Audit Team step."
        ],
        "tips": [
          "If no team is proposed, check the competence register: is an active auditor authorised for the standard and the IAF codes?"
        ],
        "fields": [
          [
            "Eight areas",
            "Scope & Technical Complexity, Applicable Standards, Audit Team Availability, Technical Expertise, Site Accessibility, Resource Availability, Timeline & Scheduling, Regulatory Requirements."
          ],
          [
            "Status",
            "Feasible, Partially Feasible, Not Feasible, Not Applicable."
          ],
          [
            "Review Summary",
            "Areas marked Feasible out of 8, and the percentage."
          ],
          [
            "Due Date for Assessment",
            "14 days after the request."
          ]
        ],
        "statuses": [
          [
            "Feasible",
            "Area satisfied."
          ],
          [
            "Partially Feasible",
            "Needs action."
          ],
          [
            "Not Feasible",
            "Blocks a feasible decision."
          ],
          [
            "Not Applicable",
            "Does not apply."
          ]
        ],
        "sections": [
          {
            "id": "technical-feasibility-team",
            "title": "Review summary, proposed team and resources",
            "bullets": [
              "Review Summary above the team shows the feasible areas out of 8 and the percentage.",
              "Each member shows name, role (Lead Auditor / Auditor), qualification and years of experience.",
              "Resources: Technical Experts (On Call), Sector Specialists, Document Reviewers, Support Staff, Travel Resources.",
              "A saved team has exactly one lead auditor; every member is an active employee authorised for one of the application’s standards.",
              "Comments & Justification shows the lead auditor’s and technical manager’s notes with dates."
            ]
          },
          {
            "id": "technical-feasibility-recommendation",
            "title": "Recommendation and moving to the quotation",
            "bullets": [
              "The recommendation follows the eight area statuses.",
              "Proceeding opens the Quotation for the same application.",
              "Key Information: Requested On, Requested By, Due Date for Assessment.",
              "Quick Actions panel: Add Internal Comment, Send Reminder, Escalate to Technical Manager, Extend Assessment Due Date."
            ]
          }
        ]
      },
      "ar": {
        "title": "الجدوى الفنية",
        "summary": "يتأكد فيها المدير الفني أن الجهة قادرة على تنفيذ التدقيق: 8 مجالات تقييم، فريق تدقيق مقترح من سجل الكفاءة، الموارد المتاحة، ثم التوصية بالانتقال إلى عرض السعر.",
        "who": "المدير الفني والمدقق الرئيسي المقترح.",
        "when": "بعد اعتماد اكتمال الطلب وقبل التسعير.",
        "nav": "المراجعة ← «إرسال للجدوى الفنية»، أو مركز التطبيقات ← الجدوى الفنية (يفتح أول طلب جاهز، مثل APP-0147)",
        "screen": [
          "رقم الطلب المعروض.",
          "جدول تقييم الجدوى الفنية.",
          "أول مجال: النطاق والتعقيد الفني.",
          "«المتابعة إلى عرض السعر»."
        ],
        "steps": [
          "راجع ملخص الطلب: العميل، النوع، المعيار، المواقع، تاريخ الطلب، مقدم الطلب.",
          "راجع المجالات الثمانية وحالة كل مجال وتعليقه.",
          "راجع فريق التدقيق المقترح والموارد المتاحة.",
          "اقرأ «التعليقات والتبرير» وأضف تعليقاً داخلياً إن لزم.",
          "إذا كانت التوصية «مجدٍ»، اضغط «المتابعة إلى عرض السعر»."
        ],
        "rules": [
          "يقيّم النظام تلقائياً «المعايير المعمول بها» و«توفر الفريق» و«الخبرة الفنية» من مخططات الجهة وكفاءة الفريق المقترح.",
          "الفريق يُقترح من سجل الكفاءة: مدقق رئيسي واحد مفوَّض بكل المعايير، ثم مدققون يغطون الرموز الناقصة.",
          "قرار «مجدٍ» يتطلب مدققاً رئيسياً وعدم وجود أي مجال «غير مجدٍ».",
          "يمكن تعديل التقييم فقط والطلب مُقدَّم أو قيد المراجعة أو معتمد.",
          "«تعديل الفريق» يختار مدققًا رئيسيًا واحدًا وحتى خمسة مدققين معتمدين للمواصفات ويحفظ الفريق، و«الإجراءات السريعة» تضيف تعليقًا داخليًا أو تطلب معلومات من العميل أو تصعّد إلى المدير الفني أو تمدّد تاريخ استحقاق التقييم.",
          "يستخدم «تعديل الفريق» أداة اختيار الفريق المبنية على الكفاءة: أشخاص مقترحون بدرجات وأسباب، وفحص المواصفات ورموز IAF واختبارات الرموز الحرجة والحياد، ومصفوفة التغطية. ولا يُحفظ فريق فيه مسألة مانعة (انظر اختيار فريق التدقيق)."
        ],
        "after": [
          "«المتابعة إلى عرض السعر» يفتح محرر عرض السعر للطلب نفسه.",
          "الفريق المقترح هنا هو المرشح لاختياره في خطوة «فريق التدقيق» بعرض السعر."
        ],
        "tips": [
          "إذا لم يُقترح فريق، راجع سجل الكفاءة: هل يوجد مدقق نشط مفوَّض بالمعيار ورموز IAF المطلوبة؟"
        ],
        "fields": [
          [
            "المجالات الثمانية",
            "النطاق والتعقيد الفني، المعايير المعمول بها، توفر فريق التدقيق، الخبرة الفنية، إمكانية الوصول للموقع، توفر الموارد، الجدول الزمني والتخطيط، المتطلبات التنظيمية."
          ],
          [
            "الحالة",
            "مجدٍ، مجدٍ جزئياً، غير مجدٍ، غير قابل للتطبيق."
          ],
          [
            "ملخص المراجعة",
            "عدد المجالات المجدية من 8 ونسبتها."
          ],
          [
            "تاريخ استحقاق التقييم",
            "14 يوماً من تاريخ الطلب."
          ]
        ],
        "statuses": [
          [
            "مجدٍ",
            "المجال مستوفٍ."
          ],
          [
            "مجدٍ جزئياً",
            "يحتاج معالجة."
          ],
          [
            "غير مجدٍ",
            "يمنع قرار الجدوى."
          ],
          [
            "غير قابل للتطبيق",
            "لا ينطبق."
          ]
        ],
        "sections": [
          {
            "id": "technical-feasibility-team",
            "title": "ملخص المراجعة والفريق المقترح والموارد",
            "bullets": [
              "«ملخص المراجعة» أعلى الفريق يعرض عدد المجالات المجدية من 8 ونسبتها.",
              "لكل عضو: الاسم، الدور (مدقق رئيسي / مدقق)، المؤهل، سنوات الخبرة.",
              "الموارد: الخبراء الفنيون (عند الطلب)، متخصصو القطاع، مراجعو المستندات، فريق الدعم، موارد السفر.",
              "الفريق المحفوظ يضم مدققاً رئيسياً واحداً، وكل عضو موظف نشط مفوَّض بأحد معايير الطلب.",
              "التعليقات والتبرير تعرض ملاحظات المدقق الرئيسي والمدير الفني بالتاريخ."
            ]
          },
          {
            "id": "technical-feasibility-recommendation",
            "title": "التوصية والانتقال إلى عرض السعر",
            "bullets": [
              "التوصية تُبنى على حالات المجالات الثمانية.",
              "المتابعة تفتح «عرض السعر» للطلب نفسه.",
              "معلومات رئيسية: تاريخ الطلب، مقدم الطلب، تاريخ استحقاق التقييم.",
              "لوحة «إجراءات سريعة»: إضافة تعليق داخلي، إرسال تذكير، تصعيد إلى المدير الفني، تمديد تاريخ الاستحقاق."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "quotation",
    "audience": "cab",
    "section": "contract",
    "routes": [
      "/cab/applications/quotation",
      "/cab/applications/:applicationId/quotation"
    ],
    "open": "/cab/applications/quotation",
    "statusDomain": "quotation",
    "statusValues": [
      "CREATED",
      "ISSUED",
      "ACCEPTED",
      "REJECTED",
      "CANCELLED"
    ],
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/applications/a9000146-7d1e-4b5a-8c01-000000000146/quotation"
    },
    "text": {
      "en": {
        "title": "Quotation",
        "summary": "Turns a reviewed application into a quotation: the system calculates audit days per standard and per stage of the 3-year certification cycle, multiplies them by the man-day rate, adds travel, extra charges and tax, then issues it to the client.",
        "who": "Certification manager or commercial officer, with the technical manager.",
        "when": "After the application review is complete (every section Complete or Not Applicable) and feasibility is confirmed.",
        "nav": "Technical Feasibility → Proceed to Quotation, or Application Hub → Quotation → Select a reviewed application",
        "handoff": "After Issue to client, the client sees the offer under Offers in the portal with Accept offer and Reject offer.",
        "screen": [
          "Quotation number, start date, offer validity and standards.",
          "Quotation status: Draft (not sent).",
          "Audit programme by standard over the 3-year cycle.",
          "A standard card: its total days and fee.",
          "Refresh reloads the quotation from the server.",
          "Download Quotation exports the lines to Excel."
        ],
        "steps": [
          "Open the application in Quotation; without a quotation a 4-step editor appears.",
          "Step 1 Offer terms: man-day rate, Offer valid until, and complexity or food-safety data when needed.",
          "Step 2 Audit Team: auditor and expert names.",
          "Step 3 Travel expenses + additional cost: travel, other charges and notes for the client.",
          "Step 4 Review & create: check, then click Create quotation.",
          "Review the calculated programme, adjust days or costs if needed, then Save changes.",
          "Click Issue to client to send it."
        ],
        "rules": [
          "Before issuing, the quotation must be approved by a second person in Quotation approvals.",
          "The editor stays closed until the review is complete: “Complete the application review before preparing a quotation.”.",
          "Without tax and currency in the CAB Profile: “Set and save your taxes and currency…”.",
          "You cannot move to a step until the earlier steps are valid.",
          "An issued quotation cannot be edited; it can only be cancelled.",
          "Stage 1 and Stage 2 belong to the combined Initial audit; the server does not let you override them separately.",
          "Issuing is blocked while any audit event is BLOCKED (no calculation policy) until its days are entered by hand."
        ],
        "after": [
          "On create: the application becomes Quotation drafted, a linked offer is created as Pending Approval, and “Quotation … needs approval” is notified.",
          "On issue: the application becomes Quotation issued, the offer Issued, and the client gets “Offer … is ready”.",
          "On client acceptance: a 50% advance invoice (draft) and a draft Stage 1 (or recertification) audit plan are created.",
          "On cancel: the linked offer becomes Void."
        ],
        "tips": [
          "Audit days come from the audit-time engine (IAF MD 5, MD 1, MD 11, MD 4); see Audit time: how the days are calculated.",
          "Check the branch staff numbers before creating; they drive the days.",
          "If the provisional-policy notice shows, review the surveillance days before issuing."
        ],
        "fields": [
          [
            "Man-day rate *",
            "Greater than zero; prefilled from CAB Profile → Pricing (the rate of the standard when set); a change applies to this quotation only."
          ],
          [
            "Offer valid until *",
            "Cannot be in the past."
          ],
          [
            "ISO 14001 / ISO 45001 · Complexity *",
            "14001: High/Medium/Low/Limited; 45001: High/Medium/Low."
          ],
          [
            "ISO 22000",
            "Food chain category *, Number of HACCP studies * (1 or more), FTE employees (optional)."
          ],
          [
            "Auditor names *",
            "At least one auditor from the competence register."
          ],
          [
            "Travel expenses *",
            "Zero or more."
          ],
          [
            "Additional costs",
            "Description + non-negative amount for each line."
          ],
          [
            "Notes for the client",
            "Up to 1,000 characters."
          ]
        ],
        "statuses": [
          [
            "Draft (not sent)",
            "Created; can be edited."
          ],
          [
            "Issued",
            "Sent to the client; no edits, can be cancelled."
          ],
          [
            "Accepted by client",
            "Client accepted."
          ],
          [
            "Rejected by client",
            "Client rejected."
          ],
          [
            "Cancelled",
            "Cancelled for good."
          ]
        ],
        "sections": [
          {
            "id": "quotation-days-calculation",
            "title": "How audit days are calculated (principle)",
            "bullets": [
              "Employees = sum of “employees in scope” across the application’s branches.",
              "Each standard is calculated on its own; no IMS reduction is applied at present.",
              "Initial audit days come from the standard’s employee-band table (IAF MD 5 basis).",
              "The initial audit is one figure covering Stage 1 + Stage 2, rounded to the nearest half day.",
              "Stage 1 and Stage 2 are shown for clarity only; the server gives them no separate days or fees.",
              "Surveillance 1 = initial × 1/3, minimum 1 day, rounded to the nearest half day.",
              "Surveillance 2 = same rule and same minimum.",
              "Recertification ≈ initial × 2/3 (provisional policy); in a renewal it replaces the initial audit.",
              "The surveillance and recertification ratios are provisional (NEEDS_REVIEW) and carry a disclosure note.",
              "Above 10,700 employees automatic calculation is blocked; enter days by hand.",
              "Fee of each event = its days × man-day rate."
            ]
          },
          {
            "id": "quotation-days-tables",
            "title": "Day tables per standard, with examples",
            "bullets": [
              "ISO 9001: one band per size, no complexity; e.g. 176 to 275 staff = 9 days, 426 to 625 = 11 days.",
              "Full example: 190 staff → initial 9 days, Surveillance 1 = 3, Surveillance 2 = 3; total 15 days.",
              "At SAR 3,000 per day: 15 × 3,000 = SAR 45,000 before travel and tax.",
              "ISO 14001 by complexity; 176 to 275 staff: High 13, Medium 10, Low 7, Limited 5.",
              "ISO 45001 by complexity; 176 to 275 staff: High 13, Medium 10, Low 7 (no Limited).",
              "ISO/IEC 27001: ISO/IEC 27006-1 table; e.g. 86 to 125 staff = 12 days, so surveillance 4 days.",
              "ISO 50001: ISO 50003 table A.3 for the initial audit; surveillance days straight from table A.4.",
              "ISO 13485: IAF MD 9 table."
            ]
          },
          {
            "id": "quotation-step1-terms",
            "title": "Step 1: Offer terms",
            "bullets": [
              "Start date is today and cannot be changed.",
              "Man-day rate is required and above zero; it is prefilled from CAB Profile → Pricing.",
              "Changing the rate here applies to this quotation only; the CAB profile keeps its default rates.",
              "Pick Offer valid until; a past date shows “The offer end date cannot be in the past”.",
              "Next stays disabled until the fields are complete."
            ]
          },
          {
            "id": "quotation-complexity-fsms",
            "title": "Complexity and ISO 22000 (HACCP) inputs",
            "bullets": [
              "Example: APP-0150 (ISO 45001) after approving completeness and proceeding from feasibility.",
              "Complexity is required and changes the initial-audit days from the table.",
              "ISO 22000 shows three fields: Food chain category *, Number of HACCP studies *, FTE employees (optional).",
              "Categories: AI, AII, BI, BII, BIII, CO, CI, CII, CIII, CIV, D, E, FI, FII, G, H, I, J, K.",
              "Formula (ISO 22003-1): days = TD + TH × (studies − 1) + TFTE.",
              "TD includes one HACCP study; e.g. CI: TD = 2, TH = 0.5.",
              "TFTE by FTE: 1 to 5 = 0, 6 to 49 = 0.5, 50 to 99 = 1, 100 to 199 = 1.5, 200 to 499 = 2, 500 to 999 = 2.5, 1000+ = 3.",
              "Example: CI, 3 studies, 520 FTE → 2 + 0.5×2 + 2.5 = 5.5 days.",
              "If FTE is left empty, the application’s employee count is used.",
              "ISO 22000 recertification days are not part of the first-cycle quotation."
            ]
          },
          {
            "id": "quotation-step2-team",
            "title": "Step 2: Audit team",
            "bullets": [
              "Auditor names lists people whose role is Auditor or Lead Auditor in the competence register.",
              "Expert names lists people whose role is Technical Expert.",
              "Include the lead auditor in the auditor list.",
              "The team is stored in the quotation’s internal notes and is never shown to the client.",
              "Use the team proposed in Technical Feasibility as your reference."
            ]
          },
          {
            "id": "quotation-step3-travel",
            "title": "Step 3: Travel and additional costs",
            "bullets": [
              "Enter travel expenses in the CAB currency.",
              "Each additional cost needs a description (up to 200 characters) and a non-negative amount; Remove deletes it.",
              "A line without description or with a negative amount shows a warning and blocks Next.",
              "Notes are shown to the client (up to 1,000 characters).",
              "Travel and additional costs are part of the taxable amount."
            ]
          },
          {
            "id": "quotation-step4-create",
            "title": "Step 4: Review & create",
            "bullets": [
              "The summary shows Offer valid until, Man-day rate, Travel expenses, Audit Team, Additional costs.",
              "Click Create quotation; the server calculates each event’s days, fees, tax and total.",
              "If the server refuses (e.g. missing complexity or food category), the message shows under the summary.",
              "After creation the quotation appears with its programme, status Draft (not sent)."
            ]
          },
          {
            "id": "quotation-programme",
            "title": "Programme cards per standard and editing days",
            "bullets": [
              "Each standard has a card with its phases in order: Initial certification (or Recertification for a renewal) → Surveillance 1 → Surveillance 2 → Recertification.",
              "Each phase shows days, fee and daily rate, and its timing: year 1, year 2, year 3 before expiry.",
              "On a draft, days can be edited in half-day steps; the change is saved when you leave the field.",
              "A manually changed event shows “(overridden)”.",
              "Overriding a BLOCKED event sets it to NEEDS_REVIEW, never VERIFIED.",
              "When the initial audit is combined, “Included in initial audit” replaces the stage fee.",
              "Example QT-0146 (renewal): ISO 22000 and ISO 9001 start with Recertification; ISO 45001 is added with an initial certification."
            ]
          },
          {
            "id": "quotation-summary",
            "title": "Summary: fees, tax and total",
            "bullets": [
              "Audit fee: 21.5 days × 3,200 = SAR 68,800.",
              "Add travel 1,800 and an extra charge 1,200 = SAR 71,800 taxable.",
              "Tax 15% × 71,800 = SAR 10,770.",
              "Total = 71,800 + 10,770 = SAR 82,570.",
              "The tax rate comes from the CAB’s saved pricing at creation time.",
              "All money maths runs on the server in exact decimals, rounded to two places."
            ]
          },
          {
            "id": "quotation-edit",
            "title": "Editing the quotation (draft)",
            "bullets": [
              "Change travel expenses and Offer valid until.",
              "Edit or remove additional costs, or add a line.",
              "Add Notes for the client.",
              "Saving recalculates tax and total and updates the linked offer (fees, validity, currency).",
              "The daily rate and days are not changed here; days are edited in the programme cards."
            ]
          },
          {
            "id": "quotation-issue",
            "title": "Issuing or cancelling the quotation",
            "bullets": [
              "Review, then submit it for approval; once a second person approves it, click Issue to client. It cannot be edited afterwards.",
              "Cancelling asks: “Cancel this quotation? This cannot be undone.”.",
              "Allowed paths: Draft → Issued or Cancelled; Issued → Accepted, Rejected or Cancelled.",
              "Issuing with provisional policies is recorded with a “PROVISIONAL” note.",
              "The application status only moves forward, never back.",
              "The client gets “Offer … is ready: Review the offer and accept it to start planning your audit.”."
            ]
          }
        ]
      },
      "ar": {
        "title": "عرض السعر",
        "summary": "تحويل الطلب المراجَع إلى عرض سعر: يحسب النظام أيام التدقيق لكل مواصفة ولكل مرحلة من دورة الشهادة (3 سنوات)، ويضربها في سعر يوم العمل، ويضيف السفر والتكاليف الإضافية والضريبة، ثم يُصدر العرض للعميل.",
        "who": "مدير منح الشهادات أو المسؤول التجاري، بالتنسيق مع المدير الفني.",
        "when": "بعد اكتمال مراجعة الطلب (كل الأقسام مكتملة أو غير منطبقة) والجدوى الفنية.",
        "nav": "الجدوى الفنية ← «المتابعة إلى عرض السعر»، أو مركز التطبيقات ← عروض الأسعار ← «اختر طلبًا تمت مراجعته»",
        "handoff": "بعد «إصدار للعميل» يرى العميل العرض في «العروض» ببوابته مع زرّي «قبول العرض» و«رفض العرض».",
        "screen": [
          "رقم عرض السعر وتاريخ البدء وصلاحية العرض والمواصفات.",
          "حالة عرض السعر: «مسودة (لم يُرسل)».",
          "برنامج التدقيق لكل مواصفة لدورة 3 سنوات.",
          "بطاقة مواصفة: إجمالي أيامها ورسومها.",
          "«تحديث» يعيد تحميل العرض من الخادم.",
          "«تنزيل عرض السعر» يصدّر البنود إلى ملف Excel."
        ],
        "steps": [
          "افتح الطلب في «عروض الأسعار»؛ إن لم يوجد عرض يظهر محرر من 4 خطوات.",
          "الخطوة 1 «شروط العرض»: سعر يوم العمل، تاريخ «العرض ساري حتى»، والتعقيد أو بيانات سلامة الغذاء إن لزم.",
          "الخطوة 2 «فريق التدقيق»: أسماء المدققين والخبراء.",
          "الخطوة 3 «مصاريف السفر + تكلفة إضافية»: السفر والتكاليف الأخرى وملاحظات للعميل.",
          "الخطوة 4 «مراجعة وإنشاء»: راجع ثم اضغط «إنشاء عرض السعر».",
          "راجع البرنامج المحسوب، وعدّل الأيام أو التكاليف إن لزم، ثم «حفظ التغييرات».",
          "اضغط «إصدار للعميل» لإرساله."
        ],
        "rules": [
          "قبل الإصدار يجب أن يعتمد شخص ثانٍ عرض السعر في «اعتمادات عروض الأسعار».",
          "لا يُفتح المحرر قبل اكتمال المراجعة: «أكمل مراجعة الطلب قبل إعداد عرض السعر».",
          "بدون إعداد الضريبة والعملة في ملف الجهة: «حدد واحفظ الضرائب والعملة...».",
          "لا تنتقل لخطوة قبل أن تكون الخطوات السابقة صالحة.",
          "العرض المصدَر لا يمكن تعديله؛ يمكن فقط إلغاؤه.",
          "المرحلة 1 والمرحلة 2 جزء من «التدقيق الأولي» المجمّع ولا تُعدَّل أيامهما منفردة في الخادم.",
          "لا يمكن الإصدار إذا كان أي حدث تدقيق «BLOCKED» (لا توجد سياسة حساب) حتى تُدخل أيامه يدوياً."
        ],
        "after": [
          "عند الإنشاء: حالة الطلب «مسودة عرض سعر»، ويُنشأ عرض مرتبط بحالة «بانتظار الاعتماد»، ويصل إشعار «عرض السعر بانتظار الاعتماد».",
          "عند الإصدار: الطلب «صدر عرض السعر»، والعرض «صادر»، ويصل العميل إشعار «العرض جاهز».",
          "عند قبول العميل: فاتورة دفعة مقدمة 50% (مسودة) ومسودة خطة تدقيق المرحلة 1 (أو إعادة المنح).",
          "عند الإلغاء: يصبح العرض المرتبط «ملغى»."
        ],
        "tips": [
          "تأتي أيام التدقيق من محرك وقت التدقيق (IAF MD 5 وMD 1 وMD 11 وMD 4)؛ راجع «وقت التدقيق: كيف تُحسب الأيام».",
          "تحقق من عدد الموظفين في الفروع قبل الإنشاء؛ هو أساس الأيام.",
          "إذا ظهر تنبيه «سياسات مؤقتة»، راجع أيام المراقبة قبل الإصدار."
        ],
        "fields": [
          [
            "سعر يوم العمل *",
            "أكبر من صفر؛ يُعبّأ من ملف جهة المنح ← التسعير (سعر المواصفة إن وُجد)، وتغييره يسري على هذا العرض فقط."
          ],
          [
            "العرض ساري حتى *",
            "لا يمكن أن يكون في الماضي."
          ],
          [
            "ISO 14001 / ISO 45001 · التعقيد *",
            "14001: مرتفع/متوسط/منخفض/محدود؛ 45001: مرتفع/متوسط/منخفض."
          ],
          [
            "ISO 22000",
            "فئة سلسلة الغذاء *، عدد دراسات HACCP * (1 فأكثر)، عدد الموظفين بدوام كامل (اختياري)."
          ],
          [
            "أسماء المدققين *",
            "مدقق واحد على الأقل من سجل الكفاءة."
          ],
          [
            "مصاريف السفر *",
            "صفر أو أكثر."
          ],
          [
            "التكاليف الإضافية",
            "وصف + مبلغ غير سالب لكل بند."
          ],
          [
            "ملاحظات للعميل",
            "حتى 1000 حرف."
          ]
        ],
        "statuses": [
          [
            "مسودة (لم يُرسل)",
            "أُنشئ ويمكن تعديله."
          ],
          [
            "صادر",
            "أُرسل للعميل؛ لا تعديل، يمكن الإلغاء."
          ],
          [
            "قبله العميل",
            "وافق العميل."
          ],
          [
            "رفضه العميل",
            "رفض العميل."
          ],
          [
            "ملغي",
            "أُلغي ولا رجعة فيه."
          ]
        ],
        "sections": [
          {
            "id": "quotation-days-calculation",
            "title": "كيف تُحسب أيام التدقيق (المبدأ)",
            "bullets": [
              "عدد الموظفين = مجموع «الموظفين في النطاق» لكل فروع الطلب.",
              "كل مواصفة تُحسب مستقلة، ولا يُطبق تخفيض الأنظمة المتكاملة (IMS) حالياً.",
              "أيام التدقيق الأولي تؤخذ من جدول نطاقات الموظفين للمواصفة (مرجع IAF MD 5).",
              "التدقيق الأولي رقم واحد يجمع المرحلة 1 والمرحلة 2، ويُقرَّب لأقرب نصف يوم.",
              "المرحلة 1 والمرحلة 2 تظهران للتوضيح فقط دون أيام أو رسوم منفصلة في الخادم.",
              "المراقبة 1 = التدقيق الأولي × 1/3، بحد أدنى يوم واحد، مقرّبة لأقرب نصف يوم.",
              "المراقبة 2 = القاعدة نفسها والحد الأدنى نفسه.",
              "إعادة المنح ≈ التدقيق الأولي × 2/3 (سياسة مؤقتة)، وفي طلب التجديد تحل محل التدقيق الأولي.",
              "نسب المراقبة وإعادة المنح «مؤقتة» (NEEDS_REVIEW) وتظهر معها ملاحظة الإفصاح.",
              "أكثر من 10,700 موظف: الحساب الآلي متوقف ويلزم إدخال يدوي.",
              "رسوم كل حدث = أيامه × سعر يوم العمل."
            ]
          },
          {
            "id": "quotation-days-tables",
            "title": "جداول الأيام لكل مواصفة وأمثلة",
            "bullets": [
              "ISO 9001: نطاق واحد بلا تعقيد؛ مثال 176 إلى 275 موظفاً = 9 أيام، 426 إلى 625 = 11 يوماً.",
              "مثال كامل: 190 موظفاً ← تدقيق أولي 9 أيام، مراقبة 1 = 3، مراقبة 2 = 3؛ المجموع 15 يوماً.",
              "بسعر 3,000 ر.س لليوم: 15 × 3,000 = 45,000 ر.س قبل السفر والضريبة.",
              "ISO 14001: حسب التعقيد؛ 176 إلى 275 موظفاً: مرتفع 13، متوسط 10، منخفض 7، محدود 5.",
              "ISO 45001: حسب التعقيد؛ 176 إلى 275 موظفاً: مرتفع 13، متوسط 10، منخفض 7 (لا يوجد «محدود»).",
              "ISO/IEC 27001: جدول ISO/IEC 27006-1؛ مثال 86 إلى 125 موظفاً = 12 يوماً، فالمراقبة 4 أيام.",
              "ISO 50001: جدول ISO 50003 A.3 للأولي، وأيام المراقبة من جدول A.4 مباشرة.",
              "ISO 13485: جدول IAF MD 9."
            ]
          },
          {
            "id": "quotation-step1-terms",
            "title": "الخطوة 1: شروط العرض",
            "bullets": [
              "تاريخ البدء = تاريخ اليوم، ولا يُعدَّل.",
              "سعر يوم العمل إلزامي وأكبر من صفر، ويُعبّأ من ملف جهة المنح ← التسعير.",
              "تغيير السعر هنا يسري على هذا العرض فقط، ويحتفظ ملف جهة المنح بأسعاره الافتراضية.",
              "اختر «العرض ساري حتى»؛ تاريخ في الماضي يظهر معه «لا يمكن أن يكون تاريخ انتهاء العرض في الماضي».",
              "زر «التالي» معطل حتى تكتمل الحقول."
            ]
          },
          {
            "id": "quotation-complexity-fsms",
            "title": "التعقيد وبيانات ISO 22000 (HACCP)",
            "bullets": [
              "المثال: طلب APP-0150 (ISO 45001) بعد اعتماد الاكتمال والانتقال من الجدوى الفنية.",
              "التعقيد إلزامي؛ ويغيّر أيام التدقيق الأولي من الجدول.",
              "ISO 22000 يُظهر ثلاثة حقول: فئة سلسلة الغذاء *، عدد دراسات HACCP *، عدد الموظفين بدوام كامل (اختياري).",
              "الفئات: AI، AII، BI، BII، BIII، CO، CI، CII، CIII، CIV، D، E، FI، FII، G، H، I، J، K.",
              "المعادلة (ISO 22003-1): الأيام = TD + TH × (عدد الدراسات − 1) + TFTE.",
              "TD يشمل دراسة HACCP واحدة؛ مثل CI: TD = 2، TH = 0.5.",
              "TFTE حسب الموظفين بدوام كامل: 1 إلى 5 = 0، 6 إلى 49 = 0.5، 50 إلى 99 = 1، 100 إلى 199 = 1.5، 200 إلى 499 = 2، 500 إلى 999 = 2.5، 1000+ = 3.",
              "مثال: فئة CI، 3 دراسات، 520 موظفاً ← 2 + 0.5×2 + 2.5 = 5.5 أيام.",
              "إذا تُرك حقل الموظفين فارغاً يُستخدم عدد موظفي الطلب.",
              "أيام إعادة المنح لـ ISO 22000 لا تدخل في عرض الدورة الأولى."
            ]
          },
          {
            "id": "quotation-step2-team",
            "title": "الخطوة 2: فريق التدقيق",
            "bullets": [
              "قائمة المدققين تعرض من دورهم «Auditor» أو «Lead Auditor» في سجل الكفاءة.",
              "قائمة الخبراء تعرض من دورهم «Technical Expert».",
              "أدرج المدقق الرئيسي ضمن قائمة المدققين.",
              "يُحفظ الفريق في الملاحظات الداخلية للعرض ولا يظهر للعميل.",
              "استخدم الفريق المقترح في الجدوى الفنية كمرجع."
            ]
          },
          {
            "id": "quotation-step3-travel",
            "title": "الخطوة 3: السفر والتكاليف الإضافية",
            "bullets": [
              "أدخل مصاريف السفر بعملة الجهة.",
              "لكل تكلفة إضافية: وصف (حتى 200 حرف) ومبلغ غير سالب، و«حذف» لإزالتها.",
              "تكلفة بلا وصف أو بمبلغ سالب تُظهر تنبيهاً وتمنع المتابعة.",
              "الملاحظات تظهر للعميل (حتى 1000 حرف).",
              "السفر والتكاليف الإضافية تدخل في المبلغ الخاضع للضريبة."
            ]
          },
          {
            "id": "quotation-step4-create",
            "title": "الخطوة 4: مراجعة وإنشاء",
            "bullets": [
              "يعرض الملخص: العرض ساري حتى، سعر يوم العمل، مصاريف السفر، فريق التدقيق، التكاليف الإضافية.",
              "اضغط «إنشاء عرض السعر»؛ يحسب الخادم أيام كل حدث والرسوم والضريبة والإجمالي.",
              "إذا رفض الخادم (مثل نقص التعقيد أو فئة الغذاء) تظهر الرسالة تحت الملخص.",
              "بعد الإنشاء يظهر عرض السعر ببرنامج التدقيق وحالته «مسودة (لم يُرسل)»."
            ]
          },
          {
            "id": "quotation-programme",
            "title": "بطاقات البرنامج لكل مواصفة وتعديل الأيام",
            "bullets": [
              "لكل مواصفة بطاقة بمراحلها بالترتيب: المنح الأولي (أو إعادة المنح للتجديد) ← المراقبة 1 ← المراقبة 2 ← إعادة المنح.",
              "كل مرحلة تعرض الأيام والرسوم وسعر يوم العمل، وتوقيتها: السنة 1، السنة 2، السنة 3 قبل انتهاء الشهادة.",
              "في المسودة تُعدَّل الأيام بخطوة نصف يوم؛ يُحفظ التعديل عند مغادرة الحقل.",
              "الحدث المعدّل يدوياً يظهر بجانبه «(معدّل يدويًا)».",
              "تعديل حدث كان BLOCKED يجعل حالته NEEDS_REVIEW ولا يجعله VERIFIED.",
              "إذا كان التدقيق الأولي مجمّعاً تظهر «مشمول في التدقيق الأولي» بدل رسوم المرحلة.",
              "المثال QT-0146 (تجديد): ISO 22000 و ISO 9001 تبدآن بإعادة المنح، و ISO 45001 مضافة بمنح أولي."
            ]
          },
          {
            "id": "quotation-summary",
            "title": "الملخص: الرسوم والضريبة والإجمالي",
            "bullets": [
              "رسوم التدقيق: 21.5 يوماً × 3,200 = 68,800 ر.س.",
              "يُضاف السفر 1,800 والتكلفة الإضافية 1,200 = 71,800 ر.س خاضعة للضريبة.",
              "الضريبة 15% × 71,800 = 10,770 ر.س.",
              "الإجمالي = 71,800 + 10,770 = 82,570 ر.س.",
              "نسبة الضريبة تؤخذ من إعداد التسعير المحفوظ للجهة وقت الإنشاء.",
              "كل الحسابات المالية تتم في الخادم بدقة عشرية، وتُقرّب لخانتين."
            ]
          },
          {
            "id": "quotation-edit",
            "title": "تعديل تفاصيل عرض السعر (المسودة)",
            "bullets": [
              "عدّل مصاريف السفر وتاريخ «العرض ساري حتى».",
              "عدّل أو احذف التكاليف الإضافية، أو أضف بنداً.",
              "أضف «ملاحظات للعميل».",
              "الحفظ يعيد حساب الضريبة والإجمالي، ويحدّث العرض المرتبط (الرسوم والصلاحية والعملة).",
              "لا يتغير سعر يوم العمل أو الأيام من هنا؛ الأيام تُعدَّل في بطاقات البرنامج."
            ]
          },
          {
            "id": "quotation-issue",
            "title": "إصدار عرض السعر أو إلغاؤه",
            "bullets": [
              "راجعه ثم أرسله للاعتماد، وبعد أن يعتمده شخص ثانٍ اضغط «إصدار للعميل»، ولا يمكن تعديله بعد ذلك.",
              "الإلغاء يطلب تأكيداً: «إلغاء عرض السعر؟ لا يمكن التراجع عن ذلك.».",
              "المسارات المسموحة: مسودة ← صادر أو ملغي؛ صادر ← مقبول أو مرفوض أو ملغي.",
              "إصدار عرض بسياسات مؤقتة يُسجَّل بملاحظة «PROVISIONAL».",
              "حالة الطلب تتقدم فقط ولا ترجع للخلف.",
              "العميل يستلم إشعار «العرض … جاهز: راجع العرض واقبله لبدء تخطيط التدقيق»."
            ]
          }
        ]
      }
    },
    "related": [
      "audit-time",
      "quotation-approval",
      "offer-lifecycle"
    ]
  },
  {
    "id": "offers",
    "audience": "cab",
    "section": "contract",
    "routes": [
      "/cab/offers",
      "/cab/offers/new"
    ],
    "open": "/cab/offers",
    "statusDomain": "offer",
    "statusValues": [
      "draft",
      "pending_approval",
      "approved",
      "issued",
      "rejected",
      "void"
    ],
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/offers"
    },
    "text": {
      "en": {
        "title": "Offer register",
        "summary": "Commercial offers sent to clients: number, client, amount, currency, validity and status. An offer linked to a quotation follows it automatically; offers can also be prepared by hand.",
        "who": "Commercial officer and certification manager.",
        "when": "To follow sent offers and client responses, or to prepare a manual offer.",
        "nav": "Application Hub → Quotation & contract → Offers (/cab/offers)",
        "handoff": "The client sees issued offers under Offers in the portal and clicks Accept offer or Reject offer with an optional note.",
        "screen": [
          "Search by offer number or client.",
          "New Offer prepares a manual offer.",
          "Offer number (OF-0146 is linked to QT-0146).",
          "Status.",
          "Actions menu."
        ],
        "steps": [
          "Search or filter by Country and Status.",
          "Open Actions on the offer row.",
          "Choose View offer, Revise (new version) (Revise in quotation for a quotation-linked offer), Download PDF or Void offer.",
          "Tick offers and export them with Export."
        ],
        "rules": [
          "For a quotation-linked offer, issue, reject and void run through the quotation.",
          "An accepted offer cannot be voided or rejected.",
          "Accept and reject belong to the client, in the portal.",
          "View offer opens the offer panel: client, application, fees, commercial terms, revision and history, with Send for approval, Approve and Issue to client when they apply. Approval must come from a different CAB user than the preparer, or the CAB administrator."
        ],
        "after": [
          "Client acceptance: a 50% advance invoice (draft) and, for quotation-linked offers, a Stage 1 audit plan.",
          "Rejection: the offer becomes Rejected and the application Quotation rejected."
        ],
        "tips": [
          "Check Valid until before chasing the client; an expired offer needs a new issue."
        ],
        "fields": [
          [
            "Offer",
            "Offer number (OF-xxxx)."
          ],
          [
            "Client",
            "Name, code and country."
          ],
          [
            "Amount / Currency",
            "Offer value."
          ],
          [
            "Valid until",
            "Expiry date."
          ],
          [
            "Status",
            "Offer status."
          ]
        ],
        "statuses": [
          [
            "Draft",
            "Not sent for approval."
          ],
          [
            "Pending Approval",
            "Sent to the approval route (or created from a quotation)."
          ],
          [
            "Approved",
            "Approved internally; ready to issue."
          ],
          [
            "Issued",
            "Sent to the client; waiting for a reply."
          ],
          [
            "Rejected",
            "Rejected by the client."
          ],
          [
            "Void",
            "Cancelled."
          ]
        ],
        "sections": [
          {
            "id": "offers-actions",
            "title": "Offer actions: revise and void",
            "bullets": [
              "View offer opens the offer panel with its details, revision number, history and the next action (send for approval, approve, issue).",
              "Revise (new version) opens the offer for editing; saving creates the next revision, and the offer goes back to draft to be approved and issued again.",
              "Download PDF downloads the offer as a PDF with your CAB branding: client and application, fee lines, discount and total, commercial terms and history.",
              "Void offer sets the status to Void at once; for a linked offer the quotation is cancelled too.",
              "CAB transitions allowed: Draft → Pending Approval → Approved → Issued, and Void from any state before acceptance."
            ]
          },
          {
            "id": "offer-new",
            "title": "Creating a manual offer",
            "bullets": [
              "Choose Client * then Application *; country, scope, primary contact, standard and e-mail appear.",
              "Currency *: USD, SAR, EGP, EUR, GBP or AED.",
              "Valid until *: defaults to 30 days ahead.",
              "Payment terms *: 30 days, 15 days, upon receipt, or 50% advance / 50% on completion.",
              "Notes take precedence over the generated text.",
              "Offers can be prepared only for applications from Submitted up to quotation accepted/rejected."
            ]
          },
          {
            "id": "offer-new-fees",
            "title": "Fees, approval route and saving",
            "bullets": [
              "Fees: one line per item (description and amount); + Add fee adds a line; at least one line is required.",
              "More details: Travel costs (Excluded / Included / Reimbursed), optional discount, terms and conditions attachment.",
              "Approval route: Commercial Approval or Standard Technical Route (Commercial Manager → Managing Director → Finance Manager).",
              "Save draft stores it as Draft; Send for approval stores it as Pending Approval.",
              "When a client accepts a manual offer, a 50% advance invoice of (fees − discount) is raised, with no automatic audit plan."
            ]
          }
        ]
      },
      "ar": {
        "title": "سجل العروض",
        "summary": "العروض التجارية المرسلة للعملاء: الرقم، العميل، المبلغ، العملة، الصلاحية والحالة. العرض المرتبط بعرض سعر يتبع حالته تلقائياً، ويمكن إعداد عرض يدوياً.",
        "who": "المسؤول التجاري ومدير منح الشهادات.",
        "when": "لمتابعة العروض المرسلة وردود العملاء، أو لإعداد عرض يدوي.",
        "nav": "مركز التطبيقات ← عرض السعر والعقد ← العروض (/cab/offers)",
        "handoff": "العميل يرى العروض الصادرة في «العروض» ببوابته، ويضغط «قبول العرض» أو «رفض العرض» مع ملاحظة اختيارية.",
        "screen": [
          "البحث برقم العرض أو العميل.",
          "«عرض جديد» لإعداد عرض يدوي.",
          "رقم العرض (OF-0146 مرتبط بـ QT-0146).",
          "الحالة.",
          "قائمة الإجراءات."
        ],
        "steps": [
          "ابحث أو صفِّ حسب الدولة والحالة.",
          "افتح «الإجراءات» في صف العرض.",
          "اختر «عرض العرض» أو «تعديل (نسخة جديدة)» («المراجعة في عرض السعر» للعرض المرتبط بعرض سعر) أو «تحميل PDF» أو «إلغاء العرض».",
          "حدد عروضاً وصدّرها من «تصدير»."
        ],
        "rules": [
          "العرض المرتبط بعرض سعر: إصداره أو رفضه أو إلغاؤه يتم عبر عرض السعر.",
          "العرض المقبول لا يمكن إلغاؤه أو رفضه.",
          "القبول والرفض من صلاحيات العميل فقط في بوابته.",
          "«عرض العرض» يفتح لوحة العرض: العميل والطلب والرسوم والشروط التجارية والمراجعة والسجل، مع «إرسال للاعتماد» و«اعتماد» و«إصدار للعميل» حسب الحالة. ويجب أن يصدر الاعتماد من مستخدم آخر غير مُعِد العرض، أو من مسؤول جهة منح الشهادات."
        ],
        "after": [
          "قبول العميل: فاتورة دفعة مقدمة 50% بحالة مسودة، وخطة تدقيق المرحلة 1 (للعروض المرتبطة بعرض سعر).",
          "الرفض: يصبح العرض «مرفوض» والطلب «رُفض عرض السعر»."
        ],
        "tips": [
          "تحقق من «صالح حتى» قبل متابعة العميل؛ العرض المنتهي يحتاج إصداراً جديداً."
        ],
        "fields": [
          [
            "العرض",
            "رقم العرض (OF-xxxx)."
          ],
          [
            "العميل",
            "الاسم والكود والدولة."
          ],
          [
            "المبلغ / العملة",
            "قيمة العرض."
          ],
          [
            "صالح حتى",
            "تاريخ انتهاء الصلاحية."
          ],
          [
            "الحالة",
            "حالة العرض."
          ]
        ],
        "statuses": [
          [
            "مسودة",
            "لم يُرسل للاعتماد."
          ],
          [
            "بانتظار الاعتماد",
            "أُرسل لمسار الاعتماد (أو أُنشئ من عرض سعر)."
          ],
          [
            "معتمد",
            "اعتُمد داخلياً وجاهز للإصدار."
          ],
          [
            "صادر",
            "أُرسل للعميل وينتظر رده."
          ],
          [
            "مرفوض",
            "رفضه العميل."
          ],
          [
            "ملغى",
            "أُلغي."
          ]
        ],
        "sections": [
          {
            "id": "offers-actions",
            "title": "إجراءات العرض: مراجعة وإلغاء",
            "bullets": [
              "«عرض العرض»: يفتح لوحة العرض ببياناته ورقم مراجعته وسجله والإجراء التالي (إرسال للاعتماد، اعتماد، إصدار).",
              "«تعديل (نسخة جديدة)»: يفتح العرض للتعديل، والحفظ ينشئ المراجعة التالية ويعيد العرض إلى المسودة ليُعتمد ويُصدر مجددًا.",
              "«تحميل PDF»: ينزّل العرض ملف PDF بهوية جهتك: العميل والطلب وبنود الرسوم والخصم والإجمالي والشروط التجارية والسجل.",
              "«إلغاء العرض»: يغيّر الحالة إلى «ملغى» فوراً؛ للعرض المرتبط يُلغى عرض السعر أيضاً.",
              "الانتقالات المسموحة للجهة: مسودة ← بانتظار الاعتماد ← معتمد ← صادر، والإلغاء من أي حالة قبل القبول."
            ]
          },
          {
            "id": "offer-new",
            "title": "إنشاء عرض يدوي",
            "bullets": [
              "اختر العميل * ثم الطلب *؛ تظهر الدولة والنطاق وجهة الاتصال والمواصفة والبريد.",
              "العملة *: USD أو SAR أو EGP أو EUR أو GBP أو AED.",
              "صالح حتى *: الافتراضي بعد 30 يوماً.",
              "شروط الدفع *: 30 يوماً، 15 يوماً، عند الاستلام، أو 50% مقدماً و50% عند الإنجاز.",
              "الملاحظات: لها الأولوية على النص المُنشأ تلقائياً.",
              "يُقبل العرض فقط لطلبات في حالات مقدَّم حتى قبول/رفض عرض السعر."
            ]
          },
          {
            "id": "offer-new-fees",
            "title": "الرسوم ومسار الاعتماد والحفظ",
            "bullets": [
              "الرسوم: سطر لكل بند (الوصف والمبلغ)، و«+ إضافة رسوم» لسطر جديد؛ سطر واحد على الأقل.",
              "تفاصيل إضافية: تكاليف السفر (غير مشمولة / مشمولة / تُسترد)، خصم اختياري، مرفق الشروط والأحكام.",
              "مسار الاعتماد: الاعتماد التجاري أو المسار الفني القياسي (المدير التجاري ← المدير العام ← المدير المالي).",
              "«حفظ كمسودة» يحفظ بحالة مسودة؛ «إرسال للاعتماد» يحفظ بحالة «بانتظار الاعتماد».",
              "عند قبول العميل لعرض يدوي تُنشأ فاتورة مقدمة 50% من (الرسوم − الخصم)، دون خطة تدقيق تلقائية."
            ]
          }
        ]
      }
    },
    "related": [
      "offer-lifecycle",
      "quotation-approval",
      "c-offers"
    ]
  },
  {
    "id": "invoices",
    "audience": "cab",
    "section": "followUp",
    "routes": [
      "/cab/invoices",
      "/cab/invoices/:invoiceId"
    ],
    "open": "/cab/invoices",
    "statusDomain": "cabInvoice",
    "statusValues": [
      "Draft",
      "Issued",
      "Partially paid",
      "Paid",
      "Unpaid"
    ],
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/invoices"
    },
    "text": {
      "en": {
        "title": "Invoice register",
        "summary": "Every client invoice: issue and due dates, amount, paid, balance and status. The first invoice in the journey is the 50% advance raised when the offer is accepted.",
        "who": "Accountant and finance officer.",
        "when": "When a client accepts an offer, when payments arrive, and to chase overdue invoices.",
        "nav": "Application Hub → Finance & insight → Invoices (/cab/invoices)",
        "handoff": "Once issued, the client sees the invoice under Invoices and receives “Invoice … due”.",
        "screen": [
          "Search by invoice number, client name or ID.",
          "Create invoice.",
          "Invoice number opens its details.",
          "Payment status.",
          "Actions menu."
        ],
        "steps": [
          "Search or filter by Country and Payment status.",
          "Open an invoice from its number or Actions → View invoice.",
          "For a draft: check the lines, configure tax, then Issue invoice.",
          "When money arrives: Actions → Record payment.",
          "To reduce an issued invoice: Create credit note."
        ],
        "rules": [
          "The advance = 50% of the initial-audit fee (Stage 1 + 2), or of the total audit fee when there is no breakdown.",
          "It is raised once per quotation, as a draft, with the quotation’s tax rate.",
          "Issued invoices cannot be deleted; correct them with a credit note.",
          "An invoice past its due date becomes overdue and the CAB gets “Invoice … is overdue”."
        ],
        "after": [
          "Issuing notifies the client with “Invoice … due” and the payment date.",
          "The client sees only issued invoices under Invoices in the portal."
        ],
        "tips": [
          "Import from Excel adds open and historic invoices; repeat the invoice number on a new row to add a line. The fee catalog has its own Import for your price list.",
          "Check the Unpaid filter weekly; the overdue notice says the certificate stays locked until paid.",
          "Manage catalog keeps your fee items and invoice currencies; issued invoices of a CAB registered in Saudi Arabia also carry the ZATCA e-invoice panel."
        ],
        "fields": [
          [
            "Invoice",
            "Number (INV-2026-0410)."
          ],
          [
            "Client",
            "Name and code."
          ],
          [
            "Issued / Due",
            "The advance is due 30 days after issue."
          ],
          [
            "Amount",
            "Including tax."
          ],
          [
            "Paid / Balance",
            "Amount paid and remaining."
          ],
          [
            "Status",
            "Payment status."
          ]
        ],
        "statuses": [
          [
            "Draft",
            "Editable; not sent."
          ],
          [
            "Issued",
            "Final and sent to the client."
          ],
          [
            "Partially paid",
            "Part paid."
          ],
          [
            "Paid",
            "Balance is zero."
          ],
          [
            "Unpaid",
            "Overdue and unpaid."
          ]
        ],
        "sections": [
          {
            "id": "invoice-details",
            "title": "Invoice details (draft)",
            "bullets": [
              "Data: invoice number, issue and due dates, status, client, country, primary contact, e-mail, related order, PO reference, currency.",
              "Bill-to is a snapshot of the client address at invoicing (Use client address).",
              "Amounts: Subtotal, Tax, Total, Amount paid, Balance due.",
              "Tabs: Invoice items (add lines from the fee catalog), Installments, Attachments (upload, download or remove files) and More details.",
              "Issuing needs billing details, a tax and at least one line.",
              "After issue: “Invoice issued successfully! Invoice is now finalized and immutable.”."
            ]
          },
          {
            "id": "invoice-tax",
            "title": "Configure tax",
            "bullets": [
              "Options: VAT 15% (Saudi Arabia), VAT 5%, GST 10%, No tax (0%).",
              "Tax = subtotal × rate; e.g. 7,200 × 15% = 1,080.",
              "“Tax configured successfully!” confirms it.",
              "Without tax a warning shows: “Must configure tax before issuing.”."
            ]
          },
          {
            "id": "invoice-payment",
            "title": "Record a payment",
            "bullets": [
              "Enter amount, payment date, method (Bank transfer, Credit Card, Cheque, Cash) and reference (e.g. TRX-12345).",
              "The amount must be above zero and not exceed the balance.",
              "No payment on a draft: issue the invoice first.",
              "A fully paid invoice refuses further payments.",
              "After saving the status becomes Partially paid or Paid depending on the balance.",
              "Payments appear in the client’s wallet history."
            ]
          },
          {
            "id": "invoice-credit-note",
            "title": "Credit note and invoice actions",
            "bullets": [
              "Actions menu: View invoice, Record payment, Create credit note, Download PDF.",
              "A credit note stays linked to the issued invoice and reduces its balance.",
              "Enter the amount and the reason (e.g. overbilled fee).",
              "It cannot exceed the balance and cannot be raised on a draft.",
              "“Credit note created successfully.” confirms it."
            ]
          }
        ]
      },
      "ar": {
        "title": "سجل الفواتير",
        "summary": "كل فواتير العملاء: تاريخ الإصدار والاستحقاق، المبلغ، المدفوع، الرصيد والحالة. أول فاتورة في الرحلة هي الدفعة المقدمة 50% التي تُنشأ عند قبول العرض.",
        "who": "المحاسب والمسؤول المالي.",
        "when": "عند قبول العميل للعرض، وعند استلام الدفعات، ومتابعة المتأخرات.",
        "nav": "مركز التطبيقات ← المالية والتحليلات ← الفواتير (/cab/invoices)",
        "handoff": "العميل يرى الفاتورة بعد إصدارها في «الفواتير» ويستلم إشعار «استحقاق الفاتورة».",
        "screen": [
          "البحث برقم الفاتورة أو اسم العميل أو معرفه.",
          "«إنشاء فاتورة».",
          "رقم الفاتورة يفتح تفاصيلها.",
          "حالة الدفع.",
          "قائمة الإجراءات."
        ],
        "steps": [
          "ابحث أو صفِّ حسب الدولة وحالة الدفع.",
          "افتح الفاتورة من رقمها أو من «الإجراءات» ← «عرض الفاتورة».",
          "للمسودة: راجع البنود، أعدّ الضريبة، ثم «إصدار الفاتورة».",
          "عند استلام مبلغ: «الإجراءات» ← «تسجيل دفعة».",
          "لتخفيض فاتورة صادرة: «إنشاء إشعار دائن»."
        ],
        "rules": [
          "الدفعة المقدمة = 50% من رسوم التدقيق الأولي (المرحلة 1 + 2) أو من إجمالي رسوم التدقيق إن لم يوجد تفصيل.",
          "تُنشأ مرة واحدة لكل عرض سعر، بحالة مسودة، وبنسبة ضريبة عرض السعر.",
          "لا تُحذف الفواتير الصادرة؛ تُصحَّح بإشعار دائن.",
          "الفاتورة المتجاوزة تاريخ الاستحقاق تصبح متأخرة ويصل للجهة إشعار «الفاتورة متأخرة»."
        ],
        "after": [
          "إصدار الفاتورة يرسل للعميل إشعار «استحقاق الفاتورة» مع تاريخ السداد.",
          "العميل يرى الفواتير الصادرة فقط في «الفواتير» ببوابته."
        ],
        "tips": [
          "يضيف الاستيراد من Excel الفواتير المفتوحة والسابقة، وكرر رقم الفاتورة في صف جديد لإضافة بند. ولقائمة الرسوم زر استيراد خاص بها لقائمة أسعارك.",
          "تابع فلتر «غير مدفوعة» أسبوعياً؛ الشهادة تبقى مقفلة حتى السداد حسب إشعار التأخير.",
          "«إدارة الكتالوج» تحفظ بنود الرسوم وعملات الفوترة، والفواتير الصادرة من جهة مسجلة في المملكة تحمل أيضًا لوحة الفاتورة الإلكترونية (زاتكا)."
        ],
        "fields": [
          [
            "الفاتورة",
            "الرقم (INV-2026-0410)."
          ],
          [
            "العميل",
            "الاسم والكود."
          ],
          [
            "تاريخ الإصدار / الاستحقاق",
            "الاستحقاق بعد 30 يوماً من الإصدار للدفعة المقدمة."
          ],
          [
            "المبلغ",
            "شامل الضريبة."
          ],
          [
            "المدفوع / الرصيد",
            "ما سُدد والمتبقي."
          ],
          [
            "الحالة",
            "حالة الدفع."
          ]
        ],
        "statuses": [
          [
            "مسودة",
            "قابلة للتعديل ولم تُرسل."
          ],
          [
            "صادرة",
            "نهائية وأُرسلت للعميل."
          ],
          [
            "مدفوعة جزئيًا",
            "سُدد جزء منها."
          ],
          [
            "مدفوعة",
            "الرصيد صفر."
          ],
          [
            "غير مدفوعة",
            "متأخرة دون سداد."
          ]
        ],
        "sections": [
          {
            "id": "invoice-details",
            "title": "تفاصيل الفاتورة (مسودة)",
            "bullets": [
              "البيانات: رقم الفاتورة، تاريخ الإصدار والاستحقاق، الحالة، العميل، الدولة، جهة الاتصال، البريد، الطلب المرتبط، مرجع أمر الشراء، العملة.",
              "عنوان الفوترة نسخة ثابتة من عنوان العميل وقت الإصدار («استخدام عنوان العميل»).",
              "المبالغ: المجموع الفرعي، الضريبة، الإجمالي، المدفوع، الرصيد المستحق.",
              "التبويبات: بنود الفاتورة (إضافة البنود من كتالوج الرسوم)، الأقساط، المرفقات (رفع الملفات وتنزيلها وحذفها)، تفاصيل إضافية.",
              "الإصدار يتطلب بيانات فوترة وضريبة وبنداً واحداً على الأقل.",
              "بعد الإصدار: «تم إصدار الفاتورة بنجاح! الفاتورة الآن نهائية ولا يمكن تعديلها.»."
            ]
          },
          {
            "id": "invoice-tax",
            "title": "إعداد الضريبة",
            "bullets": [
              "الخيارات: ضريبة القيمة المضافة 15% (السعودية)، 5%، ضريبة السلع والخدمات 10%، بدون ضريبة (0%).",
              "الضريبة = المجموع الفرعي × النسبة؛ مثال: 7,200 × 15% = 1,080.",
              "تظهر «تم إعداد الضريبة بنجاح!».",
              "بدون ضريبة يظهر تنبيه «يجب إعداد الضريبة قبل الإصدار»."
            ]
          },
          {
            "id": "invoice-payment",
            "title": "تسجيل دفعة",
            "bullets": [
              "أدخل المبلغ وتاريخ الدفع وطريقة الدفع (تحويل بنكي، بطاقة ائتمان، شيك، نقداً) والمرجع (مثل TRX-12345).",
              "المبلغ يجب أن يكون أكبر من صفر ولا يتجاوز الرصيد المتبقي.",
              "لا تُسجَّل دفعة على مسودة: يجب إصدار الفاتورة أولاً.",
              "الفاتورة المسددة بالكامل ترفض أي دفعة إضافية.",
              "بعد الحفظ: الحالة «مدفوعة جزئيًا» أو «مدفوعة» حسب الرصيد.",
              "الدفعات تظهر في سجل محفظة العميل."
            ]
          },
          {
            "id": "invoice-credit-note",
            "title": "الإشعار الدائن وإجراءات الفاتورة",
            "bullets": [
              "قائمة الإجراءات: عرض الفاتورة، تسجيل دفعة، إنشاء إشعار دائن، تحميل PDF.",
              "الإشعار الدائن يُربط بالفاتورة الصادرة ويخفض رصيدها.",
              "أدخل المبلغ والسبب (مثل رسوم محتسبة بالزيادة).",
              "لا يتجاوز الإشعار الرصيد المتبقي، ولا يُنشأ على مسودة.",
              "تظهر «تم إنشاء الإشعار الدائن بنجاح.»."
            ]
          }
        ]
      }
    },
    "related": [
      "fee-catalog",
      "zatca-einvoice",
      "c-invoices"
    ]
  },
  {
    "id": "audit-schedule",
    "audience": "cab",
    "section": "audit",
    "routes": [
      "/cab/audit-planning",
      "/cab/audit-planning/schedule"
    ],
    "open": "/cab/audit-planning",
    "updated": "2026-10-27",
    "related": ["audit-execution"],
    "capture": {
      "as": "cab",
      "route": "/cab/audit-planning"
    },
    "text": {
      "en": {
        "title": "Audit schedule",
        "summary": "One register of every audit plan at your CAB: client, site, dates, lead auditor and status. New plans are created here and opened for building.",
        "who": "CAB admin, audit coordinators and lead auditors.",
        "when": "After the client accepts the quotation, and whenever you track upcoming or running audits.",
        "nav": "Sidebar → Audit Planning → Audit schedule",
        "handoff": "The client does not see this list. A plan reaches the client only when you send it from Build audit plan; it then appears under Audits in the client portal.",
        "screen": [
          "List view / Calendar view toggle.",
          "Search audit or client, plus the Planned period, Country and Status filters.",
          "Create plan opens the new audit plan form.",
          "Export downloads the listed plans as CSV, Excel or JSON.",
          "The plan number (e.g. AUD-0266) opens Build audit plan.",
          "Row actions (⋮): Build / Edit Plan, View Agenda, Export Plan."
        ],
        "steps": [
          "Open Audit Planning from the sidebar; plans show in List view.",
          "Type a plan number or client name in the search box if needed.",
          "Pick a Planned period (month), Country and Status.",
          "Click Search to apply, or Clear to reset every filter to All.",
          "Read the columns: Audit and standard, Client, Sites, Dates and days, Lead auditor, Status.",
          "Click the plan number or Build / Edit Plan to open it."
        ],
        "rules": [
          "Filters apply only when you click Search.",
          "Period and country options are built from the plans that exist.",
          "Export covers only the plans currently listed."
        ],
        "after": [
          "Row menu → Start / continue execution opens the audit execution workspace of the plan.",
          "A new plan opens straight in Build audit plan with status Draft.",
          "When a client accepts a quotation, the system drafts a Stage 1 plan automatically.",
          "The Upcoming Audits card on the dashboard reads these plans live."
        ],
        "tips": [
          "Import from Excel adds audits already planned in your previous system (client, standard, stage, dates and team) as draft plans.",
          "Use Calendar view to spot auditors booked on the same days.",
          "Filter on Draft to find plans not yet sent to clients."
        ],
        "fields": [
          [
            "Search audit or client",
            "Matches plan number, client, client code, application, lead auditor and standard."
          ],
          [
            "Planned period",
            "Months covered by existing plans; shows plans that overlap the chosen month."
          ],
          [
            "Country",
            "Client countries found in the plans."
          ],
          [
            "Status",
            "All, Planned, Draft, In progress, Completed."
          ]
        ],
        "statuses": [
          [
            "Draft",
            "Created or saved as draft; not yet sent to the client."
          ],
          [
            "Planned",
            "Sent to the client and waiting for confirmation."
          ],
          [
            "Rescheduled",
            "Dates changed; the plan has a new version."
          ],
          [
            "In progress",
            "The audit started and its audit report is open."
          ],
          [
            "Under review",
            "Fieldwork done; the report is being reviewed and finalized."
          ],
          [
            "Completed",
            "Audit closed and added to each team member's competence log."
          ]
        ],
        "sections": [
          {
            "id": "schedule-calendar",
            "title": "Calendar view",
            "bullets": [
              "Shows one month; each day carries a chip per plan covering it (plan number • short client name).",
              "Opens on the current month, or on the month chosen in Planned period.",
              "A multi-day plan appears on each of its days.",
              "Click a chip to open Build audit plan for that plan.",
              "The same Country, Status and search filters apply to the calendar.",
              "The direct link /cab/audit-planning/schedule opens the same page."
            ]
          },
          {
            "id": "schedule-row-actions",
            "title": "Row actions and export",
            "bullets": [
              "Click ⋮ at the end of a row to open its actions.",
              "The Export button above the table offers Export as CSV, Export as Excel and Export as JSON.",
              "The table export covers every plan listed after filtering.",
              "Status colours: blue for Planned, green for Completed, orange for Draft and In progress."
            ]
          },
          {
            "id": "create-plan",
            "title": "Create new audit plan",
            "bullets": [
              "Click Create plan in the audit schedule.",
              "Pick the Client and Audit stage: Stage 1, Stage 2 or Surveillance 1.",
              "Pick the Lead auditor; non-audit roles are left out of the list.",
              "Check the Standard, e.g. Occupational Health and Safety Management System (ISO 45001:2018).",
              "Start date and End date default to 21 and 22 days from today.",
              "Click Continue to build plan; the plan is saved as Draft with a new AUD-xxxx number.",
              "The server rejects an end date before the start, or a plan longer than 60 days.",
              "/cab/audit-planning/new opens the blank create-plan form: client, application, stage, standard, dates and lead auditor; Create saves the plan as Draft and opens its build page."
            ]
          }
        ]
      },
      "ar": {
        "title": "جدول التدقيق",
        "summary": "سجل موحّد لكل خطط التدقيق لدى جهة منح الشهادات، يعرض العميل والموقع والتواريخ والمدقق الرئيسي وحالة كل خطة. منه تُنشأ الخطط الجديدة وتُفتح للبناء والتعديل.",
        "who": "مدير جهة منح الشهادات ومنسقو التدقيق والمدققون الرئيسيون.",
        "when": "بعد قبول العميل لعرض السعر، وكلما احتجت إلى متابعة عمليات التدقيق القادمة أو الجارية.",
        "nav": "القائمة الجانبية ← تخطيط التدقيق ← جدول التدقيق",
        "handoff": "لا يرى العميل هذه القائمة. يرى الخطة فقط بعد إرسالها إليه من شاشة بناء الخطة، في قسم «عمليات التدقيق» في بوابته.",
        "screen": [
          "زرّا التبديل «عرض القائمة» و«عرض التقويم» لتغيير طريقة عرض الخطط.",
          "مربع «البحث في التدقيق أو العميل» مع فلاتر «الفترة المخططة» و«الدولة» و«الحالة».",
          "زر «إنشاء خطة» يفتح نموذج خطة تدقيق جديدة.",
          "زر «تصدير» لتنزيل الخطط المعروضة بصيغة CSV أو Excel أو JSON.",
          "رقم الخطة (مثل AUD-0266): الضغط عليه يفتح شاشة «بناء خطة التدقيق».",
          "زر الإجراءات (⋮) في كل صف: بناء/تعديل الخطة، عرض جدول الأعمال، تصدير الخطة."
        ],
        "steps": [
          "افتح «تخطيط التدقيق» من القائمة الجانبية؛ تظهر الخطط في «عرض القائمة».",
          "اكتب رقم الخطة أو اسم العميل في مربع البحث عند الحاجة.",
          "اختر «الفترة المخططة» (شهر) و«الدولة» و«الحالة» من الفلاتر.",
          "اضغط «بحث» لتطبيق الفلاتر، أو «مسح» لإعادة كل الفلاتر إلى «الكل».",
          "راجع الأعمدة: التدقيق والمعيار، العميل، المواقع، التواريخ وعدد الأيام، رئيس فريق التدقيق، الحالة.",
          "اضغط رقم الخطة أو «بناء / تعديل الخطة» لفتحها."
        ],
        "rules": [
          "لا تُطبَّق الفلاتر إلا بعد الضغط على «بحث».",
          "خيارات الفترة والدولة تُبنى تلقائيًا من الخطط الموجودة فعلًا.",
          "التصدير يشمل الخطط المعروضة بعد الفلترة فقط."
        ],
        "after": [
          "قائمة الصف ← بدء التنفيذ أو متابعته تفتح مساحة عمل تنفيذ التدقيق للخطة.",
          "الخطة الجديدة تُفتح مباشرة في شاشة «بناء خطة التدقيق» بحالة «مسودة».",
          "عند قبول العميل لعرض السعر يُنشئ النظام تلقائيًا خطة مسودة للمرحلة الأولى (Stage 1).",
          "مؤشر «عمليات تدقيق قادمة» في لوحة التحكم يقرأ هذه الخطط مباشرة."
        ],
        "tips": [
          "يضيف الاستيراد من Excel عمليات التدقيق المخطط لها في نظامك السابق (العميل والمواصفة والمرحلة والتواريخ والفريق) كخطط بحالة مسودة.",
          "استخدم «عرض التقويم» لاكتشاف تزاحم المدققين في الأيام نفسها.",
          "ابدأ بفلتر «مسودة» لمعرفة الخطط التي لم تُرسل للعملاء بعد."
        ],
        "fields": [
          [
            "البحث في التدقيق أو العميل",
            "يبحث في رقم الخطة والعميل ورمز العميل والطلب والمدقق الرئيسي والمعيار."
          ],
          [
            "الفترة المخططة",
            "قائمة الأشهر التي تغطيها الخطط الموجودة؛ تعرض الخطط التي تتقاطع مع الشهر المختار."
          ],
          [
            "الدولة",
            "دول العملاء الموجودة في الخطط."
          ],
          [
            "الحالة",
            "الكل، Planned، Draft، In progress، Completed (تظهر هذه الخيارات بالإنجليزية في القائمة)."
          ]
        ],
        "statuses": [
          [
            "مسودة",
            "خطة أُنشئت أو حُفظت كمسودة ولم تُرسل للعميل بعد."
          ],
          [
            "مخطط",
            "أُرسلت الخطة إلى العميل وتنتظر تأكيده."
          ],
          [
            "أُعيدت جدولته",
            "تغيّرت تواريخ الخطة وأصبح لها إصدار جديد."
          ],
          [
            "قيد التنفيذ",
            "بدأ التدقيق وفُتح تقرير التدقيق المرتبط به."
          ],
          [
            "قيد المراجعة",
            "انتهى العمل الميداني والتقرير قيد المراجعة والإنهاء."
          ],
          [
            "مكتمل",
            "اكتمل التدقيق وأُضيف إلى سجل كفاءة أعضاء الفريق."
          ]
        ],
        "sections": [
          {
            "id": "schedule-calendar",
            "title": "عرض التقويم",
            "bullets": [
              "يعرض شهرًا واحدًا؛ كل يوم يحمل شارة لكل خطة تغطيه (رقم الخطة • اسم العميل المختصر).",
              "يفتح التقويم على الشهر الحالي، أو على الشهر المختار في فلتر «الفترة المخططة».",
              "الخطة الممتدة عدة أيام تظهر في كل يوم من أيامها.",
              "الضغط على أي شارة يفتح شاشة «بناء خطة التدقيق» لتلك الخطة.",
              "الفلاتر نفسها (الدولة والحالة والبحث) تنطبق على التقويم.",
              "الرابط المباشر /cab/audit-planning/schedule يفتح الصفحة نفسها."
            ]
          },
          {
            "id": "schedule-row-actions",
            "title": "إجراءات الصف والتصدير",
            "bullets": [
              "اضغط (⋮) في نهاية الصف لفتح قائمة الإجراءات.",
              "زر «تصدير» أعلى الجدول يعرض: تصدير كملف CSV، تصدير كملف Excel، تصدير كملف JSON.",
              "التصدير العام يشمل كل الخطط الظاهرة بعد الفلترة.",
              "شارات الحالة ملوّنة: الأزرق لـ«مخطط»، الأخضر لـ«مكتمل»، البرتقالي لـ«مسودة» و«قيد التنفيذ»."
            ]
          },
          {
            "id": "create-plan",
            "title": "إنشاء خطة تدقيق جديدة",
            "bullets": [
              "اضغط «إنشاء خطة» في جدول التدقيق.",
              "اختر «العميل» و«مرحلة التدقيق»: المرحلة الأولى أو المرحلة الثانية أو المراقبة الأولى.",
              "اختر «رئيس فريق التدقيق»؛ تُستبعد الأدوار غير التدقيقية من القائمة.",
              "تحقق من «المعيار»، مثل Occupational Health and Safety Management System (ISO 45001:2018).",
              "«تاريخ البدء» و«تاريخ الانتهاء» يُقترحان تلقائيًا بعد 21 و22 يومًا من اليوم.",
              "اضغط «متابعة إلى إعداد الخطة»؛ تُحفظ الخطة بحالة «مسودة» برقم جديد AUD-xxxx.",
              "الخادم يرفض تاريخ انتهاء قبل البدء، أو خطة تمتد أكثر من 60 يومًا.",
              "الرابط /cab/audit-planning/new يفتح نموذج إنشاء خطة فارغًا: العميل والطلب والمرحلة والمواصفة والتواريخ والمدقق الرئيسي، و«إنشاء» يحفظ الخطة كمسودة ويفتح صفحة بنائها."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "build-audit-plan",
    "audience": "cab",
    "section": "audit",
    "routes": [
      "/cab/audit-planning/build/:planId",
      "/cab/audit-planning/new"
    ],
    "open": "/cab/audit-planning",
    "updated": "2026-10-27",
    "related": [
      "team-selection", "audit-execution", "checklist-library"],
    "capture": {
      "as": "cab",
      "route": "/cab/audit-planning/build/AUD-0266"
    },
    "text": {
      "en": {
        "title": "Build audit plan",
        "summary": "Where one audit plan is prepared end to end: stage, dates, team, objectives, scope, agenda, sites, remote work, travel and team declarations, then the readiness check and sending to the client.",
        "who": "The audit coordinator or the lead auditor assigned to the plan.",
        "when": "After the plan is created (by hand, or automatically when the quotation is accepted) and well before the audit date.",
        "nav": "Audit Planning → Audit schedule → plan number (e.g. AUD-0266)",
        "handoff": "After Confirm & Send Plan the client sees the plan under Audits in the portal with a notification to confirm it; acknowledging the plan does not mean certification is granted.",
        "screen": [
          "Plan status badge next to the title (e.g. Planned).",
          "Save as Draft saves everything on the page.",
          "Check readiness verifies competence, availability and impartiality.",
          "Send to client sends the plan to the client's primary contact.",
          "The ••• button opens Reschedule Audit Plan with a reason.",
          "Summary bar: plan and stage, client, application, reviewed duration, site, primary contact."
        ],
        "steps": [
          "Open the plan from the audit schedule.",
          "Read the summary bar: plan, stage, client, application, reviewed duration (DUR-xxxx), site and contact.",
          "Complete Audit details: stage, dates, timezone, Lead Auditor and Audit team.",
          "Review Audit objectives and Scope summary.",
          "Build the Audit agenda with Add activity or Import template.",
          "Check Site allocation, Remote activities and Travel notes.",
          "Confirm Team declarations: availability and no conflicts of interest.",
          "Click Save as Draft, then Check readiness.",
          "When the checks pass, click Send to client, then Confirm & Send Plan."
        ],
        "rules": [
          "Lead Auditor and + Add auditor list qualified auditors only.",
          "Save as Draft returns a Draft, Planned or Rescheduled plan to Draft.",
          "Plans In progress or later keep their status when saved.",
          "A completed plan cannot be changed; the server rejects edits.",
          "A plan cannot be sent without a lead auditor.",
          "Sending and rescheduling work only for Draft, Planned and Rescheduled plans.",
          "The Audit team card recommends, validates and confirms the team. The plan can be sent to the client or started only with a confirmed team that still passes the competence, availability and impartiality checks (see Audit team selection)."
        ],
        "after": [
          "Once the plan is sent, select Start / continue execution to run the audit in six steps (preparation, opening, conduct, team review, closing, report) with checklists for each standard.",
          "After sending, the status becomes Planned and an unconfirmed periodic visit is created for the client.",
          "The client receives a Confirm audit plan notification with the start date.",
          "When the client confirms, the CAB receives Audit plan … awaiting approval.",
          "Calendar, dashboard and certification cycle read the plan live."
        ],
        "tips": [
          "Import template fills this plan from Excel: agenda activities, site allocation, remote activities and travel notes, one row each. Edit on the site, remote and travel cards opens a dialog that saves the section.",
          "Run Check readiness after every team or date change.",
          "Match the agenda total hours with the reviewed duration in the summary.",
          "The section tabs scroll to the section and briefly highlight it."
        ],
        "fields": [
          [
            "Audit stage *",
            "Stage 1 / Stage 2 / Surveillance 1."
          ],
          [
            "Proposed start date * / Proposed end date *",
            "Audit dates; end not before start, at most 60 days."
          ],
          [
            "Timezone *",
            "Asia/Riyadh, Asia/Dubai or Africa/Cairo."
          ],
          [
            "Lead Auditor *",
            "Qualified auditors only."
          ],
          [
            "Audit team",
            "Member chips; + Add auditor adds one, × removes one."
          ],
          [
            "Audit objectives / Scope summary",
            "Free text shown in the plan sent to the client."
          ]
        ],
        "statuses": [
          [
            "Draft",
            "Being prepared; not sent."
          ],
          [
            "Planned",
            "Sent to the client; awaiting confirmation."
          ],
          [
            "Rescheduled",
            "Dates changed; the client must confirm again."
          ],
          [
            "In progress",
            "Audit started; the audit report opens."
          ],
          [
            "Under review",
            "The report is under review."
          ],
          [
            "Completed",
            "Plan closed; the audit is logged in competence records."
          ]
        ],
        "sections": [
          {
            "id": "plan-details",
            "title": "Audit details, objectives and scope",
            "bullets": [
              "Proposed start and end dates set the audit days and show on the calendar.",
              "The lead auditor appears in the team as (Lead).",
              "Remove a member with the × on its chip.",
              "+ Add auditor hides people already in the team.",
              "Objectives and scope start with default text you can edit.",
              "Changes are stored only when you click Save as Draft."
            ]
          },
          {
            "id": "plan-agenda",
            "title": "Audit agenda",
            "bullets": [
              "Each activity row has a number, date, start and end time, activity, auditor and duration in hours.",
              "The ⋮ on a row opens Edit Activity, with Delete Activity.",
              "The total is calculated from each activity's duration.",
              "Compare the total with the reviewed duration (e.g. DUR-0144 = 2.0 days).",
              "Import template only shows a confirmation message; it does not add activities. Add them with + Add activity.",
              "Rescheduling shifts every activity date by the same number of days."
            ]
          },
          {
            "id": "add-activity",
            "title": "Add Agenda Activity",
            "bullets": [
              "Enter an Activity Title, e.g. Opening meeting or Clause 8 review.",
              "Set Date, Start and End in the plan's time zone.",
              "Pick the Auditor: one team member, or the option listing the whole team.",
              "Enter Duration (Hours); decimals like 0.5 are accepted.",
              "Every field marked * is required.",
              "The table updates at once; click Save as Draft to keep it."
            ]
          },
          {
            "id": "plan-site-remote-travel",
            "title": "Site allocation, remote activities and travel notes",
            "bullets": [
              "Pick the Site *; On-site personnel fills from the audit team.",
              "Site address comes from the client's site record.",
              "Turning Include remote off hides remote details; the plan is on-site only.",
              "Remote activities show as chips, e.g. Document review.",
              "Remote Notes say what the client arranges (invitations, access).",
              "The Edit links on these cards only show a confirmation message; change the fields directly in the card."
            ]
          },
          {
            "id": "plan-declarations",
            "title": "Team declarations",
            "bullets": [
              "Tick availability once every member confirms the audit dates.",
              "Tick no-conflict once every member declares no consultancy or financial ties with the client.",
              "Both boxes feed Check readiness directly.",
              "Unconfirmed availability gives a warning in the availability check.",
              "Without the no-conflict declaration the impartiality check fails and cannot be silently overridden."
            ]
          },
          {
            "id": "readiness-check",
            "title": "Check readiness: what it verifies",
            "bullets": [
              "Competence: the lead auditor must be an active Lead Auditor authorized for every plan standard, else it fails.",
              "Competence: a member who is not an active auditor, or an IAF code the team lacks, gives a warning.",
              "Availability: a member booked on another open plan with overlapping dates fails the check, naming that plan.",
              "Availability: unconfirmed availability in the declarations gives a warning.",
              "Impartiality: fails if the team has not declared freedom from conflicts of interest.",
              "No silent overrides are permitted; auditor disclosures are logged to the audit dossier.",
              "Each check is passed, warning or failed; full readiness needs all three to pass."
            ]
          },
          {
            "id": "send-to-client",
            "title": "Send to client",
            "bullets": [
              "The recipient is the client's registered primary contact; it is not picked by hand.",
              "A message confirms: Audit plan sent to … with name and email.",
              "Status becomes Planned; the sending time and recipient are recorded.",
              "An unconfirmed periodic visit is created and the client gets Confirm audit plan.",
              "Sending again clears any earlier client confirmation.",
              "Plans In progress or later cannot be sent."
            ]
          },
          {
            "id": "reschedule",
            "title": "Reschedule with a reason",
            "bullets": [
              "Click ••• next to Send to client.",
              "The new dates start from the current ones; change them.",
              "Type the reason, e.g. client asked to move dates for facility maintenance.",
              "The system rejects identical dates, an end before the start, or more than 60 days.",
              "Result: version +1, status Rescheduled, and a history row with old dates, new dates and reason.",
              "Agenda activity dates shift by the same number of days.",
              "If the plan was already sent, the client's visit moves and they must confirm again."
            ]
          },
          {
            "id": "plan-lifecycle",
            "title": "Plan lifecycle and what each step triggers",
            "bullets": [
              "Draft → Planned: on Send to client; a client visit is created and confirmation requested.",
              "Planned → Rescheduled: when dates change; the client must confirm again.",
              "Client confirmation keeps the status but notifies the CAB: plan awaiting approval.",
              "Planned/Rescheduled → In progress: the system opens the audit report and resolves its team.",
              "In progress → Under review: report in review; Audit report review appears in the work queue.",
              "In progress/Under review → Completed: the audit is added to each CAB team member's competence log.",
              "Completion is not blocked by an unfinalized report; finalize the report first as good practice.",
              "The Audit lifecycle bar at the top of the plan moves it on: Start audit (opens the audit report), Send for review and Mark completed, each after a confirmation; Open audit report opens the report."
            ]
          }
        ]
      },
      "ar": {
        "title": "بناء خطة التدقيق",
        "summary": "الشاشة التي تُعدّ فيها خطة تدقيق واحدة بالكامل: المرحلة والتواريخ والفريق والأهداف والنطاق وجدول الأعمال والمواقع والأنشطة عن بُعد والسفر وإقرارات الفريق، ثم فحص الجاهزية والإرسال للعميل.",
        "who": "منسق التدقيق أو المدقق الرئيسي المكلّف بالخطة.",
        "when": "بعد إنشاء الخطة (يدويًا أو تلقائيًا عند قبول عرض السعر) وقبل موعد التدقيق بوقت كافٍ.",
        "nav": "تخطيط التدقيق ← جدول التدقيق ← رقم الخطة (مثل AUD-0266)",
        "handoff": "بعد «تأكيد وإرسال الخطة» تظهر الخطة للعميل في «عمليات التدقيق» ببوابته مع إشعار لتأكيدها؛ إقرار العميل بالخطة لا يعني منح الشهادة.",
        "screen": [
          "شارة حالة الخطة بجانب العنوان (مثل «مخطط»).",
          "«حفظ كمسودة» يحفظ كل ما في الصفحة.",
          "«فحص الجاهزية» يتحقق من الكفاءة والتوفر والحياد.",
          "«إرسال إلى العميل» يرسل الخطة لجهة الاتصال الرئيسية لدى العميل.",
          "زر (•••) يفتح نافذة إعادة جدولة الخطة مع ذكر السبب.",
          "شريط الملخص: الخطة والمرحلة، العميل، الطلب، المدة المراجَعة، الموقع، جهة الاتصال الرئيسية."
        ],
        "steps": [
          "افتح الخطة من جدول التدقيق.",
          "راجع شريط الملخص: رقم الخطة والمرحلة والعميل والطلب والمدة المراجَعة (DUR-xxxx) والموقع وجهة الاتصال.",
          "أكمل «تفاصيل التدقيق»: المرحلة والتواريخ والمنطقة الزمنية والمدقق الرئيسي وفريق التدقيق.",
          "راجع «أهداف التدقيق» و«ملخص النطاق» وعدّلهما عند الحاجة.",
          "ابنِ «جدول أعمال التدقيق» بإضافة الأنشطة أو استيراد قالب.",
          "راجع «توزيع المواقع» و«الأنشطة عن بُعد» و«ملاحظات السفر».",
          "أكّد «إقرارات الفريق»: التوفر وعدم تعارض المصالح.",
          "اضغط «حفظ كمسودة»، ثم «فحص الجاهزية».",
          "عند نجاح الفحص اضغط «إرسال إلى العميل» ثم «تأكيد وإرسال الخطة»."
        ],
        "rules": [
          "قائمتا «المدقق الرئيسي» و«+ إضافة مدقق» تعرضان المدققين المؤهلين فقط.",
          "«حفظ كمسودة» يعيد الخطة إلى «مسودة» إذا كانت مسودة أو مخططة أو معاد جدولتها.",
          "الخطط قيد التنفيذ أو بعدها تحتفظ بحالتها عند الحفظ.",
          "لا يمكن تعديل خطة مكتملة؛ يرفض الخادم أي تغيير عليها.",
          "لا تُرسل الخطة دون مدقق رئيسي.",
          "الإرسال وإعادة الجدولة متاحان فقط للحالات: مسودة، مخطط، أُعيدت جدولته.",
          "توصي بطاقة فريق التدقيق بالفريق وتفحصه وتؤكده، ولا تُرسل الخطة إلى العميل ولا تبدأ إلا بفريق مؤكد ما زال يجتاز فحوص الكفاءة والتوافر والحياد (انظر اختيار فريق التدقيق)."
        ],
        "after": [
          "بعد إرسال الخطة اختر «بدء التنفيذ أو متابعته» لتنفيذ التدقيق في ست خطوات (التحضير والافتتاح والتنفيذ ومراجعة الفريق والاختتام والتقرير) مع قوائم تحقق لكل معيار.",
          "بعد الإرسال تصبح الحالة «مخطط» ويُنشأ للعميل موعد زيارة دورية غير مؤكد.",
          "يصل العميل إشعار «أكّد خطة التدقيق» مع تاريخ البدء.",
          "عندما يؤكد العميل يصل لجهة المنح إشعار «خطة التدقيق بانتظار الاعتماد».",
          "التقويم ولوحة التحكم ودورة الشهادة تقرأ الخطة مباشرة."
        ],
        "tips": [
          "يملأ زر «استيراد قالب» هذه الخطة من Excel: أنشطة جدول التدقيق وتخصيص الموقع والأنشطة عن بُعد وملاحظات السفر، صف لكل منها. ويفتح زر «تعديل» في بطاقات الموقع والأنشطة عن بُعد والسفر نافذة تحفظ القسم.",
          "شغّل «فحص الجاهزية» بعد كل تغيير في الفريق أو التواريخ.",
          "طابق مجموع ساعات جدول الأعمال مع المدة المراجَعة الظاهرة في الملخص.",
          "علامات التبويب أسفل الصفحة تنقلك إلى القسم المطلوب وتبرزه للحظة."
        ],
        "fields": [
          [
            "مرحلة التدقيق *",
            "المرحلة الأولى / المرحلة الثانية / المراقبة الأولى."
          ],
          [
            "تاريخ البدء المقترح * / تاريخ الانتهاء المقترح *",
            "تواريخ التدقيق؛ النهاية لا تسبق البدء، والحد الأقصى 60 يومًا."
          ],
          [
            "المنطقة الزمنية *",
            "Asia/Riyadh أو Asia/Dubai أو Africa/Cairo."
          ],
          [
            "المدقق الرئيسي *",
            "من المدققين المؤهلين فقط."
          ],
          [
            "فريق التدقيق",
            "شرائح بأسماء الأعضاء؛ «+ إضافة مدقق» لإضافة عضو و(×) لحذفه."
          ],
          [
            "أهداف التدقيق / ملخص النطاق",
            "نصوص حرة تظهر في الخطة المرسلة للعميل."
          ]
        ],
        "statuses": [
          [
            "مسودة",
            "قيد الإعداد، لم تُرسل للعميل."
          ],
          [
            "مخطط",
            "أُرسلت للعميل؛ ينتظر تأكيده."
          ],
          [
            "أُعيدت جدولته",
            "تغيّرت التواريخ؛ يجب أن يؤكد العميل مجددًا."
          ],
          [
            "قيد التنفيذ",
            "بدأ التدقيق ويُفتح تقرير التدقيق."
          ],
          [
            "قيد المراجعة",
            "التقرير قيد المراجعة."
          ],
          [
            "مكتمل",
            "أُغلقت الخطة وسُجّل التدقيق في سجل الكفاءة."
          ]
        ],
        "sections": [
          {
            "id": "plan-details",
            "title": "تفاصيل التدقيق والأهداف والنطاق",
            "bullets": [
              "تواريخ البدء والانتهاء المقترحة تحدد أيام التدقيق وتظهر في التقويم.",
              "المدقق الرئيسي يظهر في الفريق بعبارة (Lead).",
              "احذف عضوًا بالضغط على (×) في شريحته.",
              "القائمة «+ إضافة مدقق» تخفي من هو موجود في الفريق مسبقًا.",
              "الأهداف والنطاق تُملأ تلقائيًا بنص افتراضي يمكنك تعديله.",
              "تُحفظ التعديلات فقط عند الضغط على «حفظ كمسودة»."
            ]
          },
          {
            "id": "plan-agenda",
            "title": "جدول أعمال التدقيق",
            "bullets": [
              "كل صف نشاط له رقم وتاريخ ووقت بداية ونهاية ونشاط ومدقق ومدة بالساعات.",
              "زر (⋮) في الصف يفتح «تعديل النشاط» مع خيار «حذف النشاط».",
              "الإجمالي يُحسب تلقائيًا من حقل المدة لكل نشاط.",
              "قارن الإجمالي بالمدة المراجَعة (مثل DUR-0144 = 2.0 يوم).",
              "«استيراد قالب» يعرض رسالة تأكيد فقط ولا يضيف أنشطة؛ أضفها من «إضافة نشاط».",
              "عند إعادة الجدولة تُزاح تواريخ كل الأنشطة بعدد الأيام نفسه."
            ]
          },
          {
            "id": "add-activity",
            "title": "إضافة نشاط إلى جدول الأعمال",
            "bullets": [
              "اكتب «عنوان النشاط»، مثل: الاجتماع الافتتاحي أو مراجعة البند 8.",
              "حدد «التاريخ» و«البداية» و«النهاية» بتوقيت المنطقة الزمنية للخطة.",
              "اختر «المدقق» من أعضاء الفريق، أو خيار يجمع كل الفريق.",
              "أدخل «المدة (بالساعات)»؛ تقبل الكسور مثل 0.5.",
              "كل الحقول المعلَّمة بـ * إلزامية ولا يُحفظ النشاط دونها.",
              "الإضافة تحدّث الجدول فورًا؛ احفظ الخطة بـ«حفظ كمسودة» لتثبيتها."
            ]
          },
          {
            "id": "plan-site-remote-travel",
            "title": "توزيع المواقع والأنشطة عن بُعد وملاحظات السفر",
            "bullets": [
              "«الموقع *» يُختار من القائمة؛ «الأفراد في الموقع» يُملأ تلقائيًا من فريق التدقيق.",
              "«عنوان الموقع» يُقرأ من بيانات موقع العميل.",
              "إيقاف مفتاح الأنشطة عن بُعد يخفي تفاصيلها ويُحفظ كتدقيق ميداني فقط.",
              "الأنشطة عن بُعد تظهر كشرائح، مثل Document review.",
              "«ملاحظات» الأنشطة عن بُعد توضح ما يجهّزه العميل من دعوات وصلاحيات.",
              "أزرار «تعديل» في هذه البطاقات تعرض رسالة تأكيد فقط؛ عدّل الحقول مباشرة في البطاقة."
            ]
          },
          {
            "id": "plan-declarations",
            "title": "إقرارات الفريق",
            "bullets": [
              "علّم مربع التوفر بعد تأكيد كل عضو لتواريخ التدقيق.",
              "علّم مربع عدم التعارض بعد إقرار كل عضو بعدم وجود علاقة استشارية أو مالية مع العميل.",
              "المربعان يغذّيان «فحص الجاهزية» مباشرة.",
              "عدم إقرار التوفر يُظهر تحذيرًا في فحص التوفر.",
              "عدم إقرار عدم التعارض يُفشل فحص الحياد ولا يمكن تجاوزه بصمت."
            ]
          },
          {
            "id": "readiness-check",
            "title": "فحص الجاهزية: ماذا يتحقق منه",
            "bullets": [
              "الكفاءة: المدقق الرئيسي موظف نشط بمسمى Lead Auditor ومفوَّض بكل معايير الخطة، وإلا يفشل الفحص.",
              "الكفاءة: عضو غير مدقق نشط، أو رمز IAF لا يغطيه الفريق، يعطي تحذيرًا.",
              "التوفر: عضو محجوز في خطة مفتوحة أخرى بتواريخ متداخلة يُفشل الفحص ويذكر الخطة.",
              "التوفر: عدم تأكيد التوفر في الإقرارات يعطي تحذيرًا.",
              "الحياد: يفشل إذا لم يُقر الفريق بعدم وجود تعارض في المصالح.",
              "لا يُسمح بأي تجاوز غير موثّق، وتُسجَّل إفصاحات المدققين في ملف التدقيق.",
              "النتيجة لكل فحص: ناجح أو تحذير أو فاشل؛ والجاهزية الكاملة تتطلب نجاح الثلاثة."
            ]
          },
          {
            "id": "send-to-client",
            "title": "إرسال الخطة إلى العميل",
            "bullets": [
              "المستلم هو جهة الاتصال الرئيسية المسجلة للعميل، ولا يُختار يدويًا.",
              "بعد التأكيد تظهر رسالة: Audit plan sent to … مع الاسم والبريد.",
              "تتحول الحالة إلى «مخطط» ويُسجَّل وقت الإرسال واسم المستلم.",
              "يُنشأ للعميل موعد زيارة دورية غير مؤكد ويصله إشعار «أكّد خطة التدقيق».",
              "إعادة الإرسال تمسح أي تأكيد سابق من العميل.",
              "خطة قيد التنفيذ أو بعدها لا يمكن إرسالها."
            ]
          },
          {
            "id": "reschedule",
            "title": "إعادة الجدولة مع ذكر السبب",
            "bullets": [
              "اضغط (•••) بجانب «إرسال إلى العميل».",
              "التواريخ الجديدة تبدأ بالتواريخ الحالية؛ عدّلها.",
              "اكتب السبب، مثل طلب العميل تعديل الموعد بسبب صيانة المنشأة.",
              "يرفض النظام تواريخ مطابقة للحالية، أو نهاية قبل البدء، أو مدة تتجاوز 60 يومًا.",
              "النتيجة: رقم الإصدار +1، والحالة «أُعيدت جدولته»، وسطر في سجل إعادة الجدولة بالتواريخ القديمة والجديدة والسبب.",
              "تُزاح تواريخ أنشطة جدول الأعمال بالفرق نفسه.",
              "إذا كانت الخطة قد أُرسلت، يُحدَّث موعد العميل ويُطلب منه التأكيد مجددًا."
            ]
          },
          {
            "id": "plan-lifecycle",
            "title": "دورة حياة الخطة وما تطلقه كل مرحلة",
            "bullets": [
              "مسودة ← مخطط: عند «إرسال إلى العميل»؛ يُنشأ موعد زيارة للعميل ويُطلب تأكيده.",
              "مخطط ← أُعيدت جدولته: عند تغيير التواريخ؛ يُطلب من العميل التأكيد مجددًا.",
              "تأكيد العميل لا يغيّر الحالة، لكنه يرسل لجهة المنح إشعار «بانتظار الاعتماد».",
              "مخطط/أُعيدت جدولته ← قيد التنفيذ: يفتح النظام تقرير التدقيق للخطة ويحدد فريقه.",
              "قيد التنفيذ ← قيد المراجعة: التقرير قيد المراجعة؛ يظهر بند «مراجعة تقرير التدقيق» في قائمة المهام.",
              "قيد التنفيذ/قيد المراجعة ← مكتمل: يُضاف التدقيق إلى سجل كفاءة كل عضو من موظفي الجهة.",
              "الإكمال لا يُمنع بتقرير غير مُنهى؛ أنهِ التقرير أولًا كممارسة جيدة.",
              "شريط «دورة حياة التدقيق» أعلى الخطة ينقلها: «بدء التدقيق» (يفتح تقرير التدقيق) و«إرسال للمراجعة» و«وضع علامة مكتمل»، ولكلٍّ تأكيد، و«فتح تقرير التدقيق» يفتح التقرير."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "audit-reporting",
    "audience": "cab",
    "section": "audit",
    "routes": [
      "/cab/audit-reporting",
      "/cab/audit-reporting/workspace"
    ],
    "open": "/cab/audit-reporting",
    "updated": "2026-10-27",
    "related": ["stage-report-review", "audit-execution"],
    "capture": {
      "as": "cab",
      "route": "/cab/audit-reporting"
    },
    "text": {
      "en": {
        "title": "Audit reporting workspace",
        "summary": "One workspace per audit: the agenda as run, evidence tasks, the findings register, and the final report with submission gates. It opens automatically when the audit plan starts.",
        "who": "The lead auditor and audit team members.",
        "when": "During and after the audit, until the report is finalized, frozen and handed to technical review.",
        "nav": "Sidebar → Audit Reporting",
        "handoff": "The client does not see the workspace. After finalization the client sees its nonconformities under Findings in the portal and is asked to respond.",
        "screen": [
          "CAB-client scope banner: organization, site, contact and documents.",
          "Agenda tab: sessions and their status.",
          "Evidence tab: required evidence and its status.",
          "Findings tab: findings register and classification.",
          "Report tab: recommendation, submission gates and finalization.",
          "Agenda table: Time, Session / Activity, Clauses, Auditor, Status."
        ],
        "steps": [
          "Open Audit Reporting; the latest draft report opens automatically.",
          "Check the scope banner shows the right client and site.",
          "Follow the Agenda sessions and their status.",
          "In Evidence, add the evidence needed and link it to a requirement.",
          "In Findings, add each finding and submit it classified.",
          "In Report, write the auditor recommendation.",
          "When every gate passes, click Finalize & freeze version."
        ],
        "rules": [
          "Each audit plan has exactly one report.",
          "A frozen version cannot change; open a new draft version to edit.",
          "No cross-tenant sharing; records outside your CAB are not found.",
          "With no report yet, the page shows No audit report yet."
        ],
        "after": [
          "The stage report of each audit (ISO/IEC 17021-1 9.4.8) is reviewed by a technical reviewer outside the audit team, issued as a bilingual PDF and acknowledged by the client in the portal.",
          "Finalizing raises a nonconformity for every critical, major or minor nonconformity finding.",
          "The client is notified Response due on … for each nonconformity.",
          "A Stage 2 or recertification report opens a certification decision file."
        ],
        "tips": [
          "Record evidence first, then link findings to it; generic claims are blocked.",
          "Use Export filtered to share evidence or findings lists with the team."
        ],
        "fields": [
          [
            "Org",
            "The audited client."
          ],
          [
            "Site",
            "The audited site."
          ],
          [
            "Contact",
            "Client contact and role."
          ],
          [
            "Docs",
            "Client reference documents; IDs are stable within the CAB-client relationship."
          ]
        ],
        "statuses": [
          [
            "Completed",
            "Session finished."
          ],
          [
            "In progress",
            "Session running."
          ],
          [
            "Not started",
            "Session not started yet."
          ]
        ],
        "sections": [
          {
            "id": "rep-evidence",
            "title": "Evidence tasks",
            "bullets": [
              "Each item is linked to the audit number and a requirement (clause).",
              "The counter next to the filters shows listed / total (e.g. 4 / 4).",
              "Row checkboxes select evidence; they lock once the report is frozen.",
              "Open: requested. Submitted: provided by the client. Verified: checked by the auditor.",
              "With no match, a message offers Clear filters.",
              "The first finalization gate needs at least one linked evidence task."
            ]
          },
          {
            "id": "rep-add-evidence",
            "title": "Add evidence task",
            "bullets": [
              "Write a precise description, e.g. Calibration records (last 12 months).",
              "Without a description the message Description is required. appears.",
              "The task gets an EV-xxxx number and audit reference automatically.",
              "A failed save keeps the values you entered.",
              "The button is disabled while the report is frozen."
            ]
          },
          {
            "id": "rep-findings",
            "title": "Findings register",
            "bullets": [
              "Each finding has a number and a type: Nonconformity, Observation or Opportunity.",
              "Classification and due dates follow the configured scheme rules; no universal major/minor deadline applies.",
              "Status is Draft or Submitted; finalization needs every finding submitted and classified.",
              "Export filtered downloads the findings register as CSV.",
              "Add finding is disabled once the report is frozen."
            ]
          },
          {
            "id": "rep-report-gates",
            "title": "Report and submission gates",
            "bullets": [
              "Evidence linked: at least one linked evidence task.",
              "Findings classified: at least one finding, all submitted and classified.",
              "Auditor recommendation recorded: more than 10 characters.",
              "Technical review handoff ready: passes once the version is frozen.",
              "Passed gates turn green; open gates stay grey.",
              "The recommendation saves when you leave the field; it is not a certification decision.",
              "If a gate is open, Finalization blocked names the first missing gate."
            ]
          },
          {
            "id": "rep-finalize-reopen",
            "title": "Finalize and reopen",
            "bullets": [
              "Finalizing freezes the version; the workspace becomes read-only.",
              "A green bar shows Report v… frozen · read-only.",
              "A nonconformity is raised for each nonconformity finding classified critical, major or minor.",
              "Each nonconformity's due date is the finding's due date; the client is notified.",
              "After Stage 2 or recertification a decision file opens, due in 30 days.",
              "Go to technical review handoff opens that decision.",
              "Open new draft version returns the report to draft with the next version number.",
              "Reopening is refused once the decision is recorded; open a decision correction first."
            ]
          }
        ]
      },
      "ar": {
        "title": "مساحة عمل تقارير التدقيق",
        "summary": "مساحة عمل لكل تدقيق: جدول الأعمال الفعلي، ومهام الأدلة، وسجل النتائج، والتقرير النهائي مع بوابات التسليم. تُفتح تلقائيًا عند بدء تنفيذ خطة التدقيق.",
        "who": "المدقق الرئيسي وأعضاء فريق التدقيق.",
        "when": "أثناء التدقيق وبعده، حتى إنهاء التقرير وتجميده وتسليمه للمراجعة الفنية.",
        "nav": "القائمة الجانبية ← تقارير التدقيق",
        "handoff": "لا يرى العميل مساحة العمل. بعد الإنهاء يرى حالات عدم المطابقة في «الملاحظات» ببوابته ويُطلب منه الرد عليها.",
        "screen": [
          "شريط «النطاق المتفق عليه»: المنظمة والموقع وجهة الاتصال والمستندات.",
          "تبويب «جدول الأعمال»: الجلسات وحالتها.",
          "تبويب «الأدلة والمهام»: الأدلة المطلوبة وحالتها.",
          "تبويب «النتائج والملاحظات»: سجل النتائج وتصنيفها.",
          "تبويب «التقرير النهائي»: التوصية وبوابات التسليم والإنهاء.",
          "جدول الأعمال: الوقت، الجلسة / النشاط، البنود، المدقق، الحالة."
        ],
        "steps": [
          "افتح «تقارير التدقيق»؛ تُفتح آخر مسودة تقرير تلقائيًا.",
          "راجع شريط النطاق للتأكد من العميل والموقع الصحيحين.",
          "تابع جلسات «جدول الأعمال» وحالة كل جلسة.",
          "في «الأدلة والمهام» أضف الأدلة المطلوبة واربطها بالمتطلب.",
          "في «النتائج والملاحظات» أضف كل نتيجة وقدّمها مصنّفة.",
          "في «التقرير النهائي» اكتب توصية فريق التدقيق.",
          "تحقق من اجتياز كل البوابات ثم اضغط «إنهاء وتجميد النسخة»."
        ],
        "rules": [
          "يُفتح تقرير واحد فقط لكل خطة تدقيق.",
          "لا يمكن تعديل نسخة مُجمَّدة؛ افتح مسودة جديدة لتغييرها.",
          "لا مشاركة للبيانات بين جهات منح مختلفة؛ كل سجل خارج نطاقك يظهر كغير موجود.",
          "إن لم يوجد تقرير تظهر رسالة «No audit report yet» بالإنجليزية."
        ],
        "after": [
          "يراجع تقرير المرحلة لكل تدقيق (البند 9.4.8 من ISO/IEC 17021-1) مراجع فني من خارج فريق التدقيق، ويصدر بملف PDF ثنائي اللغة، ويؤكد العميل استلامه في البوابة.",
          "إنهاء التقرير يرفع حالة عدم مطابقة لكل نتيجة عدم مطابقة حرجة أو رئيسية أو ثانوية.",
          "يصل العميل إشعار «مطلوب ردكم» لكل حالة عدم مطابقة.",
          "تقرير المرحلة الثانية أو إعادة المنح يفتح ملف قرار منح الشهادة."
        ],
        "tips": [
          "سجّل الأدلة أولًا ثم اربط النتائج بها؛ الادعاءات العامة تُرفض.",
          "استخدم «تصدير المصفى» لمشاركة قائمة الأدلة أو النتائج مع الفريق."
        ],
        "fields": [
          [
            "المنظمة",
            "اسم العميل صاحب التدقيق."
          ],
          [
            "الموقع",
            "الموقع المدقَّق."
          ],
          [
            "جهة الاتصال",
            "جهة اتصال العميل ودورها."
          ],
          [
            "المستندات",
            "مستندات العميل المرجعية؛ المعرّفات ثابتة ضمن العلاقة بين الجهة والعميل."
          ]
        ],
        "statuses": [
          [
            "مكتمل",
            "جلسة انتهت."
          ],
          [
            "قيد التنفيذ",
            "جلسة جارية."
          ],
          [
            "لم يبدأ",
            "جلسة لم تبدأ بعد."
          ]
        ],
        "sections": [
          {
            "id": "rep-evidence",
            "title": "مهام الأدلة",
            "bullets": [
              "كل دليل مرتبط برقم التدقيق ومتطلب محدد (بند).",
              "العدّاد بجانب الفلاتر يبين المعروض من الإجمالي (مثل 4 / 4).",
              "مربع الاختيار في كل صف لتحديد الأدلة؛ يُعطَّل بعد تجميد التقرير.",
              "«مفتوح»: مطلوب ولم يُقدَّم. «مُقدَّم»: قدّمه العميل. «تم التحقق»: راجعه المدقق.",
              "إن لم تطابق أي نتيجة تظهر رسالة مع زر «مسح الفلاتر».",
              "بوابة الإنهاء الأولى تتطلب وجود دليل واحد مرتبط على الأقل."
            ]
          },
          {
            "id": "rep-add-evidence",
            "title": "إضافة مهمة دليل",
            "bullets": [
              "اكتب وصفًا محددًا، مثل: سجلات المعايرة لآخر 12 شهرًا.",
              "دون وصف تظهر رسالة «Description is required.» ولا تُضاف المهمة.",
              "يحصل الدليل على رقم EV-xxxx ومرجع تدقيق تلقائيًا.",
              "إذا فشل الحفظ تبقى القيم المدخلة كما هي.",
              "الزر معطّل عندما يكون التقرير مُجمَّدًا."
            ]
          },
          {
            "id": "rep-findings",
            "title": "سجل النتائج",
            "bullets": [
              "كل نتيجة لها رقم ونوع: Nonconformity أو Observation أو Opportunity.",
              "التصنيف والمواعيد تتبع قواعد المخطط المهيأة؛ لا توجد مهلة عامة للرئيسية والثانوية.",
              "الحالة «مسودة» أو «مُقدَّم»؛ الإنهاء يتطلب تقديم وتصنيف كل النتائج.",
              "«تصدير المصفى» ينزّل سجل النتائج بملف CSV.",
              "زر الإضافة معطّل بعد تجميد التقرير."
            ]
          },
          {
            "id": "rep-report-gates",
            "title": "التقرير النهائي وبوابات التسليم",
            "bullets": [
              "Evidence linked: دليل واحد مرتبط على الأقل.",
              "Findings classified: نتيجة واحدة على الأقل، وكل النتائج مقدَّمة ومصنفة.",
              "Auditor recommendation recorded: توصية أطول من 10 أحرف.",
              "Technical review handoff ready: تتحقق تلقائيًا بعد الإنهاء.",
              "البوابة المجتازة تظهر باللون الأخضر، وغير المجتازة بالرمادي.",
              "التوصية تُحفظ تلقائيًا عند مغادرة الحقل؛ وهي ليست قرار منح.",
              "إن لم تكتمل البوابات تظهر رسالة «Finalization blocked» مع أول بوابة ناقصة."
            ]
          },
          {
            "id": "rep-finalize-reopen",
            "title": "الإنهاء وفتح نسخة جديدة",
            "bullets": [
              "الإنهاء يجمّد النسخة ويجعل مساحة العمل للقراءة فقط.",
              "يظهر شريط أخضر: «تم تجميد التقرير الإصدار … · للقراءة فقط».",
              "تُرفع حالة عدم مطابقة لكل نتيجة عدم مطابقة مصنفة حرجة أو رئيسية أو ثانوية.",
              "تاريخ استحقاق كل حالة هو تاريخ استحقاق النتيجة، ويصل العميل إشعار بالرد.",
              "بعد المرحلة الثانية أو إعادة المنح يُفتح ملف قرار مستحق خلال 30 يومًا.",
              "زر «الانتقال إلى تسليم المراجعة الفنية» يفتح ملف القرار.",
              "«فتح مسودة جديدة» يعيد التقرير مسودة برقم إصدار تالٍ.",
              "لا يمكن إعادة الفتح بعد تسجيل القرار؛ يلزم فتح نسخة تصحيح للقرار أولًا."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "record-finding",
    "audience": "cab",
    "section": "audit",
    "routes": [
      "/cab/audit-reporting/findings/new"
    ],
    "open": "/cab/audit-reporting",
    "updated": "2026-10-27",
    "related": ["audit-execution"],
    "capture": {
      "as": "cab",
      "route": "/cab/audit-reporting/findings/new"
    },
    "text": {
      "en": {
        "title": "Record a finding",
        "summary": "Form for one finding linked to the audit, a requirement and objective evidence. Drafts may be incomplete; submission enforces the stage gates.",
        "who": "The lead auditor and audit team members.",
        "when": "During or right after the audit, before the report is finalized.",
        "nav": "Audit Reporting → Findings → Add finding",
        "handoff": "The client sees nothing while you draft. After finalization the nonconformity reaches the client under Findings in the portal for a response.",
        "screen": [
          "Finding type: Nonconformity, Observation, Opportunity for improvement.",
          "Classification (scheme rules), with ? to view the rules.",
          "Requirement reference: standard and clause.",
          "Objective evidence (linked): evidence text and evidence/document chips.",
          "Finding statement.",
          "Stage gates: what must be complete before submitting.",
          "Submit finding: final submission once gates pass."
        ],
        "steps": [
          "In the Findings tab, click Add finding.",
          "Choose the Finding type.",
          "Choose the Classification; click ? to review the scheme rules.",
          "Enter the Requirement reference, e.g. ISO 9001:2015, Clause 8.5.1.",
          "Write the objective evidence and tick linked items (EV-… or DOC-…).",
          "Write a clear Finding statement.",
          "Open More details: process, due date and responsible contact.",
          "Click Save as Draft to keep partial work, or Submit finding."
        ],
        "rules": [
          "A nonconformity must be classified critical, major or minor.",
          "An observation is classified Observation; opportunities follow the scheme rules.",
          "Submission needs type, classification, reference, statement and evidence text or a link.",
          "A nonconformity needs a due date on submission.",
          "Generic claims without evidence tied to the audit and requirement are blocked.",
          "Once a finding has raised a nonconformity it can no longer change."
        ],
        "after": [
          "From a checklist item with a Minor or Major NC result, the form opens already filled with the clause, statement and evidence; saving it links the finding to the item and returns you to the audit.",
          "After submission a success message shows and you return to the workspace.",
          "On report finalization, critical/major/minor nonconformity findings become register entries.",
          "The nonconformity number reuses the finding's sequence number."
        ],
        "tips": [
          "Write statements as: requirement + what is not met + evidence.",
          "Client contact ≠ portal access ≠ signatory authority … reminds you roles are separate.",
          "Cancelling with unsaved changes asks you to confirm Discard changes."
        ],
        "fields": [
          [
            "Finding type *",
            "Nonconformity / Observation / Opportunity for improvement."
          ],
          [
            "Classification (scheme rules) *",
            "Critical / Major / Minor / Observation · per scheme rules."
          ],
          [
            "Requirement reference *",
            "Standard and clause."
          ],
          [
            "Objective evidence (linked) *",
            "Evidence text and/or at least one linked item."
          ],
          [
            "Finding statement *",
            "What is not met, or what is observed."
          ],
          [
            "Process / area",
            "Optional, e.g. Storage and Handling."
          ],
          [
            "Due date · scheme-ruled",
            "Required for a nonconformity on submission."
          ],
          [
            "Responsible contact (client contact role)",
            "Client person who must respond."
          ],
          [
            "Additional comments (optional)",
            "Internal notes."
          ]
        ],
        "statuses": [
          [
            "Draft",
            "Saved, possibly incomplete; not counted by the classification gate."
          ],
          [
            "Submitted",
            "Passed the gates and is part of the report."
          ]
        ],
        "sections": [
          {
            "id": "finding-scheme-rules",
            "title": "Classification rules",
            "bullets": [
              "Critical and Major: significant nonconformities; must be closed after verification before a grant.",
              "Minor: partial nonconformity; an accepted corrective action plan is enough before a grant.",
              "Observation: noted, raises no nonconformity.",
              "Opportunity for improvement is a finding type, not a class; it raises no nonconformity.",
              "Due dates are Due per scheme rules (configured), not one universal deadline."
            ]
          },
          {
            "id": "finding-more-details",
            "title": "More details",
            "bullets": [
              "The section is open by default; click its header to collapse it.",
              "The due date becomes the nonconformity's due and target date.",
              "The responsible contact carries over to Responsible person in the client's response.",
              "These fields are optional in a draft; the due date is required for a nonconformity on submission."
            ]
          },
          {
            "id": "finding-gates-submit",
            "title": "Stage gates: draft or submit",
            "bullets": [
              "Five gates: Finding type chosen, Classified per scheme rules, Requirement referenced, Evidence linked, Statement written.",
              "A draft permits incomplete later-stage data.",
              "An incomplete submission shows a red box listing missing gates; the draft is kept.",
              "The server also checks nonconformity classification and due date.",
              "A successful submission shows a message and returns to the workspace after about a second.",
              "Both buttons are disabled when the report is frozen."
            ]
          }
        ]
      },
      "ar": {
        "title": "تسجيل نتيجة تدقيق",
        "summary": "نموذج تسجيل نتيجة واحدة مرتبطة بالتدقيق والمتطلب والدليل الموضوعي. يمكن حفظها مسودة ناقصة، ولا تُقدَّم إلا بعد اجتياز بوابات المرحلة.",
        "who": "المدقق الرئيسي وأعضاء فريق التدقيق.",
        "when": "أثناء التدقيق أو بعده مباشرة، قبل إنهاء التقرير.",
        "nav": "تقارير التدقيق ← النتائج والملاحظات ← إضافة ملاحظة / نتيجة",
        "handoff": "لا يرى العميل النتيجة أثناء الصياغة. بعد إنهاء التقرير تصله حالة عدم المطابقة في «الملاحظات» ببوابته ليرد عليها.",
        "screen": [
          "«نوع النتيجة»: عدم مطابقة، ملاحظة، فرصة للتحسين.",
          "«التصنيف (وفق قواعد المخطط)» مع زر (?) لعرض القواعد.",
          "«مرجع المتطلب»: المعيار والبند.",
          "«الدليل الموضوعي (مرتبط)»: نص الدليل وشرائح الأدلة والمستندات.",
          "«نص النتيجة»: صياغة النتيجة.",
          "«بوابات المراحل»: ما يجب اكتماله قبل التقديم.",
          "«تقديم النتيجة»: التقديم النهائي بعد اجتياز البوابات."
        ],
        "steps": [
          "من تبويب «النتائج والملاحظات» اضغط «إضافة ملاحظة / نتيجة».",
          "اختر «نوع النتيجة».",
          "اختر «التصنيف (وفق قواعد المخطط)»؛ اضغط (?) لمراجعة القواعد.",
          "اكتب «مرجع المتطلب»، مثل ISO 9001:2015, Clause 8.5.1.",
          "اكتب الدليل الموضوعي واختر الأدلة المرتبطة (EV-… أو DOC-…).",
          "اكتب «نص النتيجة» بصياغة واضحة.",
          "افتح «تفاصيل إضافية» وأكمل العملية وتاريخ الاستحقاق وجهة الاتصال.",
          "اضغط «حفظ كمسودة» للحفظ الجزئي، أو «تقديم النتيجة» للتقديم."
        ],
        "rules": [
          "عدم المطابقة يجب تصنيفه حرجة أو رئيسية أو ثانوية فقط.",
          "الملاحظة تُصنَّف Observation، وفرصة التحسين تتبع قواعد المخطط.",
          "التقديم يتطلب: النوع، التصنيف، المرجع، النص، ودليلًا نصيًا أو مرتبطًا.",
          "عدم المطابقة يتطلب تاريخ استحقاق عند التقديم.",
          "الادعاءات العامة دون دليل مرتبط بالتدقيق والمتطلب تُرفض.",
          "النتيجة التي رفعت حالة عدم مطابقة لا يمكن تغييرها بعد ذلك."
        ],
        "after": [
          "عند فتح النموذج من بند في قائمة التحقق نتيجته عدم مطابقة بسيطة أو جسيمة يُعبأ مسبقاً برقم البند والبيان والأدلة، ويربط الحفظ الملاحظة بالبند ويعيدك إلى التدقيق.",
          "بعد التقديم تظهر رسالة نجاح ويعود النظام إلى مساحة العمل.",
          "عند إنهاء التقرير تتحول نتائج عدم المطابقة (حرجة/رئيسية/ثانوية) إلى سجل حالات عدم المطابقة.",
          "يحمل رقم حالة عدم المطابقة الرقم التسلسلي نفسه للنتيجة."
        ],
        "tips": [
          "اكتب النص بصيغة: المتطلب + ما لم يُستوفَ + الدليل.",
          "عبارة «جهة اتصال العميل ≠ صلاحية دخول البوابة ≠ صلاحية التوقيع…» تذكير بفصل الأدوار.",
          "عند إلغاء نموذج فيه تغييرات يطلب النظام تأكيد «تجاهل التغييرات»."
        ],
        "fields": [
          [
            "نوع النتيجة *",
            "عدم مطابقة / ملاحظة / فرصة للتحسين."
          ],
          [
            "التصنيف (وفق قواعد المخطط) *",
            "Critical / Major / Minor / Observation · per scheme rules."
          ],
          [
            "مرجع المتطلب *",
            "المعيار والبند."
          ],
          [
            "الدليل الموضوعي (مرتبط) *",
            "نص الدليل و/أو دليل مرتبط واحد على الأقل."
          ],
          [
            "نص النتيجة *",
            "وصف عدم الاستيفاء أو الملاحظة."
          ],
          [
            "العملية / المجال",
            "اختياري، مثل Storage and Handling."
          ],
          [
            "تاريخ الاستحقاق · وفق قواعد المخطط",
            "إلزامي لعدم المطابقة عند التقديم."
          ],
          [
            "جهة الاتصال المسؤولة (دور جهة اتصال العميل)",
            "الشخص لدى العميل المسؤول عن الرد."
          ],
          [
            "تعليقات إضافية (اختياري)",
            "ملاحظات داخلية."
          ]
        ],
        "statuses": [
          [
            "مسودة",
            "محفوظة وقد تكون ناقصة؛ لا تُحتسب في بوابة التصنيف."
          ],
          [
            "مُقدَّم",
            "اجتازت البوابات وأصبحت جزءًا من التقرير."
          ]
        ],
        "sections": [
          {
            "id": "finding-scheme-rules",
            "title": "قواعد التصنيف",
            "bullets": [
              "Critical وMajor: عدم مطابقة جوهرية؛ يجب إغلاقها بعد التحقق قبل منح الشهادة.",
              "Minor: عدم مطابقة جزئية؛ يكفي قبول خطة الإجراء التصحيحي قبل المنح.",
              "Observation: ملاحظة لا ترفع حالة عدم مطابقة.",
              "فرصة التحسين (Opportunity) نوع نتيجة وليست تصنيفًا، ولا ترفع حالة عدم مطابقة.",
              "المواعيد «Due per scheme rules (configured)»: تحددها قواعد المخطط لا قاعدة عامة."
            ]
          },
          {
            "id": "finding-more-details",
            "title": "تفاصيل إضافية",
            "bullets": [
              "القسم مفتوح افتراضيًا؛ اضغط العنوان لطيّه.",
              "تاريخ الاستحقاق يصبح تاريخ استحقاق حالة عدم المطابقة وتاريخها المستهدف.",
              "جهة الاتصال المسؤولة تُنقل إلى حقل «الشخص المسؤول» في رد العميل.",
              "هذه الحقول اختيارية في المسودة؛ تاريخ الاستحقاق إلزامي لعدم المطابقة عند التقديم."
            ]
          },
          {
            "id": "finding-gates-submit",
            "title": "بوابات المراحل: مسودة أم تقديم",
            "bullets": [
              "البوابات الخمس: تم اختيار نوع النتيجة، مصنفة وفق قواعد المخطط، تمت الإشارة إلى المتطلب، تم ربط الدليل، تمت كتابة النص.",
              "المسودة تقبل بيانات ناقصة للمراحل اللاحقة.",
              "عند التقديم الناقص يظهر صندوق أحمر يسرد البوابات الناقصة ويُحتفظ بالمسودة.",
              "الخادم يتحقق أيضًا من تصنيف عدم المطابقة وتاريخ استحقاقها.",
              "التقديم الناجح يعرض رسالة ويعود إلى مساحة العمل بعد ثانية تقريبًا.",
              "الزران معطّلان إذا كان التقرير مُجمَّدًا."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "nonconformity-register",
    "audience": "cab",
    "section": "audit",
    "routes": [
      "/cab/nonconformities"
    ],
    "open": "/cab/nonconformities",
    "statusDomain": "nonconformity",
    "statusValues": [
      "open",
      "in_progress",
      "submitted",
      "closed",
      "overdue"
    ],
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/nonconformities"
    },
    "text": {
      "en": {
        "title": "Nonconformity register",
        "summary": "Every nonconformity raised from audit findings, with client, classification, due date, owner and status, to follow corrective actions to closure.",
        "who": "Lead auditor, follow-up owner and CAB admin.",
        "when": "After the audit report is finalized, and throughout the client response and verification.",
        "nav": "Sidebar → Workspace → Nonconformities",
        "handoff": "The client sees the same items under Findings in the portal and answers them from its response page.",
        "screen": [
          "Search by finding ID, client name or client ID.",
          "Raised period: date range the NC was raised.",
          "Export the listed rows to Excel or PDF.",
          "Clear filters resets every filter to All.",
          "NC ID (e.g. NC-0412): a link straight to the full page.",
          "Status: Open, In progress, Submitted, Closed, Overdue."
        ],
        "steps": [
          "Open Nonconformities from the sidebar.",
          "Narrow the list with search, Raised period, Country and Status.",
          "Read the columns: NC ID, Finding, Client, Classification, Due, Owner, Status.",
          "Click a row to open the side panel and its tabs.",
          "In the panel click Open response, or Open full page."
        ],
        "rules": [
          "Nonconformities are raised on report finalization, for critical, major and minor nonconformity findings only.",
          "Overdue is computed: the client still owes a response and the due date has passed.",
          "A submitted or closed NC never becomes overdue.",
          "The due date turns red when the NC is overdue.",
          "Export is disabled when there are no results."
        ],
        "after": [
          "Closed NCs, and submitted minor NCs, satisfy the Findings closed or accepted decision gate.",
          "When the client submits, the CAB is notified Response received on …."
        ],
        "tips": [
          "Import from Excel carries over open findings from your previous system with grade, due date and status.",
          "Start the day filtering on Submitted to review waiting responses.",
          "Chase Overdue items using the client contact shown in the details."
        ],
        "fields": [
          [
            "Search finding or client",
            "Finding ID, client name or client ID."
          ],
          [
            "Raised period",
            "From · to dates (DD/MM/YYYY)."
          ],
          [
            "Country",
            "Client country."
          ],
          [
            "Status",
            "All, or one status."
          ]
        ],
        "statuses": [
          [
            "Open",
            "Raised; the client has not started."
          ],
          [
            "In progress",
            "Client saved a draft, or the CAB requested a revision."
          ],
          [
            "Submitted",
            "Client submitted; awaiting CAB verification."
          ],
          [
            "Closed",
            "Closed after verification."
          ],
          [
            "Overdue",
            "Client response still owed and past due."
          ]
        ],
        "sections": [
          {
            "id": "nc-side-panel",
            "title": "Side panel and its tabs",
            "bullets": [
              "Click any row to open the panel; close it with ×.",
              "At the bottom of the panel: Open full page and Open response.",
              "Actions are built from the client's response; each has an owner, due date and status.",
              "Action statuses: Pending, Submitted, Accepted, Rejected.",
              "Verification stays Pending until the CAB closes the NC.",
              "History starts with the NC being raised from the finding during the audit."
            ]
          }
        ]
      },
      "ar": {
        "title": "سجل حالات عدم المطابقة",
        "summary": "سجل لكل حالات عدم المطابقة التي رُفعت من نتائج التدقيق، مع العميل والتصنيف وتاريخ الاستحقاق والمسؤول والحالة، لمتابعة الإجراءات التصحيحية حتى الإغلاق.",
        "who": "المدقق الرئيسي ومسؤول المتابعة ومدير جهة منح الشهادات.",
        "when": "بعد إنهاء تقرير التدقيق، وطوال فترة رد العميل والتحقق.",
        "nav": "القائمة الجانبية ← مساحة العمل ← حالات عدم المطابقة",
        "handoff": "يرى العميل الحالات نفسها في «الملاحظات» ببوابته، ويرد عليها من صفحة الرد الخاصة به.",
        "screen": [
          "البحث برقم النتيجة أو اسم العميل أو رقم العميل.",
          "«فترة الإصدار»: نطاق تاريخ رفع الحالة.",
          "«تصدير» بصيغة Excel أو PDF للنتائج المعروضة.",
          "«مسح الفلاتر» يعيد كل الفلاتر إلى «الكل».",
          "«رقم عدم المطابقة» (مثل NC-0412): رابط يفتح الصفحة الكاملة مباشرة.",
          "«الحالة»: مفتوحة، قيد التنفيذ، تم الإرسال، مغلقة، متأخرة."
        ],
        "steps": [
          "افتح «حالات عدم المطابقة» من القائمة الجانبية.",
          "استخدم البحث و«فترة الإصدار» و«الدولة» و«الحالة» لتضييق القائمة.",
          "اقرأ الأعمدة: رقم عدم المطابقة، النتيجة، العميل، التصنيف، تاريخ الاستحقاق، المسؤول، الحالة.",
          "اضغط أي صف لفتح لوحة التفاصيل الجانبية بتبويباتها.",
          "من اللوحة اضغط «فتح الرد» لمراجعة رد العميل، أو «فتح في صفحة كاملة»."
        ],
        "rules": [
          "تُرفع الحالة تلقائيًا عند إنهاء التقرير، لنتائج عدم المطابقة الحرجة والرئيسية والثانوية فقط.",
          "«متأخرة» حالة محسوبة: الرد ما زال مطلوبًا من العميل وتاريخ الاستحقاق قد مضى.",
          "الحالة المقدَّمة أو المغلقة لا تصبح متأخرة مهما مضى التاريخ.",
          "تاريخ الاستحقاق يظهر بالأحمر عندما تكون الحالة متأخرة.",
          "زر «تصدير» معطّل عندما لا توجد نتائج."
        ],
        "after": [
          "الحالات المغلقة، والثانوية المقدَّمة، تفتح بوابة «إغلاق النتائج أو قبولها» في ملف القرار.",
          "عند تقديم العميل لرده يصل لجهة المنح إشعار «وصل الرد على …»."
        ],
        "tips": [
          "ينقل الاستيراد من Excel الملاحظات المفتوحة من نظامك السابق مع الدرجة وتاريخ الاستحقاق والحالة.",
          "ابدأ يومك بفلتر «تم الإرسال» لمراجعة الردود المنتظرة.",
          "تابع «متأخرة» وتواصل مع جهة اتصال العميل الظاهرة في التفاصيل."
        ],
        "fields": [
          [
            "البحث عن نتيجة أو عميل",
            "رقم النتيجة أو اسم العميل أو رقمه."
          ],
          [
            "فترة الإصدار",
            "من تاريخ إلى تاريخ (يوم/شهر/سنة)."
          ],
          [
            "الدولة",
            "دولة العميل."
          ],
          [
            "الحالة",
            "الكل أو حالة محددة."
          ]
        ],
        "statuses": [
          [
            "مفتوحة",
            "رُفعت ولم يبدأ العميل الرد."
          ],
          [
            "قيد التنفيذ",
            "حفظ العميل مسودة، أو طلبت الجهة تعديل الرد."
          ],
          [
            "تم الإرسال",
            "قدّم العميل الرد؛ ينتظر تحقق الجهة."
          ],
          [
            "مغلقة",
            "أُغلقت بعد التحقق."
          ],
          [
            "متأخرة",
            "مطلوب رد العميل وقد تجاوز تاريخ الاستحقاق."
          ]
        ],
        "sections": [
          {
            "id": "nc-side-panel",
            "title": "لوحة التفاصيل الجانبية وتبويباتها",
            "bullets": [
              "اضغط أي صف لفتح اللوحة؛ أغلقها بزر (×).",
              "أسفل اللوحة زرّا «فتح في صفحة كاملة» و«فتح الرد».",
              "الإجراءات تُبنى من رد العميل؛ كل إجراء له مسؤول وتاريخ استحقاق وحالة.",
              "حالات الإجراء: قيد الانتظار، تم الإرسال، مقبول، مرفوض.",
              "التحقق يبقى «قيد الانتظار» حتى تُغلق الجهة الحالة.",
              "السجل يبدأ بحدث رفع الحالة من النتيجة أثناء التدقيق."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "nonconformity-details",
    "audience": "cab",
    "section": "audit",
    "routes": [
      "/cab/nonconformities/:ncId"
    ],
    "open": "/cab/nonconformities",
    "updated": "2026-10-24",
    "capture": {
      "as": "cab",
      "route": "/cab/nonconformities/nc-0412"
    },
    "text": {
      "en": {
        "title": "Nonconformity details",
        "summary": "Full page for one nonconformity: number, status and class, the four corrective-action stages, description, actions, history, details, client contact and attachments.",
        "who": "Lead auditor and follow-up owner.",
        "when": "When following one NC, or before reviewing the client's response.",
        "nav": "Nonconformities → row → Open full page",
        "handoff": "The client sees the same stages on its portal response page, including Rejected, resubmit after a revision request.",
        "screen": [
          "NC number with status and classification badges.",
          "Open response (View response once closed).",
          "Stage 1: Correction and its state.",
          "Stage 4: Verification and its state.",
          "Previous moves to the previous NC in the register.",
          "Next moves to the next NC."
        ],
        "steps": [
          "Open the NC from the register.",
          "Read the line under the name: finding, raised date and due date.",
          "Check the stage strip: Correction, Root cause analysis, Corrective action, Verification.",
          "Read Description, Actions and History.",
          "Check Details, Client contact and Attachments on the side.",
          "Click Open response to review the corrective action."
        ],
        "rules": [
          "A red Overdue badge shows when a response is owed and past due.",
          "A closed NC shows View response instead of Open response."
        ],
        "after": [
          "Every response change or reviewer decision is added to History."
        ],
        "tips": [
          "Use Previous and Next to work through NCs without going back to the list."
        ],
        "fields": [
          [
            "Description",
            "Requirement and finding statement as raised from the report."
          ],
          [
            "Details",
            "Client, Country, Finding, Audit, Classification, Owner, Status."
          ],
          [
            "Client contact",
            "Primary contact and email."
          ],
          [
            "Attachments",
            "File, size, uploader and date."
          ]
        ],
        "statuses": [
          [
            "Waiting for the client",
            "This part is not submitted yet."
          ],
          [
            "Submitted, to review",
            "Submitted by the client; awaiting verification."
          ],
          [
            "Accepted",
            "NC closed after verification."
          ],
          [
            "Rejected, resubmit",
            "Revision requested; the client must resubmit."
          ]
        ],
        "sections": [
          {
            "id": "nc-actions-history",
            "title": "Actions, history, contact and attachments",
            "bullets": [
              "Each action shows stage, status, description, owner and due date.",
              "Correction, root cause and corrective action are owned by the client's responsible person.",
              "Verification is owned by the CAB owner and due on the effectiveness review date.",
              "History lists each event, who did it, date and time.",
              "Attachments list file name, size, uploader and upload date."
            ]
          }
        ]
      },
      "ar": {
        "title": "تفاصيل حالة عدم المطابقة",
        "summary": "صفحة كاملة لحالة عدم مطابقة واحدة: رقمها وحالتها وتصنيفها، ومراحل الإجراء التصحيحي الأربع، والوصف والإجراءات والسجل والتفاصيل وجهة الاتصال والمرفقات.",
        "who": "المدقق الرئيسي ومسؤول المتابعة.",
        "when": "عند متابعة حالة بعينها أو قبل مراجعة رد العميل.",
        "nav": "حالات عدم المطابقة ← صف الحالة ← فتح في صفحة كاملة",
        "handoff": "العميل يرى المراحل نفسها في صفحة الرد ببوابته، ويرى حالة «مرفوض، يُعاد تقديمه» عند طلب التعديل.",
        "screen": [
          "رقم الحالة مع شارتي الحالة والتصنيف.",
          "«فتح الرد» (أو «عرض الرد» للحالة المغلقة).",
          "المرحلة 1: التصحيح وحالتها.",
          "المرحلة 4: التحقق وحالتها.",
          "«السابق» للتنقل إلى الحالة السابقة في السجل.",
          "«التالي» للتنقل إلى الحالة التالية."
        ],
        "steps": [
          "افتح الحالة من السجل.",
          "اقرأ السطر تحت الاسم: رقم النتيجة وتاريخ الإصدار وتاريخ الاستحقاق.",
          "راجع شريط المراحل: التصحيح، تحليل السبب الجذري، الإجراء التصحيحي، التحقق.",
          "اقرأ «الوصف» و«الإجراءات» و«السجل».",
          "راجع «التفاصيل» و«جهة اتصال العميل» و«المرفقات» في العمود الجانبي.",
          "اضغط «فتح الرد» لمراجعة الإجراء التصحيحي."
        ],
        "rules": [
          "شارة «متأخرة» الحمراء تظهر عندما يكون الرد مطلوبًا وتجاوز تاريخ الاستحقاق.",
          "الحالة المغلقة تعرض «عرض الرد» بدل «فتح الرد»."
        ],
        "after": [
          "كل تغيير في الرد أو قرار المراجع يظهر في «السجل»."
        ],
        "tips": [
          "استخدم «السابق» و«التالي» لمراجعة الحالات المتتالية دون العودة للسجل."
        ],
        "fields": [
          [
            "الوصف",
            "المتطلب ونص النتيجة كما رُفعت من التقرير."
          ],
          [
            "التفاصيل",
            "العميل، الدولة، النتيجة، التدقيق، التصنيف، المسؤول، الحالة."
          ],
          [
            "جهة اتصال العميل",
            "جهة الاتصال الرئيسية وبريدها."
          ],
          [
            "المرفقات",
            "الملف وحجمه ومن رفعه وتاريخه."
          ]
        ],
        "statuses": [
          [
            "بانتظار العميل",
            "لم يُقدَّم هذا الجزء بعد."
          ],
          [
            "مقدّم، للمراجعة",
            "قدّمه العميل وينتظر التحقق."
          ],
          [
            "مقبول",
            "أُغلقت الحالة بعد التحقق."
          ],
          [
            "مرفوض، يُعاد تقديمه",
            "طلبت الجهة تعديلًا ويجب إعادة التقديم."
          ]
        ],
        "sections": [
          {
            "id": "nc-actions-history",
            "title": "الإجراءات والسجل وجهة الاتصال والمرفقات",
            "bullets": [
              "كل إجراء يعرض المرحلة والحالة والوصف والمسؤول وتاريخ الاستحقاق.",
              "إجراءات التصحيح والسبب والإجراء التصحيحي يملكها الشخص المسؤول لدى العميل.",
              "إجراء التحقق يملكه مسؤول الحالة لدى الجهة، ويستحق بتاريخ مراجعة الفعالية.",
              "السجل يعرض الحدث ومن قام به وتاريخه ووقته.",
              "المرفقات تعرض اسم الملف وحجمه ورافعه وتاريخ الرفع."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "nonconformity-response-review",
    "audience": "cab",
    "section": "audit",
    "routes": [
      "/cab/nonconformities/:ncId/response"
    ],
    "open": "/cab/nonconformities",
    "statusDomain": "nonconformity",
    "statusValues": [
      "open",
      "in_progress",
      "submitted",
      "closed"
    ],
    "updated": "2026-10-24",
    "capture": {
      "as": "cab",
      "route": "/cab/nonconformities/nc-0412/response"
    },
    "text": {
      "en": {
        "title": "Review corrective action",
        "summary": "Where the CAB reviews the client's answer to a nonconformity: correction, root cause, corrective action and implementation evidence, then the effectiveness review, a revision request or closure.",
        "who": "Lead auditor or the reviewer assigned to verify.",
        "when": "After the client submits its response (status Submitted).",
        "nav": "Nonconformities → NC → Open response",
        "handoff": "After Request revision the client sees the NC In progress with your comments and resubmits from Findings in its portal. After closure the NC shows Closed to the client.",
        "screen": [
          "Root cause * with a character counter (up to 1000).",
          "Corrective action *: what prevents recurrence.",
          "Implementation evidence *: PDF, DOCX, JPG or PNG up to 10 MB.",
          "Reviewer action card.",
          "Request revision sends the response back to the client.",
          "Close after verification closes the NC."
        ],
        "steps": [
          "Open the NC and click Open response; tabs: Corrective action, Activity log, Related records, Attachments.",
          "Read Original finding (read-only) and the raised date.",
          "Review Correction, Root cause and Corrective action.",
          "Open and check the Implementation evidence files.",
          "In More details set Effectiveness review date and Effectiveness review result.",
          "Write Comments for the client.",
          "Click Request revision if incomplete or not effective, or Close after verification."
        ],
        "rules": [
          "Request revision and Close after verification work only on a Submitted response.",
          "A revision returns the NC to In progress and flags the response for rework.",
          "Closing makes the NC Closed and read-only; effectiveness defaults to Effective if not set.",
          "Submitting needs correction, root cause, corrective action, responsible person, target date and one evidence file.",
          "Effectiveness review and comments are written by CAB staff only; the client sees them read-only."
        ],
        "after": [
          "A revision request notifies the client Response due on … with a link to its response page.",
          "Closing adds Closed after verification to the history and feeds the decision gate.",
          "The Your response card shows the last save and who made it."
        ],
        "tips": [
          "Explain the revision reason in Comments; it is kept in the history.",
          "Major NCs must be closed before a grant; a submitted minor response is enough.",
          "View application opens the application register."
        ],
        "fields": [
          [
            "Correction *",
            "What was fixed immediately; up to 1000 characters."
          ],
          [
            "Root cause *",
            "Why the nonconformity happened."
          ],
          [
            "Corrective action *",
            "What prevents recurrence."
          ],
          [
            "Implementation evidence *",
            "At least one file; same file name saves a new version."
          ],
          [
            "Responsible person *",
            "Client owner of the action."
          ],
          [
            "Target date *",
            "When the action is complete."
          ],
          [
            "Effectiveness review date",
            "Set by the CAB only."
          ],
          [
            "Effectiveness review result",
            "Not yet reviewed / Effective / Partially effective / Not effective."
          ],
          [
            "Comments",
            "Reviewer comment; up to 1000 characters."
          ]
        ],
        "statuses": [
          [
            "Open",
            "Client has not started."
          ],
          [
            "In progress",
            "Client draft, or revision requested."
          ],
          [
            "Submitted",
            "Ready for verification."
          ],
          [
            "Closed",
            "Closed after verification."
          ]
        ],
        "sections": [
          {
            "id": "nc-effectiveness",
            "title": "More details and effectiveness review",
            "bullets": [
              "The client enters responsible person and target date; the CAB can adjust them before closing.",
              "Effectiveness review date is when effectiveness is checked; it becomes the verification action's due date.",
              "Results: Not yet reviewed, Effective, Partially effective, Not effective.",
              "Not effective or Partially effective is a good reason to request a revision.",
              "After closure every field is read-only."
            ]
          },
          {
            "id": "nc-activity-log",
            "title": "Activity log",
            "bullets": [
              "Each event shows text, who did it, date and time.",
              "Events include: raised, response submitted, revision requested with reason, closed after verification.",
              "The log can also be opened from the ⋯ menu next to View application."
            ]
          },
          {
            "id": "nc-related-attachments",
            "title": "Related records and attachments",
            "bullets": [
              "Related records: Audit finding (F-…), Audit plan (AUD-…), Application (APP-…).",
              "Attachments lists implementation evidence and lets you upload more.",
              "Each file shows version, upload date, size, download and delete.",
              "Files cannot be uploaded or deleted after the NC is closed."
            ]
          }
        ]
      },
      "ar": {
        "title": "مراجعة الإجراء التصحيحي",
        "summary": "الصفحة التي تراجع فيها جهة المنح رد العميل على حالة عدم المطابقة: التصحيح والسبب الجذري والإجراء التصحيحي وأدلة التنفيذ، ثم مراجعة الفعالية وطلب التعديل أو الإغلاق.",
        "who": "المدقق الرئيسي أو المراجع المكلَّف بالتحقق.",
        "when": "بعد أن يرسل العميل رده (الحالة «تم الإرسال»).",
        "nav": "حالات عدم المطابقة ← الحالة ← فتح الرد",
        "handoff": "عند «طلب تعديل» يرى العميل الحالة «قيد التنفيذ» وتعليقاتك، ويعيد التقديم من «الملاحظات» في بوابته. عند الإغلاق تصبح الحالة مغلقة لديه.",
        "screen": [
          "«السبب الجذري *» مع عدّاد الأحرف (حتى 1000).",
          "«الإجراء التصحيحي *»: ما يمنع تكرار عدم المطابقة.",
          "«أدلة التنفيذ *»: ملفات PDF أو DOCX أو JPG أو PNG حتى 10 ميجابايت.",
          "بطاقة «إجراء المراجع».",
          "«طلب تعديل»: يعيد الرد للعميل.",
          "«الإغلاق بعد التحقق»: يغلق الحالة."
        ],
        "steps": [
          "افتح الحالة واضغط «فتح الرد»؛ التبويبات: الإجراء التصحيحي، سجل النشاط، السجلات المرتبطة، المرفقات.",
          "اقرأ «النتيجة الأصلية (للقراءة فقط)» وتاريخ الإصدار.",
          "راجع «التصحيح» و«السبب الجذري» و«الإجراء التصحيحي».",
          "افتح ملفات «أدلة التنفيذ» وتحقق منها.",
          "في «تفاصيل إضافية» حدّد «تاريخ مراجعة الفعالية» و«نتيجة مراجعة الفعالية».",
          "اكتب «الملاحظات» للعميل.",
          "اضغط «طلب تعديل» إذا كان الرد ناقصًا أو غير فعّال، أو «الإغلاق بعد التحقق»."
        ],
        "rules": [
          "«طلب تعديل» و«الإغلاق بعد التحقق» يعملان فقط على رد بحالة «تم الإرسال».",
          "طلب التعديل يعيد الحالة إلى «قيد التنفيذ» ويُعلَّم الرد بأنه يحتاج تعديلًا.",
          "الإغلاق يجعل الحالة «مغلقة» للقراءة فقط؛ وتُسجَّل الفعالية «فعال» إن لم تُحدَّد.",
          "تقديم الرد يتطلب التصحيح والسبب والإجراء والشخص المسؤول والتاريخ المستهدف ودليلًا واحدًا على الأقل.",
          "مراجعة الفعالية والملاحظات يكتبها موظفو الجهة فقط؛ وتظهر للعميل للقراءة."
        ],
        "after": [
          "طلب التعديل يرسل للعميل إشعار «مطلوب ردكم على …» مع رابط صفحة الرد.",
          "الإغلاق يضيف «Closed after verification» إلى السجل ويغذّي بوابة القرار.",
          "بطاقة «ردك» تعرض آخر حفظ ومن قام به."
        ],
        "tips": [
          "اكتب في «الملاحظات» سبب طلب التعديل بوضوح؛ يُحفظ في السجل.",
          "الحالة الرئيسية تحتاج إغلاقًا قبل المنح؛ الثانوية يكفي تقديم ردها.",
          "زر «عرض الطلب» يفتح سجل الطلبات."
        ],
        "fields": [
          [
            "التصحيح *",
            "ما أُصلح فورًا؛ حتى 1000 حرف."
          ],
          [
            "السبب الجذري *",
            "سبب حدوث عدم المطابقة."
          ],
          [
            "الإجراء التصحيحي *",
            "ما يمنع التكرار."
          ],
          [
            "أدلة التنفيذ *",
            "ملف واحد على الأقل؛ الملف بالاسم نفسه يُحفظ كإصدار جديد."
          ],
          [
            "الشخص المسؤول *",
            "مسؤول التنفيذ لدى العميل."
          ],
          [
            "التاريخ المستهدف *",
            "موعد إتمام الإجراء."
          ],
          [
            "تاريخ مراجعة الفعالية",
            "تحدده الجهة فقط."
          ],
          [
            "نتيجة مراجعة الفعالية",
            "لم تتم المراجعة بعد / فعال / فعال جزئياً / غير فعال."
          ],
          [
            "الملاحظات",
            "تعليق المراجع؛ حتى 1000 حرف."
          ]
        ],
        "statuses": [
          [
            "مفتوحة",
            "لم يبدأ العميل."
          ],
          [
            "قيد التنفيذ",
            "مسودة لدى العميل أو مطلوب تعديل."
          ],
          [
            "تم الإرسال",
            "جاهز للتحقق."
          ],
          [
            "مغلقة",
            "أُغلقت بعد التحقق."
          ]
        ],
        "sections": [
          {
            "id": "nc-effectiveness",
            "title": "تفاصيل إضافية ومراجعة الفعالية",
            "bullets": [
              "الشخص المسؤول والتاريخ المستهدف يُدخلهما العميل ويمكن للجهة تعديلهما قبل الإغلاق.",
              "«تاريخ مراجعة الفعالية» موعد التحقق من فعالية الإجراء؛ ويصبح تاريخ استحقاق إجراء التحقق.",
              "النتائج: لم تتم المراجعة بعد، فعال، فعال جزئياً، غير فعال.",
              "النتيجة «غير فعال» أو «فعال جزئياً» سبب مناسب لطلب تعديل.",
              "بعد الإغلاق تصبح كل الحقول للقراءة فقط."
            ]
          },
          {
            "id": "nc-activity-log",
            "title": "سجل النشاط",
            "bullets": [
              "كل حدث يعرض النص ومن قام به والتاريخ والوقت.",
              "الأحداث تشمل: رفع الحالة، تقديم الرد، طلب التعديل مع السبب، الإغلاق بعد التحقق.",
              "يمكن فتح السجل أيضًا من قائمة (⋯) بجانب «عرض الطلب»."
            ]
          },
          {
            "id": "nc-related-attachments",
            "title": "السجلات المرتبطة والمرفقات",
            "bullets": [
              "السجلات المرتبطة: نتيجة التدقيق (F-…)، خطة التدقيق (AUD-…)، الطلب (APP-…).",
              "تبويب «المرفقات» يعرض أدلة التنفيذ مع رفع ملفات جديدة.",
              "لكل ملف: الإصدار وتاريخ الرفع والحجم وتنزيل وحذف.",
              "لا يمكن رفع أو حذف ملفات بعد إغلاق الحالة."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "decision-queue",
    "audience": "cab",
    "section": "certification",
    "routes": [
      "/cab/decisions"
    ],
    "open": "/cab/decisions",
    "updated": "2026-10-24",
    "capture": {
      "as": "cab",
      "route": "/cab/decisions"
    },
    "text": {
      "en": {
        "title": "Decision queue",
        "summary": "Certification decision files: one per finalized Stage 2 or recertification report, with client, scheme, review status, decision maker and due date.",
        "who": "Certification manager, technical reviewers and authorized decision makers.",
        "when": "After a Stage 2 or recertification report is finalized and handed to technical review.",
        "nav": "Sidebar → Decisions",
        "handoff": "The client does not see decision files. It sees the outcome only when the certificate is issued, under Certificates in the portal.",
        "screen": [
          "Search by file, application or client.",
          "Received period: date range the file was received.",
          "Export the listed files.",
          "File: decision file number (e.g. DEC-0143).",
          "Review status of each file.",
          "Decision maker assigned to the file."
        ],
        "steps": [
          "Open Decisions from the sidebar.",
          "Filter by search, Received period, Country and Status, then click Search.",
          "Click a row to see its summary in the Selected decision panel.",
          "Click Open decision to open the file."
        ],
        "rules": [
          "A decision file opens automatically only after Stage 2 and recertification reports.",
          "The decision is due 30 days after the file is handed over.",
          "Each CAB sees only its own files."
        ],
        "after": [
          "The Decisions Pending card on the dashboard reads this queue.",
          "A ready file appears in the work queue as Certification decision."
        ],
        "tips": [
          "Start with Ready for decision files closest to their due date."
        ],
        "fields": [
          [
            "Search",
            "File, application, client name or client ID."
          ],
          [
            "Received period",
            "Defaults to the last 12 months."
          ],
          [
            "Country",
            "Saudi Arabia, United Arab Emirates, Egypt."
          ],
          [
            "Status",
            "Awaiting technical review, Ready for decision, Granted, Refused."
          ]
        ],
        "statuses": [
          [
            "Awaiting technical review",
            "The independent technical review is not complete."
          ],
          [
            "Ready for decision",
            "Technical review done; waiting for the decision maker."
          ],
          [
            "Granted",
            "Grant recorded; certificate draft prepared."
          ],
          [
            "Refused",
            "Refusal recorded."
          ],
          [
            "Deferred",
            "Deferral recorded."
          ]
        ],
        "sections": [
          {
            "id": "decision-selected",
            "title": "Selected decision panel",
            "bullets": [
              "The panel shows client and ID, scheme, country, status, received, due and decision maker.",
              "Close it with × to return to the full list."
            ]
          }
        ]
      },
      "ar": {
        "title": "قائمة القرارات",
        "summary": "قائمة ملفات قرار منح الشهادة: ملف لكل تقرير مرحلة ثانية أو إعادة منح بعد إنهائه، مع العميل والمخطط وحالة المراجعة ومتخذ القرار وتاريخ الاستحقاق.",
        "who": "مدير منح الشهادات، المراجعون الفنيون، ومتخذو القرار المفوَّضون.",
        "when": "بعد إنهاء تقرير المرحلة الثانية أو إعادة المنح وتسليمه للمراجعة الفنية.",
        "nav": "القائمة الجانبية ← القرارات",
        "handoff": "لا يرى العميل ملف القرار. يرى النتيجة فقط عند إصدار الشهادة في «الشهادات» ببوابته.",
        "screen": [
          "مربع «بحث» برقم الملف أو الطلب أو العميل.",
          "«فترة الاستلام»: نطاق تاريخ استلام الملف.",
          "«تصدير» للقائمة المعروضة.",
          "«الملف»: رقم ملف القرار (مثل DEC-0143).",
          "«حالة المراجعة» لكل ملف.",
          "«متخذ القرار» المعيَّن للملف."
        ],
        "steps": [
          "افتح «القرارات» من القائمة الجانبية.",
          "صفِّ القائمة بالبحث و«فترة الاستلام» و«الدولة» و«حالة المراجعة» ثم اضغط «بحث».",
          "اضغط أي صف لعرض ملخصه في لوحة «القرار المحدد».",
          "اضغط «فتح القرار» لفتح ملف القرار."
        ],
        "rules": [
          "يُفتح ملف القرار تلقائيًا فقط بعد تقارير المرحلة الثانية وإعادة المنح.",
          "تاريخ استحقاق القرار 30 يومًا من تسليم الملف.",
          "كل جهة ترى ملفاتها فقط."
        ],
        "after": [
          "مؤشر «قرارات قيد الانتظار» في لوحة التحكم يقرأ هذه القائمة.",
          "الملف الجاهز يظهر في قائمة المهام بعنوان «قرار منح الشهادة»."
        ],
        "tips": [
          "ابدأ بالملفات «جاهز لاتخاذ القرار» الأقرب استحقاقًا."
        ],
        "fields": [
          [
            "بحث",
            "رقم الملف أو رقم الطلب أو اسم العميل أو رقمه."
          ],
          [
            "فترة الاستلام",
            "افتراضيًا آخر 12 شهرًا."
          ],
          [
            "الدولة",
            "المملكة العربية السعودية، الإمارات العربية المتحدة، مصر."
          ],
          [
            "حالة المراجعة",
            "بانتظار المراجعة الفنية، جاهز لاتخاذ القرار، تم المنح، مرفوض."
          ]
        ],
        "statuses": [
          [
            "بانتظار المراجعة الفنية",
            "لم تكتمل المراجعة الفنية المستقلة بعد."
          ],
          [
            "جاهز لاتخاذ القرار",
            "اكتملت المراجعة الفنية؛ ينتظر متخذ القرار."
          ],
          [
            "تم المنح",
            "سُجّل قرار المنح وأُعدّت مسودة الشهادة."
          ],
          [
            "مرفوض",
            "سُجّل قرار الرفض."
          ],
          [
            "مؤجَّل",
            "سُجّل قرار التأجيل."
          ]
        ],
        "sections": [
          {
            "id": "decision-selected",
            "title": "لوحة الملف المحدد",
            "bullets": [
              "تعرض اللوحة: العميل ورقمه، المخطط، الدولة، حالة المراجعة، تاريخ الاستلام، تاريخ الاستحقاق، متخذ القرار.",
              "أغلق اللوحة بزر (×) للعودة إلى القائمة كاملة."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "decision-details",
    "audience": "cab",
    "section": "certification",
    "routes": [
      "/cab/decisions/:decisionId"
    ],
    "open": "/cab/decisions",
    "updated": "2026-10-24",
    "capture": {
      "as": "cab",
      "route": "/cab/decisions/dec-0143"
    },
    "text": {
      "en": {
        "title": "Certification decision file",
        "summary": "One decision file: readiness gates, the decision record (outcome, date, confirmed scope, rationale), the decision maker and independence, evidence, findings, activity and the technical recommendation.",
        "who": "An authorized decision maker independent of the audit team, and an independent technical reviewer.",
        "when": "After the technical review is complete and nonconformities are closed or accepted.",
        "nav": "Decisions → row → Open decision",
        "handoff": "The client is not notified when the decision is recorded. On a grant, it sees the certificate under Certificates in the portal once issued, with a Certificate … issued notification.",
        "screen": [
          "Queue returns to the decision queue.",
          "Record decision at the top of the page.",
          "Readiness to record card with its seven gates.",
          "Blocking gates: what currently prevents recording.",
          "Outcome: Grant, Defer or Refuse.",
          "Decision maker card in the side column."
        ],
        "steps": [
          "Open the file from the decision queue.",
          "Check Readiness to record and the blocking gates.",
          "Pick the Decision maker in the side card.",
          "Choose the Outcome and the Decision date.",
          "Check Confirmed scope and write the Rationale.",
          "Click Save draft for partial work, or Record decision once every gate passes."
        ],
        "rules": [
          "A certification decision is separate from application acceptance; nothing is granted automatically on payment.",
          "Recording needs: technical review complete, report finalized, outcome, rationale, date and confirmed scope.",
          "To grant: critical and major NCs must be closed after verification.",
          "To grant: every minor NC needs an accepted corrective action plan (submitted response) or closure.",
          "The decision maker must be authorized and independent of the audit team.",
          "A recorded decision is immutable; changes only through a controlled correction version."
        ],
        "after": [
          "Grant: a certificate draft is prepared and the CAB is notified File … ready for decision, linking to Certificates.",
          "Defer or Refuse: any draft certificate of the file is withdrawn.",
          "Activity logs Decision recorded under the decision maker's name."
        ],
        "tips": [
          "Save draft never checks the gates; use it while collecting information.",
          "Read the Technical recommendation at the bottom of the side column; it is not a decision."
        ],
        "fields": [
          [
            "Outcome",
            "Grant / Defer / Refuse."
          ],
          [
            "Decision date",
            "Required to record."
          ],
          [
            "Confirmed scope",
            "Scope printed on the certificate; pre-filled from the proposed scope."
          ],
          [
            "Rationale",
            "Reasons; required to record."
          ],
          [
            "Decision maker",
            "Authorized and independent of the audit team."
          ]
        ],
        "statuses": [
          [
            "Awaiting technical review",
            "Mark the technical review complete first."
          ],
          [
            "Ready for decision",
            "Can be recorded once the gates pass."
          ],
          [
            "Recorded · vN",
            "Decision recorded and locked at version N."
          ]
        ],
        "sections": [
          {
            "id": "decision-gates",
            "title": "Readiness gates",
            "bullets": [
              "Gates: technical review, findings closed or accepted, maker authorized, maker independent, confirmed scope, rationale, decision date.",
              "Passed gates show a green tick; missing ones show ✕.",
              "Gates update instantly as you fill the form.",
              "When all pass, the badge changes from Incomplete to All gates passed.",
              "The server re-checks every gate when recording; it does not trust the screen."
            ]
          },
          {
            "id": "decision-record-form",
            "title": "Decision record and the three outcomes",
            "bullets": [
              "Grant: certification granted; a certificate draft appears in the certificate register.",
              "Defer: decision postponed, e.g. pending more evidence.",
              "Refuse: certification not granted.",
              "Choosing Grant shows: Certificates become available only after this grant is recorded.",
              "The v1 · draft badge shows version and record state.",
              "Recording with an open gate shows a red message with the blockers.",
              "Once recorded the card becomes Recorded decision (immutable), read-only."
            ]
          },
          {
            "id": "decision-maker",
            "title": "Decision maker and the independence rule",
            "bullets": [
              "The list shows CAB people; authorized ones carry Authorized decision maker.",
              "Audit team members show (Part of audit team).",
              "Picking a non-independent person fails the independence gate and blocks recording.",
              "Below the list: ✓ Authorized decision maker · ✓ Independent from audit.",
              "The technical reviewer must not be on the audit team either.",
              "Authorization is verified separately from auditor roles."
            ]
          },
          {
            "id": "decision-tabs",
            "title": "Evidence, findings and activity",
            "bullets": [
              "Evidence: audit report, technical review report, findings register, corrective action responses; each with type, version, date and state.",
              "Findings: nonconformities with requirement, classification and status (Open, Accepted or Closed).",
              "A minor NC with a submitted response counts as Accepted for the decision.",
              "Activity: event log, e.g. audit completed, report finalized, technical review completed, decision recorded."
            ]
          },
          {
            "id": "technical-review",
            "title": "Technical review (file awaiting review)",
            "bullets": [
              "The button shows only while the status is Awaiting technical review.",
              "The server refuses it while the report is being revised and not finalized.",
              "The technical reviewer must not be on the audit team, or the action is refused.",
              "Afterwards the status becomes Ready for decision and the event is logged under the reviewer.",
              "The example DEC-0142 also has unresolved findings that block recording."
            ]
          },
          {
            "id": "decision-correction",
            "title": "Recorded decision and correction versions",
            "bullets": [
              "A recorded decision shows Recorded · vN and the immutable decision card.",
              "A correction opens the next version (v2, v3…) and returns the file to Ready for decision or Awaiting technical review.",
              "Every correction is logged in Activity, so the full decision history is kept.",
              "Correction is refused while a certificate issued under it is Issued or Suspended; withdraw it first.",
              "The audit report cannot be reopened after recording until a correction is opened."
            ]
          }
        ]
      },
      "ar": {
        "title": "ملف قرار منح الشهادة",
        "summary": "ملف قرار واحد: بوابات الجاهزية، وسجل القرار (النتيجة والتاريخ والنطاق المؤكد والمبررات)، ومتخذ القرار واستقلاليته، والأدلة والنتائج والنشاط، والتوصية الفنية.",
        "who": "متخذ القرار المفوَّض المستقل عن فريق التدقيق، والمراجع الفني المستقل.",
        "when": "بعد اكتمال المراجعة الفنية وإغلاق حالات عدم المطابقة أو قبولها.",
        "nav": "القرارات ← صف الملف ← فتح القرار",
        "handoff": "لا يُشعَر العميل بتسجيل القرار مباشرة. عند المنح يرى الشهادة بعد إصدارها في «الشهادات» ببوابته مع إشعار «صدرت الشهادة».",
        "screen": [
          "«القائمة» للعودة إلى قائمة القرارات.",
          "«تسجيل القرار» في أعلى الصفحة.",
          "بطاقة «الجاهزية للتسجيل» وبواباتها السبع.",
          "«البوابات المانعة للتسجيل»: أسباب المنع الحالية.",
          "«نتيجة القرار»: Grant أو Defer أو Refuse.",
          "بطاقة «متخذ القرار» في العمود الجانبي."
        ],
        "steps": [
          "افتح الملف من قائمة القرارات.",
          "تحقق من بطاقة «الجاهزية للتسجيل» وأسباب المنع.",
          "اختر «متخذ القرار» من البطاقة الجانبية.",
          "اختر «نتيجة القرار» وأدخل «تاريخ القرار».",
          "راجع «النطاق المؤكد» واكتب «المبررات».",
          "اضغط «حفظ كمسودة» للحفظ الجزئي، أو «تسجيل القرار» عند اجتياز كل البوابات."
        ],
        "rules": [
          "قرار المنح منفصل عن قبول الطلب، ولا يتم أي منح تلقائي بناءً على السداد.",
          "التسجيل يتطلب: اكتمال المراجعة الفنية، وتقريرًا مُنهى، ونتيجة، ومبررات، وتاريخًا، ونطاقًا مؤكدًا.",
          "للمنح: الحالات الحرجة والرئيسية يجب إغلاقها بعد التحقق.",
          "للمنح: كل حالة ثانوية تحتاج خطة إجراء تصحيحي مقبولة (رد مُقدَّم) أو إغلاقًا.",
          "متخذ القرار يجب أن يكون مفوَّضًا ومستقلًا عن فريق التدقيق.",
          "القرار المسجَّل غير قابل للتعديل؛ التغيير فقط عبر نسخة تصحيح مضبوطة."
        ],
        "after": [
          "Grant: تُنشأ مسودة الشهادة ويصل لجهة المنح إشعار «الملف … جاهز للقرار» برابط الشهادات.",
          "Defer أو Refuse: تُسحب أي مسودة شهادة مرتبطة بالملف.",
          "يُسجَّل في «النشاط» حدث «Decision recorded» باسم متخذ القرار."
        ],
        "tips": [
          "«حفظ كمسودة» لا يتحقق من البوابات؛ استخدمه أثناء جمع المعلومات.",
          "اقرأ «التوصية الفنية» أسفل العمود الجانبي قبل القرار؛ التوصية ليست قرارًا."
        ],
        "fields": [
          [
            "نتيجة القرار",
            "Grant (منح) / Defer (تأجيل) / Refuse (رفض)؛ تظهر الخيارات بالإنجليزية."
          ],
          [
            "تاريخ القرار",
            "تاريخ اتخاذ القرار؛ إلزامي للتسجيل."
          ],
          [
            "النطاق المؤكد",
            "النطاق الذي سيظهر على الشهادة؛ يُملأ من النطاق المقترح."
          ],
          [
            "المبررات",
            "شرح القرار؛ إلزامي للتسجيل."
          ],
          [
            "متخذ القرار",
            "شخص مفوَّض ومستقل عن فريق التدقيق."
          ]
        ],
        "statuses": [
          [
            "بانتظار المراجعة الفنية",
            "يلزم اعتماد اكتمال المراجعة الفنية أولًا."
          ],
          [
            "جاهز لاتخاذ القرار",
            "يمكن تسجيل القرار عند اجتياز البوابات."
          ],
          [
            "Recorded · vN",
            "قرار مسجَّل ومقفل في الإصدار N."
          ]
        ],
        "sections": [
          {
            "id": "decision-gates",
            "title": "بوابات الجاهزية للتسجيل",
            "bullets": [
              "البوابات: اكتمال المراجعة الفنية، إغلاق النتائج أو قبولها، تفويض متخذ القرار، استقلاليته، النطاق المؤكد، المبررات، تاريخ القرار.",
              "البوابة المجتازة بعلامة خضراء، والناقصة بعلامة (✕).",
              "تتحدث البوابات فورًا عند تعديل النموذج.",
              "عند اجتياز الكل تظهر شارة «All gates passed» بدل «غير مكتمل».",
              "الخادم يعيد التحقق من كل البوابات عند التسجيل ولا يثق بالواجهة."
            ]
          },
          {
            "id": "decision-record-form",
            "title": "سجل القرار والنتائج الثلاث",
            "bullets": [
              "Grant (منح): تُمنح الشهادة وتُنشأ مسودتها في سجل الشهادات.",
              "Defer (تأجيل): يُؤجَّل القرار، مثلًا بانتظار أدلة إضافية.",
              "Refuse (رفض): لا تُمنح الشهادة.",
              "عند اختيار Grant تظهر ملاحظة: الشهادات تتاح فقط بعد تسجيل هذا المنح.",
              "شارة «v1 · مسودة» تبين رقم الإصدار وحالة السجل.",
              "التسجيل مع بوابة ناقصة يعرض رسالة حمراء بأسباب المنع.",
              "بعد التسجيل يتحول السجل إلى «Recorded decision (immutable)» للقراءة فقط."
            ]
          },
          {
            "id": "decision-maker",
            "title": "متخذ القرار وقاعدة الاستقلالية",
            "bullets": [
              "القائمة تعرض أشخاص الجهة؛ المفوَّض يظهر بجانبه «متخذ قرار مفوَّض».",
              "عضو فريق التدقيق يظهر بعبارة «ضمن فريق التدقيق (غير مستقل)».",
              "اختيار شخص غير مستقل يُفشل بوابة الاستقلالية ويمنع التسجيل.",
              "تحت القائمة تظهر علامتا «متخذ قرار مفوَّض» و«مستقل عن فريق التدقيق».",
              "المراجع الفني أيضًا يجب ألا يكون من فريق التدقيق.",
              "التفويض يُتحقق منه بمعزل عن أدوار المدققين."
            ]
          },
          {
            "id": "decision-tabs",
            "title": "الأدلة والنتائج والنشاط",
            "bullets": [
              "الأدلة: تقرير التدقيق، تقرير المراجعة الفنية، سجل النتائج، ردود الإجراءات التصحيحية؛ لكل منها نوع وإصدار وتاريخ وحالة.",
              "النتائج: حالات عدم المطابقة بالمتطلب والتصنيف والحالة (Open أو Accepted أو Closed).",
              "الحالة الثانوية بردٍّ مُقدَّم تُعدّ Accepted لأغراض القرار.",
              "النشاط: سجل الأحداث، مثل اكتمال التدقيق وإنهاء التقرير واكتمال المراجعة الفنية وتسجيل القرار."
            ]
          },
          {
            "id": "technical-review",
            "title": "المراجعة الفنية (ملف بانتظار المراجعة)",
            "bullets": [
              "يظهر الزر فقط عندما تكون الحالة «بانتظار المراجعة الفنية».",
              "يرفض الخادم الاعتماد إذا كان التقرير قيد التعديل وغير مُنهى.",
              "يجب ألا يكون المراجع الفني من فريق التدقيق، وإلا يُرفض الإجراء.",
              "بعد الاعتماد تصبح الحالة «جاهز لاتخاذ القرار» ويُسجَّل الحدث باسم المراجع.",
              "المثال DEC-0142 فيه أيضًا نتائج غير محسومة تمنع التسجيل."
            ]
          },
          {
            "id": "decision-correction",
            "title": "القرار المسجَّل ونسخ التصحيح",
            "bullets": [
              "القرار المسجَّل يعرض شارة «Recorded · vN» وبطاقة القرار غير القابل للتعديل.",
              "التصحيح يفتح الإصدار التالي (v2، v3…) ويعيد الملف «جاهز لاتخاذ القرار» أو «بانتظار المراجعة الفنية».",
              "كل نسخة تصحيح تُسجَّل في النشاط فيبقى تاريخ القرار كاملًا.",
              "يُرفض التصحيح إذا صدرت شهادة بموجب القرار وما زالت صادرة أو معلّقة؛ اسحبها أولًا.",
              "لا يمكن إعادة فتح تقرير التدقيق بعد تسجيل القرار إلا بعد فتح نسخة تصحيح."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "certificate-register",
    "audience": "cab",
    "section": "certification",
    "routes": [
      "/cab/certificates"
    ],
    "open": "/cab/certificates",
    "statusDomain": "certificate",
    "statusValues": [
      "DRAFT",
      "ISSUED",
      "SUSPENDED",
      "WITHDRAWN"
    ],
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/certificates"
    },
    "text": {
      "en": {
        "title": "Certificate register",
        "summary": "Every certificate the CAB has prepared or issued: number, client, standard, scope, valid until and status, with prepare, issue, suspend and withdraw actions.",
        "who": "Certification manager and certificate issuing staff.",
        "when": "After a grant is recorded, and throughout the certificate's validity.",
        "nav": "Sidebar → Workspace → Certificate register",
        "handoff": "The client sees issued, suspended and withdrawn certificates under Certificates in the portal with their current status.",
        "screen": [
          "Prepare certificate opens the first draft certificate.",
          "Search by certificate number, client name or client ID.",
          "Issue period, with Country and Status filters.",
          "Number: certificate number (e.g. CAS-QMS-2026-0143).",
          "Status: Draft, Issued, Suspended, Withdrawn.",
          "Row actions (⋮) for each certificate."
        ],
        "steps": [
          "Open Certificate register.",
          "Filter by search, period, country and status; Clear filters resets.",
          "For a draft: ⋮ → Issue or Edit draft.",
          "For an issued certificate: ⋮ → Suspend, Withdraw or View.",
          "Use Export to download the register as Excel or PDF."
        ],
        "rules": [
          "Draft: Prepare certificate, View, Edit draft, Issue.",
          "Issued: View, Reissue, Extend validity, Suspend, Withdraw, History.",
          "Suspended: View, Reinstate, Extend validity, Withdraw, History.",
          "Withdrawn and superseded: View and History only.",
          "Only issued certificates can be suspended; issued or suspended ones can be withdrawn.",
          "A suspended certificate is reinstated with Reinstate and a reason; the client is notified."
        ],
        "after": [
          "Suspending or withdrawing changes the certification cycle status, which reads the certificate live.",
          "The Certificates to Issue card counts drafts."
        ],
        "tips": [
          "Import from Excel registers certificates issued before iCASCO with their numbers, dates and status; they count towards your plan limit.",
          "Write a precise reason when suspending or withdrawing; it stays on the record."
        ],
        "fields": [
          [
            "Search certificate or client",
            "Certificate number, client name or client ID."
          ],
          [
            "Issue period",
            "Issue date range."
          ],
          [
            "Country / Status",
            "All countries / All statuses, or one value."
          ]
        ],
        "statuses": [
          [
            "Draft",
            "Prepared after a grant; not issued."
          ],
          [
            "Issued",
            "Valid and visible to the client."
          ],
          [
            "Suspended",
            "Temporarily not valid; reason kept."
          ],
          [
            "Withdrawn",
            "Permanently not valid; reason kept."
          ]
        ],
        "sections": [
          {
            "id": "cert-row-actions",
            "title": "Actions on an issued certificate: reissue, extend and history",
            "bullets": [
              "View and Prepare certificate open the preparation page; an issued certificate is read-only.",
              "Reissue issues a new version with the next revision number (you can adjust the scope); the current version becomes Superseded and the client is notified. Extend validity moves the expiry date by up to six months, with a reason.",
              "Suspend and Withdraw open a confirmation dialog that asks for a reason.",
              "A draft certificate shows Edit draft and Issue instead."
            ]
          },
          {
            "id": "cert-suspend-withdraw",
            "title": "Suspend or withdraw with a reason",
            "bullets": [
              "Suspend: The certificate is not valid while suspended. The reason is kept on the certificate record.",
              "Withdraw: The certificate stops being valid permanently. The reason is kept on the certificate record.",
              "The action cannot run without a reason.",
              "After confirming, the register updates and the certification cycle reflects the new status.",
              "Cancel closes the dialog with no change."
            ]
          }
        ]
      },
      "ar": {
        "title": "سجل الشهادات",
        "summary": "سجل كل الشهادات التي أعدّتها الجهة أو أصدرتها: الرقم والعميل والمعيار والنطاق وتاريخ الصلاحية والحالة، مع إجراءات التجهيز والإصدار والتعليق والسحب.",
        "who": "مدير منح الشهادات وموظفو إصدار الشهادات.",
        "when": "بعد تسجيل قرار المنح، وطوال صلاحية الشهادة.",
        "nav": "القائمة الجانبية ← مساحة العمل ← سجل الشهادات",
        "handoff": "يرى العميل الشهادات الصادرة والمعلّقة والمسحوبة في «الشهادات» ببوابته بحالتها الحالية.",
        "screen": [
          "«تجهيز شهادة» يفتح أول شهادة بحالة مسودة.",
          "البحث برقم الشهادة أو اسم العميل أو رمزه.",
          "«فترة الإصدار» مع فلتري «الدولة» و«الحالة».",
          "«الرقم»: رقم الشهادة (مثل CAS-QMS-2026-0143).",
          "«الحالة»: مسودة، صادرة، معلّقة، مسحوبة.",
          "زر الإجراءات (⋮) لكل شهادة."
        ],
        "steps": [
          "افتح «سجل الشهادات».",
          "صفِّ القائمة بالبحث والفترة والدولة والحالة؛ «مسح الفلاتر» لإعادة الضبط.",
          "للشهادة المسودة: افتح (⋮) ثم «إصدار» أو «تعديل المسودة».",
          "للشهادة الصادرة: (⋮) ثم «تعليق» أو «سحب» أو «عرض».",
          "استخدم «تصدير» لتنزيل السجل بصيغة Excel أو PDF."
        ],
        "rules": [
          "مسودة: تجهيز شهادة، عرض، تعديل المسودة، إصدار.",
          "صادرة: عرض، إعادة إصدار، تمديد الصلاحية، تعليق، سحب، السجل.",
          "معلّقة: عرض، إعادة تفعيل، تمديد الصلاحية، سحب، السجل.",
          "مسحوبة ومستبدلة: عرض والسجل فقط.",
          "التعليق للصادرة فقط؛ والسحب للصادرة أو المعلّقة.",
          "تُعاد الشهادة المعلّقة إلى السريان بـ«إعادة تفعيل» مع ذكر السبب، ويُشعَر العميل."
        ],
        "after": [
          "التعليق أو السحب يغيّر حالة دورة الشهادة تلقائيًا لأنها تقرأ حالة الشهادة مباشرة.",
          "مؤشر «شهادات بانتظار الإصدار» يعدّ المسودات."
        ],
        "tips": [
          "يسجل الاستيراد من Excel الشهادات الصادرة قبل iCASCO بأرقامها وتواريخها وحالتها، وتُحتسب ضمن حد الباقة.",
          "اكتب سبب التعليق أو السحب بدقة؛ يُحفظ في سجل الشهادة."
        ],
        "fields": [
          [
            "بحث عن شهادة أو عميل",
            "رقم الشهادة أو اسم العميل أو رمزه."
          ],
          [
            "فترة الإصدار",
            "نطاق تاريخ الإصدار."
          ],
          [
            "الدولة / الحالة",
            "كل الدول / كل الحالات أو قيمة محددة."
          ]
        ],
        "statuses": [
          [
            "مسودة",
            "أُعدّت بعد قرار المنح ولم تُصدر."
          ],
          [
            "صادرة",
            "سارية ومرئية للعميل."
          ],
          [
            "معلّقة",
            "غير سارية مؤقتًا؛ يُحفظ السبب."
          ],
          [
            "مسحوبة",
            "فقدت سريانها نهائيًا؛ يُحفظ السبب."
          ]
        ],
        "sections": [
          {
            "id": "cert-row-actions",
            "title": "إجراءات الشهادة الصادرة: إعادة الإصدار والتمديد والسجل",
            "bullets": [
              "«عرض» و«تجهيز شهادة» يفتحان صفحة تجهيز الشهادة؛ الصادرة تُعرض للقراءة فقط.",
              "«إعادة إصدار» تُصدر نسخة جديدة برقم المراجعة التالي (ويمكن تعديل النطاق)، وتصبح النسخة الحالية «مستبدلة» ويُشعَر العميل. و«تمديد الصلاحية» يؤخّر تاريخ الانتهاء حتى ستة أشهر مع ذكر السبب.",
              "«تعليق» و«سحب» يفتحان نافذة تأكيد تطلب السبب.",
              "الشهادة المسودة تعرض «تعديل المسودة» و«إصدار» بدلًا من ذلك."
            ]
          },
          {
            "id": "cert-suspend-withdraw",
            "title": "نافذة التعليق أو السحب مع السبب",
            "bullets": [
              "التعليق: «لا تكون الشهادة سارية أثناء التعليق. يُحفظ السبب في سجل الشهادة.»",
              "السحب: «تفقد الشهادة سريانها نهائياً. يُحفظ السبب في سجل الشهادة.»",
              "لا يُنفَّذ الإجراء دون كتابة السبب.",
              "بعد التأكيد تتحدث الحالة في السجل فورًا، وتعكس دورة الشهادة الحالة الجديدة.",
              "«إلغاء» يغلق النافذة دون تغيير."
            ]
          }
        ]
      }
    },
    "related": [
      "certificate-lifecycle",
      "prepare-certificate",
      "manage-certification-cycle"
    ]
  },
  {
    "id": "prepare-certificate",
    "audience": "cab",
    "section": "certification",
    "routes": [
      "/cab/certificates/:certificateId/prepare"
    ],
    "open": "/cab/certificates",
    "updated": "2026-10-24",
    "capture": {
      "as": "cab",
      "route": "/cab/certificates/143/prepare"
    },
    "text": {
      "en": {
        "title": "Prepare and issue the certificate",
        "summary": "Prepare a draft certificate from the grant decision: application, client, decision, scope and sites, then dates, template, signatory, marks and QR code, with a live preview and the Issue button.",
        "who": "Certification manager or the staff member who issues certificates.",
        "when": "After a grant is recorded; the certificate appears as Draft in the register.",
        "nav": "Certificate register → ⋮ → Issue, or the Prepare certificate button",
        "handoff": "Once issued the client sees the active certificate under Certificates in the portal and can download it, with a Certificate issued notification.",
        "screen": [
          "Preview opens the certificate in a larger window.",
          "Issue certificate is enabled only when the data is complete.",
          "Authorized decision: decision number, date and outcome.",
          "Scope (approved) as it will print.",
          "Included sites on the certificate.",
          "Live Certificate preview, updated on every change."
        ],
        "steps": [
          "Open the draft certificate.",
          "Check Application and client, and Authorized decision (Decision: Granted).",
          "Review Scope (approved) and Included sites.",
          "Set Issue date, Effective date and Expiry date.",
          "Choose the Certificate template, then open More details.",
          "Set Certificate language, Authorized signatory, Applicable marks and Include QR code.",
          "Check the preview and click Issue certificate."
        ],
        "rules": [
          "Only drafts can be issued; otherwise This certificate can't be issued shows.",
          "The decision must be recorded as Grant before issuing.",
          "Expiry after effective; effective not before issue.",
          "Template, signatory and marks must belong to your CAB.",
          "After issuing every field is read-only."
        ],
        "after": [
          "A Certificate issued notice shows, with Back to certificate register.",
          "A new certification cycle opens (initial) or the next one (recertification).",
          "The client is notified Certificate … issued, linking to Certificates."
        ],
        "tips": [
          "The preview uses the certificate language, not the screen language.",
          "If issuing fails your changes stay; try again."
        ],
        "fields": [
          [
            "Certificate number",
            "Generated; read-only."
          ],
          [
            "Issue date / Effective date",
            "Effective not before issue."
          ],
          [
            "Expiry date",
            "Defaults to three years from effective, minus a day; must be after effective."
          ],
          [
            "Certificate template",
            "A CAB template; required."
          ],
          [
            "Certificate language",
            "English or Arabic; sets the certificate text language."
          ],
          [
            "Authorized signatory",
            "Required; name and title print."
          ],
          [
            "Applicable marks",
            "From the CAB's marks via Configure authorized marks."
          ],
          [
            "Verification QR code",
            "Include QR code links to online verification."
          ]
        ],
        "statuses": [
          [
            "Draft",
            "Editable and issuable."
          ],
          [
            "Issued",
            "Frozen, read-only."
          ]
        ],
        "sections": [
          {
            "id": "cert-details-fields",
            "title": "Certificate details and dates",
            "bullets": [
              "Changing Effective date recalculates Expiry date unless you edited it yourself.",
              "Default validity is three years (ISO/IEC 17021-1 cycle).",
              "An expiry not after effective shows Expiry date must be after the effective date. and blocks issuing.",
              "The preview shows 1st and 2nd surveillance due one and two years in, minus a day."
            ]
          },
          {
            "id": "cert-more-details",
            "title": "Language, signatory, marks and QR code",
            "bullets": [
              "Language sets the certificate text in the preview and file.",
              "The signatory is required; without one, Issue is disabled.",
              "The marks dialog lists only the CAB's authorized marks, with Apply.",
              "The QR code lets anyone verify the certificate online."
            ]
          },
          {
            "id": "cert-live-preview",
            "title": "Live preview",
            "bullets": [
              "Shows client name and address, standard, scope, number, initial certification date, validity and both surveillance dates.",
              "Also shows signatory, marks, accreditation body and issuer details.",
              "Updates as soon as any field changes.",
              "The Preview button at the top opens it larger."
            ]
          }
        ]
      },
      "ar": {
        "title": "تجهيز الشهادة وإصدارها",
        "summary": "صفحة تجهيز شهادة مسودة بناءً على قرار المنح: بيانات الطلب والعميل والقرار والنطاق والمواقع، ثم تفاصيل الشهادة والتواريخ والقالب والموقّع والعلامات ورمز QR، مع معاينة حية وزر الإصدار.",
        "who": "مدير منح الشهادات أو الموظف المسؤول عن الإصدار.",
        "when": "بعد تسجيل قرار منح؛ تظهر الشهادة مسودة في السجل.",
        "nav": "سجل الشهادات ← (⋮) ← إصدار، أو زر «تجهيز شهادة»",
        "handoff": "بعد الإصدار يرى العميل الشهادة سارية في «الشهادات» ببوابته ويمكنه تنزيلها، مع إشعار «صدرت الشهادة».",
        "screen": [
          "«معاينة» تفتح الشهادة في نافذة مكبرة.",
          "«إصدار الشهادة» يُفعَّل فقط عند اكتمال البيانات.",
          "قسم «القرار المعتمد»: رقم القرار وتاريخه والقرار.",
          "«النطاق (المعتمد)» كما سيُطبع.",
          "«المواقع المشمولة» بالشهادة.",
          "«معاينة الشهادة» الحية تتحدث مع كل تغيير."
        ],
        "steps": [
          "افتح الشهادة المسودة.",
          "تحقق من «الطلب والعميل» و«القرار المعتمد» (القرار: ممنوحة).",
          "راجع «النطاق (المعتمد)» و«المواقع المشمولة».",
          "اضبط «تاريخ الإصدار» و«تاريخ السريان» و«تاريخ الانتهاء».",
          "اختر «قالب الشهادة»، ثم افتح «المزيد من التفاصيل».",
          "اختر «لغة الشهادة» و«الموقّع المعتمد» و«العلامات المطبقة» و«تضمين رمز QR».",
          "راجع المعاينة ثم اضغط «إصدار الشهادة»."
        ],
        "rules": [
          "يُصدَر فقط ما هو مسودة؛ غير ذلك تظهر رسالة «لا يمكن إصدار هذه الشهادة».",
          "يجب أن يكون قرار المنح مسجَّلًا (Grant) قبل الإصدار.",
          "تاريخ الانتهاء بعد السريان، والسريان لا يسبق الإصدار.",
          "القالب والموقّع والعلامات يجب أن تكون من إعدادات الجهة نفسها.",
          "بعد الإصدار تصبح كل الحقول للقراءة فقط."
        ],
        "after": [
          "يظهر تنبيه «تم إصدار الشهادة» مع رابط العودة إلى السجل.",
          "تُفتح دورة شهادة جديدة (المنح الأولي) أو الدورة التالية (إعادة المنح).",
          "يصل العميل إشعار «صدرت الشهادة …» برابط «الشهادات»."
        ],
        "tips": [
          "المعاينة تُعرض بلغة الشهادة لا بلغة الواجهة.",
          "عند فشل الإصدار تبقى تعديلاتك؛ أعد المحاولة."
        ],
        "fields": [
          [
            "رقم الشهادة",
            "يُولَّد تلقائيًا؛ للقراءة فقط."
          ],
          [
            "تاريخ الإصدار / تاريخ السريان",
            "السريان لا يسبق الإصدار."
          ],
          [
            "تاريخ الانتهاء",
            "يُقترح ثلاث سنوات من السريان ناقص يوم؛ يجب أن يكون بعد السريان."
          ],
          [
            "قالب الشهادة",
            "قالب معتمد للجهة؛ إلزامي."
          ],
          [
            "لغة الشهادة",
            "الإنجليزية أو العربية؛ تحدد لغة نص الشهادة."
          ],
          [
            "الموقّع المعتمد",
            "إلزامي؛ يظهر اسمه ومنصبه."
          ],
          [
            "العلامات المطبقة",
            "من العلامات المهيأة للجهة عبر «تهيئة العلامات المعتمدة»."
          ],
          [
            "رمز QR للتحقق",
            "«تضمين رمز QR» يربط بصفحة التحقق الإلكتروني."
          ]
        ],
        "statuses": [
          [
            "مسودة",
            "قابلة للتعديل والإصدار."
          ],
          [
            "صادرة",
            "مجمّدة للقراءة."
          ]
        ],
        "sections": [
          {
            "id": "cert-details-fields",
            "title": "تفاصيل الشهادة والتواريخ",
            "bullets": [
              "تغيير «تاريخ السريان» يعيد حساب «تاريخ الانتهاء» تلقائيًا ما لم تعدّله يدويًا.",
              "الصلاحية الافتراضية ثلاث سنوات (دورة ISO/IEC 17021-1).",
              "انتهاء لا يقع بعد السريان يُظهر خطأ «يجب أن يكون تاريخ الانتهاء بعد تاريخ السريان.» ويعطّل الإصدار.",
              "المعاينة تحسب موعد المراقبة الأولى والثانية بعد سنة وسنتين ناقص يوم."
            ]
          },
          {
            "id": "cert-more-details",
            "title": "اللغة والموقّع والعلامات ورمز QR",
            "bullets": [
              "اللغة تحدد نص الشهادة في المعاينة والملف.",
              "الموقّع إلزامي؛ دونه يتعطل زر الإصدار.",
              "نافذة العلامات تعرض العلامات المعتمدة للجهة فقط مع زر «تطبيق».",
              "رمز QR يتيح لأي طرف التحقق من الشهادة إلكترونيًا."
            ]
          },
          {
            "id": "cert-live-preview",
            "title": "المعاينة الحية",
            "bullets": [
              "تعرض: اسم العميل وعنوانه، المعيار، النطاق، رقم الشهادة، تاريخ المنح الأولي، الصلاحية، موعدي المراقبة.",
              "تعرض أيضًا الموقّع والعلامات وجهة الاعتماد وبيانات الجهة المُصدِرة.",
              "تتحدث فور تغيير أي حقل.",
              "زر «معاينة» أعلى الصفحة يفتحها بحجم أكبر."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "certification-cycles",
    "audience": "cab",
    "section": "certification",
    "routes": [
      "/cab/certification"
    ],
    "open": "/cab/certification",
    "statusDomain": "lifecycle",
    "statusValues": [
      "active",
      "upcoming",
      "suspended",
      "expired"
    ],
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/certification"
    },
    "text": {
      "en": {
        "title": "Certification cycles",
        "summary": "Live certification cycles (three years per certificate): status, standard, start and end, next surveillance due, timeline and upcoming activities.",
        "who": "Certification manager and audit coordinators.",
        "when": "After a certificate is issued, to follow surveillance and recertification.",
        "nav": "Sidebar → Workspace → Certification cycles",
        "handoff": "The client sees the next audit on its portal home (Upcoming audit) once it is scheduled and sent.",
        "screen": [
          "New cycle registers a cycle by hand for an issued certificate that has none, or for a certificate migrated from another system (cycles also open automatically when a certificate is issued).",
          "Search client or certificate.",
          "Lifecycle status filter.",
          "Manage cycle opens the full cycle page.",
          "Next surveillance due, with days remaining.",
          "Cycle tabs: Cycle overview, Audits, Findings, Certificates, Documents and History."
        ],
        "steps": [
          "Open Certification cycles.",
          "Filter by search, Due period (30/90/180 days), Country and Lifecycle status.",
          "Pick a client card from the list.",
          "Review cycle data, timeline and upcoming activities.",
          "Click Manage cycle for actions."
        ],
        "rules": [
          "Cycle status is read live from the certificate, never stored.",
          "Suspended: certificate suspended. Expired: withdrawn or past expiry.",
          "Upcoming: the certificate's effective date is still ahead.",
          "The tabs list the cycle’s audits, findings, certificates, documents and history straight from their records."
        ],
        "after": [
          "Manage cycle opens the page where the next surveillance is scheduled."
        ],
        "tips": [
          "Import from Excel opens the cycles of migrated certificates with their surveillance and recertification due dates. Import the certificates first.",
          "Use Due in 90 days to plan surveillance audits early."
        ],
        "fields": [
          [
            "Due period",
            "Cycles whose next event is due within 30, 90 or 180 days."
          ],
          [
            "Lifecycle status",
            "Active, Upcoming, Suspended, Expired."
          ]
        ],
        "statuses": [
          [
            "Active",
            "Certificate issued and valid."
          ],
          [
            "Upcoming",
            "Validity starts later."
          ],
          [
            "Suspended",
            "Certificate suspended."
          ],
          [
            "Expired",
            "Withdrawn or expired."
          ]
        ],
        "sections": [
          {
            "id": "cycle-timeline",
            "title": "Timeline and upcoming activities",
            "bullets": [
              "Timeline: Initial Certification, Surveillance 1, Surveillance 2, Recertification, each with date and state.",
              "Event states: Completed, Upcoming, Pending.",
              "Upcoming activities: surveillance audit, Audit Plan Due (21 days before the audit), information request.",
              "Audit Plan Due turns Done once the plan is sent to the client."
            ]
          }
        ]
      },
      "ar": {
        "title": "دورات الشهادات",
        "summary": "قائمة دورات الشهادات السارية (ثلاث سنوات لكل شهادة): الحالة، المعيار، بداية الدورة ونهايتها، موعد المراقبة القادم، الجدول الزمني والأنشطة القادمة.",
        "who": "مدير منح الشهادات ومنسقو التدقيق.",
        "when": "بعد إصدار الشهادة، لمتابعة المراقبة وإعادة المنح.",
        "nav": "القائمة الجانبية ← مساحة العمل ← دورات الشهادات",
        "handoff": "يرى العميل التدقيق القادم في الصفحة الرئيسية لبوابته («التدقيق القادم») بعد جدولته وإرساله.",
        "screen": [
          "«دورة جديدة» تسجّل دورة يدويًا لشهادة صادرة بدون دورة، أو لشهادة منقولة من نظام آخر (وتُفتح الدورات تلقائيًا أيضًا عند إصدار الشهادة).",
          "البحث بالعميل أو الشهادة.",
          "فلتر «حالة دورة الحياة».",
          "«إدارة الدورة» يفتح صفحة الدورة الكاملة.",
          "«موعد تدقيق المراقبة القادم» مع عدد الأيام المتبقية.",
          "تبويبات الدورة: نظرة عامة على الدورة، عمليات التدقيق، النتائج، الشهادات، المستندات، السجل."
        ],
        "steps": [
          "افتح «دورات الشهادات».",
          "صفِّ بالبحث و«الفترة المستحقة» (30/90/180 يومًا) و«الدولة» و«حالة دورة الحياة».",
          "اختر بطاقة العميل من القائمة على الجانب.",
          "راجع بيانات الدورة والجدول الزمني والأنشطة القادمة.",
          "اضغط «إدارة الدورة» للإجراءات."
        ],
        "rules": [
          "حالة الدورة تُقرأ مباشرة من حالة الشهادة ولا تُخزَّن.",
          "معلّقة: الشهادة معلّقة. منتهية: الشهادة مسحوبة أو تجاوزت تاريخ الانتهاء.",
          "قادمة: تاريخ سريان الشهادة لم يحن بعد.",
          "تعرض التبويبات عمليات التدقيق والنتائج والشهادات والمستندات وسجل الدورة مباشرة من سجلاتها."
        ],
        "after": [
          "«إدارة الدورة» يفتح الصفحة التي تُجدول منها المراقبة التالية."
        ],
        "tips": [
          "يفتح الاستيراد من Excel دورات الشهادات المُرحّلة مع مواعيد المراقبة وإعادة المنح. استورد الشهادات أولاً.",
          "استخدم «مستحق خلال 90 يومًا» لتخطيط تدقيقات المراقبة مبكرًا."
        ],
        "fields": [
          [
            "الفترة المستحقة",
            "الدورات التي يستحق حدثها التالي خلال 30 أو 90 أو 180 يومًا."
          ],
          [
            "حالة دورة الحياة",
            "نشطة، قادمة، معلّقة، منتهية."
          ]
        ],
        "statuses": [
          [
            "نشط",
            "الشهادة صادرة وسارية."
          ],
          [
            "قادم",
            "السريان يبدأ لاحقًا."
          ],
          [
            "معلّق",
            "الشهادة معلّقة."
          ],
          [
            "منتهي الصلاحية",
            "مسحوبة أو منتهية."
          ]
        ],
        "sections": [
          {
            "id": "cycle-timeline",
            "title": "الجدول الزمني والأنشطة القادمة",
            "bullets": [
              "الجدول: منح الشهادة الأولي، المراقبة الأولى، المراقبة الثانية، إعادة منح الشهادة، لكل منها تاريخ وحالة.",
              "حالات الحدث: مكتمل، قادم، قيد الانتظار.",
              "الأنشطة القادمة: تدقيق المراقبة، موعد جاهزية خطة التدقيق (قبل التدقيق بـ21 يومًا)، طلب المعلومات.",
              "حالة «Audit Plan Due» تصبح Done عند إرسال الخطة للعميل."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "manage-certification-cycle",
    "audience": "cab",
    "section": "certification",
    "routes": [
      "/cab/certification/:cycleId"
    ],
    "open": "/cab/certification",
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/certification/cyc-0141"
    },
    "text": {
      "en": {
        "title": "Manage certification cycle",
        "summary": "One certification cycle: the active certificate, current cycle, next event and its window, upcoming events and linked records, with scheduling of the next surveillance audit.",
        "who": "Certification manager and audit coordinator.",
        "when": "Ahead of a surveillance or recertification window, or when following a certificate.",
        "nav": "Certification cycles → Manage cycle",
        "handoff": "The client never sees the cycle itself; it sees the surveillance plan under Audits once sent, and is asked to confirm it.",
        "screen": [
          "Create application opens a new application form.",
          "Lifecycle actions menu.",
          "Active certificate: number, standard, status and validity.",
          "Page tabs; Certification cycle is the one available now.",
          "Next event and its target window.",
          "Save draft event creates a draft audit plan for the next event."
        ],
        "steps": [
          "Open the cycle from Certification cycles.",
          "Review Current certification cycle: cycle, status, initial certification, expiry.",
          "Read Next event, Target window and Responsible coordinator.",
          "Click Save draft event (or Schedule surveillance in Lifecycle actions).",
          "The new plan opens in Build audit plan; complete it and send it to the client.",
          "Once scheduled, View event details opens the plan."
        ],
        "rules": [
          "No scheduling on a closed cycle: This certification cycle is closed.",
          "No scheduling when every event is done, or the next event is already scheduled.",
          "Default start: window start, or 21 days from today if the window has already opened.",
          "The audit must start inside the cycle (decision date to certificate expiry).",
          "Audit days are worked out automatically for the event's stage."
        ],
        "after": [
          "A Draft audit plan is created for the client, standard and stage, and opens at once.",
          "The event becomes Scheduled and is linked to the plan number.",
          "Completing the event's plan marks it Completed and moves Next on."
        ],
        "tips": [
          "Schedule well before the window opens so the plan can be sent and confirmed.",
          "Issuing a recertification certificate opens a new linked cycle; the old one stays until its certificate expires."
        ],
        "fields": [
          [
            "Cycle",
            "Cycle years (e.g. 2026 to 2029)."
          ],
          [
            "Cycle status",
            "In progress, Not started, Suspended, Expired."
          ],
          [
            "Next event",
            "Surveillance or Recertification."
          ],
          [
            "Target window",
            "Window start and end, with days left or overdue."
          ],
          [
            "Responsible coordinator",
            "Owner of the event."
          ],
          [
            "Status",
            "Scheduled or not."
          ]
        ],
        "statuses": [
          [
            "Next",
            "The next event of the cycle."
          ],
          [
            "Planned",
            "A later event, not due yet."
          ],
          [
            "Completed",
            "The event's audit plan is completed."
          ]
        ],
        "sections": [
          {
            "id": "cycle-event-windows",
            "title": "Event windows: surveillance and recertification",
            "bullets": [
              "Anchor: the cycle's certification decision date.",
              "Surveillance 1: window ends 12 months after the decision and opens 3 months earlier.",
              "Surveillance 2: window ends 24 months after the decision and opens 3 months earlier.",
              "Recertification: window ends 2 months before certificate expiry, leaving time for the decision, and opens 6 months earlier.",
              "An event whose plan is completed is Completed; the first open event is Next.",
              "Only plans for the same client and standard starting inside the cycle count.",
              "Example cycle: Surveillance 1 window 08 Apr 2027 to 07 Jun 2027."
            ]
          },
          {
            "id": "cycle-lifecycle-actions",
            "title": "Lifecycle actions",
            "bullets": [
              "Schedule surveillance works like Save draft event and is disabled when there is no next event.",
              "If the event is already scheduled, its plan opens instead of creating one.",
              "Request scope change, Request site change and Transfer certificate log a request on the cycle; approve, reject and complete it from the Scope, Sites or Transfer tab.",
              "Certificate actions follow its status: Reissue, Extend validity, Suspend and Withdraw for an issued certificate; Reinstate, Extend validity and Withdraw for a suspended one. Each asks for a reason.",
              "The ⋯ menu beside it offers Download certificate and Print cycle summary."
            ]
          },
          {
            "id": "cycle-more-details",
            "title": "More details and the other tabs",
            "bullets": [
              "Each group shows its record count and expands to list record, date and status.",
              "Other groups, depending on data: transfers, audit plans, audit reports, decisions, certificates.",
              "Scope, site and transfer changes are logged as requests on the cycle and decided from their tabs.",
              "The other tabs show live data: Certificate details, Audit history, Sites, Scope, Transfer, Suspension (suspension, reinstatement and extension records), Documents and Related applications."
            ]
          }
        ]
      },
      "ar": {
        "title": "إدارة دورة الشهادة",
        "summary": "صفحة دورة شهادة واحدة: الشهادة السارية، الدورة الحالية، الحدث التالي ونافذته الزمنية، الأحداث القادمة، والسجلات المرتبطة، مع جدولة تدقيق المراقبة التالي.",
        "who": "مدير منح الشهادات ومنسق التدقيق.",
        "when": "قبل نافذة المراقبة أو إعادة المنح، أو عند متابعة حالة الشهادة.",
        "nav": "دورات الشهادات ← إدارة الدورة",
        "handoff": "لا يرى العميل الدورة نفسها؛ يرى خطة المراقبة بعد إرسالها في «عمليات التدقيق» ويُطلب منه تأكيدها.",
        "screen": [
          "«إنشاء طلب» يفتح نموذج طلب جديد.",
          "«إجراءات الدورة»: قائمة إجراءات دورة الحياة.",
          "«الشهادة السارية»: الرقم والمعيار والحالة والصلاحية.",
          "تبويبات الصفحة؛ «دورة الشهادة» هو المتاح حاليًا.",
          "«الحدث التالي» ونافذته المستهدفة.",
          "«حفظ الحدث كمسودة» ينشئ خطة تدقيق مسودة للحدث التالي."
        ],
        "steps": [
          "افتح الدورة من «دورات الشهادات».",
          "راجع «دورة الشهادة الحالية»: الدورة، حالتها، المنح الأولي، الانتهاء.",
          "اقرأ «الحدث التالي» و«الفترة المستهدفة» و«المنسّق المسؤول».",
          "اضغط «حفظ الحدث كمسودة» (أو «جدولة تدقيق مراقبة» من «إجراءات الدورة»).",
          "يفتح النظام الخطة الجديدة في «بناء خطة التدقيق»؛ أكملها وأرسلها للعميل.",
          "بعد الجدولة استخدم «عرض تفاصيل الحدث» لفتح الخطة."
        ],
        "rules": [
          "لا جدولة لدورة منتهية: «This certification cycle is closed».",
          "لا جدولة إذا اكتملت كل أحداث الدورة، أو إذا كان الحدث التالي مجدولًا مسبقًا.",
          "تاريخ البدء الافتراضي: بداية النافذة، أو بعد 21 يومًا من اليوم إن كانت النافذة قد بدأت.",
          "يجب أن يبدأ التدقيق داخل الدورة (من تاريخ القرار حتى انتهاء الشهادة).",
          "مدة التدقيق تُحسب تلقائيًا لمرحلة الحدث."
        ],
        "after": [
          "تُنشأ خطة تدقيق «مسودة» للعميل والمعيار والمرحلة، وتنتقل إليها مباشرة.",
          "الحدث يصبح «مجدول» ويُربط برقم الخطة.",
          "إكمال خطة الحدث يجعله «مكتمل» وينقل «Next» إلى الحدث التالي."
        ],
        "tips": [
          "جدول المراقبة قبل بداية النافذة بوقت كافٍ لإرسال الخطة وتأكيدها.",
          "إصدار شهادة إعادة المنح يفتح دورة جديدة مرتبطة، وتبقى القديمة حتى انتهاء شهادتها."
        ],
        "fields": [
          [
            "الدورة",
            "سنوات الدورة (مثل 2026 إلى 2029)."
          ],
          [
            "حالة الدورة",
            "قيد التنفيذ، لم تبدأ، معلّقة، منتهية."
          ],
          [
            "الحدث التالي",
            "المراقبة أو إعادة المنح."
          ],
          [
            "الفترة المستهدفة",
            "بداية النافذة ونهايتها، والأيام المتبقية أو أيام التأخير."
          ],
          [
            "المنسّق المسؤول",
            "المسؤول عن الحدث."
          ],
          [
            "الحالة",
            "مجدول أو غير مجدول."
          ]
        ],
        "statuses": [
          [
            "Next",
            "الحدث التالي في الدورة."
          ],
          [
            "مخطط",
            "حدث لاحق لم يحن دوره."
          ],
          [
            "مكتمل",
            "اكتملت خطة تدقيق الحدث."
          ]
        ],
        "sections": [
          {
            "id": "cycle-event-windows",
            "title": "نوافذ الأحداث: المراقبة وإعادة المنح",
            "bullets": [
              "مرجع الحساب: تاريخ قرار منح الشهادة للدورة.",
              "المراقبة الأولى: تنتهي نافذتها بعد 12 شهرًا من القرار، وتفتح قبل ذلك بثلاثة أشهر.",
              "المراقبة الثانية: تنتهي بعد 24 شهرًا من القرار، وتفتح قبل ذلك بثلاثة أشهر.",
              "إعادة المنح: تنتهي قبل انتهاء الشهادة بشهرين لترك وقت للقرار، وتفتح قبل ذلك بستة أشهر.",
              "الحدث الذي اكتملت خطته يُعدّ «مكتمل»، وأول حدث غير مكتمل هو «Next».",
              "تُحتسب للحدث فقط خطط العميل والمعيار نفسيهما التي تبدأ داخل الدورة.",
              "مثال الدورة: نافذة المراقبة الأولى 08 Apr 2027 إلى 07 Jun 2027."
            ]
          },
          {
            "id": "cycle-lifecycle-actions",
            "title": "إجراءات الدورة",
            "bullets": [
              "«جدولة تدقيق مراقبة» يعمل مثل «حفظ الحدث كمسودة»، ومعطّل إذا لم يوجد حدث تالٍ.",
              "إذا كان الحدث مجدولًا مسبقًا يفتح النظام خطته بدل إنشاء خطة جديدة.",
              "«طلب تغيير النطاق» و«طلب تغيير موقع» و«نقل الشهادة» تسجّل طلبًا على الدورة، ويُعتمد أو يُرفض أو يُكمل من تبويب «النطاق» أو «المواقع» أو «النقل».",
              "إجراءات الشهادة تتبع حالتها: «إعادة إصدار» و«تمديد الصلاحية» و«تعليق» و«سحب» للشهادة الصادرة، و«إعادة تفعيل» و«تمديد الصلاحية» و«سحب» للمعلّقة، ولكلٍّ سبب.",
              "قائمة (⋯) بجانبها: «تنزيل الشهادة» و«طباعة ملخص الدورة»."
            ]
          },
          {
            "id": "cycle-more-details",
            "title": "تفاصيل إضافية والتبويبات الأخرى",
            "bullets": [
              "كل مجموعة تعرض عدد سجلاتها وتُفتح لعرض السجل والتاريخ والحالة.",
              "تشمل أيضًا: سجلات النقل، وخطط التدقيق، وتقارير التدقيق، وقرارات المنح، والشهادات حسب البيانات.",
              "تُسجَّل تغييرات النطاق والمواقع والنقل كطلبات على الدورة ويُبتّ فيها من تبويباتها.",
              "التبويبات الأخرى تعرض بيانات فعلية: بيانات الشهادة، سجل عمليات التدقيق، المواقع، النطاق، النقل، التعليق (سجلات التعليق وإعادة التفعيل والتمديد)، المستندات، الطلبات المرتبطة."
            ]
          }
        ]
      }
    },
    "related": [
      "cycle-requests",
      "certificate-lifecycle",
      "certification-cycles"
    ]
  },
  {
    "id": "cab-dashboard",
    "audience": "cab",
    "section": "followUp",
    "routes": [
      "/cab/dashboard"
    ],
    "open": "/cab/dashboard",
    "updated": "2026-10-24",
    "capture": {
      "as": "cab",
      "route": "/cab/dashboard"
    },
    "text": {
      "en": {
        "title": "CAB dashboard",
        "summary": "A live picture of the CAB's work: eight indicators, pipeline, audit and decision charts, the work queue, recent activity and quick actions. Every number is calculated from the records, nothing is stored.",
        "who": "CAB admin and all CAB staff.",
        "when": "At the start of each working day, and whenever you need to see what is waiting or late.",
        "nav": "Sidebar → Analytics and reports",
        "screen": [
          "New Applications → opens Application Receipt.",
          "The (i) button explains what the indicator counts.",
          "Upcoming Audits → opens Audit Planning.",
          "Decisions Pending → opens Decisions.",
          "Certificates to Issue → opens the certificate register.",
          "Freelancer Payables in EGP → opens personnel."
        ],
        "steps": [
          "Open Analytics and reports.",
          "Read each number and the line under it (oldest or next item).",
          "Click (i) to see what the indicator counts.",
          "Click a card or its link to open the records behind it.",
          "Review the charts, then work the Work Queue from the top."
        ],
        "rules": [
          "Numbers are read live from the records each time the page opens.",
          "Amounts convert to EGP at fixed rates: SAR 13.2, USD 49.5, EUR 53.5, GBP 63.",
          "Overdue payments are past their due date."
        ],
        "after": [
          "Changes to applications, plans, decisions or certificates show the next time the dashboard opens."
        ],
        "tips": [
          "Start with High items in the work queue, then decisions ready to take."
        ],
        "fields": [
          [
            "New Applications",
            "Submitted, not yet opened; → Open receipt."
          ],
          [
            "Pending Reviews",
            "Received, in review, awaiting client; → Open review queue."
          ],
          [
            "Upcoming Audits",
            "Draft and planned audits starting today or later; → Open audit planning."
          ],
          [
            "Technical Reviews Pending",
            "Feasibility and pre-decision reviews; → Open technical review."
          ],
          [
            "Decisions Pending",
            "Ready to decide or awaiting technical review; → Open decisions."
          ],
          [
            "Certificates to Issue",
            "Drafts after a grant; → Open certificates."
          ],
          [
            "Outstanding Payments",
            "Issued invoices with an unpaid balance; → Open invoices."
          ],
          [
            "Freelancer Payables",
            "Audit days × EGP 4,200 for freelance auditors on completed plans; → Open personnel."
          ]
        ],
        "statuses": [
          [
            "High / Medium",
            "Priority of work queue items."
          ]
        ],
        "sections": [
          {
            "id": "dashboard-info",
            "title": "Info (i) buttons",
            "bullets": [
              "Every card, chart and the work queue has an (i) button.",
              "It explains what the indicator counts and where the number comes from.",
              "Works on tap and click; click outside to close it.",
              "Example: Applications the client has submitted that nobody has opened yet."
            ]
          },
          {
            "id": "dashboard-charts",
            "title": "Charts",
            "bullets": [
              "Applications by Stage: count and share per stage from receipt to decision; click a stage to open its applications.",
              "Audits Overview: Planned, In-Progress, Completed, Report Finalization bars, split Stage 1 vs Stage 2.",
              "The Planned bar opens Audit Planning; the others open Audit Reporting.",
              "Certification Decisions: Granted, Awaiting decision, Deferred, Refused, Suspended, Withdrawn.",
              "View Decisions opens the decision queue."
            ]
          },
          {
            "id": "dashboard-queue",
            "title": "Work queue, recent activity and quick actions",
            "bullets": [
              "Queue items come from the records: information-required follow-up, technical feasibility review, audit report review, certification decision.",
              "Also: audit team proposal review for draft plans, contract review and approval, certificates to issue.",
              "Each item has client, priority and due date; clicking opens that record.",
              "Recent Activity: payments, information requests, files ready for review, audits completed, certificates issued.",
              "Quick Actions: New Application (register a client), Assign Review, Issue Certificate."
            ]
          }
        ]
      },
      "ar": {
        "title": "لوحة تحكم جهة منح الشهادات",
        "summary": "صورة حية لعمل الجهة: ثمانية مؤشرات، ورسوم المسار والتدقيق والقرارات، وقائمة المهام، وآخر الأنشطة، والإجراءات السريعة. كل الأرقام تُحسب مباشرة من السجلات ولا تُخزَّن.",
        "who": "مدير جهة منح الشهادات وكل موظفيها.",
        "when": "في بداية كل يوم عمل، وكلما احتجت إلى معرفة ما ينتظر أو ما تأخر.",
        "nav": "القائمة الجانبية ← التحليلات والتقارير",
        "screen": [
          "بطاقة «طلبات جديدة» ← تفتح استلام الطلبات.",
          "زر (i) يشرح ما يعدّه المؤشر ومصدره.",
          "«عمليات تدقيق قادمة» ← تفتح تخطيط التدقيق.",
          "«قرارات قيد الانتظار» ← تفتح القرارات.",
          "«شهادات بانتظار الإصدار» ← تفتح سجل الشهادات.",
          "«مستحقات المستقلين» بالجنيه ← تفتح سجل الأفراد."
        ],
        "steps": [
          "افتح «التحليلات والتقارير».",
          "اقرأ الرقم في كل بطاقة والسطر تحته (الأقدم أو الأقرب).",
          "اضغط (i) لمعرفة ما يعدّه المؤشر.",
          "اضغط البطاقة أو رابطها السفلي لفتح السجلات خلفها.",
          "راجع الرسوم، ثم اعمل على «قائمة المهام» من الأعلى."
        ],
        "rules": [
          "الأرقام تُقرأ مباشرة من السجلات عند فتح الصفحة.",
          "المبالغ تُحوَّل إلى الجنيه بأسعار ثابتة: الريال 13.2، الدولار 49.5، اليورو 53.5، الجنيه الإسترليني 63.",
          "«متأخرة» في المدفوعات تعني تجاوز تاريخ الاستحقاق."
        ],
        "after": [
          "أي تغيير في الطلبات أو الخطط أو القرارات أو الشهادات يظهر في اللوحة عند فتحها مجددًا."
        ],
        "tips": [
          "ابدأ بالبنود عالية الأولوية في قائمة المهام، ثم القرارات الجاهزة."
        ],
        "fields": [
          [
            "طلبات جديدة",
            "طلبات مقدَّمة لم يفتحها أحد؛ ← فتح الاستلام."
          ],
          [
            "مراجعات قيد الانتظار",
            "مستلمة، قيد المراجعة، بانتظار العميل؛ ← قائمة المراجعة."
          ],
          [
            "عمليات تدقيق قادمة",
            "خطط مسودة ومخططة تبدأ اليوم أو بعده؛ ← تخطيط التدقيق."
          ],
          [
            "مراجعات فنية قيد الانتظار",
            "جدوى فنية وملفات قبل القرار؛ ← المراجعة الفنية."
          ],
          [
            "قرارات قيد الانتظار",
            "جاهزة للقرار أو بانتظار المراجعة الفنية؛ ← القرارات."
          ],
          [
            "شهادات بانتظار الإصدار",
            "مسودات بعد قرار المنح؛ ← الشهادات."
          ],
          [
            "مدفوعات مستحقة",
            "فواتير برصيد غير مدفوع؛ ← الفواتير."
          ],
          [
            "مستحقات المستقلين",
            "أيام التدقيق × 4,200 جنيه للمدققين المستقلين في الخطط المكتملة؛ ← سجل الأفراد."
          ]
        ],
        "statuses": [
          [
            "عالية / متوسطة",
            "أولوية بنود قائمة المهام."
          ]
        ],
        "sections": [
          {
            "id": "dashboard-info",
            "title": "أزرار المعلومات (i)",
            "bullets": [
              "كل بطاقة ورسم وقائمة مهام لها زر (i).",
              "يشرح ما يعدّه المؤشر ومن أين يأتي الرقم.",
              "يعمل باللمس والنقر؛ اضغط خارجه لإغلاقه.",
              "مثال: «طلبات قدّمها العملاء ولم يفتحها أحد بعد. تنتظر في استلام الطلبات للتحقق من اكتمالها.»"
            ]
          },
          {
            "id": "dashboard-charts",
            "title": "الرسوم البيانية",
            "bullets": [
              "الطلبات حسب المرحلة: عدد ونسبة كل مرحلة من الاستلام حتى القرار؛ اضغط مرحلة لفتح طلباتها.",
              "نظرة عامة على التدقيق: أعمدة مخطط، قيد التنفيذ، مكتمل، إنهاء التقرير؛ مقسمة إلى المرحلة 1 والمرحلة 2.",
              "عمود «مخطط» يفتح تخطيط التدقيق؛ والبقية تفتح تقارير التدقيق.",
              "قرارات منح الشهادات: تم المنح، بانتظار القرار، مؤجل، مرفوض، موقوفة، مسحوبة.",
              "«عرض القرارات» يفتح قائمة القرارات."
            ]
          },
          {
            "id": "dashboard-queue",
            "title": "قائمة المهام وآخر الأنشطة والإجراءات السريعة",
            "bullets": [
              "بنود المهام تُبنى من السجلات: متابعة معلومات مطلوبة، مراجعة الجدوى الفنية، مراجعة تقرير التدقيق، قرار منح الشهادة.",
              "وأيضًا: مراجعة فريق التدقيق للخطط المسودة، مراجعة واعتماد العقد، إصدار الشهادات.",
              "لكل بند عميل وأولوية وتاريخ استحقاق؛ الضغط عليه يفتح السجل المعني.",
              "آخر الأنشطة: دفعات مستلمة، طلبات معلومات، ملفات جاهزة للمراجعة، تدقيقات مكتملة، شهادات صادرة.",
              "الإجراءات السريعة: «طلب جديد» (تسجيل عميل)، «تعيين مراجعة»، «إصدار شهادة»."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "notifications",
    "audience": "cab",
    "section": "start",
    "routes": [],
    "updated": "2026-10-24",
    "capture": {
      "as": "cab",
      "route": "/cab/dashboard"
    },
    "text": {
      "en": {
        "title": "Notifications",
        "summary": "The bell at the top of every page collects workflow events for your CAB: new applications, responses, files ready for decision, overdue invoices and more.",
        "who": "Every CAB user.",
        "when": "When the bell shows a number, or to catch up.",
        "nav": "Top bar → bell icon",
        "handoff": "Events the CAB triggers (plan sent, NC raised, revision requested, certificate issued) reach the client as notifications in its portal bell.",
        "screen": [
          "Mark all as read.",
          "All tab.",
          "Unread tab with count.",
          "A notification: title, text and time; unread ones are marked.",
          "The bell and its unread count."
        ],
        "steps": [
          "Click the bell in the top bar.",
          "Choose All or Unread.",
          "Click a notification; it is marked read and opens the linked page.",
          "Click Mark all as read to clear the counter."
        ],
        "rules": [
          "Each CAB sees only its own notifications; a client sees only its organization's.",
          "If loading fails, a message offers Try again."
        ],
        "after": [
          "CAB examples: Response received on NC-…, File … ready for decision, Audit plan … awaiting approval.",
          "Client examples: Confirm audit plan …, Response due on …, Certificate … issued."
        ],
        "tips": [
          "Open items straight from the bell; it takes you to the right page."
        ],
        "fields": [
          [
            "Notification",
            "Title, text and relative time (e.g. 40 minutes ago)."
          ]
        ],
        "statuses": [
          [
            "Unread",
            "Not opened yet."
          ]
        ]
      },
      "ar": {
        "title": "الإشعارات",
        "summary": "جرس الإشعارات في أعلى كل صفحة يجمع أحداث سير العمل التي تخص الجهة: طلبات جديدة، ردود، قرارات جاهزة، فواتير متأخرة، وغيرها.",
        "who": "كل مستخدمي جهة منح الشهادات.",
        "when": "عند ظهور رقم على الجرس، أو لمتابعة ما وصل.",
        "nav": "الشريط العلوي ← رمز الجرس",
        "handoff": "الأحداث التي تطلقها الجهة (إرسال خطة، رفع عدم مطابقة، طلب تعديل، إصدار شهادة) تصل العميل كإشعارات في جرس بوابته.",
        "screen": [
          "«تعليم الكل كمقروء».",
          "تبويب «الكل».",
          "تبويب «غير المقروءة» مع العدد.",
          "إشعار: عنوان ونص ووقت؛ غير المقروء معلَّم.",
          "الجرس ورقم غير المقروءة."
        ],
        "steps": [
          "اضغط الجرس في الشريط العلوي.",
          "اختر «الكل» أو «غير المقروءة».",
          "اضغط أي إشعار؛ يُعلَّم مقروءًا وتنتقل إلى الصفحة المرتبطة به.",
          "اضغط «تعليم الكل كمقروء» لتصفير العداد."
        ],
        "rules": [
          "كل جهة ترى إشعاراتها فقط، والعميل يرى إشعارات منظمته فقط.",
          "عند تعذّر التحميل تظهر رسالة مع «حاول مرة أخرى»."
        ],
        "after": [
          "أمثلة لجهة المنح: «وصل الرد على NC-…»، «الملف … جاهز للقرار»، «خطة التدقيق … بانتظار الاعتماد».",
          "أمثلة يتلقاها العميل: «أكّد خطة التدقيق …»، «مطلوب ردكم على …»، «صدرت الشهادة …»."
        ],
        "tips": [
          "افتح الإشعار من الجرس مباشرة؛ ينقلك إلى الصفحة الصحيحة دون بحث."
        ],
        "fields": [
          [
            "الإشعار",
            "العنوان، النص، الوقت النسبي (مثل قبل 40 دقيقة)."
          ]
        ],
        "statuses": [
          [
            "غير مقروء",
            "لم يُفتح بعد."
          ]
        ]
      }
    },
    "related": [
      "notification-preferences"
    ]
  },
  {
    "id": "smart-assistant",
    "audience": "cab",
    "section": "start",
    "routes": [],
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/cab/dashboard"
    },
    "text": {
      "en": {
        "title": "Smart assistant",
        "summary": "An in-app assistant that knows the page you are on: it explains the steps, suggests common questions, answers yours and helps when an error appears.",
        "who": "All users.",
        "when": "When you are unsure of the next step, or an error appears.",
        "nav": "Floating assistant button at the bottom of the screen",
        "screen": [
          "× closes the Smart assistant.",
          "You are on: current page name.",
          "Suggested questions; clicking one asks it.",
          "Ask anything about this page… box.",
          "Send button."
        ],
        "steps": [
          "Click the floating assistant button.",
          "Read the page summary and its short steps.",
          "Click a suggested question, or type yours and click Send.",
          "Read the answer; it may include an Open … button to a related page.",
          "Close with × or the Esc key."
        ],
        "rules": [
          "Answer order: the AI model when configured, then the built-in page guide.",
          "Answers come from the iCASCO AI assistant; when it cannot be reached, the built-in guide of the page answers instead.",
          "When an error is on screen it offers Explain and help me fix it.",
          "After idle time a hint shows Stuck here? I can help."
        ],
        "after": [
          "The conversation stays open while you navigate until you close it."
        ],
        "tips": [
          "Ask for the next step after each important action."
        ],
        "fields": [
          [
            "Question",
            "Free text up to 1000 characters."
          ]
        ],
        "sections": [
          {
            "id": "assistant-ask",
            "title": "Asking a question",
            "bullets": [
              "Your question appears in the chat, with the answer below it.",
              "Animated dots show while it is thinking.",
              "Answers are short and tied to the current page and screen language."
            ]
          }
        ]
      },
      "ar": {
        "title": "المساعد الذكي",
        "summary": "مساعد داخل التطبيق يعرف الصفحة التي أنت فيها: يشرح خطواتها، ويقترح أسئلة شائعة، ويجيب عن سؤالك، ويساعد عند ظهور خطأ.",
        "who": "كل المستخدمين.",
        "when": "عندما لا تعرف الخطوة التالية أو تظهر رسالة خطأ.",
        "nav": "زر المساعد العائم في أسفل الشاشة",
        "screen": [
          "زر (×) لإغلاق «المساعد الذكي».",
          "«أنت في:» اسم الصفحة الحالية.",
          "أسئلة مقترحة؛ الضغط عليها يرسلها.",
          "مربع «اسأل عن أي حاجة في الصفحة دي…».",
          "زر «إرسال»."
        ],
        "steps": [
          "اضغط زر المساعد العائم.",
          "اقرأ شرح الصفحة وخطواتها المختصرة.",
          "اضغط سؤالًا مقترحًا، أو اكتب سؤالك ثم «إرسال».",
          "اقرأ الإجابة؛ قد تتضمن زر «فتح …» لصفحة ذات صلة.",
          "أغلق النافذة بـ(×) أو بمفتاح Esc."
        ],
        "rules": [
          "ترتيب الإجابة: نموذج الذكاء الاصطناعي إن كان مهيأً، ثم دليل الصفحة المدمج.",
          "تأتي الإجابات من المساعد الذكي في iCASCO، وإذا تعذّر الوصول إليه يجيب دليل الصفحة المدمج بدلًا منه.",
          "عند ظهور خطأ على الشاشة يعرض «اشرح وساعدني أصلحه».",
          "بعد فترة خمول يظهر تلميح «Stuck here? I can help.»."
        ],
        "after": [
          "تبقى المحادثة مفتوحة أثناء التنقل حتى تغلقها."
        ],
        "tips": [
          "اسأل عن الخطوة التالية بعد كل إجراء مهم."
        ],
        "fields": [
          [
            "السؤال",
            "نص حر حتى 1000 حرف."
          ]
        ],
        "sections": [
          {
            "id": "assistant-ask",
            "title": "طرح سؤال",
            "bullets": [
              "يظهر سؤالك في المحادثة ثم إجابة المساعد تحته.",
              "أثناء التفكير تظهر نقاط متحركة.",
              "الإجابات قصيرة ومرتبطة بالصفحة الحالية ولغة الواجهة."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "my-profile",
    "audience": "cab",
    "section": "start",
    "routes": [
      "/account/profile"
    ],
    "open": "/account/profile",
    "updated": "2026-10-25",
    "capture": {
      "as": "cab",
      "route": "/account/profile"
    },
    "text": {
      "en": {
        "title": "My profile, language and sign out",
        "summary": "Your account page: photo, name, job title and phone, system language, sign out and password change.",
        "who": "Every user, for their own account.",
        "when": "When updating your details, language or password.",
        "nav": "Account menu (your avatar in the top bar) → My profile",
        "screen": [
          "Change uploads a profile photo.",
          "Full name is required.",
          "Email is read-only.",
          "Save changes is enabled once there is a valid change.",
          "العربية switches the whole system to Arabic, right-to-left.",
          "English for the English interface."
        ],
        "steps": [
          "Open the account menu and choose My profile.",
          "Click Change to upload a JPG, PNG or WebP photo up to 2 MB.",
          "Edit Full name, Job title and Phone (country code + number).",
          "Click Save changes, or Cancel to undo.",
          "Pick the language in the Language card."
        ],
        "rules": [
          "Photo: JPG, PNG or WebP only, up to 2 MB.",
          "Save changes stays disabled with no change or a name/phone error.",
          "Switching language flips the layout: Arabic is right-to-left with the sidebar on the right.",
          "The language is remembered on the device for later sessions."
        ],
        "after": [
          "A success message shows and your name updates in the top bar."
        ],
        "tips": [
          "You can also switch language from the globe button in the top bar."
        ],
        "fields": [
          [
            "Full name",
            "Required."
          ],
          [
            "Job title",
            "Optional."
          ],
          [
            "Email",
            "Your sign-in; cannot be changed here."
          ],
          [
            "Phone",
            "Country code then number; 7 to 12 digits."
          ]
        ],
        "sections": [
          {
            "id": "profile-signout-password",
            "title": "Sign out and password",
            "bullets": [
              "Logout asks: Sign out of iCASCO on this device?",
              "After confirming, the session ends on this device and the sign-in page opens.",
              "New password: at least 8 characters, upper and lower case, at least one number.",
              "Change password stays disabled until a new password is typed.",
              "Errors show under the form; success shows Password changed."
            ]
          },
          {
            "id": "header-language",
            "title": "Switching language from the top bar (RTL)",
            "bullets": [
              "Available on every page from the top bar.",
              "The choice changes every interface text at once, no new sign-in.",
              "Arabic flips the layout: sidebar on the right, tables and forms right-to-left.",
              "Entered data (client names, scopes) stays as entered.",
              "Statuses and system messages follow the language; names and free text that people typed stay as written."
            ]
          },
          {
            "id": "account-menu",
            "title": "Account menu",
            "bullets": [
              "Opens from your name and avatar in the top bar.",
              "Shows your name, email, CAB and role.",
              "Body setup opens the CAB setup.",
              "Logout asks for confirmation before ending the session."
            ]
          }
        ]
      },
      "ar": {
        "title": "ملفي الشخصي واللغة وتسجيل الخروج",
        "summary": "صفحة حسابك: الصورة والاسم والمسمى والهاتف، ولغة النظام، وتسجيل الخروج، وتغيير كلمة المرور.",
        "who": "كل مستخدم لحسابه الخاص.",
        "when": "عند تحديث بياناتك أو تغيير اللغة أو كلمة المرور.",
        "nav": "قائمة الحساب (صورتك في الشريط العلوي) ← ملفي الشخصي",
        "screen": [
          "«تغيير» لرفع صورة شخصية.",
          "«الاسم الكامل» إلزامي.",
          "«البريد الإلكتروني» للقراءة فقط.",
          "«حفظ التغييرات» يُفعَّل عند وجود تعديل صحيح.",
          "«العربية» لتحويل النظام كله للعربية ومن اليمين لليسار.",
          "«English» للواجهة الإنجليزية."
        ],
        "steps": [
          "افتح قائمة الحساب واختر «ملفي الشخصي».",
          "اضغط «تغيير» لرفع صورة JPG أو PNG أو WebP حتى 2 ميجابايت.",
          "عدّل «الاسم الكامل» و«المسمى الوظيفي» و«الهاتف» (رمز الدولة + الرقم).",
          "اضغط «حفظ التغييرات»، أو «إلغاء» للتراجع.",
          "اختر اللغة من بطاقة «اللغة»."
        ],
        "rules": [
          "الصورة: JPG أو PNG أو WebP فقط، وحتى 2 ميجابايت.",
          "«حفظ التغييرات» معطّل دون تعديل أو مع خطأ في الاسم أو الهاتف.",
          "تغيير اللغة يقلب الاتجاه كاملًا: العربية من اليمين لليسار والقائمة الجانبية على اليمين.",
          "تُحفظ اللغة على الجهاز وتبقى في الجلسات التالية."
        ],
        "after": [
          "تظهر رسالة نجاح، ويتحدث اسمك في الشريط العلوي."
        ],
        "tips": [
          "يمكن تغيير اللغة أيضًا من زر الكرة الأرضية في الشريط العلوي."
        ],
        "fields": [
          [
            "الاسم الكامل",
            "إلزامي."
          ],
          [
            "المسمى الوظيفي",
            "اختياري."
          ],
          [
            "البريد الإلكتروني",
            "بيانات الدخول؛ لا يتغير من هنا."
          ],
          [
            "الهاتف",
            "رمز الدولة ثم الرقم؛ من 7 إلى 12 رقمًا."
          ]
        ],
        "sections": [
          {
            "id": "profile-signout-password",
            "title": "تسجيل الخروج وكلمة المرور",
            "bullets": [
              "«تسجيل الخروج» يطلب التأكيد: «تسجيل الخروج من iCASCO على هذا الجهاز؟».",
              "بعد التأكيد تنتهي الجلسة على هذا الجهاز وتعود لصفحة الدخول.",
              "كلمة المرور الجديدة: 8 أحرف على الأقل، حروف كبيرة وصغيرة، ورقم واحد على الأقل.",
              "زر التغيير معطّل حتى تكتب كلمة مرور جديدة.",
              "الخطأ يظهر تحت النموذج؛ والنجاح برسالة «Password changed.»."
            ]
          },
          {
            "id": "header-language",
            "title": "تبديل اللغة من الشريط العلوي (RTL)",
            "bullets": [
              "متاح في كل صفحة من الشريط العلوي.",
              "الاختيار يغيّر كل نصوص الواجهة فورًا دون إعادة الدخول.",
              "العربية تقلب الاتجاه: القائمة الجانبية يمينًا، والجداول والنماذج من اليمين لليسار.",
              "البيانات المدخلة (أسماء العملاء والنطاقات) تبقى كما أُدخلت.",
              "تتبع الحالات ورسائل النظام اللغة المختارة، أما الأسماء والنصوص التي كتبها المستخدمون فتبقى كما كُتبت."
            ]
          },
          {
            "id": "account-menu",
            "title": "قائمة الحساب",
            "bullets": [
              "تُفتح بالضغط على اسمك وصورتك في الشريط العلوي.",
              "تعرض اسمك وبريدك واسم الجهة ودورك.",
              "«إعداد الجهة» يفتح إعداد جهة منح الشهادات.",
              "«تسجيل الخروج» يطلب تأكيدًا قبل إنهاء الجلسة."
            ]
          }
        ]
      }
    },
    "related": [
      "notification-preferences",
      "ihelp"
    ]
  },
  {
    "id": "client-view",
    "audience": "cab",
    "section": "clients",
    "routes": [
      "/portal"
    ],
    "open": "/portal",
    "updated": "2026-10-24",
    "capture": {
      "as": "cab",
      "route": "/portal"
    },
    "text": {
      "en": {
        "title": "Client view",
        "summary": "When a CAB user opens the client portal (/portal), they see it as the client does, with a Client view banner as a reminder.",
        "who": "CAB staff checking what the client sees.",
        "when": "After sending a plan, raising a nonconformity or issuing a certificate, to confirm what reached the client.",
        "nav": "Portal address /portal while signed in as the CAB",
        "handoff": "This is the client's side: home with the upcoming audit, Audits to confirm plans, Findings to respond, Certificates to download.",
        "screen": [
          "Client view banner naming the client shown.",
          "Back to CAB workspace.",
          "Audits: plans sent for confirmation.",
          "Findings: nonconformities and responses.",
          "Certificates: issued certificates."
        ],
        "steps": [
          "Open /portal while signed in as the CAB.",
          "Move through the portal sections as the client would.",
          "Click Back to CAB workspace to return."
        ],
        "rules": [
          "The banner shows only for CAB users inside the portal.",
          "Data shown belongs to the client named in the banner."
        ],
        "tips": [
          "Use it to walk the client through the next step on the same screen they see."
        ]
      },
      "ar": {
        "title": "عرض العميل",
        "summary": "عندما يفتح مستخدم من جهة المنح بوابة العميل (/portal) يرى البوابة كما يراها العميل، مع شريط «عرض العميل» يذكّره بذلك.",
        "who": "موظفو جهة منح الشهادات عند التحقق مما يراه العميل.",
        "when": "بعد إرسال خطة أو رفع حالة عدم مطابقة أو إصدار شهادة، للتأكد مما وصل للعميل.",
        "nav": "عنوان البوابة /portal أثناء تسجيل الدخول كجهة منح",
        "handoff": "هذا ما يراه العميل: الصفحة الرئيسية بالتدقيق القادم، و«عمليات التدقيق» لتأكيد الخطط، و«الملاحظات» للرد، و«الشهادات» للتنزيل.",
        "screen": [
          "شريط «عرض العميل» واسم العميل المعروض.",
          "«الرجوع لمساحة عمل جهة المنح».",
          "«عمليات التدقيق»: الخطط المرسلة لتأكيدها.",
          "«الملاحظات»: حالات عدم المطابقة والرد عليها.",
          "«الشهادات»: الشهادات الصادرة."
        ],
        "steps": [
          "افتح /portal وأنت مسجل كجهة منح.",
          "تنقّل بين أقسام البوابة كما يفعل العميل.",
          "اضغط «الرجوع لمساحة عمل جهة المنح» للعودة."
        ],
        "rules": [
          "الشريط يظهر فقط لمستخدمي جهة المنح داخل البوابة.",
          "البيانات المعروضة تخص العميل المذكور في الشريط."
        ],
        "tips": [
          "استخدمه لشرح الخطوة التالية للعميل وأنت ترى شاشته نفسها."
        ]
      }
    }
  }
]

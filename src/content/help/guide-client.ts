import type { HelpArticleSource } from '@/lib/help/types'

/** Audit client articles, converted from the bilingual user guide. Edit freely: this file is the source now. */
export const CLIENT_GUIDE_ARTICLES: HelpArticleSource[] = [
  {
    "id": "c-register",
    "audience": "client",
    "section": "start",
    "routes": [
      "/register"
    ],
    "updated": "2026-10-25",
    "capture": {
      "as": "client",
      "route": "/register"
    },
    "text": {
      "en": {
        "title": "Create your audit client account",
        "summary": "Your organization registers itself as an audit client, verifies its email with a one-time code, then signs in to the client portal.",
        "who": "The person who represents the organization seeking certification (owner or quality manager). Contacts invited by the CAB do not need to register.",
        "when": "Once, before your first certification application, unless the CAB has already created your access.",
        "nav": "Log In screen → Don't have an account? Register now → Audit Clients / Auditees",
        "handoff": "Nothing reaches the CAB at registration; your organization appears to the CAB when you submit your first application.",
        "screen": [
          "Step indicator: 1 Account details, 2 Verification.",
          "Your company name as it will appear in your profile and applications.",
          "Pick the country first; the City list then loads for that country.",
          "The contact person who will manage the account.",
          "Mobile number with country code; 8 to 15 digits."
        ],
        "steps": [
          "Open the registration page from Register now under the Log In form.",
          "Choose Audit Clients / Auditees. Organizations is for certification bodies, not clients.",
          "Enter the company name, then pick Country and City from the searchable lists.",
          "Enter the contact person, email and mobile number.",
          "Create and confirm a password, then tick Agree to the privacy policy.",
          "Click Next. A 6-digit verification code is sent to your email.",
          "Type the code. It is checked and the account is created as soon as the sixth digit is entered.",
          "Click Go to Login and sign in with your email and password."
        ],
        "rules": [
          "Next stays disabled until every required field is filled and valid.",
          "If the email is already registered, a message appears with a Log In link.",
          "A wrong code is cleared so you can retype it; use Resend code if needed.",
          "The 6-digit verification code is sent to the email you registered with."
        ],
        "after": [
          "Your organization account is created with the contact person as its administrator.",
          "After you log in you land directly on the Client Portal home page.",
          "Next, complete your company profile, then request certification."
        ],
        "tips": [
          "Use a work email you check often; codes and notifications go there.",
          "If the CAB already added you as a contact, do not register again; just log in.",
          "Back on the Verification step returns you to fix the email without losing your entries."
        ],
        "fields": [
          [
            "Company Name / Auditee Client",
            "Required. Legal or trading name of the organization."
          ],
          [
            "Country",
            "Required. Searchable list; may be pre-filled from your location."
          ],
          [
            "City",
            "Required. Enabled only after a country is chosen."
          ],
          [
            "Contact Person",
            "Required. Becomes the account administrator."
          ],
          [
            "Email",
            "Required, valid format. It becomes your sign-in."
          ],
          [
            "Mobile Number",
            "Required, 8 to 15 digits with the country code."
          ],
          [
            "Password / Confirm Password",
            "At least 8 characters; both must match."
          ],
          [
            "Agree to the privacy policy",
            "Required. The policy link opens in a new tab."
          ]
        ],
        "statuses": [
          [
            "Account details",
            "Step 1: company and sign-in details."
          ],
          [
            "Verification",
            "Step 2: enter the emailed code."
          ],
          [
            "Account created successfully!",
            "Registration is complete; you can log in."
          ]
        ],
        "sections": [
          {
            "id": "c-register-type",
            "title": "Choose the registration type",
            "bullets": [
              "The first registration screen asks what kind of organization you are.",
              "Audit clients choose Audit Clients / Auditees.",
              "Switch the language with the globe icon above the form.",
              "Back on the next step returns you to this choice."
            ]
          },
          {
            "id": "c-register-password",
            "title": "Password and consent",
            "bullets": [
              "The eye icon shows or hides the password.",
              "\"Passwords do not match\" appears if they differ.",
              "The button shows a sending state while the code is sent.",
              "The account is not created until the correct code is entered."
            ]
          },
          {
            "id": "c-register-verify",
            "title": "Verify your email",
            "bullets": [
              "Verification starts automatically after the sixth digit; there is no confirm button.",
              "When the code is accepted, the account is created at once.",
              "A wrong code is cleared and an error message appears.",
              "No code? Check your spam folder, then select Resend code."
            ]
          },
          {
            "id": "c-register-done",
            "title": "Registration complete",
            "bullets": [
              "Log in with the email and password you just created.",
              "An audit client account always lands on the Client Portal after login.",
              "You do not need CAB approval to open the portal."
            ]
          }
        ]
      },
      "ar": {
        "title": "إنشاء حساب عميل التدقيق",
        "summary": "تسجّل المنشأة نفسها في iCASCO كعميل تدقيق، وتؤكد بريدها الإلكتروني برمز تحقق، ثم تسجّل الدخول إلى بوابة العميل.",
        "who": "ممثل المنشأة الراغبة في الحصول على الشهادة (المالك أو مدير الجودة). جهات الاتصال التي دعتها جهة المنح لا تحتاج إلى التسجيل.",
        "when": "مرة واحدة قبل تقديم أول طلب منح، إذا لم تكن جهة المنح قد أنشأت لك حسابًا.",
        "nav": "شاشة تسجيل الدخول ← ليس لديك حساب؟ سجّل الآن ← عملاء التدقيق / الجهات الخاضعة للتدقيق",
        "handoff": "لا يصل شيء إلى جهة المنح عند التسجيل؛ تظهر منشأتك لديها عندما تقدّم أول طلب منح.",
        "screen": [
          "مؤشر الخطوات: الخطوة 1 بيانات الحساب، والخطوة 2 التحقق.",
          "اسم الشركة كما سيظهر في ملفك وطلباتك.",
          "اختر الدولة أولًا، ثم تُفتح قائمة المدينة الخاصة بها.",
          "اسم الشخص المختص الذي سيدير الحساب.",
          "رقم الجوال مع مفتاح الدولة؛ يقبل من 8 إلى 15 رقمًا."
        ],
        "steps": [
          "افتح صفحة التسجيل من رابط «سجّل الآن» أسفل شاشة الدخول.",
          "اختر «عملاء التدقيق / الجهات الخاضعة للتدقيق». خيار «المنظمات» مخصص لجهات المنح وليس للعملاء.",
          "أدخل اسم الشركة، ثم اختر الدولة والمدينة من القوائم المنسدلة مع خانة البحث.",
          "أدخل اسم الشخص المختص والبريد الإلكتروني ورقم الجوال.",
          "أنشئ كلمة المرور وأكّدها، ثم فعّل خانة «الموافقة على سياسة الخصوصية».",
          "اضغط «التالي»؛ يرسل النظام رمز تحقق من 6 أرقام إلى بريدك.",
          "أدخل الرمز في خانات التحقق؛ يتم التحقق وإنشاء الحساب تلقائيًا بعد إدخال الرقم السادس.",
          "اضغط «الذهاب لتسجيل الدخول» وادخل ببريدك وكلمة المرور."
        ],
        "rules": [
          "يبقى زر «التالي» معطلًا حتى تكتمل كل الحقول الإلزامية وتصح.",
          "إذا كان البريد مسجلًا من قبل يظهر تنبيه ورابط «تسجيل الدخول».",
          "الرمز الخاطئ يُمسح ويُطلب إدخاله من جديد؛ يمكن طلب «إعادة إرسال الرمز».",
          "يُرسل رمز التحقق المكوّن من 6 أرقام إلى البريد الإلكتروني الذي سجّلت به."
        ],
        "after": [
          "يُنشأ حساب منشأتك ويُسجَّل الشخص المختص مسؤولًا عنه.",
          "بعد الدخول تصل مباشرة إلى بوابة العميل (الصفحة الرئيسية).",
          "ابدأ بإكمال ملف الشركة ثم قدّم طلب المنح."
        ],
        "tips": [
          "استخدم بريد عمل تتابعه باستمرار؛ عليه تصلك الرموز والإشعارات.",
          "إذا أضافتك جهة المنح كجهة اتصال فلا تنشئ حسابًا جديدًا؛ سجّل الدخول مباشرة.",
          "زر «السابق» في خطوة التحقق يعيدك لتصحيح البريد دون فقد البيانات."
        ],
        "fields": [
          [
            "اسم الشركة / عميل التدقيق",
            "إلزامي. الاسم القانوني أو التجاري للمنشأة."
          ],
          [
            "الدولة",
            "إلزامي. قائمة بحث؛ قد تُملأ تلقائيًا حسب موقعك."
          ],
          [
            "المدينة",
            "إلزامي. لا تُفعَّل قبل اختيار الدولة."
          ],
          [
            "الشخص المختص",
            "إلزامي. يُسجَّل كمسؤول الحساب."
          ],
          [
            "البريد الإلكتروني",
            "إلزامي وبصيغة صحيحة؛ يصبح اسم الدخول."
          ],
          [
            "رقم الجوال",
            "إلزامي، من 8 إلى 15 رقمًا مع مفتاح الدولة."
          ],
          [
            "كلمة المرور / تأكيد كلمة المرور",
            "8 أحرف على الأقل، ويجب أن تتطابقا."
          ],
          [
            "الموافقة على سياسة الخصوصية",
            "إلزامية؛ رابط السياسة يفتح في نافذة جديدة."
          ]
        ],
        "statuses": [
          [
            "بيانات الحساب",
            "الخطوة الأولى: إدخال بيانات الشركة والدخول."
          ],
          [
            "التحقق",
            "الخطوة الثانية: إدخال رمز البريد."
          ],
          [
            "تم إنشاء الحساب بنجاح!",
            "اكتمل التسجيل ويمكنك الدخول."
          ]
        ],
        "sections": [
          {
            "id": "c-register-type",
            "title": "اختيار نوع التسجيل",
            "bullets": [
              "أول شاشة في التسجيل تسأل عن نوع الجهة.",
              "عميل التدقيق يختار «عملاء التدقيق / الجهات الخاضعة للتدقيق».",
              "يمكن تغيير اللغة من أيقونة الكرة الأرضية أعلى النموذج.",
              "زر «السابق» في الخطوة التالية يعيدك إلى هذا الاختيار."
            ]
          },
          {
            "id": "c-register-password",
            "title": "كلمة المرور والموافقة",
            "bullets": [
              "أيقونة العين تُظهر كلمة المرور أو تخفيها.",
              "تظهر رسالة «كلمتا المرور غير متطابقتين» عند الاختلاف.",
              "يتغير الزر إلى حالة الإرسال أثناء إرسال الرمز.",
              "لا يُنشأ الحساب قبل إدخال الرمز الصحيح."
            ]
          },
          {
            "id": "c-register-verify",
            "title": "التحقق من البريد الإلكتروني",
            "bullets": [
              "يبدأ التحقق تلقائيًا بعد الرقم السادس، دون زر تأكيد.",
              "عند نجاح التحقق يُنشأ الحساب مباشرة.",
              "الرمز الخاطئ يُمسح وتظهر رسالة خطأ.",
              "لم يصلك الرمز؟ تحقّق من مجلد الرسائل غير المرغوب فيها، ثم اختر «إعادة إرسال الرمز»."
            ]
          },
          {
            "id": "c-register-done",
            "title": "اكتمال التسجيل",
            "bullets": [
              "سجّل الدخول بالبريد وكلمة المرور اللذين أنشأتهما.",
              "حساب عميل التدقيق يصل دائمًا إلى بوابة العميل بعد الدخول.",
              "لا يلزم انتظار موافقة جهة المنح لفتح البوابة."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "c-signin",
    "audience": "client",
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
        "title": "Sign in and reset your password",
        "summary": "One sign-in screen serves CAB staff and clients; an audit client lands straight on the Client Portal.",
        "who": "Every client user: the account owner or a contact invited by the CAB.",
        "when": "At the start of each session, or when you forget your password.",
        "nav": "System address → Log In",
        "screen": [
          "The email registered for your account.",
          "Your password; the eye icon reveals it.",
          "Remember Me keeps you signed in on this device.",
          "Reset your password with a code sent to your email.",
          "Sign in."
        ],
        "steps": [
          "Enter your E-mail and Password.",
          "Tick Remember Me on your own device only.",
          "Click Log In. The Client Portal opens.",
          "Forgot your password? Click Forgot Password?, enter your email and click Send Code.",
          "Enter the 6-digit code and click Confirm.",
          "Create and confirm a new password, then click Reset Password."
        ],
        "rules": [
          "Wrong details show: \"The email or password is incorrect.\"",
          "An inactive account cannot sign in and is told to contact support.",
          "Resend code becomes active when the countdown ends.",
          "The new password needs at least 8 characters and must match the confirmation."
        ],
        "after": [
          "The Client Portal opens with the client sidebar.",
          "After a reset, Back to login returns you to the Log In screen."
        ],
        "tips": [
          "Do not tick Remember Me on a shared computer.",
          "If the code does not arrive, check your spam folder before resending."
        ],
        "fields": [
          [
            "E-mail",
            "A valid email address."
          ],
          [
            "Password",
            "Your account password."
          ],
          [
            "Remember Me",
            "Optional; keeps the session after the browser closes."
          ]
        ],
        "statuses": [
          [
            "Password reset successfully",
            "Log in with the new password."
          ],
          [
            "Password reset failed",
            "Use Try again or contact support."
          ]
        ],
        "sections": [
          {
            "id": "c-forgot",
            "title": "Forgot Password?",
            "bullets": [
              "Recovery has three steps: email, code, new password.",
              "An unknown email shows: \"No account is registered with this email address.\"",
              "The Log In link takes you back without sending a code."
            ]
          },
          {
            "id": "c-forgot-otp",
            "title": "Enter the reset code",
            "bullets": [
              "A countdown under the button runs before Resend code is allowed.",
              "After Confirm, enter and confirm the new password.",
              "Resending clears the boxes and restarts the countdown."
            ]
          }
        ]
      },
      "ar": {
        "title": "تسجيل الدخول واستعادة كلمة المرور",
        "summary": "شاشة دخول واحدة لموظفي جهة المنح وللعملاء؛ يصل عميل التدقيق بعد الدخول إلى بوابة العميل مباشرة.",
        "who": "كل مستخدم لدى العميل: صاحب الحساب أو جهة اتصال دعتها جهة المنح.",
        "when": "في بداية كل جلسة عمل، أو عند نسيان كلمة المرور.",
        "nav": "الرابط الرئيسي للنظام ← تسجيل الدخول",
        "screen": [
          "البريد الإلكتروني المسجل للحساب.",
          "كلمة المرور؛ أيقونة العين تُظهرها.",
          "«تذكرني» يحفظ الجلسة على هذا الجهاز.",
          "استعادة كلمة المرور برمز يُرسل إلى بريدك.",
          "زر الدخول."
        ],
        "steps": [
          "أدخل البريد الإلكتروني وكلمة المرور.",
          "فعّل «تذكرني» على جهازك الشخصي فقط.",
          "اضغط «تسجيل الدخول»؛ تُفتح «بوابة العميل».",
          "إذا نسيت كلمة المرور اضغط «نسيت كلمة المرور؟» وأدخل بريدك ثم «إرسال الرمز».",
          "أدخل الرمز المكون من 6 أرقام واضغط «تأكيد».",
          "أنشئ كلمة مرور جديدة وأكدها، ثم «إعادة تعيين كلمة المرور»."
        ],
        "rules": [
          "بيانات خاطئة تُظهر: «البريد الإلكتروني أو كلمة المرور غير صحيحة.»",
          "الحساب غير المفعّل لا يدخل ويُطلب التواصل مع الدعم.",
          "رابط إعادة إرسال الرمز يُفعَّل بعد انتهاء العد التنازلي.",
          "كلمة المرور الجديدة 8 أحرف على الأقل ويجب أن تتطابق مع التأكيد."
        ],
        "after": [
          "يفتح النظام «بوابة العميل» بقائمتها الجانبية الخاصة بالعميل.",
          "بعد إعادة التعيين يعود زر «العودة لتسجيل الدخول» إلى شاشة الدخول."
        ],
        "tips": [
          "لا تفعّل «تذكرني» على جهاز مشترك.",
          "إذا لم يصل الرمز افحص مجلد البريد غير المرغوب فيه قبل إعادة الإرسال."
        ],
        "fields": [
          [
            "البريد الإلكتروني",
            "بصيغة بريد صحيحة."
          ],
          [
            "كلمة المرور",
            "كلمة مرور الحساب."
          ],
          [
            "تذكرني",
            "اختياري؛ يُبقي الجلسة بعد إغلاق المتصفح."
          ]
        ],
        "statuses": [
          [
            "تمت إعادة تعيين كلمة المرور",
            "ادخل بكلمة المرور الجديدة."
          ],
          [
            "فشل إعادة تعيين كلمة المرور",
            "استخدم «حاول مرة أخرى» أو تواصل مع الدعم."
          ]
        ],
        "sections": [
          {
            "id": "c-forgot",
            "title": "نسيت كلمة المرور؟",
            "bullets": [
              "تتم الاستعادة في ثلاث خطوات: البريد، الرمز، كلمة المرور الجديدة.",
              "إذا لم يكن البريد مسجلًا تظهر رسالة: «لا يوجد حساب مسجّل بهذا البريد الإلكتروني.»",
              "رابط «تسجيل الدخول» يعيدك دون إرسال رمز."
            ]
          },
          {
            "id": "c-forgot-otp",
            "title": "إدخال رمز الاستعادة",
            "bullets": [
              "يظهر أسفل الزر عدّاد قبل السماح بإعادة الإرسال.",
              "بعد التأكيد تظهر خانتا كلمة المرور الجديدة وتأكيدها.",
              "إعادة الإرسال تمسح الخانات وتبدأ عدًّا جديدًا."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "c-portal-home",
    "audience": "client",
    "section": "start",
    "routes": [
      "/portal/home"
    ],
    "open": "/portal/home",
    "updated": "2026-10-24",
    "capture": {
      "as": "client",
      "route": "/portal/home"
    },
    "text": {
      "en": {
        "title": "Client portal home",
        "summary": "One page that shows your application status, what the CAB needs from you, your next audit, your documents and recent activity.",
        "who": "All client users.",
        "when": "Every time you sign in, to see what is waiting for you.",
        "nav": "Sidebar → Home",
        "handoff": "This page is read-only. It shows what the CAB recorded: information requests, audit plans, invoices and certificates.",
        "screen": [
          "Opens your company profile for editing.",
          "Current application: number, status, scheme, dates; follow it from here.",
          "Information requests from the CAB with their due date.",
          "Upcoming audit: stage, date and site.",
          "Documents: uploaded by you, requested by the CAB, shared with you.",
          "Notifications bell with the unread count."
        ],
        "steps": [
          "Check the summary card: company name, Client ID, country and primary contact.",
          "On the application card, click Follow application or View application to open Applications.",
          "If the card shows Clarification required, click View requested info and answer before the due date.",
          "Click View audit details to open Audits and confirm the visit.",
          "Click View all documents to open the documents in your company profile.",
          "Click a reference in Recent activity to jump to the related record."
        ],
        "rules": [
          "Cards read your live records; no manual refresh is needed.",
          "Invoice references open Invoices, certificates open Certificates, audits open Audits, findings open Findings."
        ],
        "after": [
          "Whatever you do in the other modules is reflected here in the cards and Recent activity."
        ],
        "tips": [
          "Start with the information request and upcoming audit cards; these are what the CAB is waiting on.",
          "Click a contact's email or phone to reach them directly."
        ],
        "fields": [
          [
            "Application",
            "Your latest active application and status; a draft shows Continue application."
          ],
          [
            "No open requests / Clarification required",
            "Turns into Clarification required, with the request and due date, when one is open."
          ],
          [
            "Upcoming audit",
            "Audit stage, date and site, or \"No audit scheduled yet.\""
          ],
          [
            "Documents",
            "Uploaded by you, Requested by us, Shared with you."
          ],
          [
            "Recent activity",
            "Date, Details and Related to reference."
          ],
          [
            "Your contacts at Example CAB",
            "Client manager and technical manager with email and phone."
          ]
        ],
        "statuses": [
          [
            "Submitted",
            "The application was sent to the CAB."
          ],
          [
            "Active client",
            "Your organization is active with the CAB."
          ]
        ],
        "sections": [
          {
            "id": "c-portal-menu",
            "title": "Portal menu",
            "bullets": [
              "Below these are Wallet and Company profile.",
              "Logout at the bottom ends the session after a confirmation.",
              "The active item is highlighted.",
              "The order follows the certification journey: apply, offer, audit, findings, certificate."
            ]
          },
          {
            "id": "c-portal-activity",
            "title": "Recent activity and contacts",
            "bullets": [
              "Examples: Invoice due, Certificate issued, Audit plan to confirm, Information requested.",
              "View all activity appears when there are more events than shown.",
              "Email and phone are links that open your mail or dialer."
            ]
          }
        ]
      },
      "ar": {
        "title": "الصفحة الرئيسية لبوابة العميل",
        "summary": "لوحة واحدة تعرض حالة طلبك، وما تطلبه جهة المنح منك، وموعد التدقيق القادم، ومستنداتك وآخر النشاطات.",
        "who": "جميع مستخدمي العميل.",
        "when": "عند كل دخول، لمعرفة المطلوب منك اليوم.",
        "nav": "القائمة الجانبية ← الرئيسية",
        "handoff": "هذه الصفحة للعرض فقط؛ ما تراه هنا هو ما سجّلته جهة المنح من طلبات معلومات وخطط تدقيق وفواتير وشهادات.",
        "screen": [
          "يفتح ملف الشركة للتعديل.",
          "بطاقة الطلب الحالي: رقمه وحالته والمخطط وتواريخه، ومتابعته.",
          "بطاقة طلبات المعلومات من جهة المنح وتاريخ استحقاقها.",
          "بطاقة التدقيق القادم: المرحلة والتاريخ والموقع.",
          "ملخص المستندات: المرفوعة منكم، المطلوبة منكم، المشاركة معكم.",
          "جرس الإشعارات وعدد غير المقروء."
        ],
        "steps": [
          "راجع بطاقة الملخص أعلى الصفحة: اسم المنشأة ومعرف العميل والدولة وجهة الاتصال الرئيسية.",
          "في بطاقة الطلب اضغط «متابعة الطلب» أو «عرض الطلب» للانتقال إلى «الطلبات».",
          "إذا ظهرت بطاقة «مطلوب توضيحات» اضغط «عرض المعلومات المطلوبة» ورد قبل تاريخ الاستحقاق.",
          "اضغط «عرض تفاصيل التدقيق» للانتقال إلى «عمليات التدقيق» وتأكيد الزيارة.",
          "اضغط «عرض جميع المستندات» لفتح المستندات في ملف الشركة.",
          "اضغط رقم المرجع في «النشاط الأخير» للانتقال إلى السجل المرتبط."
        ],
        "rules": [
          "تقرأ البطاقات بياناتك الحية؛ لا يلزم تحديث يدوي.",
          "مراجع الفواتير تفتح «الفواتير»، والشهادات «الشهادات»، والتدقيق «عمليات التدقيق»، والملاحظات «الملاحظات»."
        ],
        "after": [
          "كل إجراء تقوم به في الوحدات الأخرى ينعكس هنا في البطاقات والنشاط الأخير."
        ],
        "tips": [
          "ابدأ يومك من بطاقة طلبات المعلومات والتدقيق القادم؛ هي ما ينتظره منك الطرف الآخر.",
          "يمكنك مراسلة جهة الاتصال مباشرة بالضغط على بريدها أو هاتفها."
        ],
        "fields": [
          [
            "الطلب",
            "آخر طلب فعّال مع حالته؛ المسودة تُظهر «متابعة الطلب» لإكمالها."
          ],
          [
            "لا توجد طلبات مفتوحة / مطلوب توضيحات",
            "تتحول إلى «مطلوب توضيحات» مع نص الطلب وتاريخ الاستحقاق عند وجود طلب مفتوح."
          ],
          [
            "التدقيق القادم",
            "مرحلة التدقيق وتاريخه وموقعه، أو «لم يُحدد موعد تدقيق بعد.»"
          ],
          [
            "المستندات",
            "مرفوعة من قبلكم، مطلوبة من قبلنا، تمت مشاركتها معكم."
          ],
          [
            "النشاط الأخير",
            "التاريخ والتفاصيل والمرجع المرتبط."
          ],
          [
            "جهات الاتصال الخاصة بك في جهة منح الشهادات",
            "مدير العملاء والمدير الفني مع البريد والهاتف."
          ]
        ],
        "statuses": [
          [
            "مُقدَّم",
            "تم إرسال الطلب لجهة المنح."
          ],
          [
            "عميل نشط",
            "حساب المنشأة فعّال لدى جهة المنح."
          ]
        ],
        "sections": [
          {
            "id": "c-portal-menu",
            "title": "قائمة البوابة",
            "bullets": [
              "تحت هذه العناصر أيضًا «المحفظة» و«ملف الشركة».",
              "«تسجيل الخروج» أسفل القائمة ينهي الجلسة بعد التأكيد.",
              "العنصر النشط يظهر بخلفية مميزة.",
              "ترتيب القائمة يتبع رحلة المنح: الطلب، العرض، التدقيق، الملاحظات، الشهادة."
            ]
          },
          {
            "id": "c-portal-activity",
            "title": "النشاط الأخير وجهات الاتصال",
            "bullets": [
              "أمثلة الأحداث: فاتورة مستحقة، صدور شهادة، خطة تدقيق بانتظار التأكيد، طلب معلومات.",
              "يظهر زر «عرض كافة الأنشطة» عندما تزيد الأحداث عن المعروض.",
              "البريد والهاتف روابط تفتح تطبيق البريد أو الاتصال."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "c-company-profile",
    "audience": "client",
    "section": "start",
    "routes": [
      "/portal/company-profile"
    ],
    "open": "/portal/company-profile",
    "updated": "2026-10-25",
    "capture": {
      "as": "client",
      "route": "/portal/company-profile"
    },
    "text": {
      "en": {
        "title": "Company profile",
        "summary": "Your legal data, address, sites, contacts and official documents. Applications, invoices and certificates reuse it.",
        "who": "The client administrator or anyone allowed to edit (view-only users cannot edit).",
        "when": "Right after registration, and whenever your details, sites or contacts change.",
        "nav": "Sidebar → Company profile (or Edit profile on Home)",
        "handoff": "The CAB sees your updated data in its client file and uses it for applications and invoices.",
        "screen": [
          "Essentials tab: company identity, registered address and contacts.",
          "More details tab: sites and branches, official documents and account details.",
          "Change the logo and view upload requirements.",
          "Legal name, country of incorporation, trading name, sector, registration number, website.",
          "Saves company details and address changes.",
          "Discards changes and returns to Home."
        ],
        "steps": [
          "Open Company profile.",
          "Edit Company details and Main address as needed.",
          "Click Save changes. \"Company profile changes saved successfully.\" appears.",
          "To change the logo, click Change logo, pick an image, then Save logo.",
          "Contacts are on Essentials; sites and documents are on More details."
        ],
        "rules": [
          "Logo: PNG, JPG or SVG up to 5 MB, at least 200×200 px.",
          "With unsaved changes, Cancel asks first: Keep editing or Discard & leave.",
          "A legal identity change stays pending until the CAB verifies it; a banner says so."
        ],
        "after": [
          "Saved data pre-fills your next certification request.",
          "Invoices use your registered address at the time they are issued."
        ],
        "tips": [
          "Update sites before you apply; they appear in the branch list of the application form.",
          "Keep the legal name identical to your commercial registration; it prints on the certificate."
        ],
        "fields": [
          [
            "Legal name",
            "Registered name; a change may need CAB verification and shows Change pending."
          ],
          [
            "Country of incorporation",
            "Country where the company is registered."
          ],
          [
            "Trading name (if different)",
            "Optional."
          ],
          [
            "Industry sector",
            "Main business sector."
          ],
          [
            "Company registration number",
            "Commercial registration or license number."
          ],
          [
            "Website",
            "Optional."
          ]
        ],
        "statuses": [
          [
            "Change pending",
            "Your legal name change is under CAB review."
          ],
          [
            "Active",
            "The site is active in your profile."
          ],
          [
            "Primary",
            "The organization's main contact."
          ]
        ],
        "sections": [
          {
            "id": "c-profile-address",
            "title": "Main address",
            "bullets": [
              "The address is saved with Save changes at the top.",
              "New invoices print this address under Bill-to."
            ]
          },
          {
            "id": "c-profile-sites",
            "title": "Sites and contacts",
            "bullets": [
              "Save site stays disabled until name and address are filled.",
              "Save contact needs a name and an email.",
              "New sites appear in the branch list when you fill an application.",
              "Primary marks the main contact.",
              "The ••• menu on a site offers Edit details, Set as active or inactive and Remove site; a site named in an application can only be set inactive.",
              "The ••• menu on a contact offers Edit details, Send email and Remove access; the account owner and your own access cannot be removed."
            ]
          },
          {
            "id": "c-profile-add-site",
            "title": "Add a site or branch",
            "bullets": [
              "After saving, \"Site draft added · saved to profile.\" appears.",
              "The site is added as Active.",
              "Unsaved edits elsewhere on the page are kept."
            ]
          },
          {
            "id": "c-profile-docs",
            "title": "Official documents",
            "bullets": [
              "Click Upload; \"Document uploaded successfully.\" appears.",
              "View all documents on Home opens this section.",
              "Refresh the commercial registration and organization chart when they change.",
              "The ••• menu on a document offers Download, Replace file (PDF, PNG or JPEG) and Remove document."
            ]
          }
        ]
      },
      "ar": {
        "title": "ملف الشركة",
        "summary": "البيانات القانونية والعنوان والمواقع وجهات الاتصال والمستندات الرسمية لمنشأتك. تُستخدم في طلبات المنح والفواتير والشهادات.",
        "who": "مسؤول حساب العميل أو من يملك صلاحية التعديل (المستخدم بصلاحية العرض فقط لا يعدّل).",
        "when": "بعد التسجيل مباشرة، وعند أي تغيير في البيانات أو المواقع أو جهات الاتصال.",
        "nav": "القائمة الجانبية ← ملف الشركة (أو «تعديل الملف التعريفي» في الرئيسية)",
        "handoff": "تظهر بياناتك المحدثة لجهة المنح في ملف العميل لديها، وتُعتمد في الطلبات والفواتير.",
        "screen": [
          "تبويب «البيانات الأساسية»: هوية الشركة والعنوان المسجل وجهات الاتصال.",
          "تبويب «تفاصيل إضافية»: المواقع والفروع والمستندات الرسمية وتفاصيل الحساب.",
          "تغيير الشعار وعرض متطلبات الرفع.",
          "الاسم القانوني ودولة التأسيس والاسم التجاري والقطاع ورقم التسجيل والموقع الإلكتروني.",
          "يحفظ تعديلات بيانات الشركة والعنوان.",
          "يلغي التعديلات ويعود إلى الرئيسية."
        ],
        "steps": [
          "افتح «ملف الشركة».",
          "عدّل حقول «بيانات الشركة» و«العنوان الرئيسي» حسب الحاجة.",
          "اضغط «حفظ التغييرات»؛ تظهر رسالة «تم حفظ تغييرات الملف التعريفي بنجاح.»",
          "لتغيير الشعار اضغط «تغيير الشعار» واختر صورة ثم «حفظ الشعار».",
          "جهات الاتصال في «البيانات الأساسية»، والمواقع والمستندات في «تفاصيل إضافية»."
        ],
        "rules": [
          "الشعار: PNG أو JPG أو SVG حتى 5 ميجابايت وأبعاد لا تقل عن 200×200 بكسل.",
          "عند وجود تعديلات غير محفوظة يسألك «إلغاء» قبل المغادرة: «متابعة التعديل» أو «تجاهل ومغادرة».",
          "تعديل الهوية القانونية يبقى معلقًا حتى تتحقق منه جهة المنح، ويظهر شريط «توجد تغييرات معلقة على الهوية القانونية»."
        ],
        "after": [
          "تُستخدم البيانات المحفوظة لملء طلب المنح الجديد تلقائيًا.",
          "عنوان الفاتورة يُؤخذ من العنوان المسجل وقت إصدارها."
        ],
        "tips": [
          "حدّث المواقع قبل تقديم الطلب؛ تظهر في قائمة الفروع داخل نموذج الطلب.",
          "تأكد أن الاسم القانوني مطابق للسجل التجاري لأنه يظهر على الشهادة."
        ],
        "fields": [
          [
            "الاسم القانوني",
            "الاسم المسجل؛ تعديله قد يحتاج تحقق جهة المنح ويظهر بجانبه «تعديل معلق»."
          ],
          [
            "دولة التأسيس",
            "الدولة المسجلة فيها المنشأة."
          ],
          [
            "الاسم التجاري (إن وجد)",
            "اختياري."
          ],
          [
            "القطاع الصناعي",
            "نشاط المنشأة الرئيسي."
          ],
          [
            "رقم تسجيل الشركة",
            "رقم السجل التجاري أو الترخيص."
          ],
          [
            "الموقع الإلكتروني",
            "اختياري."
          ]
        ],
        "statuses": [
          [
            "تعديل معلق",
            "طلب تعديل الاسم القانوني قيد مراجعة جهة المنح."
          ],
          [
            "نشط",
            "الموقع فعّال في ملفك."
          ],
          [
            "رئيسي",
            "جهة الاتصال الرئيسية للمنشأة."
          ]
        ],
        "sections": [
          {
            "id": "c-profile-address",
            "title": "العنوان الرئيسي",
            "bullets": [
              "يُحفظ العنوان مع زر «حفظ التغييرات» أعلى الصفحة.",
              "يظهر هذا العنوان في خانة «Bill-to» على الفواتير الجديدة."
            ]
          },
          {
            "id": "c-profile-sites",
            "title": "المواقع وجهات الاتصال",
            "bullets": [
              "زر «حفظ الموقع» لا يعمل قبل إدخال الاسم والعنوان.",
              "زر «حفظ جهة الاتصال» يتطلب الاسم والبريد.",
              "المواقع المضافة تظهر في قائمة الفروع عند تعبئة طلب المنح.",
              "«رئيسي» يميز جهة الاتصال الأساسية.",
              "قائمة (•••) في صف الموقع تتيح «تعديل البيانات» و«تعيين كنشط» أو «تعيين كغير نشط» و«حذف الموقع»، والموقع المدرج في طلب يمكن تعيينه كغير نشط فقط.",
              "قائمة (•••) في صف جهة الاتصال تتيح «تعديل البيانات» و«إرسال بريد» و«إلغاء صلاحية الوصول»، ولا يمكن إلغاء صلاحية مالك الحساب أو صلاحيتك أنت."
            ]
          },
          {
            "id": "c-profile-add-site",
            "title": "إضافة موقع أو فرع",
            "bullets": [
              "بعد الحفظ تظهر رسالة «تمت إضافة مسودة الموقع · وحفظها في الملف.»",
              "يُضاف الموقع بحالة «نشط».",
              "لا تتأثر التعديلات غير المحفوظة في بقية الصفحة بإضافة الموقع."
            ]
          },
          {
            "id": "c-profile-docs",
            "title": "المستندات الرسمية",
            "bullets": [
              "اضغط «رفع» لإضافة المستند؛ تظهر رسالة «تم رفع المستند بنجاح.»",
              "رابط «عرض جميع المستندات» في الرئيسية يفتح هذا القسم.",
              "حدّث السجل التجاري والهيكل التنظيمي عند تغيرهما.",
              "قائمة (•••) في صف المستند تتيح «تنزيل» و«استبدال الملف» (PDF أو PNG أو JPEG) و«حذف المستند»."
            ]
          }
        ]
      }
    },
    "related": [
      "national-address"
    ]
  },
  {
    "id": "c-request",
    "audience": "client",
    "section": "certification",
    "routes": [
      "/certification-request/new"
    ],
    "open": "/certification-request/new",
    "updated": "2026-10-24",
    "capture": {
      "as": "client",
      "route": "/certification-request/new"
    },
    "text": {
      "en": {
        "title": "Request certification",
        "summary": "The certification application: entity data, field and IAF sectors, documents, then submission to the CAB.",
        "who": "The client administrator or the quality manager authorized to sign.",
        "when": "When you apply for a new certificate, or for an additional standard.",
        "nav": "Applications → New Certification Request",
        "handoff": "The CAB receives the application, with its order number, in its application register for receipt and review.",
        "screen": [
          "The five Entity data sections; a dot marks the current one.",
          "Field: economic sectors and IAF codes per standard.",
          "Required documents and the final submit button.",
          "Feedback: CAB information requests and your replies.",
          "Pick one or more standards; this drives the questions and the field."
        ],
        "steps": [
          "Open Applications and click New Certification Request.",
          "In Legal identity of the facility, pick the required standard and complete main and regulatory data.",
          "Click Next to save the draft and open Scope of activity and branches.",
          "Complete Consulting and management system readiness, then Specification questions.",
          "In Legal declarations, sign, enter the certificate data in Arabic and English, and tick the acknowledgement.",
          "In Field, choose the economic sectors, then IAF codes for each standard.",
          "In Documents, upload the mandatory files.",
          "Click Submit request. The success message shows your order number."
        ],
        "rules": [
          "Next stays disabled until the required (*) fields of the current section are complete.",
          "Every Next saves the draft first, then moves on.",
          "Organization data is pre-filled from your company profile and can be edited.",
          "The application cannot be changed after submission.",
          "Submit request stays disabled until the acknowledgement in Legal declarations is ticked.",
          "The server checks the whole application on submit and rejects it with the missing items."
        ],
        "after": [
          "Message: \"Your request has been submitted successfully. Order number: ...\".",
          "\"The Application Is Currently Under Technical Review\" appears and the form becomes read-only.",
          "The request shows in Applications as Under review."
        ],
        "tips": [
          "Use Save as Draft often; reopen the draft later from its card.",
          "Complete your company profile and sites before you start.",
          "Review every section before submitting; the application locks afterwards."
        ],
        "fields": [
          [
            "Required Standard Specification",
            "Required; multi-select of 8 standards, or Other with its name."
          ],
          [
            "Request type",
            "Fixed: New (granted)."
          ],
          [
            "Save as Draft",
            "Saves without checking the section is complete."
          ]
        ],
        "statuses": [
          [
            "Under construction",
            "Draft, not submitted yet."
          ],
          [
            "Under review",
            "Submitted; the CAB is reviewing it."
          ],
          [
            "Closed by director's decision",
            "The application was rejected."
          ],
          [
            "The certificate has been issued",
            "Certification completed."
          ]
        ],
        "sections": [
          {
            "id": "c-request-standard",
            "title": "Choose the required standards",
            "bullets": [
              "Available: ISO 9001, ISO 14001, ISO 45001, ISO 50001, ISO 22000, ISO 22301, ISO/IEC 27001, ISO 13485.",
              "Other shows a required Other Standard field.",
              "Remove a standard with the close mark on its tag.",
              "Specification questions and the Field step follow this choice.",
              "ISO 22000 activates the HACCP plans item in Documents."
            ]
          },
          {
            "id": "c-request-regulatory",
            "title": "Legal identity: main and regulatory data",
            "bullets": [
              "The section is complete when every starred field is filled.",
              "Email, mobile or website errors show right under the field."
            ]
          },
          {
            "id": "c-request-scope",
            "title": "Scope of activity and branches",
            "bullets": [
              "With Yes, pick a branch from your profile sites or + Add new branch.",
              "Per branch: employees, employees in audit scope, shifts, expected Stage 1 date, name and address.",
              "Also per branch: integrated system, central administration, activities to audit, products, technical means of communication.",
              "Opening hours, weekly vacation and number of production lines are optional.",
              "Any branch after the first can be removed with its delete icon."
            ]
          },
          {
            "id": "c-request-consulting",
            "title": "Consulting and management system readiness",
            "bullets": [
              "The design question is the only required one here.",
              "These answers help the CAB judge readiness and audit time.",
              "1 is the lowest rating and 10 the highest."
            ]
          },
          {
            "id": "c-request-spec",
            "title": "Specification questions",
            "bullets": [
              "Questions follow the standards chosen in Legal identity.",
              "Answer types: yes/no, number, date, text.",
              "Follow-up questions are only required after a Yes to an earlier one.",
              "ISO 9001: system in place and start date, sites, products/services in scope, outsourced processes, non-applicable requirements, prior certification and its body.",
              "ISO 22000: number of HACCP plans, CCPs and food categories.",
              "ISO 14001, ISO 45001 and ISO 50001 ask about permits, risks and energy.",
              "With no standard that has questions: \"There are no specification questions for the standards you selected.\"",
              "Next stays disabled until every required question is answered."
            ]
          },
          {
            "id": "c-request-declarations",
            "title": "Legal declarations and signature",
            "bullets": [
              "Section One: the certification request in your organization's name.",
              "Section Two: the CAB's confidentiality terms.",
              "Clear erases the drawing to start again.",
              "Upload: PNG or JPG up to 1 MB on a white background.",
              "Once applied, Signed shows with Change signature and Remove.",
              "A signature is required to complete the section."
            ]
          },
          {
            "id": "c-request-signature-type",
            "title": "Type a signature",
            "bullets": [
              "The name is turned into a script-style signature image.",
              "Use the same name as in Authorized signatory.",
              "You can change the signature only before submitting."
            ]
          },
          {
            "id": "c-request-certificate-data",
            "title": "Certificate data and acknowledgement",
            "bullets": [
              "Warning: the order cannot be modified after submission.",
              "Check spelling; these texts print on the issued certificate.",
              "The acknowledgement is required to enable Submit request."
            ]
          },
          {
            "id": "c-request-field",
            "title": "Field: choose the economic sector",
            "bullets": [
              "Each chosen standard has its own tab showing its selection count.",
              "Choices are independent per standard.",
              "Each card shows the sector and a short description.",
              "Selection summary at the bottom counts the chosen sectors.",
              "A yellow hint lists standards still missing a sector.",
              "Next saves the draft and moves on to IAF codes.",
              "With no standard chosen: \"Please select the required standards on the Legal Identity step first.\""
            ]
          },
          {
            "id": "c-request-codes",
            "title": "Field: choose IAF codes",
            "bullets": [
              "Codes are grouped under each sector you chose.",
              "Each card shows the activity name and its Code, e.g. 01, 03 or 30.",
              "A critical code may need specific auditor competence.",
              "Back returns to the sector choice.",
              "Next stays disabled until every standard has at least one code.",
              "\"Draft saved successfully.\" appears as you move on."
            ]
          },
          {
            "id": "c-request-documents",
            "title": "Documents and submission",
            "bullets": [
              "After upload the item shows Uploaded with view, download, delete and replace.",
              "Add more files with Attach additional document.",
              "Formats: PDF, JPG, PNG, max 10 MB per file; several files per item are allowed.",
              "The HACCP plans item is activated automatically for food safety standards.",
              "Submit request works once the acknowledgement is ticked; the server then checks completeness."
            ]
          },
          {
            "id": "c-request-submit",
            "title": "Save and submit bar",
            "bullets": [
              "On the other sections, Next saves the draft and moves on.",
              "Submit request stays disabled until the acknowledgement in Legal declarations is ticked.",
              "On success: \"Your request has been submitted successfully. Order number: ...\" and the technical review screen appears.",
              "If data is missing, the server refuses with the missing items and the application stays a draft.",
              "While saving, the button shows Loading..."
            ]
          }
        ]
      },
      "ar": {
        "title": "طلب المنح",
        "summary": "نموذج طلب الحصول على الشهادة: بيانات الجهة، المجال وقطاعات IAF، المستندات، ثم الإرسال إلى جهة المنح.",
        "who": "مسؤول حساب العميل أو مدير الجودة المخوّل بالتوقيع.",
        "when": "عند طلب شهادة جديدة لأول مرة أو لمواصفة إضافية.",
        "nav": "الطلبات ← طلب منح جديد",
        "handoff": "تستلم جهة المنح الطلب برقمه في سجل الطلبات لديها لتأكيد الاستلام ثم المراجعة.",
        "screen": [
          "أقسام «بيانات الجهة» الخمسة؛ القسم الحالي مميز بنقطة.",
          "المجال: القطاعات الاقتصادية ورموز IAF لكل مواصفة.",
          "المستندات المطلوبة وزر الإرسال النهائي.",
          "الملاحظات: طلبات المعلومات من جهة المنح وردودك.",
          "اختر مواصفة أو أكثر؛ هذا الاختيار يحدد الأسئلة والمجال."
        ],
        "steps": [
          "افتح «الطلبات» واضغط «طلب منح جديد».",
          "في «الهوية القانونية للمنشأة» اختر المواصفة المطلوبة وأكمل البيانات الرئيسية والتنظيمية.",
          "اضغط «التالي» لحفظ المسودة والانتقال إلى «نطاق النشاط والفروع».",
          "أكمل «الاستشارات وجاهزية نظام الإدارة» ثم «أسئلة المواصفات».",
          "في «الإقرارات القانونية» وقّع، وأدخل بيانات الشهادة بالعربية والإنجليزية، وفعّل الإقرار.",
          "في «المجال» اختر القطاعات الاقتصادية ثم رموز IAF لكل مواصفة.",
          "في «المستندات» ارفع الوثائق الإلزامية.",
          "اضغط «إرسال الطلب»؛ يظهر رقم الطلب في رسالة النجاح."
        ],
        "rules": [
          "يبقى «التالي» معطلًا حتى تكتمل الحقول الإلزامية (*) في القسم الحالي.",
          "كل ضغطة على «التالي» تحفظ المسودة أولًا ثم تنتقل.",
          "تُملأ بيانات المنظمة تلقائيًا من ملف الشركة ويمكن تعديلها.",
          "لا يمكن تعديل الطلب بعد الإرسال.",
          "زر «إرسال الطلب» لا يعمل قبل تفعيل خانة الإقرار في «الإقرارات القانونية».",
          "يتحقق الخادم من الطلب كاملًا عند الإرسال، ويرفضه برسالة توضح النواقص."
        ],
        "after": [
          "رسالة: «تم إرسال طلبك بنجاح. رقم الطلب: ...».",
          "تظهر شاشة «الطلب قيد المراجعة الفنية حالياً» ويُقفل النموذج للعرض فقط.",
          "يظهر الطلب في «الطلبات» بحالة «تحت المراجعة»."
        ],
        "tips": [
          "استخدم «حفظ كمسودة» كثيرًا؛ يمكنك العودة لاحقًا من بطاقة الطلب.",
          "أكمل ملف الشركة ومواقعها قبل البدء لتوفير الوقت.",
          "راجع كل الأقسام قبل الإرسال لأن الطلب يُقفل بعده."
        ],
        "fields": [
          [
            "المواصفة القياسية المطلوبة",
            "إلزامي؛ اختيار متعدد من 8 مواصفات أو «أخرى» مع اسمها."
          ],
          [
            "نوع الطلب",
            "ثابت: «جديد (ممنوح)»."
          ],
          [
            "حفظ كمسودة",
            "يحفظ دون التحقق من اكتمال القسم."
          ]
        ],
        "statuses": [
          [
            "قيد الإنشاء",
            "مسودة لم تُرسل بعد."
          ],
          [
            "تحت المراجعة",
            "أُرسل الطلب وتراجعه جهة المنح."
          ],
          [
            "مغلق بقرار المدير",
            "رُفض الطلب."
          ],
          [
            "تم إصدار الشهادة",
            "اكتمل المنح."
          ]
        ],
        "sections": [
          {
            "id": "c-request-standard",
            "title": "اختيار المواصفات المطلوبة",
            "bullets": [
              "المواصفات المتاحة: ISO 9001، ISO 14001، ISO 45001، ISO 50001، ISO 22000، ISO 22301، ISO/IEC 27001، ISO 13485.",
              "اختيار «أخرى» يُظهر حقل «مواصفة أخرى» الإلزامي.",
              "لإزالة مواصفة اضغط علامة الإغلاق على وسمها.",
              "أسئلة المواصفات وخطوة المجال تتبع ما تختاره هنا.",
              "اختيار ISO 22000 يفعّل عنصر خطط HACCP في المستندات."
            ]
          },
          {
            "id": "c-request-regulatory",
            "title": "الهوية القانونية: البيانات الرئيسية والتنظيمية",
            "bullets": [
              "يكتمل القسم عند تعبئة كل الحقول المعلّمة بنجمة.",
              "الأخطاء في البريد أو الجوال أو الموقع تظهر تحت الحقل مباشرة."
            ]
          },
          {
            "id": "c-request-scope",
            "title": "نطاق النشاط والفروع",
            "bullets": [
              "عند «نعم» اختر الفرع من مواقع ملف الشركة أو «+ إضافة فرع جديد».",
              "لكل فرع: عدد الموظفين، الموظفون ضمن نطاق التدقيق، الورديات، تاريخ المرحلة الأولى المتوقع، الاسم والعنوان.",
              "ولكل فرع أيضًا: هل النظام متكامل، هل يتبع الإدارة المركزية، الأنشطة المراد تدقيقها، المنتجات، ووسائل الاتصال التقنية.",
              "حقول ساعات العمل والإجازة الأسبوعية وعدد خطوط الإنتاج اختيارية.",
              "يمكن حذف أي فرع غير الأول من أيقونة الحذف."
            ]
          },
          {
            "id": "c-request-consulting",
            "title": "الاستشارات وجاهزية نظام الإدارة",
            "bullets": [
              "سؤال التصميم هو الإلزامي الوحيد في هذا القسم.",
              "هذه الإجابات تساعد جهة المنح في تقدير الجاهزية ومدة التدقيق.",
              "التقييم 1 هو الأدنى و10 الأعلى."
            ]
          },
          {
            "id": "c-request-spec",
            "title": "أسئلة المواصفات",
            "bullets": [
              "تظهر الأسئلة حسب المواصفات المختارة في الهوية القانونية.",
              "أنواع الإجابات: نعم/لا، رقم، تاريخ، نص.",
              "بعض الأسئلة تابعة لا تُطلب إلا عند الإجابة بـ«نعم» على سؤال سابق.",
              "ISO 9001: وجود النظام وتاريخ بدئه، عدد المواقع، المنتجات والخدمات ضمن النطاق، العمليات المسندة لجهات خارجية، المتطلبات غير القابلة للتطبيق، شهادة سابقة وجهة منحها.",
              "ISO 22000: عدد خطط HACCP ونقاط التحكم الحرجة وفئات الأغذية.",
              "ISO 14001 وISO 45001 وISO 50001 لها أسئلتها عن التصاريح والمخاطر والطاقة.",
              "عند عدم اختيار مواصفة لها أسئلة تظهر: «لا توجد أسئلة مواصفات للمعايير التي اخترتها.»",
              "لا يعمل «التالي» حتى تُجاب كل الأسئلة المطلوبة."
            ]
          },
          {
            "id": "c-request-declarations",
            "title": "الإقرارات القانونية والتوقيع",
            "bullets": [
              "القسم الأول: نص طلب الشهادة باسم منشأتك.",
              "القسم الثاني: شروط السرية التي تلتزم بها جهة المنح.",
              "«مسح» يمحو الرسم للبدء من جديد.",
              "صورة التوقيع: PNG أو JPG حتى 1 ميجابايت على خلفية بيضاء.",
              "بعد الاعتماد تظهر «تم التوقيع» مع «تغيير التوقيع» و«حذف».",
              "التوقيع إلزامي لاكتمال القسم."
            ]
          },
          {
            "id": "c-request-signature-type",
            "title": "التوقيع بالكتابة",
            "bullets": [
              "يُحوَّل الاسم إلى صورة توقيع بخط مائل.",
              "استخدم الاسم نفسه المكتوب في «الموقع المعتمد».",
              "يمكن تغيير التوقيع قبل الإرسال فقط."
            ]
          },
          {
            "id": "c-request-certificate-data",
            "title": "بيانات الشهادة والإقرار",
            "bullets": [
              "تنبيه: لا يمكن تعديل الطلب بعد الإرسال.",
              "تحقق من الإملاء؛ هذه النصوص تظهر على الشهادة الصادرة.",
              "خانة الإقرار شرط لتفعيل زر «إرسال الطلب»."
            ]
          },
          {
            "id": "c-request-field",
            "title": "المجال: اختيار القطاع الاقتصادي",
            "bullets": [
              "لكل مواصفة مختارة تبويب خاص بها يعرض عدد اختياراتها.",
              "اختيار كل مواصفة مستقل عن غيرها.",
              "كل بطاقة تعرض القطاع ووصفًا قصيرًا له.",
              "«ملخص الاختيار» أسفل الشاشة يعرض عدد القطاعات المحددة.",
              "تنبيه أصفر يذكر المواصفات التي ينقصها قطاع.",
              "«التالي» يحفظ المسودة وينتقل إلى رموز IAF.",
              "إذا لم تُختر مواصفة تظهر: «من فضلك اختر المواصفات المطلوبة أولًا من خطوة الهوية القانونية.»"
            ]
          },
          {
            "id": "c-request-codes",
            "title": "المجال: اختيار رموز IAF",
            "bullets": [
              "تُعرض الرموز مجمّعة تحت كل قطاع اخترته.",
              "كل بطاقة تعرض اسم النشاط و«الكود» مثل 01 أو 03 أو 30.",
              "الرمز الحرج قد يتطلب كفاءة خاصة لدى فريق التدقيق.",
              "«السابق» يعيدك إلى اختيار القطاعات.",
              "«التالي» معطل حتى يكون لكل مواصفة رمز واحد على الأقل.",
              "تظهر رسالة «تم حفظ المسودة بنجاح.» عند الانتقال."
            ]
          },
          {
            "id": "c-request-documents",
            "title": "المستندات والإرسال",
            "bullets": [
              "بعد الرفع تتغير الحالة إلى «تم الرفع» مع عرض وتحميل وحذف واستبدال.",
              "مستندات إضافية من «إرفاق مستند إضافي».",
              "الصيغ: PDF وJPG وPNG بحد أقصى 10 ميجابايت للملف، ويُسمح بأكثر من ملف للعنصر.",
              "عنصر خطط HACCP يُفعَّل تلقائيًا مع مواصفات سلامة الغذاء.",
              "«إرسال الطلب» يعمل بعد تفعيل الإقرار، ثم يتحقق الخادم من اكتمال الطلب."
            ]
          },
          {
            "id": "c-request-submit",
            "title": "شريط الحفظ والإرسال",
            "bullets": [
              "في بقية الأقسام يظهر «التالي» الذي يحفظ المسودة ثم ينتقل.",
              "«إرسال الطلب» معطل حتى تفعيل خانة الإقرار في «الإقرارات القانونية».",
              "عند النجاح: «تم إرسال طلبك بنجاح. رقم الطلب: ...» وتظهر شاشة المراجعة الفنية.",
              "عند نقص البيانات يرفض الخادم الإرسال برسالة توضح النواقص، ويبقى الطلب مسودة.",
              "أثناء الحفظ يتحول نص الزر إلى «جاري التحميل...»."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "c-applications",
    "audience": "client",
    "section": "certification",
    "routes": [
      "/portal/applications",
      "/certification-requests"
    ],
    "open": "/portal/applications",
    "updated": "2026-10-25",
    "capture": {
      "as": "client",
      "route": "/portal/applications"
    },
    "text": {
      "en": {
        "title": "My applications",
        "summary": "One card per certification request with order number, status and authorized person. Follow up and answer CAB requests from here.",
        "who": "Client users.",
        "when": "After you submit, and whenever you are notified of an information request or status change.",
        "nav": "Sidebar → Applications",
        "handoff": "Replies sent from Follow up reach the CAB's Information required screen with an \"Information received for ...\" notification.",
        "screen": [
          "Opens a new certification request.",
          "Interactive invoice opens your Invoices.",
          "Request status.",
          "Order number.",
          "Follow up: opens Feedback to answer the CAB.",
          "Order Status: shows the current stage screen."
        ],
        "steps": [
          "Open Applications.",
          "Find the card by its order number.",
          "Click Follow up to read and answer information requests.",
          "Click Order Status to see the current stage.",
          "A draft opens straight on the form so you can finish it."
        ],
        "rules": [
          "A submitted application cannot be edited; answer through Feedback.",
          "Only your organization's requests are listed."
        ],
        "after": [
          "When the CAB asks for information you get \"Information needed for ...\" and Home shows Clarification required.",
          "Once approved and quoted, the offer appears in Offers."
        ],
        "tips": [
          "Answer information requests before their due date to keep your application moving."
        ],
        "fields": [
          [
            "Order number",
            "Assigned on submission; a draft shows \"Draft · not submitted\"."
          ],
          [
            "Name of the authorized person",
            "The representative named in the application."
          ]
        ],
        "statuses": [
          [
            "Under construction",
            "Draft."
          ],
          [
            "Under review",
            "Submitted, under review, or at quotation stage."
          ],
          [
            "Closed by director's decision",
            "Rejected."
          ],
          [
            "The certificate has been issued",
            "Approved."
          ]
        ],
        "sections": [
          {
            "id": "c-app-status",
            "title": "Order status",
            "bullets": [
              "Under review: you are notified when the review is complete.",
              "Approved: \"The Request Has Been Approved\" with stage updates.",
              "Rejected: reasons, the rejection file, and Edit data and resubmit without a new application.",
              "Save and navigation buttons are disabled on the status screen."
            ]
          },
          {
            "id": "c-app-feedback",
            "title": "Answer information requests",
            "bullets": [
              "An application with open information requests shows them here.",
              "Your earlier replies show below the list with name and time.",
              "Choose the request under Replying to; the default is the oldest unanswered one.",
              "Write the reply; use Bold and Insert link if needed.",
              "Attach files with Attach file, then click Send Reply.",
              "Sending needs text or at least one attachment."
            ]
          },
          {
            "id": "c-app-feedback-reply",
            "title": "Write and send the reply",
            "bullets": [
              "After sending, the box clears and your reply appears in the thread.",
              "The request shows as submitted on the CAB side.",
              "You can reply more than once to the same request."
            ]
          }
        ]
      },
      "ar": {
        "title": "طلباتي",
        "summary": "بطاقة لكل طلب منح مع رقمه وحالته والشخص المخول، ومنها تتابع الطلب وترد على طلبات المعلومات.",
        "who": "مستخدمو العميل.",
        "when": "بعد إرسال الطلب، وكلما وصل إشعار بطلب معلومات أو تغيير حالة.",
        "nav": "القائمة الجانبية ← الطلبات",
        "handoff": "ردودك من «متابعة الطلب» تصل إلى جهة المنح في شاشة «معلومات مطلوبة» مع إشعار «وصلت المعلومات للطلب ...».",
        "screen": [
          "يفتح نموذج طلب منح جديد.",
          "«الفاتورة التفاعلية» تفتح «الفواتير».",
          "حالة الطلب.",
          "رقم الطلب.",
          "متابعة الطلب: يفتح «الملاحظات» للرد على جهة المنح.",
          "حالة الطلب: يعرض شاشة المرحلة الحالية."
        ],
        "steps": [
          "افتح «الطلبات».",
          "حدد بطاقة الطلب برقمه.",
          "اضغط «متابعة الطلب» لقراءة طلبات المعلومات والرد عليها.",
          "اضغط «حالة الطلب» لمعرفة المرحلة الحالية.",
          "المسودة تفتح على النموذج مباشرة لإكمالها."
        ],
        "rules": [
          "لا يمكن تعديل بيانات طلب بعد إرساله؛ الرد يكون عبر «الملاحظات».",
          "تظهر طلبات منشأتك فقط."
        ],
        "after": [
          "عند طلب جهة المنح معلومات يصلك إشعار «مطلوب معلومات للطلب ...» وتظهر بطاقة «مطلوب توضيحات» في الرئيسية.",
          "بعد الاعتماد وإصدار عرض السعر يظهر العرض في «العروض»."
        ],
        "tips": [
          "رد على طلبات المعلومات قبل تاريخ الاستحقاق حتى لا يتأخر طلبك."
        ],
        "fields": [
          [
            "رقم الطلب",
            "يُنشأ عند الإرسال؛ المسودة تظهر «مسودة · لم يتم الإرسال»."
          ],
          [
            "اسم الشخص المخول",
            "ممثل المنظمة المذكور في الطلب."
          ]
        ],
        "statuses": [
          [
            "قيد الإنشاء",
            "مسودة."
          ],
          [
            "تحت المراجعة",
            "مُرسل أو قيد المراجعة أو في مرحلة العرض."
          ],
          [
            "مغلق بقرار المدير",
            "مرفوض."
          ],
          [
            "تم إصدار الشهادة",
            "معتمد."
          ]
        ],
        "sections": [
          {
            "id": "c-app-status",
            "title": "حالة الطلب",
            "bullets": [
              "قيد المراجعة: «سيتم إشعاركم عند اكتمال المراجعة».",
              "معتمد: «تمت الموافقة على طلبكم» مع تحديثات المراحل.",
              "مرفوض: سبب الرفض، ملف الأسباب، و«تعديل البيانات وإعادة التقديم» دون فتح طلب جديد.",
              "أزرار الحفظ والتنقل معطلة في شاشة الحالة."
            ]
          },
          {
            "id": "c-app-feedback",
            "title": "الرد على طلبات المعلومات",
            "bullets": [
              "يعرض الطلب الذي لديه طلبات معلومات مفتوحة هذه الطلبات هنا.",
              "تظهر ردودك السابقة أسفل القائمة مع الاسم والتاريخ.",
              "اختر الطلب في «الرد على»؛ الافتراضي أقدم طلب لم يُرد عليه.",
              "اكتب الرد، واستخدم «غامق» و«إدراج رابط» عند الحاجة.",
              "أرفق ملفات من «إرفاق ملف»، ثم «إرسال الرد».",
              "يعمل الإرسال عند وجود نص أو مرفق."
            ]
          },
          {
            "id": "c-app-feedback-reply",
            "title": "كتابة الرد وإرساله",
            "bullets": [
              "بعد الإرسال يُمسح الصندوق ويظهر ردك في السجل.",
              "تتحول حالة الطلب لدى جهة المنح إلى «تم الإرسال».",
              "يمكنك الرد أكثر من مرة على الطلب نفسه."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "c-offers",
    "audience": "client",
    "section": "certification",
    "routes": [
      "/portal/offers"
    ],
    "open": "/portal/offers",
    "statusDomain": "offer",
    "statusValues": [
      "issued",
      "approved",
      "rejected",
      "void"
    ],
    "updated": "2026-10-24",
    "capture": {
      "as": "client",
      "route": "/portal/offers"
    },
    "text": {
      "en": {
        "title": "Offers",
        "summary": "The quotations the CAB issued for your application. Accept or reject them here.",
        "who": "The client's decision maker (owner or authorized manager).",
        "when": "After the CAB approves and issues the quotation; you get an \"Offer ... is ready\" notification.",
        "nav": "Sidebar → Offers",
        "handoff": "The CAB sees the offer status and history (\"Accepted by client\" or \"Rejected by client\") with your note; on acceptance it also finds the advance invoice and the draft audit plan.",
        "screen": [
          "Search by offer number.",
          "Filter by status.",
          "Offer number.",
          "Accept the offer.",
          "Reject the offer.",
          "Download the offer as PDF."
        ],
        "steps": [
          "Open Offers and check Amount, Currency and Valid Until.",
          "Download the PDF and review it internally if needed.",
          "Click Accept offer or Reject offer.",
          "Optionally add a note to the certification body.",
          "Confirm with the Accept or Reject button in the dialog."
        ],
        "rules": [
          "Accept and Reject appear only on an Issued offer.",
          "An accepted offer cannot be rejected or voided later.",
          "You cannot respond twice to the same offer."
        ],
        "after": [
          "Accepting confirms the quotation.",
          "A 50% advance invoice is raised and appears in Invoices.",
          "The CAB gets a draft Stage 1 audit plan.",
          "Rejecting tells the CAB you declined."
        ],
        "tips": [
          "Use the note to explain a rejection or a condition; it helps the CAB revise the offer."
        ],
        "fields": [
          [
            "Offer",
            "Offer number linked to your application."
          ],
          [
            "Amount / Currency",
            "Total fees and currency."
          ],
          [
            "Valid Until",
            "Last day the offer is valid."
          ],
          [
            "Note to the certification body (optional)",
            "Text sent with your response."
          ]
        ],
        "statuses": [
          [
            "Issued",
            "Waiting for your response."
          ],
          [
            "Approved",
            "Approved."
          ],
          [
            "Rejected",
            "You rejected it."
          ],
          [
            "Void",
            "Cancelled by the CAB."
          ]
        ],
        "sections": [
          {
            "id": "c-offer-accept",
            "title": "Accept offer dialog",
            "bullets": [
              "Dialog text: accepting confirms the quotation; the CAB then plans your audit and issues the advance invoice.",
              "After confirming, the table refreshes and the response buttons disappear.",
              "The new invoice shows in Invoices and in the wallet's Financial dues."
            ]
          },
          {
            "id": "c-offer-reject",
            "title": "Reject offer dialog",
            "bullets": [
              "The CAB is told that you rejected this offer.",
              "The offer status changes to Rejected.",
              "The CAB can prepare and issue a revised offer."
            ]
          }
        ]
      },
      "ar": {
        "title": "العروض",
        "summary": "عروض الأسعار التي أصدرتها جهة المنح لطلبك. تقبل العرض أو ترفضه من هنا.",
        "who": "صاحب القرار لدى العميل (المالك أو المدير المخوّل).",
        "when": "بعد اعتماد جهة المنح لعرض السعر وإصداره، ويصلك إشعار «العرض ... جاهز».",
        "nav": "القائمة الجانبية ← العروض",
        "handoff": "تظهر لجهة المنح حالة العرض وسجله «قبله العميل» أو «رفضه العميل» مع ملاحظتك؛ وعند القبول تجد الفاتورة المقدمة ومسودة خطة التدقيق.",
        "screen": [
          "البحث برقم العرض.",
          "تصفية حسب الحالة.",
          "رقم العرض.",
          "قبول العرض.",
          "رفض العرض.",
          "تحميل ملف PDF للعرض."
        ],
        "steps": [
          "افتح «العروض» وراجع المبلغ والعملة وتاريخ «صالح حتى».",
          "حمّل العرض PDF وراجعه داخليًا إذا لزم.",
          "اضغط «قبول العرض» أو «رفض العرض».",
          "اكتب ملاحظة لجهة المنح إن أردت (اختياري).",
          "أكّد بالضغط على زر القبول أو الرفض في النافذة."
        ],
        "rules": [
          "زرا القبول والرفض يظهران فقط للعرض بحالة «صادر».",
          "العرض المقبول لا يمكن رفضه أو إلغاؤه لاحقًا.",
          "لا يمكن الرد مرتين على العرض نفسه."
        ],
        "after": [
          "القبول يؤكد عرض السعر.",
          "تصدر فاتورة الدفعة المقدمة (50% من الرسوم) وتظهر في «الفواتير».",
          "تُنشأ مسودة خطة تدقيق المرحلة الأولى لدى جهة المنح.",
          "الرفض يُبلغ جهة المنح برفضك."
        ],
        "tips": [
          "استخدم الملاحظة لتوضيح سبب الرفض أو أي شرط؛ تسهّل على جهة المنح تعديل العرض."
        ],
        "fields": [
          [
            "العرض",
            "رقم العرض المرتبط بطلبك."
          ],
          [
            "المبلغ / العملة",
            "إجمالي الرسوم وعملتها."
          ],
          [
            "صالح حتى",
            "آخر تاريخ لصلاحية العرض."
          ],
          [
            "ملاحظة لجهة إصدار الشهادات (اختياري)",
            "نص يصل مع ردك."
          ]
        ],
        "statuses": [
          [
            "صادر",
            "بانتظار ردك."
          ],
          [
            "معتمد",
            "معتمد."
          ],
          [
            "مرفوض",
            "رفضته."
          ],
          [
            "ملغى",
            "ألغته جهة المنح."
          ]
        ],
        "sections": [
          {
            "id": "c-offer-accept",
            "title": "نافذة قبول العرض",
            "bullets": [
              "نص النافذة: قبول العرض يؤكد عرض السعر، ثم تخطط جهة المنح للتدقيق وتُصدر الفاتورة المقدمة.",
              "بعد التأكيد يُحدَّث الجدول وتختفي أزرار الرد.",
              "الفاتورة الجديدة تظهر في «الفواتير» وفي «المستحقات المالية» بالمحفظة."
            ]
          },
          {
            "id": "c-offer-reject",
            "title": "نافذة رفض العرض",
            "bullets": [
              "سيتم إبلاغ جهة المنح برفضك لهذا العرض.",
              "تتحول حالة العرض إلى «مرفوض».",
              "يمكن لجهة المنح إعداد نسخة معدلة من العرض وإصدارها من جديد."
            ]
          }
        ]
      }
    },
    "related": [
      "offer-lifecycle"
    ]
  },
  {
    "id": "c-invoices",
    "audience": "client",
    "section": "billing",
    "routes": [
      "/portal/invoices",
      "/portal/invoices/:invoiceId"
    ],
    "open": "/portal/invoices",
    "statusDomain": "cabInvoice",
    "statusValues": [
      "Issued",
      "Partially paid",
      "Paid",
      "Unpaid"
    ],
    "updated": "2026-10-24",
    "capture": {
      "as": "client",
      "route": "/portal/invoices"
    },
    "text": {
      "en": {
        "title": "Invoices",
        "summary": "Invoices issued to you by the CAB with amount, paid, balance and payment status.",
        "who": "The client's finance contact or account administrator.",
        "when": "After accepting an offer (advance invoice) and for each new invoice or due-date notification.",
        "nav": "Sidebar → Invoices",
        "handoff": "The CAB records your payment in its invoice register, and the balance and status update in your portal.",
        "screen": [
          "Search by invoice number.",
          "Invoice number.",
          "Remaining balance.",
          "Invoice status.",
          "Actions menu: View invoice.",
          "Export the list."
        ],
        "steps": [
          "Open Invoices.",
          "Filter by payment status or search by invoice number.",
          "Click the actions icon, then View invoice.",
          "Check the items, tax, total and balance.",
          "Pay the CAB by bank transfer as stated on the invoice."
        ],
        "rules": [
          "The list is read-only; clients do not edit invoices.",
          "The CAB records payments, which updates Paid, Balance and Status."
        ],
        "after": [
          "You get an \"Invoice ... due\" notification before the due date.",
          "Unpaid invoices count in the wallet's Financial dues."
        ],
        "tips": [
          "Quote the invoice number in your bank transfer reference to speed up matching."
        ],
        "fields": [
          [
            "Invoice",
            "Invoice number."
          ],
          [
            "Issued / Due",
            "Issue date and payment deadline."
          ],
          [
            "Amount / Paid / Balance",
            "Total, paid and remaining."
          ]
        ],
        "statuses": [
          [
            "Issued",
            "Issued, not paid yet."
          ],
          [
            "Partially paid",
            "Part of it has been paid."
          ],
          [
            "Paid",
            "Fully paid."
          ],
          [
            "Unpaid",
            "Filter for invoices not yet paid."
          ]
        ],
        "sections": [
          {
            "id": "c-invoice-details",
            "title": "Invoice details",
            "bullets": [
              "Shows client, primary contact, application, PO reference and currency.",
              "Amounts: Subtotal, Tax, Total, Amount paid, Balance due.",
              "Tabs: Invoice items, Installments, Attachments, More details.",
              "Read-only in the portal."
            ]
          }
        ]
      },
      "ar": {
        "title": "الفواتير",
        "summary": "الفواتير الصادرة لكم من جهة منح الشهادات مع المبلغ والمدفوع والرصيد وحالة الدفع.",
        "who": "المسؤول المالي أو مسؤول الحساب لدى العميل.",
        "when": "بعد قبول العرض (فاتورة الدفعة المقدمة) وعند كل فاتورة جديدة أو إشعار استحقاق.",
        "nav": "القائمة الجانبية ← الفواتير",
        "handoff": "تسجل جهة المنح دفعتك في سجل الفواتير لديها، فيتحدّث الرصيد والحالة في بوابتك.",
        "screen": [
          "البحث برقم الفاتورة.",
          "رقم الفاتورة.",
          "الرصيد المتبقي.",
          "حالة الفاتورة.",
          "قائمة الإجراءات: «عرض الفاتورة».",
          "تصدير القائمة."
        ],
        "steps": [
          "افتح «الفواتير».",
          "صفِّ حسب «حالة الدفع» أو ابحث برقم الفاتورة.",
          "اضغط أيقونة الإجراءات ثم «عرض الفاتورة».",
          "راجع البنود والضريبة والإجمالي والرصيد.",
          "ادفع لجهة المنح بالتحويل البنكي حسب بيانات الفاتورة."
        ],
        "rules": [
          "القائمة للعرض فقط؛ لا يعدّل العميل الفواتير.",
          "تسجّل جهة المنح الدفعات، فيتغير المدفوع والرصيد والحالة."
        ],
        "after": [
          "يصلك إشعار «استحقاق الفاتورة ...» قبل موعد الدفع.",
          "تظهر الفواتير غير المسددة في «المستحقات المالية» بالمحفظة."
        ],
        "tips": [
          "اذكر رقم الفاتورة في مرجع التحويل البنكي لتسريع المطابقة."
        ],
        "fields": [
          [
            "الفاتورة",
            "رقم الفاتورة."
          ],
          [
            "تاريخ الإصدار / تاريخ الاستحقاق",
            "موعد الإصدار وآخر موعد للدفع."
          ],
          [
            "المبلغ / المدفوع / الرصيد",
            "الإجمالي والمسدد والمتبقي."
          ]
        ],
        "statuses": [
          [
            "صادرة",
            "صدرت ولم تُسدد."
          ],
          [
            "مدفوعة جزئياً",
            "سُدد جزء منها."
          ],
          [
            "مدفوعة",
            "سُددت بالكامل."
          ],
          [
            "غير مدفوعة",
            "خيار تصفية للفواتير غير المسددة."
          ]
        ],
        "sections": [
          {
            "id": "c-invoice-details",
            "title": "تفاصيل الفاتورة",
            "bullets": [
              "تظهر بيانات العميل وجهة الاتصال والطلب ومرجع أمر الشراء والعملة.",
              "المبالغ: المجموع الفرعي، الضريبة، الإجمالي، المدفوع، الرصيد.",
              "تبويبات: بنود الفاتورة، الأقساط، المرفقات، تفاصيل إضافية.",
              "العرض للقراءة فقط في البوابة."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "c-wallet",
    "audience": "client",
    "section": "billing",
    "routes": [
      "/portal/wallet"
    ],
    "open": "/portal/wallet",
    "updated": "2026-10-25",
    "capture": {
      "as": "client",
      "route": "/portal/wallet"
    },
    "text": {
      "en": {
        "title": "Wallet",
        "summary": "Your balance with the CAB, your dues and your transaction history.",
        "who": "The client's finance contact.",
        "when": "To follow balance and dues, or to export your transaction history.",
        "nav": "Sidebar → Wallet",
        "handoff": "The wallet is view-only for the client; the CAB records bank-transfer payments it receives.",
        "screen": [
          "Credit available for audit and accreditation contracts.",
          "Recharge balance: online top-up is not available yet; pay the CAB by bank transfer.",
          "Funds in process and bank confirmation.",
          "Total of unpaid invoices.",
          "Linked bank accounts."
        ],
        "steps": [
          "Open Wallet and check the four balance cards.",
          "Scroll to History of financial transactions to search and filter.",
          "Use Download to PDF or Export to Excel.",
          "Click Preview or Print the invoice on a transaction row."
        ],
        "rules": [
          "Online top-up, saved payment methods and refund requests are not available yet: there is no payment gateway.",
          "The wallet shows: \"Online top-up is not available yet. Contact the CAB to pay by bank transfer.\""
        ],
        "after": [
          "Payments recorded by the CAB update the history and dues."
        ],
        "tips": [
          "Export to Excel to reconcile with your own accounts."
        ],
        "fields": [
          [
            "Available Credit",
            "Usable balance."
          ],
          [
            "Suspended balance",
            "Amounts awaiting bank confirmation."
          ],
          [
            "Financial dues",
            "What you owe on invoices."
          ],
          [
            "Refunds are under review",
            "Refund requests not yet settled."
          ]
        ],
        "statuses": [
          [
            "Successful",
            "Completed transaction."
          ],
          [
            "Unsuccessful",
            "Failed transaction."
          ]
        ],
        "sections": [
          {
            "id": "c-wallet-history",
            "title": "Transaction history",
            "bullets": [
              "Filters: type, From/To dates, status, and amount More than/Less than.",
              "Preview and Print the invoice on each row."
            ]
          }
        ]
      },
      "ar": {
        "title": "المحفظة",
        "summary": "رصيدك لدى جهة المنح، والمستحقات، وسجل المعاملات المالية.",
        "who": "المسؤول المالي لدى العميل.",
        "when": "لمتابعة الرصيد والمستحقات أو استخراج سجل المعاملات.",
        "nav": "القائمة الجانبية ← المحفظة",
        "handoff": "المحفظة للعرض لدى العميل؛ جهة المنح هي من تسجل الدفعات المستلمة بالتحويل.",
        "screen": [
          "الرصيد المتاح لعقود التدقيق والاعتماد.",
          "شحن الرصيد: الشحن الإلكتروني غير متاح بعد؛ ادفع لجهة منح الشهادات بالتحويل البنكي.",
          "أموال قيد المعالجة وتأكيد البنك.",
          "إجمالي الفواتير غير المسددة.",
          "الحسابات البنكية المرتبطة."
        ],
        "steps": [
          "افتح «المحفظة» وراجع البطاقات الأربع.",
          "انزل إلى «سجل المعاملات المالية» للبحث والتصفية.",
          "استخدم «تحميل PDF» أو «تصدير Excel» لاستخراج السجل.",
          "اضغط «معاينة» أو «طباعة الفاتورة» في سطر المعاملة."
        ],
        "rules": [
          "الشحن الإلكتروني وحفظ طرق الدفع وطلبات الاسترداد غير متاحة بعد لعدم وجود بوابة دفع.",
          "تعرض المحفظة رسالة: «الشحن الإلكتروني غير متاح حالياً. تواصل مع جهة إصدار الشهادات للدفع عن طريق التحويل البنكي.»"
        ],
        "after": [
          "تنعكس الدفعات التي تسجلها جهة المنح على السجل والمستحقات."
        ],
        "tips": [
          "صدّر السجل إلى Excel للمطابقة مع حساباتك."
        ],
        "fields": [
          [
            "الرصيد المتاح",
            "رصيد قابل للاستخدام."
          ],
          [
            "الرصيد المعلق",
            "مبالغ بانتظار تأكيد البنك."
          ],
          [
            "المستحقات المالية",
            "ما عليك من فواتير."
          ],
          [
            "استردادات قيد المراجعة",
            "طلبات استرداد لم تُحسم."
          ]
        ],
        "statuses": [
          [
            "ناجحة",
            "معاملة مكتملة."
          ],
          [
            "غير ناجحة",
            "معاملة فشلت."
          ]
        ],
        "sections": [
          {
            "id": "c-wallet-history",
            "title": "سجل المعاملات المالية",
            "bullets": [
              "عوامل التصفية: النوع، الفترة من/إلى، الحالة، والمبلغ أكثر من/أقل من.",
              "«معاينة» و«طباعة الفاتورة» لكل سطر."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "c-audits",
    "audience": "client",
    "section": "certification",
    "routes": [
      "/portal/audits"
    ],
    "open": "/portal/audits",
    "updated": "2026-10-27",
    "related": ["c-audit-progress"],
    "capture": {
      "as": "client",
      "route": "/portal/audits"
    },
    "text": {
      "en": {
        "title": "Audits: confirm the visit",
        "summary": "The audit visits whose plans the CAB sent to you. Confirm the visit date here.",
        "who": "The client administrator or quality manager.",
        "when": "When you get a \"Confirm audit plan ...\" notification.",
        "nav": "Sidebar → Audits (page title: Periodic visits)",
        "handoff": "The CAB receives an \"Audit plan ... awaiting approval\" notification and sees your confirmation on its audit plan.",
        "screen": [
          "Proposed visit date.",
          "Procedure: periodic, or Periodic and expanding.",
          "A confirmed visit.",
          "Confirms the visit.",
          "Download to PDF or Export to Excel."
        ],
        "steps": [
          "Open Audits.",
          "Check certificate number, specification, economic sector and visiting date.",
          "Arrange the site and people internally for that date.",
          "Click Confirm visit. The column changes to Confirmed at once."
        ],
        "rules": [
          "Only visits linked to an audit plan sent by the CAB can be confirmed.",
          "You cannot confirm while the CAB is revising the plan; a message says so.",
          "A confirmed visit cannot be confirmed again.",
          "If the CAB reschedules, your confirmation is cleared and the visit shows the new date to confirm again."
        ],
        "after": [
          "The card Audits in progress and reports shows the progress of each audit and the issued reports to acknowledge.",
          "The CAB stores when and by whom the visit was confirmed.",
          "The Upcoming audit card on Home shows stage, date and site."
        ],
        "tips": [
          "If the date does not suit you, do not confirm; ask your client manager to reschedule."
        ],
        "fields": [
          [
            "Certificate number",
            "Certificate the visit relates to."
          ],
          [
            "Specification name",
            "Standard being audited."
          ],
          [
            "Economic sector",
            "Sector code."
          ],
          [
            "Visiting date",
            "Audit start date."
          ],
          [
            "Procedures",
            "periodic, or Periodic and expanding."
          ],
          [
            "Confirmation",
            "Confirm visit button or Confirmed."
          ]
        ],
        "statuses": [
          [
            "Confirm visit",
            "Waiting for your confirmation."
          ],
          [
            "Confirmed",
            "You confirmed the date."
          ]
        ],
        "sections": [
          {
            "id": "c-audit-confirmed",
            "title": "After you confirm",
            "bullets": [
              "There is no dialog; clicking the button confirms at once.",
              "On failure: \"The visit could not be confirmed. Please try again.\"",
              "A CAB reschedule brings back Confirm visit with the new date.",
              "Agenda days shift by the same number of days when rescheduled."
            ]
          }
        ]
      },
      "ar": {
        "title": "عمليات التدقيق: تأكيد الزيارة",
        "summary": "قائمة زيارات التدقيق التي أرسلت جهة المنح خططها إليك، وفيها تؤكد موعد الزيارة.",
        "who": "مسؤول الحساب أو مدير الجودة لدى العميل.",
        "when": "عند وصول إشعار «أكّد خطة التدقيق ...».",
        "nav": "القائمة الجانبية ← عمليات التدقيق (عنوان الصفحة: الزيارات الدورية)",
        "handoff": "يصل لجهة المنح إشعار «خطة التدقيق ... بانتظار الاعتماد» ويظهر التأكيد على خطة التدقيق لديها.",
        "screen": [
          "تاريخ الزيارة المقترح.",
          "نوع الإجراء: دوري، أو دوري وتوسع.",
          "زيارة مؤكدة.",
          "يؤكد الزيارة.",
          "تحميل القائمة PDF أو تصديرها Excel."
        ],
        "steps": [
          "افتح «عمليات التدقيق».",
          "راجع رقم الشهادة والمواصفة والقطاع الاقتصادي وتاريخ الزيارة.",
          "نسّق داخليًا لتجهيز الموقع والأشخاص في الموعد.",
          "اضغط «تأكيد الزيارة»؛ يتغير العمود إلى «مؤكدة» فورًا."
        ],
        "rules": [
          "يمكن تأكيد الزيارة المرتبطة بخطة تدقيق أرسلتها جهة المنح فقط.",
          "لا يمكن التأكيد أثناء مراجعة جهة المنح للخطة؛ تظهر رسالة بذلك.",
          "الزيارة المؤكدة لا تُؤكد مرة أخرى.",
          "إذا أعادت جهة المنح جدولة الخطة يُلغى التأكيد وتظهر الزيارة بموعدها الجديد لتأكيدها من جديد."
        ],
        "after": [
          "تعرض بطاقة «التدقيقات الجارية والتقارير» سير كل تدقيق والتقارير الصادرة التي تنتظر تأكيد الاستلام.",
          "تحفظ جهة المنح وقت تأكيدك ومن أكّد.",
          "بطاقة «التدقيق القادم» في الرئيسية تعرض المرحلة والموعد والموقع."
        ],
        "tips": [
          "إذا كان الموعد غير مناسب فلا تؤكد؛ تواصل مع مدير العملاء لطلب إعادة الجدولة."
        ],
        "fields": [
          [
            "رقم الشهادة",
            "الشهادة المرتبطة بالزيارة."
          ],
          [
            "اسم المواصفة",
            "المواصفة التي يجري تدقيقها."
          ],
          [
            "القطاع الاقتصادي",
            "رمز القطاع."
          ],
          [
            "تاريخ الزيارة",
            "تاريخ بدء التدقيق."
          ],
          [
            "الإجراءات",
            "دوري، أو دوري وتوسع."
          ],
          [
            "التأكيد",
            "زر التأكيد أو «مؤكدة»."
          ]
        ],
        "statuses": [
          [
            "تأكيد الزيارة",
            "بانتظار تأكيدك."
          ],
          [
            "مؤكدة",
            "أكدت الموعد."
          ]
        ],
        "sections": [
          {
            "id": "c-audit-confirmed",
            "title": "بعد تأكيد الزيارة",
            "bullets": [
              "لا تظهر نافذة تأكيد؛ الضغط على الزر يؤكد مباشرة.",
              "عند فشل التأكيد تظهر: «تعذّر تأكيد الزيارة. يرجى المحاولة مرة أخرى.»",
              "إعادة الجدولة من جهة المنح تعيد الزر «تأكيد الزيارة» بالموعد الجديد.",
              "تُنقل أيام جدول الأعمال بالفرق نفسه عند إعادة الجدولة."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "c-findings",
    "audience": "client",
    "section": "certification",
    "routes": [
      "/portal/findings"
    ],
    "open": "/portal/findings",
    "statusDomain": "nonconformity",
    "statusValues": [
      "open",
      "in_progress",
      "submitted",
      "closed",
      "overdue"
    ],
    "updated": "2026-10-24",
    "capture": {
      "as": "client",
      "route": "/portal/findings"
    },
    "text": {
      "en": {
        "title": "Findings (nonconformities)",
        "summary": "Nonconformities raised at your audits with their response dates, and your corrective-action responses.",
        "who": "The quality manager and corrective-action owners.",
        "when": "After the audit report is finalized, when you get \"Response due on ...\".",
        "nav": "Sidebar → Findings",
        "handoff": "The CAB sees each finding's status in its nonconformity register.",
        "screen": [
          "How many findings await your response.",
          "Filter by status.",
          "NC ID and audit number.",
          "Response deadline.",
          "Opens the response screen.",
          "Opens a closed or submitted finding."
        ],
        "steps": [
          "Open Findings.",
          "Prioritize by Response due and the Overdue badge.",
          "Click Respond on an open finding.",
          "After submitting, follow its status here."
        ],
        "rules": [
          "Overdue is computed: no response submitted and the due date has passed.",
          "Respond shows on findings awaiting your answer; View on the others."
        ],
        "after": [
          "If a revision is requested, the finding returns to In progress and you get \"Response due on ...\"."
        ],
        "tips": [
          "Handle major findings first; they can block the certification decision."
        ],
        "fields": [
          [
            "NC ID",
            "e.g. NC-0420, with the audit number."
          ],
          [
            "Clause / requirement",
            "Clause and finding text."
          ],
          [
            "Classification",
            "Major or Minor."
          ],
          [
            "Raised / Response due",
            "Date raised and response deadline."
          ]
        ],
        "statuses": [
          [
            "Open",
            "No response started."
          ],
          [
            "In progress",
            "Draft saved, or the CAB asked for a revision."
          ],
          [
            "Submitted",
            "Response sent; the CAB is reviewing it."
          ],
          [
            "Closed",
            "Verified and closed by the CAB."
          ],
          [
            "Overdue",
            "Past the response date, not submitted."
          ]
        ]
      },
      "ar": {
        "title": "الملاحظات (حالات عدم المطابقة)",
        "summary": "حالات عدم المطابقة المسجلة في تدقيقكم مع مواعيد الرد، وردودكم بالإجراءات التصحيحية.",
        "who": "مدير الجودة والمسؤولون عن الإجراءات التصحيحية لدى العميل.",
        "when": "بعد اعتماد تقرير التدقيق، عند وصول إشعار «مطلوب ردكم على ...».",
        "nav": "القائمة الجانبية ← الملاحظات",
        "handoff": "تظهر لجهة المنح حالة كل ملاحظة في سجل حالات عدم المطابقة لديها.",
        "screen": [
          "عدد الملاحظات التي تنتظر ردكم.",
          "تصفية حسب الحالة.",
          "رقم عدم المطابقة ورقم التدقيق.",
          "آخر موعد للرد.",
          "يفتح شاشة الرد.",
          "يعرض ملاحظة مغلقة أو مُرسلة."
        ],
        "steps": [
          "افتح «الملاحظات».",
          "رتّب أولوياتك حسب «موعد الرد» وشارة «متأخرة».",
          "اضغط «الرد» على الملاحظة المفتوحة.",
          "بعد الإرسال تابع حالتها من هذه القائمة."
        ],
        "rules": [
          "«متأخرة» تُحسب تلقائيًا: لم يُرسل الرد وتجاوز موعده.",
          "زر «الرد» يظهر للملاحظات التي تنتظر ردك، و«عرض» لغيرها."
        ],
        "after": [
          "عند طلب التعديل تعود الملاحظة «قيد التنفيذ» ويصلك إشعار «مطلوب ردكم على ...»."
        ],
        "tips": [
          "ابدأ بالملاحظات الرئيسية؛ قد تؤثر على قرار المنح."
        ],
        "fields": [
          [
            "رقم عدم المطابقة",
            "مثل NC-0420 مع رقم التدقيق."
          ],
          [
            "البند / المتطلب",
            "البند ووصف الملاحظة."
          ],
          [
            "التصنيف",
            "رئيسية أو ثانوية."
          ],
          [
            "تاريخ التسجيل / موعد الرد",
            "تاريخ التسجيل وآخر موعد للرد."
          ]
        ],
        "statuses": [
          [
            "مفتوحة",
            "لم يبدأ الرد."
          ],
          [
            "قيد التنفيذ",
            "حُفظت مسودة أو طلبت جهة المنح تعديلًا."
          ],
          [
            "تم الإرسال",
            "أُرسل الرد وتراجعه جهة المنح."
          ],
          [
            "مغلقة",
            "تحققت جهة المنح وأغلقتها."
          ],
          [
            "متأخرة",
            "تجاوزت موعد الرد دون إرسال."
          ]
        ]
      }
    }
  },
  {
    "id": "c-finding-respond",
    "audience": "client",
    "section": "certification",
    "routes": [
      "/portal/findings/:ncId/respond"
    ],
    "open": "/portal/findings",
    "statusDomain": "nonconformity",
    "statusValues": [
      "open",
      "in_progress",
      "submitted",
      "closed"
    ],
    "updated": "2026-10-24",
    "capture": {
      "as": "client",
      "route": "/portal/findings/nc-0420/respond"
    },
    "text": {
      "en": {
        "title": "Respond to a finding",
        "summary": "Enter the correction, root cause and corrective action, set the responsible person and target date, upload evidence, then submit to the CAB.",
        "who": "The quality manager or the corrective-action owner.",
        "when": "Before the finding's response date.",
        "nav": "Findings → Respond",
        "handoff": "The CAB gets \"Response received on ...\" and sees the finding as Submitted, ready to request a revision or close it.",
        "screen": [
          "Original finding text and raised date (read-only).",
          "Correction: the immediate containment action.",
          "Root cause: the underlying cause found by analysis.",
          "Corrective action: what prevents recurrence.",
          "Implementation evidence: at least one file."
        ],
        "steps": [
          "Open the finding from Findings with Respond.",
          "Write the Correction, Root cause and Corrective action.",
          "Drag evidence files onto the upload area, or click to upload.",
          "Under More details, choose the Responsible person and Target date.",
          "Click Save response draft to keep your work without sending.",
          "Click Submit response when complete."
        ],
        "rules": [
          "Submitting needs all five required fields and at least one evidence file.",
          "Missing items show \"This field is required.\" and \"Upload at least one evidence file.\"",
          "After submission the screen is read-only until the CAB requests a revision.",
          "A closed finding is always read-only."
        ],
        "after": [
          "Status changes to Submitted and Last saved updates.",
          "The CAB reviews it, then requests a revision or closes it after verification.",
          "On a revision request the fields reopen and you are notified."
        ],
        "tips": [
          "Keep correction (immediate fix) separate from corrective action (prevent recurrence).",
          "Upload clear evidence: records, photos, training minutes.",
          "Save a draft after each part so you do not lose work."
        ],
        "fields": [
          [
            "Correction *",
            "Up to 1,000 characters."
          ],
          [
            "Root cause *",
            "Up to 1,000 characters."
          ],
          [
            "Corrective action *",
            "Up to 1,000 characters."
          ],
          [
            "Implementation evidence *",
            "PDF, DOCX, JPG, PNG, max 10 MB."
          ],
          [
            "Responsible person *",
            "From your organization's people."
          ],
          [
            "Target date *",
            "When the action will be done."
          ],
          [
            "Effectiveness review / Comments",
            "Completed by the CAB only."
          ]
        ],
        "statuses": [
          [
            "Open",
            "No response saved."
          ],
          [
            "In progress",
            "Draft saved or revision requested."
          ],
          [
            "Submitted",
            "Awaiting CAB verification."
          ],
          [
            "Closed",
            "The CAB verified effectiveness."
          ]
        ],
        "sections": [
          {
            "id": "c-respond-details",
            "title": "More details: owner and date",
            "bullets": [
              "Effectiveness review result: Not yet reviewed, Effective, Partially effective, Not effective.",
              "Status shows the finding's current status.",
              "The section can be collapsed and expanded."
            ]
          },
          {
            "id": "c-respond-submit",
            "title": "Save and submit",
            "bullets": [
              "Target closure date is the response deadline.",
              "Saving moves the status from Open to In progress.",
              "Both buttons are disabled after submission or closure."
            ]
          },
          {
            "id": "c-respond-validation",
            "title": "Validation messages",
            "bullets": [
              "Messages appear when you click Submit response on an incomplete response.",
              "Nothing is sent until every field is fixed.",
              "Save response draft does not require complete fields."
            ]
          },
          {
            "id": "c-respond-closed",
            "title": "Closed finding (read-only)",
            "bullets": [
              "This is how a response looks after submission or closure: fields and buttons are disabled.",
              "The Activity log tab lists the sequence of events.",
              "Related records and Attachments tabs show links and evidence."
            ]
          }
        ]
      },
      "ar": {
        "title": "الرد على الملاحظة",
        "summary": "تكتب التصحيح والسبب الجذري والإجراء التصحيحي، وتحدد المسؤول والتاريخ المستهدف، وترفع الأدلة ثم ترسل الرد لجهة المنح.",
        "who": "مدير الجودة أو صاحب الإجراء التصحيحي.",
        "when": "قبل موعد الرد المحدد للملاحظة.",
        "nav": "الملاحظات ← الرد",
        "handoff": "يصل لجهة المنح إشعار «وصل الرد على ...» وتظهر الملاحظة «تم الإرسال» لتراجعها وتطلب تعديلًا أو تغلقها.",
        "screen": [
          "نص الملاحظة الأصلي وتاريخ إصدارها (للقراءة فقط).",
          "التصحيح: الإجراء الفوري لاحتواء المشكلة.",
          "السبب الجذري: سبب المشكلة بعد التحليل.",
          "الإجراء التصحيحي: ما يمنع التكرار.",
          "أدلة التنفيذ: ملف واحد على الأقل."
        ],
        "steps": [
          "افتح الملاحظة من «الملاحظات» بزر «الرد».",
          "اكتب التصحيح والسبب الجذري والإجراء التصحيحي.",
          "اسحب ملفات الأدلة إلى منطقة الرفع أو اضغط للرفع.",
          "في «تفاصيل إضافية» اختر «الشخص المسؤول» و«التاريخ المستهدف».",
          "اضغط «حفظ مسودة الرد» لحفظ العمل دون إرسال.",
          "اضغط «إرسال الرد» عند الاكتمال."
        ],
        "rules": [
          "لا يُرسل الرد إلا باكتمال الحقول الخمسة الإلزامية وملف دليل واحد على الأقل.",
          "الحقول الناقصة تُعلَّم بـ«هذا الحقل مطلوب.» و«ارفع ملف دليل واحد على الأقل.»",
          "بعد الإرسال تُقفل الشاشة للقراءة فقط حتى تطلب جهة المنح تعديلًا.",
          "الملاحظة المغلقة للقراءة فقط دائمًا."
        ],
        "after": [
          "تتحول الحالة إلى «تم الإرسال» ويتحدث «آخر حفظ».",
          "تراجع جهة المنح الرد، ثم تطلب تعديلًا أو تغلق الملاحظة بعد التحقق.",
          "عند طلب التعديل تُفتح الحقول من جديد ويصلك إشعار."
        ],
        "tips": [
          "فرّق بين التصحيح (إصلاح فوري) والإجراء التصحيحي (منع التكرار).",
          "ارفع أدلة واضحة: سجلات، صور، محاضر تدريب.",
          "احفظ مسودة بعد كل جزء لتفادي فقد العمل."
        ],
        "fields": [
          [
            "التصحيح *",
            "حتى 1000 حرف."
          ],
          [
            "السبب الجذري *",
            "حتى 1000 حرف."
          ],
          [
            "الإجراء التصحيحي *",
            "حتى 1000 حرف."
          ],
          [
            "أدلة التنفيذ *",
            "PDF أو DOCX أو JPG أو PNG، حتى 10 ميجابايت."
          ],
          [
            "الشخص المسؤول *",
            "من قائمة أشخاص منشأتك."
          ],
          [
            "التاريخ المستهدف *",
            "موعد تنفيذ الإجراء."
          ],
          [
            "مراجعة الفعالية / الملاحظات",
            "تملؤها جهة المنح فقط."
          ]
        ],
        "statuses": [
          [
            "مفتوحة",
            "لم يُحفظ رد."
          ],
          [
            "قيد التنفيذ",
            "حُفظت مسودة أو طُلب تعديل."
          ],
          [
            "تم الإرسال",
            "بانتظار تحقق جهة المنح."
          ],
          [
            "مغلقة",
            "تحققت جهة المنح من الفعالية."
          ]
        ],
        "sections": [
          {
            "id": "c-respond-details",
            "title": "تفاصيل إضافية: المسؤول والتاريخ",
            "bullets": [
              "نتيجة مراجعة الفعالية: لم تتم المراجعة بعد، فعال، فعال جزئياً، غير فعال.",
              "حقل الحالة يعرض حالة الملاحظة الحالية.",
              "يمكن طي القسم وفتحه."
            ]
          },
          {
            "id": "c-respond-submit",
            "title": "الحفظ والإرسال",
            "bullets": [
              "تاريخ الإغلاق المستهدف هو موعد الرد.",
              "الحفظ يحوّل الحالة من «مفتوحة» إلى «قيد التنفيذ».",
              "الزران معطلان بعد الإرسال أو الإغلاق."
            ]
          },
          {
            "id": "c-respond-validation",
            "title": "رسائل التحقق",
            "bullets": [
              "تظهر الرسائل عند الضغط على «إرسال الرد» والرد غير مكتمل.",
              "لا يُرسل شيء حتى تُصحح كل الحقول.",
              "«حفظ مسودة الرد» لا يتطلب اكتمال الحقول."
            ]
          },
          {
            "id": "c-respond-closed",
            "title": "ملاحظة مغلقة (للقراءة فقط)",
            "bullets": [
              "هذا هو شكل الرد بعد الإرسال أو الإغلاق: الحقول والأزرار معطلة.",
              "تبويب «سجل النشاط» يعرض تسلسل الأحداث.",
              "تبويبا «السجلات المرتبطة» و«المرفقات» يعرضان الروابط والأدلة."
            ]
          }
        ]
      }
    }
  },
  {
    "id": "c-certificates",
    "audience": "client",
    "section": "certification",
    "routes": [
      "/portal/certificates"
    ],
    "open": "/portal/certificates",
    "statusDomain": "certificate",
    "statusValues": [
      "ISSUED",
      "SUSPENDED",
      "WITHDRAWN"
    ],
    "updated": "2026-10-24",
    "capture": {
      "as": "client",
      "route": "/portal/certificates"
    },
    "text": {
      "en": {
        "title": "Certificates",
        "summary": "Certificates the CAB issued to your organization, with scope, validity dates and status.",
        "who": "All client users.",
        "when": "After a positive certification decision and issue, and to follow validity.",
        "nav": "Sidebar → Certificates",
        "handoff": "This screen mirrors the CAB's certificate register; any suspension or withdrawal it records shows here.",
        "screen": [
          "Search by number, standard or scope.",
          "Certificate number.",
          "Expiry date.",
          "Certificate status."
        ],
        "steps": [
          "Open Certificates.",
          "Search by number, standard or scope.",
          "Check scope, issue and expiry dates, and status."
        ],
        "rules": [
          "Only issued certificates are listed; CAB drafts are not shown to you.",
          "Status changes only by CAB decision."
        ],
        "after": [
          "You get \"Certificate ... issued\" when it is issued.",
          "The certification cycle opens: Surveillance 1 and 2, then recertification; their visits appear in Audits."
        ],
        "tips": [
          "Watch the expiry and surveillance dates to keep the certificate valid.",
          "Do not use a suspended or withdrawn certificate in marketing."
        ],
        "fields": [
          [
            "Number",
            "Certificate number."
          ],
          [
            "Standard",
            "Certified standard."
          ],
          [
            "Scope",
            "Certified scope as printed."
          ],
          [
            "Issue date / Expiry date",
            "Validity period (certification cycle)."
          ]
        ],
        "statuses": [
          [
            "Issued",
            "Valid."
          ],
          [
            "Suspended",
            "Temporarily suspended by the CAB."
          ],
          [
            "Withdrawn",
            "Withdrawn; no longer valid."
          ]
        ]
      },
      "ar": {
        "title": "الشهادات",
        "summary": "الشهادات التي أصدرتها جهة منح الشهادات لمنشأتكم مع النطاق وتواريخ الصلاحية والحالة.",
        "who": "جميع مستخدمي العميل.",
        "when": "بعد قرار المنح الإيجابي وإصدار الشهادة، وعند متابعة صلاحيتها.",
        "nav": "القائمة الجانبية ← الشهادات",
        "handoff": "هذه الشاشة تعكس سجل الشهادات لدى جهة المنح؛ أي تعليق أو سحب تسجله يظهر هنا.",
        "screen": [
          "البحث بالرقم أو المواصفة أو النطاق.",
          "رقم الشهادة.",
          "تاريخ انتهاء الصلاحية.",
          "حالة الشهادة."
        ],
        "steps": [
          "افتح «الشهادات».",
          "ابحث بالرقم أو المواصفة أو النطاق.",
          "راجع النطاق وتاريخي الإصدار والانتهاء والحالة."
        ],
        "rules": [
          "تظهر الشهادات الصادرة فقط؛ المسودة لدى جهة المنح لا تظهر لك.",
          "تتغير الحالة بقرار جهة المنح فقط."
        ],
        "after": [
          "يصلك إشعار «صدرت الشهادة ...» عند الإصدار.",
          "تُفتح دورة المنح: تدقيق المراقبة الأولى والثانية ثم إعادة المنح، وتظهر زياراتها في «عمليات التدقيق»."
        ],
        "tips": [
          "تابع تاريخ الانتهاء ومواعيد المراقبة للحفاظ على سريان الشهادة.",
          "لا تستخدم الشهادة المعلقة أو المسحوبة في التسويق."
        ],
        "fields": [
          [
            "الرقم",
            "رقم الشهادة."
          ],
          [
            "المعيار",
            "المواصفة الممنوحة."
          ],
          [
            "النطاق",
            "نطاق المنح كما طُبع على الشهادة."
          ],
          [
            "تاريخ الإصدار / تاريخ الانتهاء",
            "مدة صلاحية الشهادة (دورة المنح)."
          ]
        ],
        "statuses": [
          [
            "صادرة",
            "سارية."
          ],
          [
            "معلّقة",
            "موقوفة مؤقتًا بقرار جهة المنح."
          ],
          [
            "مسحوبة",
            "سُحبت ولم تعد سارية."
          ]
        ]
      }
    }
  },
  {
    "id": "c-notifications",
    "audience": "client",
    "section": "start",
    "routes": [],
    "updated": "2026-10-24",
    "capture": {
      "as": "client",
      "route": "/portal/home"
    },
    "text": {
      "en": {
        "title": "Notifications and smart assistant",
        "summary": "The bell tells you what needs your action; the smart assistant explains the current page and your next step.",
        "who": "All client users.",
        "when": "Throughout your work; the bell shows the unread count.",
        "nav": "Top bar → bell icon / floating button at the bottom of the screen",
        "handoff": "Your notifications come from CAB actions, and your responses create notifications on the CAB side.",
        "screen": [
          "Bell with the unread count.",
          "Mark every notification as read.",
          "Show unread only.",
          "A notification; click it to open the related record."
        ],
        "steps": [
          "Click the bell to open the list.",
          "Choose All or Unread.",
          "Click a notification; it is marked read and opens the related page.",
          "Click Mark all as read to clear the counter."
        ],
        "rules": [
          "The list closes when you click outside it or press Esc.",
          "Every notification links to its page in the portal."
        ],
        "after": [
          "The counter drops with each notification you open."
        ],
        "tips": [
          "Clear your unread notifications each day; each one is a step the CAB is waiting for."
        ],
        "fields": [
          [
            "Offer ... is ready",
            "A quotation awaits your response."
          ],
          [
            "Information needed for ...",
            "The CAB requests information."
          ],
          [
            "Confirm audit plan ...",
            "An audit plan awaits your confirmation."
          ],
          [
            "Response due on ...",
            "A finding awaits your response."
          ],
          [
            "Invoice ... due",
            "An invoice is near its due date."
          ],
          [
            "Certificate ... issued",
            "Your certificate was issued."
          ]
        ],
        "statuses": [
          [
            "Unread",
            "A colored dot next to the notification."
          ]
        ],
        "sections": [
          {
            "id": "c-assistant",
            "title": "Smart assistant",
            "bullets": [
              "Opens from the floating button at the bottom of every page.",
              "Answers in the interface language: Arabic or English.",
              "May suggest a link to open the right page.",
              "When an error shows, Help me fix it explains the message.",
              "If the AI service is unavailable, it shows the built-in page guide."
            ]
          },
          {
            "id": "c-language",
            "title": "Switch language",
            "bullets": [
              "The whole system switches at once, including direction.",
              "Your choice is remembered on this device.",
              "Also available in My profile and on the sign-in screens."
            ]
          }
        ]
      },
      "ar": {
        "title": "الإشعارات والمساعد الذكي",
        "summary": "الجرس يخبرك بكل ما يحتاج تدخلك، والمساعد الذكي يشرح الصفحة الحالية وخطوتك التالية.",
        "who": "جميع مستخدمي العميل.",
        "when": "طوال العمل؛ يظهر عدد غير المقروء على الجرس.",
        "nav": "الشريط العلوي ← أيقونة الجرس / الزر العائم أسفل الشاشة",
        "handoff": "إشعاراتك تنشأ من إجراءات جهة المنح، وردودك تولّد إشعارات لديها.",
        "screen": [
          "الجرس وعدد الإشعارات غير المقروءة.",
          "تعليم كل الإشعارات كمقروءة.",
          "عرض غير المقروءة فقط.",
          "إشعار؛ الضغط عليه يفتح السجل المرتبط."
        ],
        "steps": [
          "اضغط الجرس لفتح القائمة.",
          "اختر «الكل» أو «غير المقروءة».",
          "اضغط الإشعار؛ يُعلَّم مقروءًا وتنتقل إلى الصفحة المرتبطة.",
          "اضغط «تعليم الكل كمقروء» لتصفير العداد."
        ],
        "rules": [
          "تُغلق القائمة بالضغط خارجها أو بمفتاح Esc.",
          "كل إشعار مرتبط بصفحته في البوابة."
        ],
        "after": [
          "يقل العداد مع كل إشعار تفتحه."
        ],
        "tips": [
          "اجعل الإشعارات غير المقروءة صفرًا في نهاية كل يوم؛ كل واحد منها خطوة تنتظرها جهة المنح."
        ],
        "fields": [
          [
            "العرض ... جاهز",
            "عرض سعر بانتظار ردك."
          ],
          [
            "مطلوب معلومات للطلب ...",
            "جهة المنح تطلب معلومات."
          ],
          [
            "أكّد خطة التدقيق ...",
            "خطة تدقيق تنتظر تأكيدك."
          ],
          [
            "مطلوب ردكم على ...",
            "ملاحظة تنتظر ردك."
          ],
          [
            "استحقاق الفاتورة ...",
            "فاتورة قرب موعد دفعها."
          ],
          [
            "صدرت الشهادة ...",
            "صدرت شهادتك."
          ]
        ],
        "statuses": [
          [
            "غير مقروء",
            "نقطة ملونة بجانب الإشعار."
          ]
        ],
        "sections": [
          {
            "id": "c-assistant",
            "title": "المساعد الذكي",
            "bullets": [
              "يفتح من الزر العائم أسفل الشاشة في كل صفحة.",
              "يجيب بلغة الواجهة: العربية أو الإنجليزية.",
              "قد يقترح رابطًا لفتح الصفحة المناسبة.",
              "عند ظهور خطأ يعرض «ساعدني أحلها» لشرح الرسالة.",
              "إذا لم تتوفر خدمة الذكاء الاصطناعي يعرض دليل الصفحة المدمج."
            ]
          },
          {
            "id": "c-language",
            "title": "تبديل اللغة",
            "bullets": [
              "يتحول النظام كله فورًا، بما فيه الاتجاه.",
              "يُحفظ اختيارك على هذا الجهاز.",
              "التبديل متاح أيضًا من «ملفي الشخصي» وشاشات الدخول."
            ]
          }
        ]
      }
    },
    "related": [
      "notification-preferences"
    ]
  },
  {
    "id": "c-my-profile",
    "audience": "client",
    "section": "start",
    "routes": [
      "/account/profile"
    ],
    "open": "/account/profile",
    "updated": "2026-10-24",
    "capture": {
      "as": "client",
      "route": "/account/profile"
    },
    "text": {
      "en": {
        "title": "My profile and sign out",
        "summary": "Your personal details, photo, interface language and password, plus sign out.",
        "who": "Every user, for their own account.",
        "when": "To update your details or password, or to end the session.",
        "nav": "Account menu (your photo, top right) → My profile",
        "handoff": "Your updated name and phone appear to the CAB on your replies and records.",
        "screen": [
          "Change your photo.",
          "Full name, job title, email and phone.",
          "Saves your personal details.",
          "Choose the interface language.",
          "Ends your session on this device."
        ],
        "steps": [
          "Click your photo at the top, then My profile.",
          "Edit Full name, Job title and Phone, then Save changes.",
          "To change the photo, click Change and pick an image.",
          "To change the password, enter the current one, the new one and its confirmation, then Change password.",
          "To sign out, click Logout and confirm."
        ],
        "rules": [
          "Photo: JPG, PNG or WebP up to 2 MB.",
          "New password: at least 8 characters, upper and lower case letters, at least one number.",
          "Both new passwords must match.",
          "Logout asks: \"Sign out of iCASCO on this device?\""
        ],
        "after": [
          "Your updated name shows in the top bar.",
          "After signing out you return to the Log In screen."
        ],
        "tips": [
          "Use a password you do not use anywhere else.",
          "Always sign out on shared computers."
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
            "Your sign-in; it cannot be changed here."
          ],
          [
            "Phone",
            "A valid number with country code."
          ]
        ],
        "statuses": [
          [
            "Your profile is saved.",
            "Details saved."
          ],
          [
            "Password changed.",
            "Use the new one next time."
          ]
        ],
        "sections": [
          {
            "id": "c-account-menu",
            "title": "Account menu",
            "bullets": [
              "The menu shows your name, email, organization and role.",
              "It also links to Company profile.",
              "Take a Tour walks through the page sections step by step."
            ]
          },
          {
            "id": "c-password",
            "title": "Change password",
            "bullets": [
              "Rules: at least 8 characters, upper and lower case letters, at least one number.",
              "Rejected if the current password is missing, a rule fails, or the new ones differ.",
              "On success: \"Password changed.\""
            ]
          }
        ]
      },
      "ar": {
        "title": "ملفي الشخصي وتسجيل الخروج",
        "summary": "بياناتك الشخصية وصورتك ولغة الواجهة وكلمة المرور، وتسجيل الخروج.",
        "who": "كل مستخدم لحسابه الشخصي.",
        "when": "عند تغيير بياناتك أو كلمة المرور، أو لإنهاء الجلسة.",
        "nav": "قائمة الحساب (الصورة أعلى الشاشة) ← ملفي الشخصي",
        "handoff": "يظهر اسمك ورقمك المحدثان لجهة المنح في ردودك وسجلاتها.",
        "screen": [
          "تغيير الصورة الشخصية.",
          "الاسم الكامل والمسمى الوظيفي والبريد والهاتف.",
          "حفظ البيانات الشخصية.",
          "اختيار لغة الواجهة.",
          "إنهاء الجلسة على هذا الجهاز."
        ],
        "steps": [
          "اضغط صورتك أعلى الشاشة ثم «ملفي الشخصي».",
          "عدّل الاسم والمسمى الوظيفي والهاتف، ثم «حفظ التغييرات».",
          "لتغيير الصورة اضغط «تغيير» واختر صورة.",
          "لتغيير كلمة المرور أدخل الحالية ثم الجديدة وتأكيدها، واضغط «تغيير كلمة المرور».",
          "لتسجيل الخروج اضغط «تسجيل الخروج» وأكّد."
        ],
        "rules": [
          "الصورة: JPG أو PNG أو WebP حتى 2 ميجابايت.",
          "كلمة المرور الجديدة: 8 أحرف على الأقل، حروف كبيرة وصغيرة، ورقم واحد على الأقل.",
          "يجب أن تتطابق كلمتا المرور الجديدتان.",
          "تسجيل الخروج يطلب تأكيدًا: «تسجيل الخروج من iCASCO على هذا الجهاز؟»"
        ],
        "after": [
          "يظهر اسمك المحدث في الشريط العلوي.",
          "بعد تسجيل الخروج تعود إلى شاشة الدخول."
        ],
        "tips": [
          "استخدم كلمة مرور لا تستخدمها في أي مكان آخر.",
          "سجّل الخروج دائمًا على الأجهزة المشتركة."
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
            "بيانات الدخول؛ لا يُعدَّل هنا."
          ],
          [
            "الهاتف",
            "رقم صحيح مع مفتاح الدولة."
          ]
        ],
        "statuses": [
          [
            "تم حفظ ملفك.",
            "حُفظت البيانات."
          ],
          [
            "تم تغيير كلمة المرور.",
            "استخدم الجديدة في الدخول القادم."
          ]
        ],
        "sections": [
          {
            "id": "c-account-menu",
            "title": "قائمة الحساب",
            "bullets": [
              "تعرض القائمة اسمك وبريدك ومنشأتك ودورك.",
              "تحتوي أيضًا على رابط «ملف الجهة» الذي يفتح ملف الشركة.",
              "الجولة التعريفية تشرح أقسام الصفحة خطوة بخطوة."
            ]
          },
          {
            "id": "c-password",
            "title": "تغيير كلمة المرور",
            "bullets": [
              "الشروط: 8 أحرف على الأقل، حروف كبيرة وصغيرة، رقم واحد على الأقل.",
              "يُرفض التغيير إذا لم تُدخل الحالية أو لم تتحقق الشروط أو لم تتطابق الجديدتان.",
              "بعد النجاح تظهر رسالة «تم تغيير كلمة المرور.»"
            ]
          }
        ]
      }
    },
    "related": [
      "notification-preferences",
      "ihelp"
    ]
  }
]

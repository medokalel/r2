/**
 * Built-in agreement template of the preview (same text as the API default,
 * backend src/modules/agreements/agreement.template.js). Draft for the product owner's review.
 */
import type { AgreementSection, AgreementVariableInfo } from '@/lib/api/agreementsApi'

export const DEFAULT_AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    "key": "parties",
    "title": {
      "en": "Parties and purpose",
      "ar": "الأطراف والغرض"
    },
    "body": {
      "en": "This certification agreement (No. {{agreement.number}}, version {{agreement.version}}) is made between {{cab.legalName}} (the certification body), registration number {{cab.registrationNumber}}, with its office at {{cab.address}}, and {{client.legalName}} (the client), commercial registration {{client.crNumber}}, with its address at {{client.address}}, represented by {{client.representative}}.\nIt sets out the legally enforceable terms under which the certification body provides certification activities to the client, as required by ISO/IEC 17021-1 clause 5.1.2. The offer {{offer.number}} accepted by the client forms part of this agreement.",
      "ar": "أُبرمت اتفاقية منح الشهادة هذه (رقم {{agreement.number}}، الإصدار {{agreement.version}}) بين {{cab.legalName}} (جهة منح الشهادات)، رقم السجل {{cab.registrationNumber}}، ومقرها {{cab.address}}، وبين {{client.legalName}} (العميل)، السجل التجاري {{client.crNumber}}، وعنوانه {{client.address}}، ويمثله {{client.representative}}.\nوتحدد هذه الاتفاقية الشروط الملزمة قانوناً التي تقدم بموجبها جهة منح الشهادات أنشطة منح الشهادة للعميل، وفقاً لمتطلبات البند 5.1.2 من المواصفة ISO/IEC 17021-1. ويُعد العرض {{offer.number}} الذي قبله العميل جزءاً من هذه الاتفاقية."
    }
  },
  {
    "key": "scope",
    "title": {
      "en": "Scope of certification",
      "ar": "نطاق الشهادة"
    },
    "body": {
      "en": "Standards: {{standards}}.\nScope: {{scope}}\nSites covered: {{sites}}.\nThe certification cycle is {{cycleYears}} years: an initial audit in two stages (or a recertification audit), surveillance audits in the first and second years, and a recertification audit before the certificate expires. Special or short-notice audits may be carried out where the certification rules require them.",
      "ar": "المواصفات: {{standards}}.\nالنطاق: {{scope}}\nالمواقع المشمولة: {{sites}}.\nمدة دورة الشهادة {{cycleYears}} سنوات، وتشمل تدقيقاً أولياً على مرحلتين (أو تدقيق إعادة منح الشهادة)، وتدقيقات مراقبة في السنتين الأولى والثانية، وتدقيق إعادة منح الشهادة قبل انتهاء صلاحيتها. ويجوز إجراء تدقيقات خاصة أو بإشعار قصير متى اقتضت قواعد منح الشهادة ذلك."
    }
  },
  {
    "key": "clientObligations",
    "title": {
      "en": "Obligations of the client",
      "ar": "التزامات العميل"
    },
    "body": {
      "en": "The client shall:\n1. Comply with the certification requirements, including implementing appropriate changes when the certification body communicates them.\n2. Keep the certified management system implemented and effective for the whole scope.\n3. Make all necessary arrangements for audits, including the review of documented information and access to all relevant processes, areas, records and personnel, for initial certification, surveillance, recertification, special audits and the handling of complaints.\n4. Provide accurate and complete information and tell the certification body about anything that may affect the audit.\n5. Correct nonconformities and take corrective action within the time agreed with the certification body.",
      "ar": "يلتزم العميل بما يلي:\n1. الامتثال لمتطلبات منح الشهادة، بما في ذلك تطبيق التغييرات المناسبة التي تبلغه بها جهة منح الشهادات.\n2. المحافظة على تطبيق نظام الإدارة الحاصل على الشهادة وفعاليته في كامل النطاق.\n3. اتخاذ الترتيبات اللازمة لإجراء التدقيقات، بما في ذلك مراجعة المعلومات الموثقة وإتاحة الوصول إلى جميع العمليات والمناطق والسجلات والأفراد ذوي العلاقة، لأغراض منح الشهادة الأولية والمراقبة وإعادة منح الشهادة والتدقيقات الخاصة ومعالجة الشكاوى.\n4. تقديم معلومات دقيقة وكاملة، وإبلاغ جهة منح الشهادات بكل ما قد يؤثر في التدقيق.\n5. تصحيح حالات عدم المطابقة واتخاذ الإجراءات التصحيحية خلال المدة المتفق عليها مع جهة منح الشهادات."
    }
  },
  {
    "key": "access",
    "title": {
      "en": "Access, observers and accreditation body witnessing",
      "ar": "الوصول والمراقبون وشهود جهة الاعتماد"
    },
    "body": {
      "en": "The client shall give access to the audit team, technical experts, trainee auditors and, where applicable, observers. The certification body tells the client in advance who is on the team and about any observer, and the client may object to a member for a justified reason.\nThe client accepts that the accreditation body {{cab.accreditationBody}}, and scheme owners where relevant, may witness audits at its sites or review records about the client, and that refusing this may prevent certification.",
      "ar": "يتيح العميل الوصول لفريق التدقيق والخبراء الفنيين والمدققين المتدربين، وللمراقبين عند الاقتضاء. وتُبلغ جهة منح الشهادات العميل مسبقاً بأعضاء الفريق وبأي مراقب، ويحق للعميل الاعتراض على أي عضو لسبب مبرر.\nويقبل العميل أن تشهد جهة الاعتماد {{cab.accreditationBody}}، وملاك المخططات عند الاقتضاء، التدقيقات في مواقعه أو تراجع السجلات المتعلقة به، وأن رفض ذلك قد يحول دون منح الشهادة."
    }
  },
  {
    "key": "complaints",
    "title": {
      "en": "Complaints",
      "ar": "الشكاوى"
    },
    "body": {
      "en": "The client shall keep a record of every complaint it receives about its conformity with the certification requirements, make these records available to the certification body on request, take appropriate action on them and document the action taken.\nComplaints and appeals against the certification body are handled under its published complaints and appeals process, without any discrimination against the client.",
      "ar": "يحتفظ العميل بسجل لكل شكوى يتلقاها بشأن مطابقته لمتطلبات منح الشهادة، ويتيح هذه السجلات لجهة منح الشهادات عند الطلب، ويتخذ الإجراءات المناسبة بشأنها ويوثق ما اتخذه من إجراءات.\nوتُعالج الشكاوى والطعون المقدمة ضد جهة منح الشهادات وفق إجراءاتها المعلنة للشكاوى والطعون، دون أي تمييز ضد العميل."
    }
  },
  {
    "key": "marks",
    "title": {
      "en": "Use of the certificate and certification marks",
      "ar": "استخدام الشهادة وعلامات منح الشهادة"
    },
    "body": {
      "en": "The client shall claim certification only for the scope for which it has been granted, and shall use the certificate, the certification body mark and any accreditation mark only as the certification body's rules for marks allow.\nThe client shall not use its certification in a way that could bring the certification body into disrepute, and shall not make any misleading statement about it. Certification marks shall not appear on laboratory test, calibration or inspection reports or certificates, nor on a product or its packaging in a way that suggests the product itself is certified.\nWhen the client gives copies of certification documents to others, it shall reproduce them in full or as the certification scheme specifies.",
      "ar": "لا يدّعي العميل الحصول على الشهادة إلا للنطاق الذي مُنحت له، ولا يستخدم الشهادة أو علامة جهة منح الشهادات أو أي علامة اعتماد إلا وفق ما تسمح به قواعد العلامات لدى جهة منح الشهادات.\nولا يستخدم العميل شهادته بطريقة قد تسيء إلى سمعة جهة منح الشهادات، ولا يدلي بأي بيان مضلل بشأنها. ولا توضع علامات منح الشهادة على تقارير أو شهادات الفحص المخبري أو المعايرة أو التفتيش، ولا على المنتج أو عبوته بطريقة توحي بأن المنتج ذاته حاصل على الشهادة.\nوعندما يقدم العميل نسخاً من وثائق الشهادة إلى الغير، يلتزم باستنساخها كاملة أو وفق ما يحدده مخطط منح الشهادة."
    }
  },
  {
    "key": "changes",
    "title": {
      "en": "Notification of changes",
      "ar": "الإبلاغ عن التغييرات"
    },
    "body": {
      "en": "The client shall inform the certification body without delay of any change that may affect its ability to meet the certification requirements, including changes to: its legal, commercial or organizational status or ownership; its organization and management, such as key managerial, decision-making or technical staff; its contact address and sites; the scope of operations under the certified management system; and major changes to the management system and its processes.\nChanges to the scope or sites are handled as amendments to this agreement and may require a special audit.",
      "ar": "يُبلغ العميل جهة منح الشهادات دون تأخير بأي تغيير قد يؤثر في قدرته على استيفاء متطلبات منح الشهادة، بما في ذلك التغييرات في: وضعه القانوني أو التجاري أو التنظيمي أو ملكيته، وتنظيمه وإدارته مثل الكوادر الإدارية الرئيسية أو صاحبة القرار أو الفنية، وعنوان التواصل والمواقع، ونطاق العمليات المشمولة بنظام الإدارة الحاصل على الشهادة، والتغييرات الجوهرية في نظام الإدارة وعملياته.\nوتُعالج التغييرات في النطاق أو المواقع بوصفها تعديلات على هذه الاتفاقية، وقد تتطلب تدقيقاً خاصاً."
    }
  },
  {
    "key": "confidentiality",
    "title": {
      "en": "Confidentiality",
      "ar": "السرية"
    },
    "body": {
      "en": "The certification body keeps confidential all information obtained or created during its certification activities, except information the client makes public or that both parties agree to release. Information about the client obtained from other sources is also kept confidential.\nWhen the law, or a contractual arrangement such as the one with the accreditation body, requires the certification body to release confidential information, it tells the client what was provided, unless the law prohibits this.",
      "ar": "تحافظ جهة منح الشهادات على سرية جميع المعلومات التي تحصل عليها أو تنشئها أثناء أنشطة منح الشهادة، باستثناء المعلومات التي يعلنها العميل أو يتفق الطرفان على الإفصاح عنها. وتُعامل المعلومات المتعلقة بالعميل والواردة من مصادر أخرى بسرية كذلك.\nوإذا ألزم النظام، أو ترتيب تعاقدي مثل الترتيب مع جهة الاعتماد، جهة منح الشهادات بالإفصاح عن معلومات سرية، فإنها تُبلغ العميل بالمعلومات المقدمة ما لم يحظر النظام ذلك."
    }
  },
  {
    "key": "impartiality",
    "title": {
      "en": "Impartiality",
      "ar": "الحيادية"
    },
    "body": {
      "en": "The certification body does not provide management system consultancy and does not certify a management system on which its personnel have given consultancy within the period its impartiality rules set. The client shall tell the certification body about any current or past relationship with members of the audit team that could threaten impartiality.",
      "ar": "لا تقدم جهة منح الشهادات استشارات في أنظمة الإدارة، ولا تمنح الشهادة لنظام إدارة قدّم أفرادها استشارات بشأنه خلال المدة التي تحددها قواعد الحيادية لديها. ويُبلغ العميل جهة منح الشهادات بأي علاقة قائمة أو سابقة مع أعضاء فريق التدقيق قد تهدد الحيادية."
    }
  },
  {
    "key": "fees",
    "title": {
      "en": "Fees and payment",
      "ar": "الأتعاب والدفع"
    },
    "body": {
      "en": "Fees for the certification cycle: {{fees}} (currency: {{currency}}).\nPayment terms: {{paymentTerms}}.\nTravel and accommodation costs, and fees for special, additional or short-notice audits, are invoiced as stated in the offer. Fees may be reviewed at recertification with written notice. Unpaid invoices may lead to suspension of certification.",
      "ar": "أتعاب دورة الشهادة: {{fees}} (العملة: {{currency}}).\nشروط الدفع: {{paymentTerms}}.\nتُفوتر تكاليف السفر والإقامة وأتعاب التدقيقات الخاصة أو الإضافية أو بإشعار قصير وفق ما ورد في العرض. ويجوز مراجعة الأتعاب عند إعادة منح الشهادة بإشعار كتابي. وقد يؤدي عدم سداد الفواتير إلى تعليق الشهادة."
    }
  },
  {
    "key": "suspension",
    "title": {
      "en": "Suspension, withdrawal and reduction of scope",
      "ar": "التعليق والسحب وتقليص النطاق"
    },
    "body": {
      "en": "The certification body may suspend certification when the management system has persistently or seriously failed to meet the certification requirements, when the client does not allow surveillance or recertification audits at the required frequency, or when the client asks for a voluntary suspension. While suspended, the client shall not promote its certification.\nIf the issues are not resolved within the time the certification body sets, certification is withdrawn or its scope is reduced. After withdrawal, the client shall stop using any advertising material that refers to its certified status and shall return or destroy the certificates as instructed.",
      "ar": "يجوز لجهة منح الشهادات تعليق الشهادة إذا أخفق نظام الإدارة إخفاقاً متكرراً أو جسيماً في استيفاء متطلبات منح الشهادة، أو إذا لم يسمح العميل بإجراء تدقيقات المراقبة أو إعادة منح الشهادة بالوتيرة المطلوبة، أو إذا طلب العميل التعليق طوعاً. ويمتنع العميل خلال مدة التعليق عن الترويج لشهادته.\nوإذا لم تُعالج المشكلات خلال المدة التي تحددها جهة منح الشهادات، تُسحب الشهادة أو يُقلّص نطاقها. وبعد السحب يتوقف العميل عن استخدام أي مواد دعائية تشير إلى حصوله على الشهادة، ويعيد الشهادات أو يتلفها وفق التعليمات."
    }
  },
  {
    "key": "transfer",
    "title": {
      "en": "Transfer of certification",
      "ar": "نقل الشهادة"
    },
    "body": {
      "en": "A certification issued by another accredited certification body may be transferred to the certification body after a pre-transfer review under the applicable accreditation rules, such as IAF MD 2. The certification body may decide that an audit is needed before it issues its own certificate. A transfer is recorded as an amendment to this agreement.",
      "ar": "يجوز نقل شهادة صادرة عن جهة منح شهادات معتمدة أخرى إلى جهة منح الشهادات بعد مراجعة ما قبل النقل وفق قواعد الاعتماد المعمول بها، مثل وثيقة IAF MD 2. ويجوز لجهة منح الشهادات أن تقرر الحاجة إلى تدقيق قبل إصدار شهادتها. ويُسجّل النقل بوصفه تعديلاً على هذه الاتفاقية."
    }
  },
  {
    "key": "term",
    "title": {
      "en": "Term and termination",
      "ar": "المدة والإنهاء"
    },
    "body": {
      "en": "This agreement takes effect when both parties have signed it electronically and stays in force for the certification cycle and any renewal, unless it is terminated earlier.\nEither party may terminate it with at least ninety (90) days' written notice, or at once for a serious breach. On termination, certification is withdrawn, and the client's obligations on the use of certificates and marks and on confidentiality continue to apply. Fees for work already performed remain payable.",
      "ar": "تسري هذه الاتفاقية عند توقيع الطرفين عليها إلكترونياً، وتظل نافذة طوال دورة الشهادة وأي تجديد لها، ما لم تُنهَ قبل ذلك.\nويحق لأي من الطرفين إنهاؤها بإشعار كتابي لا تقل مدته عن تسعين (90) يوماً، أو فوراً عند الإخلال الجسيم. وعند الإنهاء تُسحب الشهادة، وتظل التزامات العميل المتعلقة باستخدام الشهادات والعلامات وبالسرية سارية. وتبقى أتعاب الأعمال المنجزة مستحقة الدفع."
    }
  },
  {
    "key": "signature",
    "title": {
      "en": "Electronic signature and governing terms",
      "ar": "التوقيع الإلكتروني والأحكام الحاكمة"
    },
    "body": {
      "en": "The parties agree to sign this agreement electronically. Each signature is confirmed with a one-time code sent by email and recorded with the signer's name, title, date and time, IP address and device, together with the SHA-256 fingerprint of the signed text. A copy signed this way has the same effect as a signed paper original.\nThis agreement is governed by the laws in force where the certification body is registered, unless the offer states otherwise.",
      "ar": "يتفق الطرفان على توقيع هذه الاتفاقية إلكترونياً. ويُؤكَّد كل توقيع برمز لمرة واحدة يُرسل بالبريد الإلكتروني، ويُسجَّل معه اسم الموقّع ومسماه الوظيفي وتاريخ التوقيع ووقته وعنوان IP والجهاز، إضافة إلى بصمة SHA-256 للنص الموقّع. وللنسخة الموقعة بهذه الطريقة الأثر ذاته للنسخة الورقية الأصلية الموقعة.\nوتخضع هذه الاتفاقية للأنظمة المعمول بها في مكان تسجيل جهة منح الشهادات، ما لم ينص العرض على خلاف ذلك."
    }
  }
]

export const AGREEMENT_VARIABLES: AgreementVariableInfo[] = [
  {
    "key": "agreement.number",
    "label": {
      "en": "Agreement number",
      "ar": "رقم الاتفاقية"
    },
    "sample": "AGR-0001"
  },
  {
    "key": "agreement.version",
    "label": {
      "en": "Agreement version",
      "ar": "إصدار الاتفاقية"
    },
    "sample": "1"
  },
  {
    "key": "agreement.date",
    "label": {
      "en": "Agreement date",
      "ar": "تاريخ الاتفاقية"
    },
    "sample": "2026-10-27"
  },
  {
    "key": "cab.name",
    "label": {
      "en": "Certification body name",
      "ar": "اسم جهة منح الشهادات"
    },
    "sample": "CASCO"
  },
  {
    "key": "cab.legalName",
    "label": {
      "en": "Certification body legal name",
      "ar": "الاسم القانوني لجهة منح الشهادات"
    },
    "sample": "CASCO for Assessment Services"
  },
  {
    "key": "cab.registrationNumber",
    "label": {
      "en": "Certification body registration number",
      "ar": "رقم سجل جهة منح الشهادات"
    },
    "sample": "4030000000"
  },
  {
    "key": "cab.address",
    "label": {
      "en": "Certification body address",
      "ar": "عنوان جهة منح الشهادات"
    },
    "sample": "Jeddah, Saudi Arabia"
  },
  {
    "key": "cab.accreditationBody",
    "label": {
      "en": "Accreditation body",
      "ar": "جهة الاعتماد"
    },
    "sample": "SAAC"
  },
  {
    "key": "client.legalName",
    "label": {
      "en": "Client legal name",
      "ar": "الاسم القانوني للعميل"
    },
    "sample": "Al Noor Food Industries"
  },
  {
    "key": "client.tradeName",
    "label": {
      "en": "Client trade name",
      "ar": "الاسم التجاري للعميل"
    },
    "sample": "Al Noor"
  },
  {
    "key": "client.crNumber",
    "label": {
      "en": "Client commercial registration",
      "ar": "السجل التجاري للعميل"
    },
    "sample": "1010000000"
  },
  {
    "key": "client.address",
    "label": {
      "en": "Client address",
      "ar": "عنوان العميل"
    },
    "sample": "Riyadh, Saudi Arabia"
  },
  {
    "key": "client.representative",
    "label": {
      "en": "Client representative",
      "ar": "ممثل العميل"
    },
    "sample": "Sara Adel"
  },
  {
    "key": "standards",
    "label": {
      "en": "Standards",
      "ar": "المواصفات"
    },
    "sample": "ISO 9001:2015"
  },
  {
    "key": "scope",
    "label": {
      "en": "Scope of certification",
      "ar": "نطاق الشهادة"
    },
    "sample": "Production and packaging of dairy products."
  },
  {
    "key": "sites",
    "label": {
      "en": "Sites",
      "ar": "المواقع"
    },
    "sample": "Head office, Riyadh; Plant 2, Dammam"
  },
  {
    "key": "fees",
    "label": {
      "en": "Fees",
      "ar": "الأتعاب"
    },
    "sample": "Stage 1 audit: 8,000.00; Stage 2 audit: 14,000.00"
  },
  {
    "key": "currency",
    "label": {
      "en": "Currency",
      "ar": "العملة"
    },
    "sample": "SAR"
  },
  {
    "key": "paymentTerms",
    "label": {
      "en": "Payment terms",
      "ar": "شروط الدفع"
    },
    "sample": "50% on acceptance, 50% before the Stage 2 audit"
  },
  {
    "key": "cycleYears",
    "label": {
      "en": "Certification cycle (years)",
      "ar": "دورة الشهادة (بالسنوات)"
    },
    "sample": "3"
  },
  {
    "key": "offer.number",
    "label": {
      "en": "Offer number",
      "ar": "رقم العرض"
    },
    "sample": "OF-0141"
  },
  {
    "key": "application.number",
    "label": {
      "en": "Application number",
      "ar": "رقم الطلب"
    },
    "sample": "APP-0141"
  }
]

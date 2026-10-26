import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useQuotationApprovalTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'sidebar-quotation-approval',
      step: 1,
      totalSteps: 13,
      title: t('cab.tour.sidebarQuotationApproval.title', 'أيقونة موافقة عرض السعر'),
      description: t(
        'cab.tour.sidebarQuotationApproval.description',
        'تتيح لك الانتقال مباشرة لمراجعة موافقة العميل واعتماد عرض السعر النهائي.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'header',
      step: 2,
      totalSteps: 13,
      title: t('cab.applications.quotationApproval.tour.header.title', 'الهيدر الرئيسي والتحكم'),
      description: t(
        'cab.applications.quotationApproval.tour.header.description',
        'عرض المسار التوضيحي، خيارات الجولة، الإشعارات، والملف الشخصي للمسؤول.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'page-header',
      step: 3,
      totalSteps: 13,
      title: t('cab.applications.quotationApproval.tour.pageHeader.title', 'عنوان وإجراءات اعتماد عرض السعر'),
      description: t(
        'cab.applications.quotationApproval.tour.pageHeader.description',
        'عنوان مرحلة اعتماد عرض السعر، أزرار تنزيل ملف PDF والإجراءات الإضافية.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'summary-card',
      step: 4,
      totalSteps: 13,
      title: t('cab.applications.quotationApproval.tour.summaryCard.title', 'ملخص الطلب والعميل'),
      description: t(
        'cab.applications.quotationApproval.tour.summaryCard.description',
        'نظرة عامة على رقم الطلب، اسم العميل، البرنامج، عدد المواقع، والشخص المسؤول.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'tabs',
      step: 5,
      totalSteps: 13,
      title: t('cab.applications.quotationApproval.tour.tabs.title', 'أبواب وتبويبات الصفحة'),
      description: t(
        'cab.applications.quotationApproval.tour.tabs.description',
        'التنقل بين التبويبات المختلفة مثل تفاصيل الطلب، المستندات، التعليقات، الجدوى الفنية، واعتماد عرض السعر.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'quotation-summary',
      step: 6,
      totalSteps: 13,
      title: t('cab.applications.quotationApproval.tour.quotationSummary.title', 'ملخص عرض السعر والتكاليف'),
      description: t(
        'cab.applications.quotationApproval.tour.quotationSummary.description',
        'عرض رقم عرض السعر (QUO)، إصدار الطلب، الكاتب، تاريخ الصلاحية، والمبالغ الإجمالية والضرائب.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'audit-scope',
      step: 7,
      totalSteps: 13,
      title: t('cab.applications.quotationApproval.tour.auditScope.title', 'نطاق التدقيق والمشمول به'),
      description: t(
        'cab.applications.quotationApproval.tour.auditScope.description',
        'استعراض تفاصيل وتغطية نطاق التدقيق للمواصفة والمواقع المشمولة بالاعتماد.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'breakdown-table',
      step: 8,
      totalSteps: 13,
      title: t('cab.applications.quotationApproval.tour.breakdownTable.title', 'جدول تفاصيل عرض السعر'),
      description: t(
        'cab.applications.quotationApproval.tour.breakdownTable.description',
        'عرض جدول التكاليف التفصيلي الذي يشمل أيام التدقيق والخبراء والمصاريف الإضافية والإجمالي.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'sites-card',
      step: 9,
      totalSteps: 13,
      title: t('cab.applications.quotationApproval.tour.sitesCard.title', 'مواقع العميل'),
      description: t(
        'cab.applications.quotationApproval.tour.sitesCard.description',
        'استعراض قائمة كافة الفروع والمواقع المشمولة بنطاق عملية التدقيق.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'approval-info',
      step: 10,
      totalSteps: 13,
      title: t('cab.applications.quotationApproval.tour.approvalInfo.title', 'معلومات واعتماد الطلب'),
      description: t(
        'cab.applications.quotationApproval.tour.approvalInfo.description',
        'عرض حالة مراجعة عرض السعر وملاحظات المدقق الرئيسي وتاريخ الاعتماد.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'internal-comments',
      step: 11,
      totalSteps: 13,
      title: t('cab.applications.quotationApproval.tour.internalComments.title', 'التعليقات الداخلية وسجل الاعتماد'),
      description: t(
        'cab.applications.quotationApproval.tour.internalComments.description',
        'متابعة الملاحظات والتعليقات الداخلية بين فريق العمل وسجل التعديلات والقرارات المعتمدة.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'approval-note',
      step: 12,
      totalSteps: 13,
      title: t('cab.applications.quotationApproval.tour.approvalNote.title', 'تنبيهات وملاحظات الاعتماد'),
      description: t(
        'cab.applications.quotationApproval.tour.approvalNote.description',
        'ملاحظات هامة حول آلية إرسال عرض السعر للعميل والسياسات والشروط المعتمدة.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'footer-actions',
      step: 13,
      totalSteps: 13,
      title: t('cab.applications.quotationApproval.tour.footerActions.title', 'إجراءات وحفظ الاعتماد'),
      description: t(
        'cab.applications.quotationApproval.tour.footerActions.description',
        'حفظ التغييرات كمسودة أو اعتماد وإرسال عرض السعر النهائي فوراً للعميل.'
      ),
      side: 'top',
      align: 'end',
    },
  ]
}

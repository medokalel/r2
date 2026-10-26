import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useApplicationQuotationTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'sidebar-app-quotation',
      step: 1,
      totalSteps: 11,
      title: t('cab.tour.sidebarAppQuotation.title', 'أيقونة عرض السعر'),
      description: t(
        'cab.tour.sidebarAppQuotation.description',
        'تتيح لك الانتقال مباشرة إلى صفحة إعداد وتفاصيل عرض السعر الموجه للعميل.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'header',
      step: 2,
      totalSteps: 11,
      title: t('cab.applications.quotation.tour.header.title', 'الهيدر الرئيسي والتحكم'),
      description: t(
        'cab.applications.quotation.tour.header.description',
        'عرض المسار التوضيحي، خيارات الجولة، الإشعارات، والملف الشخصي للمسؤول.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'page-header',
      step: 3,
      totalSteps: 11,
      title: t('cab.applications.quotation.tour.pageHeader.title', 'عنوان وإجراءات عرض السعر'),
      description: t(
        'cab.applications.quotation.tour.pageHeader.description',
        'عنوان مرحلة عرض السعر، حالتها الحالية، وأزرار التنزيل والإجراءات وإرسال عرض السعر للعميل.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'summary-card',
      step: 4,
      totalSteps: 11,
      title: t('cab.applications.quotation.tour.summaryCard.title', 'ملخص عرض السعر'),
      description: t(
        'cab.applications.quotation.tour.summaryCard.description',
        'نظرة عامة على رقم عرض السعر، العميل، المبلغ الإجمالي، والعملة وتاريخ الإصدار.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'tabs',
      step: 5,
      totalSteps: 11,
      title: t('cab.applications.quotation.tour.tabs.title', 'أبواب وتبويبات الصفحة'),
      description: t(
        'cab.applications.quotation.tour.tabs.description',
        'التنقل بين تفاصيل عرض السعر، المستندات، تعليقات المراجعة، والسجل.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'stats-cards',
      step: 6,
      totalSteps: 11,
      title: t('cab.applications.quotation.tour.statsCards.title', 'إحصائيات عرض السعر'),
      description: t(
        'cab.applications.quotation.tour.statsCards.description',
        'ملخص المبالغ المالية وأيام التدقيق وفريق العمل والمواقع وصلاحية عرض السعر.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'breakdown-table',
      step: 7,
      totalSteps: 11,
      title: t('cab.applications.quotation.tour.breakdownTable.title', 'جدول تفاصيل عرض السعر المالي'),
      description: t(
        'cab.applications.quotation.tour.breakdownTable.description',
        'جدول التكاليف التفصيلي لجميع مراحل التدقيق والمصاريف الإضافية.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'payment-terms',
      step: 8,
      totalSteps: 11,
      title: t('cab.applications.quotation.tour.paymentTerms.title', 'شروط وأحكام الدفع'),
      description: t(
        'cab.applications.quotation.tour.paymentTerms.description',
        'مراجعة الدفعات المقدمة، طريقة الدفع، العملة، وشروط صلاحية عرض السعر.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'internal-comments',
      step: 9,
      totalSteps: 11,
      title: t('cab.applications.quotation.tour.internalComments.title', 'التعليقات الداخلية'),
      description: t(
        'cab.applications.quotation.tour.internalComments.description',
        'تتبع الملاحظات والتعليقات الداخلية المتبادلة بين فريق التقييم والمراجع الفني.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'documents-card',
      step: 10,
      totalSteps: 11,
      title: t('cab.applications.quotation.tour.documentsCard.title', 'مستندات عرض السعر الإجمالية'),
      description: t(
        'cab.applications.quotation.tour.documentsCard.description',
        'استعراض قائمة وتفاصيل كافة المستندات المرفقة وحالتها ومؤشرات الصلاحية.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'workflow-progress',
      step: 11,
      totalSteps: 11,
      title: t('cab.applications.quotation.tour.workflowProgress.title', 'متابعة سير العمل'),
      description: t(
        'cab.applications.quotation.tour.workflowProgress.description',
        'تتبع مراحل سير العمل والانتقال إلى مرحلة اعتماد عرض السعر.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}

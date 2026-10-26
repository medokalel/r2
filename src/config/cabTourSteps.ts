import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useCabDashboardTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'sidebar-navigation',
      step: 1,
      totalSteps: 7,
      title: t('cab.tour.steps.sidebar-navigation.title', 'System Navigation'),
      description: t(
        'cab.tour.steps.sidebar-navigation.description',
        'Use the sidebar to navigate between sections such as Dashboard, Client Registration, Applications, and Reviews.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'dashboard-header',
      step: 2,
      totalSteps: 7,
      title: t('cab.tour.steps.dashboard-header.title', 'Dashboard Overview'),
      description: t(
        'cab.tour.steps.dashboard-header.description',
        'Track conformity assessment activities and overall workload at a glance.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'key-metrics',
      step: 3,
      totalSteps: 7,
      title: t('cab.tour.steps.key-metrics.title', 'Key Metrics'),
      description: t(
        'cab.tour.steps.key-metrics.description',
        'Monitor vital figures like new applications, pending reviews, upcoming audits, and due payments.'
      ),
      side: 'bottom',
      align: 'start',
      alignOffset: 290,
    },
    {
      id: 'visual-analytics',
      step: 4,
      totalSteps: 7,
      title: t('cab.tour.steps.visual-analytics.title', 'Visual Analytics'),
      description: t(
        'cab.tour.steps.visual-analytics.description',
        'Explore application distribution by stage, audit progress, and certification decisions in interactive charts.'
      ),
      side: 'bottom',
      align: 'start',
      alignOffset: 290,
    },
    {
      id: 'work-queue',
      step: 5,
      totalSteps: 7,
      title: t('cab.tour.steps.work-queue.title', 'Work Queue'),
      description: t(
        'cab.tour.steps.work-queue.description',
        'View and manage pending tasks including technical reviews, info requests, and pending approvals.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'recent-activity',
      step: 6,
      totalSteps: 7,
      title: t('cab.tour.steps.recent-activity.title', 'Recent Activity'),
      description: t(
        'cab.tour.steps.recent-activity.description',
        'Follow real-time updates such as certificate issuance, audit completion, and reviewer assignments.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'quick-actions',
      step: 7,
      totalSteps: 7,
      title: t('cab.tour.steps.quick-actions.title', 'Quick Actions'),
      description: t(
        'cab.tour.steps.quick-actions.description',
        'Perform common tasks immediately like creating applications, assigning reviewers, or issuing certificates.'
      ),
      side: 'top',
      align: 'start',
    },
  ]
}

export const CAB_DASHBOARD_TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'sidebar-navigation',
    step: 1,
    totalSteps: 7,
    title: 'تنقلات النظام',
    description: 'استخدم القائمة الجانبية للتنقل بين الأقسام مثل لوحة التحكم، تسجيل العميل، الطلبات، والمراجعات.',
    side: 'right',
    align: 'start',
  },
  {
    id: 'dashboard-header',
    step: 2,
    totalSteps: 7,
    title: 'نظرة عامة على لوحة التحكم',
    description: 'هنا يمكنك متابعة أنشطة منح شهادات تقييم المطابقة وحجم العمل بلمحة واحدة.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'key-metrics',
    step: 3,
    totalSteps: 7,
    title: 'المؤشرات الرئيسية',
    description: 'تابع أهم الأرقام مثل الطلبات الجديدة، المراجعات المعلقة، أعمال التدقيق القادمة، والدفعات المستحقة.',
    side: 'bottom',
    align: 'start',
    alignOffset: 290,
  },
  {
    id: 'visual-analytics',
    step: 4,
    totalSteps: 7,
    title: 'التحليلات والرسوم البيانية',
    description: 'استعرض توزيع الطلبات حسب المراحل، تقدم التدقيق، وقرارات منح الشهادات في رسم بياني تفاعلي.',
    side: 'bottom',
    align: 'start',
    alignOffset: 290,
  },
  {
    id: 'work-queue',
    step: 5,
    totalSteps: 7,
    title: 'قائمة مهام العمل',
    description: 'عرض وإدارة المهام المعلقة الخاصة بك من مراجعات فنية، طلبات استكمال بيانات، واعتمادات تحتاج اتخاذ إجراء.',
    side: 'right',
    align: 'start',
  },
  {
    id: 'recent-activity',
    step: 6,
    totalSteps: 7,
    title: 'آخر الأنشطة',
    description: 'متابعة أحدث الأنشطة مثل إصدار الشهادات، إكمال أعمال التدقيق، وتعيين المراجعين فور حدوثها.',
    side: 'right',
    align: 'start',
  },
  {
    id: 'quick-actions',
    step: 7,
    totalSteps: 7,
    title: 'الإجراءات السريعة',
    description: 'بدء المهام الشائعة فوراً كإنشاء طلب جديد، تعيين مراجع، أو إصدار شهادة بنقرة واحدة.',
    side: 'top',
    align: 'start',
  },
]

export const CAB_APPLICATION_DRAFT_TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'draft-header',
    step: 1,
    totalSteps: 4,
    title: 'Application Submission',
    description:
      'Start a new certification application here. Track progress and preview your submission before sending it to the client.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'draft-stepper',
    step: 2,
    totalSteps: 4,
    title: 'Step-by-Step Flow',
    description:
      'Move through each stage (organization details, standards & scope, sites, documents, and final review) using this stepper.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'draft-form',
    step: 3,
    totalSteps: 4,
    title: 'Application Details',
    description:
      'Fill in the required fields for the current step. Use Save & Continue to move forward, or Save Draft to come back later.',
    side: 'right',
    align: 'start',
  },
  {
    id: 'draft-workflow',
    step: 4,
    totalSteps: 4,
    title: 'Workflow Progress',
    description:
      'See where this application sits in the full certification pipeline, from submission through review, audit, and certificate issuance.',
    side: 'left',
    align: 'start',
  },
]

export const CAB_APPLICATION_REVIEW_TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'review-header',
    step: 1,
    totalSteps: 4,
    title: 'Application Review',
    description:
      'Review submitted applications, download documents, and advance them to the next stage in the certification process.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'review-summary',
    step: 2,
    totalSteps: 4,
    title: 'Application Summary',
    description:
      'Key details at a glance: client, application type, certification body, primary standard, and submission date.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'review-tabs',
    step: 3,
    totalSteps: 4,
    title: 'Review Tabs',
    description:
      'Switch between checklist, application details, documents, review comments, internal notes, and history to complete your review.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'review-workflow',
    step: 4,
    totalSteps: 4,
    title: 'Review Workflow',
    description:
      'Track the application through each certification stage and see what actions are available at this point.',
    side: 'left',
    align: 'start',
  },
]

export const CAB_APPLICATION_RECEIPT_TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'receipt-header',
    step: 1,
    totalSteps: 4,
    title: 'Application Receipt',
    description:
      'Confirm that an application was received successfully and access receipt documents for your records.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'receipt-summary',
    step: 2,
    totalSteps: 4,
    title: 'Receipt Details',
    description:
      'View the application ID, client information, standards, and submission timestamp on the official receipt.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'receipt-success',
    step: 3,
    totalSteps: 4,
    title: 'Submission Confirmed',
    description:
      'This banner confirms the application was received. Download or print the receipt to share with the client.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'receipt-workflow',
    step: 4,
    totalSteps: 4,
    title: 'Next Steps',
    description:
      'Follow the workflow panel to see what happens after receipt: review, technical feasibility, quotation, and beyond.',
    side: 'left',
    align: 'start',
  },
]

export const CAB_APPLICATION_INFO_REQUIRED_TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'info-header',
    step: 1,
    totalSteps: 4,
    title: 'Information Required',
    description:
      'Request additional information from the client when an application is incomplete or needs clarification.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'info-summary',
    step: 2,
    totalSteps: 4,
    title: 'Request Summary',
    description:
      'Review the application context: client, standard, certification body, and who requested the additional information.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'info-alert',
    step: 3,
    totalSteps: 4,
    title: 'Response Deadline',
    description:
      'The alert highlights the deadline for the client to respond. Track requested items and uploaded responses below.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'info-workflow',
    step: 4,
    totalSteps: 4,
    title: 'Key Actions',
    description:
      'Use the sidebar to send reminders, track workflow progress, and take the next action once information is received.',
    side: 'left',
    align: 'start',
  },
]

export const CAB_APPLICATION_TECHNICAL_FEASIBILITY_TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'tf-header',
    step: 1,
    totalSteps: 4,
    title: 'Technical Feasibility',
    description:
      'Assess whether the application can be certified against the requested standard, scope, and sites before moving to quotation.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'tf-summary',
    step: 2,
    totalSteps: 4,
    title: 'Assessment Summary',
    description:
      'Review client details, standard scheme, site count, request date, and who initiated the feasibility assessment.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'tf-assessment',
    step: 3,
    totalSteps: 4,
    title: 'Feasibility Assessment',
    description:
      'Work through the assessment checklist, audit team, resources, and recommendation before proceeding to quotation.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'tf-workflow',
    step: 4,
    totalSteps: 4,
    title: 'Workflow & Actions',
    description:
      'Track progress through the certification pipeline and use quick actions to advance once feasibility is confirmed.',
    side: 'left',
    align: 'start',
  },
]
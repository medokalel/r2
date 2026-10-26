import { useTranslation } from 'react-i18next'
import { AppIcon, DownloadIcon, EyeIcon } from '@/components/icons'
import { CardHeader } from './Primitives'
import { buildProfileDocumentHtml, openProfileDocument } from './profileDocument'
import { useProfileForm } from './ProfileFormContext'

export function FileOperationsCard() {
  const { t, i18n } = useTranslation()
  const { form, branches } = useProfileForm()

  const openDocument = (print: boolean) => {
    const html = buildProfileDocumentHtml({ form, branches, t, lang: i18n.language })
    openProfileDocument(html, { print })
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-6">
      <CardHeader title={t('companyProfile.fileOperations.title')} />
      <div className="flex flex-col gap-3">
        {[
          { icon: EyeIcon, label: 'preview', subtitle: 'previewSubtitle', print: false },
          { icon: DownloadIcon, label: 'download', subtitle: 'downloadSubtitle', print: true },
        ].map(({ icon, label, subtitle, print }) => (
          <button
            key={label}
            type="button"
            onClick={() => openDocument(print)}
            className="flex h-20 items-center gap-3 rounded-md border border-dashed border-primary/60 bg-primary-25 px-4 transition-colors hover:bg-primary-50"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <AppIcon icon={icon} size={22} className="text-primary" />
            </div>
            <div className="flex flex-1 flex-col items-start gap-0.5">
              <p className="text-body font-medium leading-[1.6] text-neutral-900">
                {t(`companyProfile.fileOperations.${label}`)}
              </p>
              <p className="text-body-sm font-normal leading-[1.6] text-neutral-700">
                {t(`companyProfile.fileOperations.${subtitle}`)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

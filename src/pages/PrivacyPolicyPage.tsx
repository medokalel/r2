import { useTranslation } from 'react-i18next'
import { PrivacyPolicyContent } from '@/components/legal/PrivacyPolicyContent'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { useDirection } from '@/context/direction/useDirection'
import { getPrivacyPolicyContent } from '@/content/privacyPolicy'

export function PrivacyPolicyPage() {
  const { i18n } = useTranslation()
  const { dir } = useDirection()
  const content = getPrivacyPolicyContent(i18n.language)

  return (
    <div dir={dir} className="min-h-screen bg-neutral-25">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-8 md:py-12">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-h3-semi text-primary">{content.title}</h1>
            {content.meta.updated && (
              <p className="text-body-3 text-neutral-700">{content.meta.updated}</p>
            )}
          </div>

          <LanguageToggle variant="icon" />
        </div>

        <div className="rounded-lg border border-neutral-100 bg-white p-5 md:p-8">
          <PrivacyPolicyContent content={content} />
        </div>
      </main>
    </div>
  )
}

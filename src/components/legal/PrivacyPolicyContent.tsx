import { SectionHeading } from '@/components/dashboard/SectionHeading'
import type { PrivacyPolicyContent } from '@/content/privacyPolicy'

interface PrivacyPolicyContentProps {
  content: PrivacyPolicyContent
}

const linkPattern = /(support@icasco\.co|www\.icasco\.co|\+201028485872)/g

function renderInlineText(text: string) {
  const parts = text.split(linkPattern)

  return parts.map((part, index) => {
    if (part === 'support@icasco.co') {
      return (
        <a key={index} href="mailto:support@icasco.co" className="text-primary hover:underline">
          {part}
        </a>
      )
    }

    if (part === 'www.icasco.co') {
      return (
        <a
          key={index}
          href="https://www.icasco.co"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {part}
        </a>
      )
    }

    if (part === '+201028485872') {
      return (
        <a key={index} href="tel:+201028485872" className="text-primary hover:underline">
          {part}
        </a>
      )
    }

    return part
  })
}

export function PrivacyPolicyContent({ content }: PrivacyPolicyContentProps) {
  return (
    <article className="space-y-2">
      {content.sections.map((section) => (
        <section key={section.number} id={`section-${section.number}`}>
          <SectionHeading title={`${section.number}. ${section.title}`} />

          <div className="space-y-3 pb-6">
            {section.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-body-2 leading-7 text-neutral-700">
                {renderInlineText(paragraph)}
              </p>
            ))}

            {section.bullets.length > 0 && (
              <ul className="list-disc space-y-2 ps-5 text-body-2 leading-7 text-neutral-700">
                {section.bullets.map((bullet, index) => (
                  <li key={index}>{renderInlineText(bullet)}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
    </article>
  )
}

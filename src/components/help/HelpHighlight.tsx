import { highlightRanges } from '@/lib/help/search'

/** Text with the search tokens wrapped in <mark>. */
export function HelpHighlight({ text, tokens }: { text: string; tokens: string[] }) {
  const ranges = highlightRanges(text, tokens)
  if (!ranges.length) return <>{text}</>
  const parts: React.ReactNode[] = []
  let at = 0
  ranges.forEach(([start, end], index) => {
    if (start > at) parts.push(text.slice(at, start))
    parts.push(
      <mark key={index} className="rounded-xs bg-warning-100 px-0.5 text-text-primary">
        {text.slice(start, end)}
      </mark>,
    )
    at = end
  })
  if (at < text.length) parts.push(text.slice(at))
  return <>{parts}</>
}

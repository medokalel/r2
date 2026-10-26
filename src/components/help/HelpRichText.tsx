const PATH = /(\/[A-Za-z0-9][A-Za-z0-9\-_/:.]*)/g

/**
 * Article text with app paths (/cab/offers) isolated left-to-right, so a path inside an
 * Arabic sentence keeps its slashes and parentheses in place.
 */
export function HelpRichText({ text }: { text: string }) {
  const parts = text.split(PATH)
  if (parts.length === 1) return <>{text}</>
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <bdi key={index} dir="ltr" className="rounded-xs bg-bg-secondary px-1 font-mono text-[0.92em]">
            {part}
          </bdi>
        ) : (
          part
        ),
      )}
    </>
  )
}

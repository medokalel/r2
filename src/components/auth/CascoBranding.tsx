import { BrandingPanelBackground } from './BrandingPanelBackground'

export function CascoBranding() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden select-none">
      <BrandingPanelBackground />

      <div className="relative z-10 flex w-full flex-col items-center justify-center gap-5 px-8 text-center">
        <img src="/icasco-logo.png" alt="iCASCO" className="mx-auto h-auto w-[227px] object-contain" />
        <div className="flex flex-col items-center gap-1.5">
          <p
            className="text-[1.5rem] font-medium leading-[1.6] text-white [font-family:var(--font-arabic)] mt-2"
            dir="rtl"
            lang="ar"
          >
            امتثال ذكي... أثر حقيقي
          </p>
          <p className="text-[1.5rem] font-medium leading-[1.6] uppercase tracking-[0.2em] text-white">
            SMALL CONFORMITY.. REAL IMPACT
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * CASCO logo — radiating fan lines forming the letter C.
 * Lines fan out from a focal point (inner spine of the C).
 */
export function CascoFanLogo({ size = 180, color = 'white' }: { size?: number; color?: string }) {
  const cx = size / 2
  const cy = size / 2

  const arcStart = 48
  const arcEnd = 312
  const numLines = 72

  const innerR = size * 0.12
  const outerR = size * 0.46

  const toRad = (d: number) => ((d - 90) * Math.PI) / 180

  const lines = Array.from({ length: numLines }, (_, i) => {
    const angle = arcStart + (i / (numLines - 1)) * (arcEnd - arcStart)
    const rad = toRad(angle)
    const x1 = cx + innerR * Math.cos(rad)
    const y1 = cy + innerR * Math.sin(rad)
    const x2 = cx + outerR * Math.cos(rad)
    const y2 = cy + outerR * Math.sin(rad)

    const tipFade = Math.min(i, numLines - 1 - i) / (numLines * 0.12)
    const opacity = Math.min(1, 0.4 + tipFade * 0.6)
    const strokeW = 1.2 + tipFade * 0.4

    return { x1, y1, x2, y2, opacity, strokeW }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={color}
          strokeWidth={l.strokeW}
          strokeOpacity={l.opacity}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

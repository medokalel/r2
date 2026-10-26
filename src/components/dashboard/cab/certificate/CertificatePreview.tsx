import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { CertificateLanguage } from '@/lib/api/cabCertificatesApi'
import { formatCertificateLongDate } from '@/lib/certificatePreparationForm'
import { cn } from '@/lib/utils'

export interface CertificatePreviewData {
  /** Language the certificate itself is printed in — independent of the UI language. */
  language: CertificateLanguage
  issuer: {
    shortName: string
    name: string
    logoUrl: string
    watermarkUrl: string
    tagline: string
    addressLines: string[]
    website: string
    email: string
    phone: string
    workingHours: string
    formCode: string
    version: string
    accreditationName: string
    accreditationAddress: string
  }
  client: {
    tradeName: string
    name: string
    address: string
    logoUrl: string | null
  }
  standardCode: string
  systemName: string
  scope: string
  certificateNumber: string
  initialCertificationDate: Date
  validUntil: Date
  surveillanceDates: [Date, Date]
  includeQrCode: boolean
  signatory: { title: string; signatureUrl: string | null }
  marks: { id: string; name: string; imageUrl: string }[]
}

interface CertificatePreviewProps {
  data: CertificatePreviewData
  className?: string
}

/* ── Layout ─────────────────────────────────────────────────────────────
 * The certificate is laid out in the pixels of the design file (1749 px
 * wide) and converted to container-query units, so the same markup scales
 * from the side panel to the enlarged dialog. `LAYOUT` holds the top of each
 * block's first line of ink, per language, as measured on the two designs.
 */
const DESIGN_WIDTH = 1749
const d = (px: number) => `${(px / DESIGN_WIDTH) * 100}cqw`
/** Top of a text box whose first line's ink starts at `ink` (design px). */
const textTop = (ink: number, size: number, lineHeight: number) => d(ink - (lineHeight / 2 - 0.36 * size))

const COLOR = {
  text: '#1a1a1a',
  muted: '#666666',
  blue: '#1236a3',
  teal: '#10678f',
  accent: '#13908f',
} as const

interface Layout {
  logo: number
  tagline: number
  taglineRule: number
  title: number
  rule1: number
  certify: number
  nameCenter: number
  address: number
  approved: number
  rule2: number
  standard: number
  rule3: number
  applicable: number
  scope: number
  ruleA: number
  meta: number
  metaColumns: string
  /** Where the two vertical separators sit, in % from the start edge. */
  metaSeparators: [number, number]
  surveillance: number
  verify: number
  qr: number
  signature: number
  signatureRule: number
  manager: number
  ruleB: number
  accredited: number
  legal: number
  condition: number
  footerName: number
  pageLine: number
}

const LAYOUT: Record<CertificateLanguage, Layout> = {
  en: {
    logo: 118,
    tagline: 289,
    taglineRule: 338,
    title: 388,
    rule1: 500,
    certify: 552,
    nameCenter: 633,
    address: 710,
    approved: 774,
    rule2: 874,
    standard: 940,
    rule3: 1074,
    applicable: 1126,
    scope: 1181,
    ruleA: 1301,
    meta: 1343,
    metaColumns: '31.2fr 37.4fr 31.4fr',
    metaSeparators: [31.2, 68.6],
    surveillance: 1451,
    verify: 1509,
    qr: 1558,
    signature: 1503,
    signatureRule: 1612,
    manager: 1630,
    ruleB: 1718,
    accredited: 1759,
    legal: 1882,
    condition: 1972,
    footerName: 2065,
    pageLine: 2312,
  },
  ar: {
    logo: 122,
    tagline: 294,
    taglineRule: 342,
    title: 387,
    rule1: 505,
    certify: 553,
    nameCenter: 668,
    address: 752,
    approved: 816,
    rule2: 886,
    standard: 972,
    rule3: 1127,
    applicable: 1179,
    scope: 1231,
    ruleA: 1323,
    meta: 1361,
    metaColumns: '35fr 30.3fr 34.7fr',
    metaSeparators: [35, 65.3],
    surveillance: 1471,
    verify: 1530,
    qr: 1580,
    signature: 1530,
    signatureRule: 1634,
    manager: 1652,
    ruleB: 1739,
    accredited: 1781,
    legal: 1901,
    condition: 1965,
    footerName: 2060,
    pageLine: 2307,
  },
}

/* ── Decoration ─────────────────────────────────────────────────────────── */

const fadeBothEnds = (color: string, axis: 'x' | 'y') =>
  `linear-gradient(${axis === 'x' ? '90deg' : '180deg'}, transparent, ${color} 30%, ${color} 70%, transparent)`

/** Frame, corner accents and the faint mark behind the text. */
function PaperDecoration({ watermarkUrl }: { watermarkUrl: string }) {
  const horizontal = (position: CSSProperties) => (
    <span
      className="absolute"
      style={{ width: d(201), height: d(2), background: fadeBothEnds(COLOR.accent, 'x'), ...position }}
    />
  )
  const vertical = (position: CSSProperties) => (
    <span
      className="absolute"
      style={{ width: d(2), height: d(199), background: fadeBothEnds(COLOR.accent, 'y'), ...position }}
    />
  )

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <img
        src={watermarkUrl}
        alt=""
        className="absolute opacity-[0.05]"
        style={{ height: d(880), left: '50%', top: d(800), transform: 'translateX(-50%)' }}
      />
      <span className="absolute" style={{ inset: d(30), border: `${d(2)} solid #1a5c93` }} />
      {horizontal({ top: d(19), insetInlineStart: d(32) })}
      {horizontal({ top: d(19), insetInlineEnd: d(32) })}
      {horizontal({ bottom: d(19), insetInlineStart: d(32) })}
      {horizontal({ bottom: d(19), insetInlineEnd: d(32) })}
      {vertical({ top: d(48), insetInlineStart: d(46) })}
      {vertical({ top: d(48), insetInlineEnd: d(46) })}
      {vertical({ bottom: d(48), insetInlineStart: d(46) })}
      {vertical({ bottom: d(48), insetInlineEnd: d(46) })}
    </div>
  )
}

/** Thin horizontal rule (design px). `strong` is the darker rule above the footer. */
function Rule({ y, from, to, strong }: { y: number; from: number; to: number; strong?: boolean }) {
  return (
    <span
      className="absolute"
      aria-hidden
      style={{
        top: d(y),
        left: d(from),
        width: d(to - from),
        height: d(2),
        background: strong
          ? `linear-gradient(90deg, rgba(18,54,163,0.35), ${COLOR.blue} 12%, ${COLOR.blue} 88%, rgba(18,54,163,0.35))`
          : `linear-gradient(90deg, transparent, ${COLOR.teal} 25%, ${COLOR.teal} 75%, transparent)`,
      }}
    />
  )
}

/** Rule with a small diamond in the middle. */
function DiamondDivider({ y, width }: { y: number; width: number }) {
  const line = (angle: number) => (
    <span
      className="block flex-1"
      style={{ height: d(2), background: `linear-gradient(${angle}deg, rgba(16,103,144,0.3), ${COLOR.teal})` }}
    />
  )
  return (
    <div
      className="absolute flex items-center"
      aria-hidden
      dir="ltr"
      style={{ top: d(y - 12), left: d((DESIGN_WIDTH - width) / 2), width: d(width), height: d(24), gap: d(24) }}
    >
      {line(90)}
      <span
        className="block shrink-0 rotate-45"
        style={{ width: d(15), height: d(15), border: `${d(1.6)} solid ${COLOR.teal}` }}
      />
      {line(270)}
    </div>
  )
}

/**
 * Decorative stand-in for the verification QR code: three finder squares plus a
 * data area seeded from the certificate number. It is intentionally NOT
 * scannable — swap it for a real QR encoder once the backend returns the
 * verification URL.
 */
const QR_MODULES = 21
const FINDER_ORIGINS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [QR_MODULES - 7, 0],
  [0, QR_MODULES - 7],
]

function hashSeed(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  }
  return hash >>> 0
}

function isFinderZone(x: number, y: number): boolean {
  return FINDER_ORIGINS.some(([originX, originY]) => x >= originX - 1 && x <= originX + 7 && y >= originY - 1 && y <= originY + 7)
}

function finderModules(): string[] {
  return FINDER_ORIGINS.flatMap(([originX, originY]) => {
    const cells: string[] = []
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const onRing = x === 0 || x === 6 || y === 0 || y === 6
        const onCore = x >= 2 && x <= 4 && y >= 2 && y <= 4
        if (onRing || onCore) cells.push(`M${originX + x} ${originY + y}h1v1h-1z`)
      }
    }
    return cells
  })
}

function QrCodePlaceholder({ seed }: { seed: string }) {
  const path = useMemo(() => {
    let state = hashSeed(seed) || 1
    const next = () => {
      state ^= state << 13
      state ^= state >>> 17
      state ^= state << 5
      state >>>= 0
      return state / 4294967296
    }

    const cells = finderModules()
    for (let y = 0; y < QR_MODULES; y += 1) {
      for (let x = 0; x < QR_MODULES; x += 1) {
        if (!isFinderZone(x, y) && next() > 0.52) cells.push(`M${x} ${y}h1v1h-1z`)
      }
    }
    return cells.join('')
  }, [seed])

  return (
    <svg viewBox={`0 0 ${QR_MODULES} ${QR_MODULES}`} shapeRendering="crispEdges" className="size-full" aria-hidden>
      <path d={path} fill="currentColor" />
    </svg>
  )
}

/* ── Text helpers ───────────────────────────────────────────────────────── */

interface TextBlockProps {
  /** Design px of the top of the first line of ink. */
  ink: number
  size: number
  lineHeight: number
  children: ReactNode
  className?: string
  style?: CSSProperties
}

/** Full-width, centred block whose first line of ink sits at `ink`. */
function CenteredText({ ink, size, lineHeight, children, className, style }: TextBlockProps) {
  return (
    <div
      className={cn('absolute inset-x-0 text-center', className)}
      style={{ top: textTop(ink, size, lineHeight), fontSize: d(size), lineHeight: d(lineHeight), ...style }}
    >
      {children}
    </div>
  )
}

/** Narrower centred block, so paragraphs wrap exactly like the design. */
function Paragraph({ width, style, ...props }: TextBlockProps & { width: number }) {
  const margin = d((DESIGN_WIDTH - width) / 2)
  return <CenteredText {...props} style={{ left: margin, right: margin, ...style }} />
}

/**
 * A4-portrait CASCO certificate. Content follows the certificate language
 * (English / Arabic, mirrored), independent of the app's UI language.
 */
export function CertificatePreview({ data, className }: CertificatePreviewProps) {
  const { t } = useTranslation()
  const lng = data.language
  const layout = LAYOUT[lng]
  const { issuer, client } = data

  const label = (key: string, values?: Record<string, string | number>) =>
    t(`cab.certificatePrepare.preview.${key}`, { lng, ...values })
  const date = (value: Date) => formatCertificateLongDate(value, lng)

  const certificationDetails = [
    { key: 'certificationNo', value: <span dir="ltr">{data.certificateNumber}</span> },
    { key: 'initialCertificationDate', value: date(data.initialCertificationDate) },
    { key: 'validUntil', value: date(data.validUntil) },
  ]

  return (
    <div
      role="group"
      aria-label={t('cab.certificatePrepare.preview.title')}
      lang={lng}
      dir={lng === 'ar' ? 'rtl' : 'ltr'}
      className={cn('@container w-full', className)}
    >
      <div
        className="relative w-full overflow-hidden rounded-md border border-neutral-300 bg-white shadow-sm"
        style={{ aspectRatio: '1749 / 2459', color: COLOR.text }}
      >
        <PaperDecoration watermarkUrl={issuer.watermarkUrl} />

        {/* Header */}
        <img
          src={issuer.logoUrl}
          alt={issuer.name}
          className="absolute"
          style={{ top: d(layout.logo), left: '50%', width: d(166), transform: 'translateX(-50%)' }}
        />
        <CenteredText
          ink={layout.tagline}
          size={16}
          lineHeight={22}
          className="font-medium uppercase"
          style={{ color: COLOR.blue }}
        >
          <span dir="ltr">{issuer.tagline}</span>
        </CenteredText>
        <Rule y={layout.taglineRule} from={650} to={1098} />

        <CenteredText ink={layout.title} size={57.4} lineHeight={68} className="font-semibold">
          {label('certificateTitle')}
        </CenteredText>
        <DiamondDivider y={layout.rule1} width={651} />

        {/* Client */}
        <CenteredText ink={layout.certify} size={20} lineHeight={28} style={{ color: COLOR.muted }}>
          {label('certifyThat', { name: client.tradeName })}
        </CenteredText>

        <div
          className="absolute inset-x-0 flex items-center justify-center"
          style={{ top: d(layout.nameCenter - 45), height: d(90), gap: d(99) }}
        >
          <p
            className="line-clamp-2 text-center font-semibold"
            style={{ fontSize: d(32), lineHeight: d(40), width: client.logoUrl ? d(236) : d(760) }}
          >
            {client.name}
          </p>
          {client.logoUrl && <img src={client.logoUrl} alt="" style={{ height: d(62), width: 'auto' }} />}
        </div>

        <Paragraph ink={layout.address} size={20} lineHeight={28} width={1100} style={{ color: COLOR.muted }}>
          {client.address}
        </Paragraph>
        <Paragraph ink={layout.approved} size={20} lineHeight={32} width={1060} className="font-semibold">
          {label('approvedBy', { system: data.systemName })}
        </Paragraph>
        <DiamondDivider y={layout.rule2} width={657} />

        {/* Standard */}
        <CenteredText
          ink={layout.standard}
          size={96}
          lineHeight={102}
          className="font-bold"
          style={{ color: COLOR.blue }}
        >
          <span dir="ltr">{data.standardCode}</span>
        </CenteredText>
        <DiamondDivider y={layout.rule3} width={657} />

        <CenteredText
          ink={layout.applicable}
          size={20}
          lineHeight={28}
          className="font-medium uppercase"
          style={{ color: COLOR.blue }}
        >
          {label('applicableTo', { system: data.systemName })}
        </CenteredText>
        <Paragraph ink={layout.scope} size={20} lineHeight={32} width={1160}>
          <span className="line-clamp-4">{data.scope}</span>
        </Paragraph>

        <Rule y={layout.ruleA} from={393} to={1357} />

        {/* Certification details */}
        <div
          className="absolute inset-x-0 grid text-center"
          style={{ top: textTop(layout.meta, 20, 28), gridTemplateColumns: layout.metaColumns }}
        >
          {certificationDetails.map((column) => (
            <div key={column.key}>
              <p className="font-semibold uppercase" style={{ fontSize: d(20), lineHeight: d(28), color: COLOR.blue }}>
                {label(column.key)}
              </p>
              <p style={{ fontSize: d(20), lineHeight: d(28), marginTop: d(14) }}>{column.value}</p>
            </div>
          ))}
        </div>
        {layout.metaSeparators.map((percent) => (
          <span
            key={percent}
            aria-hidden
            className="absolute"
            style={{
              top: d(layout.meta + 3),
              insetInlineStart: `${percent}%`,
              width: d(2),
              height: d(54),
              background: `linear-gradient(180deg, transparent, ${COLOR.blue}, transparent)`,
            }}
          />
        ))}

        <CenteredText ink={layout.surveillance} size={16} lineHeight={24}>
          <span className="inline-flex items-baseline justify-center" style={{ gap: d(42) }}>
            {[label('firstSurveillance'), label('secondSurveillance')].map((text, index) => (
              <span key={text}>
                <span style={{ color: COLOR.muted }}>{text} </span>
                <span className="font-medium">{date(data.surveillanceDates[index])}</span>
              </span>
            ))}
          </span>
        </CenteredText>

        {/* Signature */}
        <div className="absolute top-0" style={{ insetInlineStart: d(135), width: d(290) }}>
          {data.signatory.signatureUrl && (
            <img
              src={data.signatory.signatureUrl}
              alt=""
              className="absolute"
              style={{ top: d(layout.signature), left: '50%', height: d(101), transform: 'translateX(-50%)' }}
            />
          )}
          <span
            aria-hidden
            className="absolute inset-x-0"
            style={{
              top: d(layout.signatureRule),
              height: d(2),
              background: `linear-gradient(90deg, transparent, ${COLOR.teal} 20%, ${COLOR.teal} 80%, transparent)`,
            }}
          />
          <p
            className="absolute inset-x-0 text-center font-medium"
            style={{ top: textTop(layout.manager, 16, 24), fontSize: d(16), lineHeight: d(24) }}
          >
            {data.signatory.title}
          </p>
          <p
            className="absolute inset-x-0 whitespace-nowrap text-center"
            style={{ top: textTop(layout.manager + 31, 16, 22), fontSize: d(16), lineHeight: d(22), color: COLOR.muted }}
          >
            {issuer.name}
          </p>
        </div>

        {/* Verification */}
        {data.includeQrCode && (
          <div className="absolute top-0 text-center" style={{ insetInlineEnd: d(125), width: d(270) }}>
            <p
              className="absolute inset-x-0 font-semibold uppercase"
              style={{ top: textTop(layout.verify, 20, 28), fontSize: d(20), lineHeight: d(28), color: COLOR.blue }}
            >
              {label('verifyValidity')}
            </p>
            <div
              className="absolute bg-white"
              style={{
                top: d(layout.qr),
                left: '50%',
                width: d(128),
                height: d(127),
                padding: d(6),
                transform: 'translateX(-50%)',
                border: `${d(2)} solid ${COLOR.text}`,
                color: COLOR.text,
              }}
            >
              <QrCodePlaceholder seed={data.certificateNumber} />
            </div>
          </div>
        )}

        <Rule y={layout.ruleB} from={386} to={1362} />

        {/* Accreditation */}
        <CenteredText ink={layout.accredited} size={20} lineHeight={40}>
          {label('accreditedBy')}
          <span className="block font-semibold">{issuer.accreditationName}</span>
          <span className="block">{issuer.accreditationAddress}</span>
        </CenteredText>

        <Paragraph ink={layout.legal} size={16} lineHeight={26} width={1140} style={{ color: COLOR.muted }}>
          {label('validityNotice', { issuer: issuer.shortName })}
        </Paragraph>
        <Paragraph ink={layout.condition} size={16} lineHeight={26} width={1140} style={{ color: COLOR.blue }}>
          {label('conditionNotice')}
        </Paragraph>

        {/* Footer */}
        <Rule y={2019} from={133} to={1616} strong />
        <div
          className="absolute"
          style={{ insetInlineStart: d(133), top: textTop(layout.footerName, 20, 32), width: d(1000) }}
        >
          <p className="font-semibold" style={{ fontSize: d(20), lineHeight: d(32) }}>
            {issuer.name}
          </p>
          <div style={{ fontSize: d(20), lineHeight: d(32), color: COLOR.muted, marginTop: d(8) }}>
            {issuer.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p style={{ marginTop: d(8) }}>
              <span style={{ color: COLOR.text }}>{label('visitUs')} </span>
              <span className="underline" dir="ltr">
                {issuer.website}
              </span>
              {' | '}
              <span className="underline" dir="ltr">
                {issuer.email}
              </span>
            </p>
            <p style={{ marginTop: d(8) }}>
              <span style={{ color: COLOR.text }}>{label('callUs')} </span>
              <span dir="ltr">{issuer.phone}</span>
              {' | '}
              {issuer.workingHours}
            </p>
          </div>
        </div>

        {data.marks.length > 0 && (
          <div className="absolute" style={{ insetInlineEnd: d(133), top: d(2100) }}>
            {/* Marks read left-to-right in both languages, like the design. */}
            <div className="flex items-center" dir="ltr" style={{ gap: d(4), height: d(100) }}>
              {data.marks.map((mark) => (
                <img key={mark.id} src={mark.imageUrl} alt={mark.name} style={{ height: d(100), width: 'auto' }} />
              ))}
            </div>
          </div>
        )}

        <div
          className="absolute flex justify-between"
          style={{
            top: textTop(layout.pageLine, 16, 24),
            insetInline: d(179),
            fontSize: d(16),
            lineHeight: d(24),
            color: COLOR.muted,
          }}
        >
          <span>{label('page', { current: 1, total: 1 })}</span>
          <span dir="ltr">{issuer.formCode}</span>
          <span>{label('version', { version: issuer.version })}</span>
        </div>
      </div>
    </div>
  )
}
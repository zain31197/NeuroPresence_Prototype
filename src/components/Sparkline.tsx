import { useId } from 'react'

/**
 * Rolling history sparkline. Hand-drawn SVG so the line, the fill and the
 * target threshold share one coordinate space and never shift layout.
 */
export function Sparkline({
  values,
  threshold,
  thresholdLabel,
  tone = '#3b82f6',
  height = 68,
  ariaLabel,
}: {
  values: number[]
  threshold?: number
  thresholdLabel?: string
  tone?: string
  height?: number
  ariaLabel: string
}) {
  const gradientId = useId()
  const W = 300
  const H = height
  const padTop = 8
  const padBottom = 14

  if (values.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-control border border-dashed border-border text-[12px] text-text-muted"
        style={{ height: H }}
      >
        No samples yet — start a session
      </div>
    )
  }

  const candidates = threshold === undefined ? values : [...values, threshold]
  let lo = Math.min(...candidates)
  let hi = Math.max(...candidates)
  if (hi - lo < 1e-6) {
    lo -= 1
    hi += 1
  }
  const pad = (hi - lo) * 0.18
  lo -= pad
  hi += pad

  const x = (i: number) => (i / Math.max(1, values.length - 1)) * W
  const y = (v: number) =>
    padTop + (1 - (v - lo) / (hi - lo)) * (H - padTop - padBottom)

  /*
   * A Catmull-Rom spline through the samples, emitted as cubic béziers.
   * Straight segments made a 2 Hz stream look like a seismograph; the curve
   * reads as a signal wandering, which is what the numbers actually do.
   */
  const pts = values.map((v, i) => ({ x: x(i), y: y(v) }))
  let line = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    line += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }
  const area = `${line} L ${x(values.length - 1).toFixed(2)},${H - padBottom} L ${x(0).toFixed(2)},${H - padBottom} Z`
  const lastX = x(values.length - 1)
  const lastY = y(values[values.length - 1])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: H }}
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
        <filter id={`${gradientId}-glow`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path d={area} fill={`url(#${gradientId})`} />
      {/* Soft under-glow, then the crisp trace on top. */}
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.35"
        filter={`url(#${gradientId}-glow)`}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {threshold !== undefined ? (
        <>
          <line
            x1="0"
            x2={W}
            y1={y(threshold)}
            y2={y(threshold)}
            stroke="var(--success)"
            strokeWidth="1"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
            opacity="0.75"
          />
          {thresholdLabel ? (
            <text
              x={4}
              y={Math.max(9, y(threshold) - 4)}
              fill="var(--success)"
              fontSize="9"
              fontFamily="var(--font-mono, ui-monospace)"
              opacity="0.9"
            >
              {thresholdLabel}
            </text>
          ) : null}
        </>
      ) : null}

      {/* Leading sample: a soft halo that breathes, plus the point itself. */}
      <circle cx={lastX} cy={lastY} r="6" fill={tone} opacity="0.18" className="motion-safe:animate-pulse-dot" />
      <circle cx={lastX} cy={lastY} r="2.6" fill={tone} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

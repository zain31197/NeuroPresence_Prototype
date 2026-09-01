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

  const points = values.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`)
  const line = `M ${points.join(' L ')}`
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
          <stop offset="0%" stopColor={tone} stopOpacity="0.16" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={area} fill={`url(#${gradientId})`} />
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

      <circle cx={lastX} cy={lastY} r="2.6" fill={tone} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

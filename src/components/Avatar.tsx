import { cx } from './ui'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Enrolled-user avatar. Initials on a generated gradient — no photo is
 * stored, because no capture actually happens.
 */
export function Avatar({
  name,
  size = 32,
  ring = 'none',
  className,
}: {
  name: string
  size?: number
  ring?: 'none' | 'success' | 'danger' | 'warning'
  className?: string
}) {
  const rings: Record<string, string> = {
    none: 'ring-1 ring-border',
    success: 'ring-2 ring-success/60',
    danger: 'ring-2 ring-danger/70',
    warning: 'ring-2 ring-warning/70',
  }
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        rings[ring],
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.38)),
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

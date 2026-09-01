import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { motion } from 'framer-motion'

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/* ------------------------------- Card ------------------------------- */

export function Card({
  children,
  className,
  padding = 'p-5',
  interactive,
}: {
  children: ReactNode
  className?: string
  padding?: string
  /** Adds the hover lift used on browsable grids. */
  interactive?: boolean
}) {
  return (
    <section
      className={cx(
        'np-card',
        padding,
        interactive &&
          'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-hover motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function CardHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon?: ReactNode
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        {icon ? <span className="mt-0.5 shrink-0 text-text-muted">{icon}</span> : null}
        <div className="min-w-0">
          <h2 className="np-section-heading truncate">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-[13px] leading-snug text-text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  )
}

/* ------------------------------ Button ------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover border border-transparent disabled:hover:bg-primary',
  secondary:
    'bg-surface-2 text-text border border-border hover:border-text-muted/60 hover:bg-surface-2/70',
  ghost: 'bg-transparent text-text-muted border border-transparent hover:text-text hover:bg-surface-2',
  danger: 'bg-danger text-white border border-transparent hover:brightness-110',
  success: 'bg-success text-[#04140a] border border-transparent hover:brightness-110',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-4 text-[13px] gap-2',
  lg: 'h-11 px-5 text-[14px] gap-2',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', block, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cx(
        'group/btn inline-flex items-center justify-center whitespace-nowrap rounded-control font-medium',
        'transition-all duration-200 ease-out',
        'disabled:cursor-not-allowed disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})

/* ------------------------------ Toggle ------------------------------ */

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  tone = 'primary',
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  tone?: 'primary' | 'success' | 'accent'
}) {
  const toneClass =
    tone === 'success' ? 'bg-success' : tone === 'accent' ? 'bg-accent' : 'bg-primary'
  return (
    <div
      className={cx(
        'flex items-center justify-between gap-4',
        disabled && 'opacity-50',
      )}
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-text">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[12px] leading-snug text-text-muted">
            {description}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 ease-out',
          checked ? cx(toneClass, 'border-transparent') : 'border-border bg-surface-2',
          disabled && 'cursor-not-allowed',
        )}
      >
        <span
          className={cx(
            'absolute top-1/2 block h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white shadow',
            'transition-all duration-200 ease-out',
            checked ? 'left-[23px]' : 'left-[3px]',
          )}
        />
      </button>
    </div>
  )
}

/** Chip drawn on top of a video frame — always dark, whatever the theme. */
export function OverlayChip({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-chip border border-white/15 bg-black/60',
        'px-2 py-1 text-[10px] font-medium leading-none text-white/85 backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ---------------------------- Segmented ----------------------------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  ariaLabel,
  className,
}: {
  value: T
  onChange: (next: T) => void
  options: Array<{ value: T; label: string; icon?: ReactNode }>
  size?: 'sm' | 'md'
  ariaLabel: string
  className?: string
}) {
  // Scopes the sliding pill to this control instance.
  const groupId = useId()
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cx(
        'inline-flex items-center gap-0.5 rounded-control border border-border bg-surface-2 p-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cx(
              'relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-[6px] font-medium',
              'transition-colors duration-200 ease-out',
              size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-8 px-3 text-[13px]',
              active ? 'text-white' : 'text-text-muted hover:text-text',
            )}
          >
            {active ? (
              <motion.span
                layoutId={`segmented-${groupId}`}
                className="absolute inset-0 rounded-[6px] bg-primary shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="relative inline-flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------ Select ------------------------------ */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
}

export function Select({ label, hint, className, children, id, ...rest }: SelectProps) {
  return (
    <div className={cx('w-full', className)}>
      {label ? (
        <label htmlFor={id} className="np-label mb-1.5 block">
          {label}
        </label>
      ) : null}
      <select
        id={id}
        className={cx(
          'h-9 w-full rounded-control border border-border bg-surface-2 px-3 text-[13px] text-text',
          'transition-colors duration-200 ease-out hover:border-text-muted/60',
        )}
        {...rest}
      >
        {children}
      </select>
      {hint ? <p className="mt-1.5 text-[12px] text-text-muted">{hint}</p> : null}
    </div>
  )
}

/* --------------------------- Progress bar --------------------------- */

export function ProgressBar({
  value,
  tone = 'primary',
  className,
  label,
}: {
  value: number
  tone?: 'primary' | 'success' | 'accent'
  className?: string
  label?: string
}) {
  const toneClass =
    tone === 'success' ? 'bg-success' : tone === 'accent' ? 'bg-accent' : 'bg-primary'
  return (
    <div
      className={cx('h-1.5 w-full overflow-hidden rounded-full bg-surface-2', className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cx('h-full rounded-full transition-[width] duration-150 ease-out', toneClass)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

/* ------------------------------- Chip ------------------------------- */

export function Chip({
  children,
  tone = 'muted',
  className,
  icon,
  title,
}: {
  children: ReactNode
  tone?: 'muted' | 'success' | 'warning' | 'danger' | 'accent' | 'primary'
  className?: string
  icon?: ReactNode
  title?: string
}) {
  const tones: Record<string, string> = {
    muted: 'text-text-muted border-border bg-surface-2',
    success: 'text-success border-success/30 bg-success/10',
    warning: 'text-warning border-warning/30 bg-warning/10',
    danger: 'text-danger border-danger/30 bg-danger/10',
    accent: 'text-accent border-accent/30 bg-accent/10',
    primary: 'text-primary border-primary/30 bg-primary/10',
  }
  return (
    <span className={cx('np-chip', tones[tone], className)} title={title}>
      {icon}
      {children}
    </span>
  )
}

/* --------------------------- Simulated tag -------------------------- */

/** Mandatory honesty marker — nothing here is real telemetry. */
export function SimulatedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-chip border border-accent/40 bg-accent/10',
        'px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent',
        className,
      )}
      title="Values on this panel are generated by the prototype, not measured live."
    >
      simulated
    </span>
  )
}

/* ---------------------------- Status dot ---------------------------- */

export function StatusDot({
  tone = 'muted',
  pulse,
}: {
  tone?: 'success' | 'danger' | 'warning' | 'muted' | 'primary'
  pulse?: boolean
}) {
  const tones: Record<string, string> = {
    success: 'bg-success',
    danger: 'bg-danger',
    warning: 'bg-warning',
    primary: 'bg-primary',
    muted: 'bg-text-muted',
  }
  return (
    <span
      aria-hidden
      className={cx(
        'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
        tones[tone],
        pulse && 'animate-pulse-dot',
      )}
    />
  )
}

/* --------------------------- Empty state ---------------------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border px-6 py-10 text-center">
      {icon ? <div className="mb-3 text-text-muted">{icon}</div> : null}
      <p className="text-[14px] font-medium text-text">{title}</p>
      {body ? <p className="mt-1 max-w-sm text-[13px] text-text-muted">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

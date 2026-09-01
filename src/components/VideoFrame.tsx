import { ShieldCheck, ShieldAlert, Power } from 'lucide-react'
import { COPY } from '../mock/constants'
import type { SessionState, SourceClip } from '../mock/types'
import { ClipSurface } from './ClipCanvas'
import { cx, ProgressBar } from './ui'

/** The synthetic-media disclosure overlay (Appendix D wording). */
export function WatermarkOverlay({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <div
      className={cx(
        'pointer-events-none inline-flex items-center gap-1.5 rounded-chip',
        'border border-white/15 bg-black/55 text-white/90 backdrop-blur-sm',
        size === 'sm' ? 'px-1.5 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[11px]',
      )}
    >
      <ShieldCheck size={size === 'sm' ? 10 : 13} className="text-accent" />
      <span className="font-medium">{COPY.watermark}</span>
    </div>
  )
}

export function LiveChip({ session }: { session: SessionState }) {
  if (session === 'idle') return null
  const live = session === 'live'
  return (
    <div
      className={cx(
        'inline-flex items-center gap-1.5 rounded-chip border px-2 py-1 text-[11px] font-semibold',
        'uppercase tracking-[0.08em] backdrop-blur-sm',
        live
          ? 'border-danger/40 bg-black/55 text-white'
          : 'border-primary/40 bg-black/55 text-primary',
      )}
    >
      <span
        className={cx(
          'inline-block h-1.5 w-1.5 rounded-full',
          live ? 'animate-pulse-dot bg-danger' : 'bg-primary',
        )}
      />
      {live ? 'Live' : 'Warming up'}
    </div>
  )
}

export function VideoFrame({
  clip,
  session,
  watermark,
  warmupProgress = 0,
  label = 'Virtual Camera Output',
  blocked = false,
  className,
  showLiveChip = true,
  cornerRight,
}: {
  clip: SourceClip
  session: SessionState
  watermark: boolean
  warmupProgress?: number
  label?: string
  blocked?: boolean
  className?: string
  showLiveChip?: boolean
  cornerRight?: React.ReactNode
}) {
  const live = session === 'live'
  const warming = session === 'warming'

  return (
    <figure
      className={cx(
        'relative aspect-video w-full overflow-hidden rounded-card border bg-black',
        live ? 'border-danger/35' : 'border-border',
        'transition-colors duration-200 ease-out',
        className,
      )}
    >
      <div className={cx('absolute inset-0', !live && 'opacity-70 saturate-[.85]')}>
        <ClipSurface clip={clip} animated={live || warming} talking={live} />
      </div>

      {/* Idle veil — the feed is not being sent anywhere yet. */}
      {session === 'idle' && !blocked ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/55 backdrop-blur-[2px]">
          <Power size={20} className="mb-2 text-text-muted" />
          <p className="text-[13px] font-medium text-text">Session idle</p>
          <p className="mt-0.5 text-[12px] text-text-muted">
            Start a session to stream to the virtual camera.
          </p>
        </div>
      ) : null}

      {/* Blocked veil — consent gate refused the likeness. */}
      {blocked ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-danger/12 backdrop-blur-[3px]">
          <div className="rounded-card border border-danger/40 bg-bg/85 px-4 py-3 text-center">
            <ShieldAlert size={18} className="mx-auto mb-1.5 text-danger" />
            <p className="text-[13px] font-semibold text-danger">Animation blocked</p>
            <p className="mt-0.5 max-w-[22rem] text-[12px] text-text-muted">
              {COPY.consentBlocked}
            </p>
          </div>
        </div>
      ) : null}

      {/* Warm-up overlay. */}
      {warming ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-8">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-white/85">
            <span>Warming up…</span>
            <span className="font-mono tabular-nums">{Math.round(warmupProgress)}%</span>
          </div>
          <ProgressBar value={warmupProgress} label="Session warm-up" />
        </div>
      ) : null}

      {/* Frame label, top-left. */}
      <figcaption className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
        {showLiveChip && session !== 'idle' ? (
          <LiveChip session={session} />
        ) : (
          <span className="rounded-chip border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/70 backdrop-blur-sm">
            {label}
          </span>
        )}
      </figcaption>

      {showLiveChip && session !== 'idle' ? (
        <span className="pointer-events-none absolute left-3 top-11 rounded-chip border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60 backdrop-blur-sm">
          {label}
        </span>
      ) : null}

      {cornerRight ? <div className="absolute right-3 top-3">{cornerRight}</div> : null}

      {/* Disclosure watermark, bottom-right. */}
      {watermark ? (
        <div className="absolute bottom-3 right-3">
          <WatermarkOverlay />
        </div>
      ) : null}
    </figure>
  )
}

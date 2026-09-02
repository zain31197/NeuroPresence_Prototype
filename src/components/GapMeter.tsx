import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { HARDWARE, MEASURED, TARGETS } from '../mock/constants'
import { cx } from './ui'

/* ------------------------------------------------------------------ *
 * Measured baseline vs. engineering target.
 *
 * The demo script calls this the honest, high-impact moment: 130.1 ms
 * measured on our own hardware, 42 ms to reach. Drawing both bars to the
 * same scale makes the size of the remaining work legible in a glance,
 * which a table of figures never quite manages.
 * ------------------------------------------------------------------ */

const EASE = [0.16, 1, 0.3, 1] as const

function Bar({
  label,
  value,
  unit,
  pct,
  tone,
  caption,
  delay,
}: {
  label: string
  value: string
  unit: string
  pct: number
  tone: 'warning' | 'success'
  caption: string
  delay: number
}) {
  const reduced = useReducedMotion()
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="np-label">{label}</span>
        <span className="flex items-baseline gap-1">
          <span
            className={cx(
              'font-mono text-[18px] font-semibold tabular-nums leading-none',
              tone === 'warning' ? 'text-warning' : 'text-success',
            )}
          >
            {value}
          </span>
          <span className="font-mono text-[11px] text-text-muted">{unit}</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className={cx(
            'h-full rounded-full',
            tone === 'warning'
              ? 'bg-gradient-to-r from-warning/70 to-warning'
              : 'bg-gradient-to-r from-success/70 to-success',
          )}
          initial={reduced ? { width: `${pct}%` } : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduced ? 0 : 0.95, delay: reduced ? 0 : delay, ease: EASE }}
        />
      </div>
      <p className="mt-1 text-[11px] text-text-muted">{caption}</p>
    </div>
  )
}

export function GapMeter() {
  const reduced = useReducedMotion()
  const worst = MEASURED.latencyMeanMs
  const speedup = MEASURED.latencyMeanMs / TARGETS.frameComputeMs

  return (
    <div className="rounded-control border border-warning/25 bg-warning/[0.06] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-warning">
            The engineering gap
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
            Measured on {HARDWARE.gpu} ({HARDWARE.vram}), {HARDWARE.os}, with actual LivePortrait
            weights. Not simulated.
          </p>
        </div>
        <motion.span
          initial={reduced ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.9, ease: EASE }}
          className="shrink-0 rounded-chip border border-success/35 bg-success/10 px-2.5 py-1.5 text-center"
        >
          <span className="block font-mono text-[15px] font-semibold leading-none text-success">
            {speedup.toFixed(1)}×
          </span>
          <span className="mt-0.5 block text-[9px] uppercase tracking-wider text-text-muted">
            to close
          </span>
        </motion.span>
      </div>

      <div className="space-y-3">
        <Bar
          label="Measured today"
          value={MEASURED.latencyMeanMs.toFixed(1)}
          unit="ms / frame"
          pct={100}
          tone="warning"
          caption={`${MEASURED.fps} FPS · p95 ${MEASURED.latencyP95Ms} ms · p99 ${MEASURED.latencyP99Ms} ms · peak ${MEASURED.peakVramGb} GB VRAM`}
          delay={0.05}
        />

        <div className="flex items-center gap-2 pl-1">
          <motion.span
            initial={reduced ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.6 }}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted"
          >
            <ArrowDown size={12} />
            {(MEASURED.latencyMeanMs - TARGETS.frameComputeMs).toFixed(1)} ms to remove
          </motion.span>
        </div>

        <Bar
          label="Engineering target"
          value={TARGETS.frameComputeMs.toFixed(0)}
          unit="ms / frame"
          pct={(TARGETS.frameComputeMs / worst) * 100}
          tone="success"
          caption={`≥ ${TARGETS.fps} FPS · ≤ ${TARGETS.endToEndLatencyMs} ms end-to-end · CSIM ≥ ${TARGETS.csim.toFixed(2)}`}
          delay={0.35}
        />
      </div>

      <p className="mt-3.5 border-t border-warning/20 pt-3 text-[11px] leading-relaxed text-text-muted">
        Closing this gap — quantisation, TensorRT export, and a lighter warping stage — is the
        engineering the project delivers. The fine-tune fit check ({MEASURED.fineTuneFitGb} GB peak,
        2 of 5 modules, FP32, batch 1) confirms the hardware has room.
      </p>
    </div>
  )
}

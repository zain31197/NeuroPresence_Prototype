import { motion } from 'framer-motion'
import { Activity, Cpu, Gauge, ScanFace, Timer } from 'lucide-react'
import { HARDWARE, MEASURED, TARGETS } from '../mock/constants'
import { useEngine } from '../mock/engine'
import type { MetricsMode } from '../mock/types'
import { Sparkline } from './Sparkline'
import { useAnimatedNumber } from './useAnimatedNumber'
import { Card, CardHeader, cx, Segmented, SimulatedBadge } from './ui'

type Status = 'good' | 'warn' | 'bad' | 'none'

const STATUS_TEXT: Record<Status, string> = {
  good: 'text-success',
  warn: 'text-warning',
  bad: 'text-danger',
  none: 'text-text-muted',
}

const STATUS_RING: Record<Status, string> = {
  good: 'border-success/25 bg-success/[0.06]',
  warn: 'border-warning/25 bg-warning/[0.06]',
  bad: 'border-danger/25 bg-danger/[0.06]',
  none: 'border-border bg-surface-2/40',
}

/** Section 9.1 thresholds, applied exactly as written in the brief. */
function latencyStatus(ms: number): Status {
  if (ms <= TARGETS.frameComputeMs) return 'good'
  if (ms <= TARGETS.endToEndLatencyMs) return 'warn'
  return 'bad'
}

function fpsStatus(fps: number): Status {
  if (fps >= TARGETS.fps) return 'good'
  if (fps >= 12) return 'warn'
  return 'bad'
}

function vramStatus(gb: number): Status {
  return gb <= TARGETS.peakVramGb ? 'good' : 'bad'
}

function csimStatus(csim: number | null): Status {
  if (csim === null) return 'none'
  return csim >= TARGETS.csim ? 'good' : 'warn'
}

function MetricTile({
  icon,
  label,
  value,
  unit,
  target,
  status,
  frozen,
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
  target: string
  status: Status
  frozen: boolean
}) {
  return (
    <div
      className={cx(
        'rounded-control border px-3.5 py-3 transition-colors duration-200 ease-out',
        STATUS_RING[status],
        frozen && 'opacity-60',
      )}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span className={cx('shrink-0', STATUS_TEXT[status])}>{icon}</span>
        <span className="np-label truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        {/* Fixed-width tabular numerals: the tile never reflows on update. */}
        <span className={cx('np-metric', STATUS_TEXT[status])}>{value}</span>
        {unit ? (
          <span className="font-mono text-[13px] font-medium text-text-muted">{unit}</span>
        ) : null}
      </div>
      <p className="mt-1.5 text-[11px] text-text-muted">{target}</p>
    </div>
  )
}

export function MetricsPanel() {
  const { metrics, history, metricsMode, setMetricsMode, session } = useEngine()

  const frozen = session !== 'live'
  const baseline = metricsMode === 'baseline'

  const latency = useAnimatedNumber(metrics?.latencyMs ?? null)
  const fps = useAnimatedNumber(metrics?.fps ?? null)
  const vram = useAnimatedNumber(metrics?.vramGb ?? null)
  const csim = useAnimatedNumber(metrics?.csim ?? null)

  const has = metrics !== null
  const latencyValues = history.map((h) => h.latencyMs)

  return (
    <Card>
      <CardHeader
        icon={<Activity size={16} />}
        title="Live Telemetry"
        subtitle={
          frozen
            ? has
              ? 'Stream paused — last sample held.'
              : 'Awaiting a session.'
            : 'Sampling twice per second.'
        }
        right={<SimulatedBadge />}
      />

      {/* Demo control: measured baseline vs. engineering target. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-control border border-border bg-surface-2/50 px-3 py-2">
        <span className="text-[12px] font-medium text-text-muted">Showing</span>
        <Segmented<MetricsMode>
          ariaLabel="Metrics display mode"
          size="sm"
          value={metricsMode}
          onChange={setMetricsMode}
          options={[
            { value: 'target', label: 'Target' },
            { value: 'baseline', label: 'Baseline' },
          ]}
        />
      </div>

      <motion.div
        // Remounting on the mode switch lands the tiles straight on the new
        // figures instead of sliding through meaningless in-between values.
        key={metricsMode}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 gap-2.5"
      >
        <MetricTile
          icon={<Timer size={14} />}
          label="Latency"
          value={latency === null ? '—' : latency.toFixed(1)}
          unit="ms"
          target={`Target ≤ ${TARGETS.frameComputeMs} ms`}
          status={latency === null ? 'none' : latencyStatus(latency)}
          frozen={frozen}
        />
        <MetricTile
          icon={<Gauge size={14} />}
          label="Throughput"
          value={fps === null ? '—' : fps.toFixed(1)}
          unit="FPS"
          target={`Target ≥ ${TARGETS.fps} FPS`}
          status={fps === null ? 'none' : fpsStatus(fps)}
          frozen={frozen}
        />
        <MetricTile
          icon={<Cpu size={14} />}
          label="GPU Memory"
          value={vram === null ? '—' : vram.toFixed(2)}
          unit={`/ ${TARGETS.peakVramGb.toFixed(1)} GB`}
          target={`Peak ≤ ${TARGETS.peakVramGb.toFixed(1)} GB`}
          status={vram === null ? 'none' : vramStatus(vram)}
          frozen={frozen}
        />
        <MetricTile
          icon={<ScanFace size={14} />}
          label="Identity (CSIM)"
          value={baseline ? 'n/a' : csim === null ? '—' : csim.toFixed(3)}
          unit={baseline ? '(baseline)' : undefined}
          target={`Target ≥ ${TARGETS.csim.toFixed(2)}`}
          status={baseline ? 'none' : csimStatus(csim)}
          frozen={frozen}
        />
      </motion.div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="np-label">Per-frame latency — last 30 samples</span>
          <span className="text-[11px] text-text-muted">
            {history.length}/30
          </span>
        </div>
        <Sparkline
          values={latencyValues}
          threshold={TARGETS.frameComputeMs}
          thresholdLabel={`${TARGETS.frameComputeMs} ms target`}
          tone={baseline ? 'var(--warning)' : 'var(--primary)'}
          ariaLabel="Rolling history of simulated per-frame latency"
        />
      </div>

      {baseline ? (
        <div className="mt-4 rounded-control border border-warning/25 bg-warning/[0.07] px-3.5 py-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-warning">
            Measured proof-of-concept
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-text-muted">
            Unoptimized baseline on {HARDWARE.gpu} ({HARDWARE.vram}), {HARDWARE.os}, with actual
            LivePortrait weights.
          </p>
          <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[11px] tabular-nums">
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">mean</dt>
              <dd className="text-text">{MEASURED.latencyMeanMs} ms</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">p95</dt>
              <dd className="text-text">{MEASURED.latencyP95Ms} ms</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">p99</dt>
              <dd className="text-text">{MEASURED.latencyP99Ms} ms</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">throughput</dt>
              <dd className="text-text">{MEASURED.fps} FPS</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">peak VRAM</dt>
              <dd className="text-text">{MEASURED.peakVramGb} GB</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">fine-tune fit</dt>
              <dd className="text-text">{MEASURED.fineTuneFitGb} GB</dd>
            </div>
          </dl>
          <p className="mt-2.5 text-[11px] leading-relaxed text-text-muted">
            Fine-tune fit check: 2 of 5 modules, FP32, batch 1. The engineering gap this project
            closes is {MEASURED.latencyMeanMs} ms → {TARGETS.frameComputeMs} ms per frame.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
          Target mode shows the finished-product operating point. Switch to Baseline for the
          measured proof-of-concept figures from our hardware.
        </p>
      )}
    </Card>
  )
}

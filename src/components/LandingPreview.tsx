import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Cpu, Gauge, ScanFace, ShieldCheck, Timer } from 'lucide-react'
import { SEED_CLIPS } from '../mock/seedData'
import { initialSamplerState, nextSample, type SamplerState } from '../mock/sampler'
import type { MetricSample } from '../mock/types'
import { VIRTUAL_CAMERA_NAME } from '../mock/constants'
import { ClipCanvas } from './ClipCanvas'
import { WatermarkOverlay } from './VideoFrame'
import { cx } from './ui'

/**
 * The hero's product shot: a self-contained miniature of the Console that
 * runs its own telemetry loop, so the landing page shows the tool working
 * rather than a static image. Same simulated sampler as the real screen.
 */

function useHeroMetrics(running: boolean) {
  const [sample, setSample] = useState<MetricSample | null>(null)
  const stateRef = useRef<SamplerState>(initialSamplerState('target'))

  useEffect(() => {
    if (!running) return
    const emit = () => {
      const { state, sample: next } = nextSample(stateRef.current, 'target')
      stateRef.current = state
      setSample(next)
    }
    emit()
    const id = window.setInterval(emit, 700)
    return () => window.clearInterval(id)
  }, [running])

  return sample
}

function MiniTile({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit: string
}) {
  return (
    <div className="rounded-control border border-success/25 bg-success/[0.07] px-3 py-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-success">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-text-muted">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-[19px] font-semibold leading-none tabular-nums text-success">
          {value}
        </span>
        <span className="font-mono text-[11px] text-text-muted">{unit}</span>
      </div>
    </div>
  )
}

export function LandingPreview() {
  const reduced = useReducedMotion()
  const metrics = useHeroMetrics(!reduced)
  const clip = SEED_CLIPS[0]

  return (
    <div className="relative">
      {/* App window chrome. */}
      <div className="overflow-hidden rounded-xl2 border border-border bg-surface shadow-hero">
        <div className="flex items-center gap-2 border-b border-border bg-surface-2/70 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          </span>
          <span className="ml-2 truncate text-[11px] font-medium text-text-muted">
            NeuroPresence — Console
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-chip border border-danger/30 bg-danger/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-danger">
            <span className="h-1.5 w-1.5 rounded-full bg-danger motion-safe:animate-pulse-dot" />
            Live
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_190px] sm:p-4">
          {/* Output frame. */}
          <div className="relative aspect-video overflow-hidden rounded-control border border-border bg-black">
            <ClipCanvas clip={clip} animated={!reduced} talking={!reduced} />
            <span className="absolute left-2.5 top-2.5 rounded-chip border border-white/15 bg-black/55 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-white/75 backdrop-blur-sm">
              Virtual Camera Output
            </span>
            <div className="absolute bottom-2.5 right-2.5">
              <WatermarkOverlay size="sm" />
            </div>
          </div>

          {/* Telemetry rail. */}
          <div className="flex flex-col gap-2.5">
            <MiniTile
              icon={<Timer size={12} />}
              label="Latency"
              value={metrics ? metrics.latencyMs.toFixed(1) : '41.0'}
              unit="ms"
            />
            <MiniTile
              icon={<Gauge size={12} />}
              label="Throughput"
              value={metrics ? metrics.fps.toFixed(1) : '23.5'}
              unit="fps"
            />
            <div className="hidden sm:block">
              <MiniTile
                icon={<Cpu size={12} />}
                label="GPU"
                value={metrics ? metrics.vramGb.toFixed(2) : '4.00'}
                unit="GB"
              />
            </div>
            <div className="hidden sm:block">
              <MiniTile
                icon={<ScanFace size={12} />}
                label="CSIM"
                value={metrics && metrics.csim ? metrics.csim.toFixed(3) : '0.855'}
                unit=""
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-2/50 px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
            <ShieldCheck size={12} className="text-success" />
            Consent verified — enrolled user
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {VIRTUAL_CAMERA_NAME}
          </span>
        </div>
      </div>

      {/* Floating callouts that anchor the two halves of the story. */}
      <FloatingCard
        className="-left-5 top-[30%] hidden lg:flex xl:-left-12"
        delay={0.75}
        tone="primary"
      >
        <span className="text-[11px] font-semibold text-text">Your live webcam</span>
        <span className="text-[10px] text-text-muted">supplies the motion</span>
      </FloatingCard>

      <FloatingCard
        className="-bottom-6 right-4 hidden lg:flex xl:right-8"
        delay={0.95}
        tone="accent"
      >
        <span className="text-[11px] font-semibold text-text">Zoom · Meet · Teams</span>
        <span className="text-[10px] text-text-muted">see an ordinary webcam</span>
      </FloatingCard>
    </div>
  )
}

function FloatingCard({
  children,
  className,
  delay,
  tone,
}: {
  children: React.ReactNode
  className?: string
  delay: number
  tone: 'primary' | 'accent'
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 14, scale: 0.94 }}
      animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cx(
        'absolute flex-col gap-0.5 rounded-control border bg-surface px-3 py-2 shadow-raised',
        tone === 'primary' ? 'border-primary/30' : 'border-accent/30',
        'motion-safe:animate-float',
        className,
      )}
      style={{ animationDelay: tone === 'accent' ? '-3s' : '0s' }}
    >
      {children}
    </motion.div>
  )
}

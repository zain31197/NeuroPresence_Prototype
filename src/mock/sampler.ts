import { SIM_RANGES } from './constants'
import type { MetricSample, MetricsMode } from './types'

/** Box–Muller gaussian, clamped so a single sample can never fly off. */
function gauss(): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  return Math.max(-2.5, Math.min(2.5, n))
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/**
 * Mean-reverting random walk inside [lo, hi]. Values wander and occasionally
 * tick rather than jumping around uniformly, which is what real telemetry
 * looks like.
 */
function wander(prev: number, lo: number, hi: number, pull = 0.12, noise = 0.16) {
  const mid = (lo + hi) / 2
  const span = hi - lo
  const next = prev + (mid - prev) * pull + gauss() * span * noise
  return clamp(next, lo, hi)
}

export interface SamplerState {
  latencyMs: number
  fps: number
  vramGb: number
  csim: number
}

export function initialSamplerState(mode: MetricsMode): SamplerState {
  const r = SIM_RANGES[mode]
  const mid = (t: readonly [number, number]) => (t[0] + t[1]) / 2
  return {
    latencyMs: mid(r.latency),
    fps: mid(r.fps),
    vramGb: mid(r.vram),
    csim: mid(SIM_RANGES.target.csim),
  }
}

/** One simulated telemetry tick. Pure function of the previous state. */
export function nextSample(prev: SamplerState, mode: MetricsMode): {
  state: SamplerState
  sample: MetricSample
} {
  const r = SIM_RANGES[mode]
  const state: SamplerState = {
    latencyMs: wander(prev.latencyMs, r.latency[0], r.latency[1]),
    fps: wander(prev.fps, r.fps[0], r.fps[1]),
    // VRAM drifts slowly — allocators do not thrash frame to frame.
    vramGb: wander(prev.vramGb, r.vram[0], r.vram[1], 0.05, 0.07),
    csim: wander(
      prev.csim,
      SIM_RANGES.target.csim[0],
      SIM_RANGES.target.csim[1],
      0.09,
      0.12,
    ),
  }

  return {
    state,
    sample: {
      t: Date.now(),
      latencyMs: state.latencyMs,
      fps: state.fps,
      vramGb: state.vramGb,
      // The measured baseline has no identity-similarity figure.
      csim: mode === 'baseline' ? null : state.csim,
    },
  }
}

export const HISTORY_LENGTH = 30

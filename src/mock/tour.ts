import { MEASURED, TARGETS, VIRTUAL_CAMERA_NAME } from './constants'
import type { MetricsMode, Screen } from './types'

/* ------------------------------------------------------------------ *
 * The guided demo.
 *
 * This is the brief's Section 13 click-path, turned into something the
 * app can drive itself. Each step names the screen it belongs on, the
 * element to spotlight, the line the presenter says, and the engine
 * calls that put the interface into the right state before the narration
 * lands. Nothing here simulates anything new — it only operates the same
 * controls a presenter would click by hand.
 * ------------------------------------------------------------------ */

export interface TourActions {
  navigate: (screen: Screen) => void
  startSession: () => void
  stopSession: () => void
  setMetricsMode: (mode: MetricsMode) => void
  setWatermark: (on: boolean) => void
  setGateEnabled: (on: boolean) => void
  simulateNonEnrolledFace: () => void
  loadDemoDrivingVideo: () => void
  startRender: () => void
  resetRender: () => void
}

export interface TourStep {
  id: string
  /** Short label for the chapter rail. */
  chapter: string
  title: string
  /** What the presenter says — quoted from the brief's demo script. */
  say: string
  /** Supporting detail shown under the line. */
  note?: string
  screen: Screen
  /** `data-tour` value of the element to spotlight. Omitted = no spotlight. */
  target?: string
  /** How long this step sits before auto-advancing, in ms. */
  hold: number
  onEnter?: (a: TourActions) => void
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'intro',
    chapter: 'Setup',
    title: 'The product',
    say: "This is NeuroPresence. I've already enrolled my identity, and my presentable source clip is loaded.",
    note: 'The output frame is the reenacted feed a meeting app would receive. The session is idle, so nothing is streaming yet.',
    screen: 'console',
    target: 'output-frame',
    hold: 7000,
    onEnter: (a) => {
      a.stopSession()
      a.resetRender()
      a.setGateEnabled(true)
      a.setWatermark(true)
      a.setMetricsMode('target')
      a.navigate('console')
    },
  },
  {
    id: 'pipeline',
    chapter: 'Setup',
    title: 'How it works',
    say: 'Your live webcam supplies the motion. A reenactment model warps the source clip to follow it, and the result is written to a virtual camera.',
    note: 'Every stage here maps to a functional requirement. The consent gate sits between motion and reenactment by design — nothing is animated before the likeness is checked.',
    screen: 'console',
    target: 'pipeline',
    hold: 8500,
  },
  {
    id: 'start',
    chapter: 'Live session',
    title: 'Start a session',
    say: 'Starting a live session — the system warms up, then streams to a virtual camera.',
    note: `Warm-up runs for about a second and a half, then the feed goes live and telemetry begins sampling.`,
    screen: 'console',
    target: 'session-controls',
    hold: 6500,
    onEnter: (a) => {
      a.navigate('console')
      a.startSession()
    },
  },
  {
    id: 'telemetry',
    chapter: 'Live session',
    title: 'Live telemetry',
    say: 'This is the live telemetry: per-frame latency, frames per second, GPU memory, and identity similarity. These are the targets our finished system runs at.',
    note: `Target operating point — ≤ ${TARGETS.frameComputeMs} ms per frame, ≥ ${TARGETS.fps} FPS, CSIM ≥ ${TARGETS.csim.toFixed(2)}. The panel is marked "simulated" because this prototype has no pipeline behind it.`,
    screen: 'console',
    target: 'metrics',
    hold: 9000,
    onEnter: (a) => a.setMetricsMode('target'),
  },
  {
    id: 'gap',
    chapter: 'The evidence',
    title: 'Measured baseline',
    say: `And this is our measured proof-of-concept on the actual RTX 5050 — ${MEASURED.latencyMeanMs} ms per frame, ${MEASURED.fps} FPS. That gap, ${MEASURED.latencyMeanMs} down to ${TARGETS.frameComputeMs} milliseconds, is exactly the engineering our project delivers.`,
    note: 'These are real numbers measured on our own hardware with actual LivePortrait weights — not a simulation. The gap is the project.',
    screen: 'console',
    target: 'metrics',
    hold: 11000,
    onEnter: (a) => a.setMetricsMode('baseline'),
  },
  {
    id: 'disclosure',
    chapter: 'Safeguards',
    title: 'Synthetic-media disclosure',
    say: 'We can attach a synthetic-media disclosure so other participants know the feed is reenacted.',
    note: 'Recommended on. The overlay rides along in the outgoing feed, so it reaches everyone in the meeting.',
    screen: 'console',
    target: 'watermark-card',
    hold: 7500,
    onEnter: (a) => {
      a.setMetricsMode('target')
      a.setWatermark(true)
    },
  },
  {
    id: 'consent',
    chapter: 'Safeguards',
    title: 'The consent gate',
    say: 'The consent gate only animates my own enrolled likeness — a non-matching face is blocked.',
    note: 'The gate tears down a running session and disables Start. It recovers after four seconds. In this prototype it is interface state, not a classifier.',
    screen: 'console',
    target: 'consent-gate',
    hold: 9000,
    onEnter: (a) => {
      a.setGateEnabled(true)
      a.simulateNonEnrolledFace()
    },
  },
  {
    id: 'offline',
    chapter: 'Two modes',
    title: 'Offline studio',
    say: 'The same feature set also runs offline: upload a recording, and with no latency limit we produce a higher-fidelity result.',
    note: 'Used for asynchronous recording and as a quality reference — the ceiling the real-time mode is measured against.',
    screen: 'offline',
    target: 'offline-render',
    hold: 11000,
    onEnter: (a) => {
      a.navigate('offline')
      a.loadDemoDrivingVideo()
    },
  },
  {
    id: 'devices',
    chapter: 'Integration',
    title: 'Virtual camera',
    say: `Integration is app-agnostic: we present as a virtual camera that Zoom, Meet, and Teams read as an ordinary webcam — no per-app plugin.`,
    note: `"${VIRTUAL_CAMERA_NAME}" appears in the camera list like any other device. Desktop apps are supported; some managed-enterprise clients block virtual cameras.`,
    screen: 'devices',
    target: 'output-device',
    hold: 9000,
    onEnter: (a) => a.navigate('devices'),
  },
  {
    id: 'close',
    chapter: 'Integration',
    title: 'Where this stands',
    say: 'This prototype is the interface; the reenactment pipeline is our FYP build. Our proof of concept has already measured feasibility on our hardware.',
    note: 'Interface complete and interactive. Pipeline measured, not yet optimised. That is the honest state of the project today.',
    screen: 'devices',
    hold: 9000,
  },
]

/** Chapters in order, for the progress rail. */
export const TOUR_CHAPTERS = TOUR_STEPS.reduce<string[]>((acc, step) => {
  if (acc[acc.length - 1] !== step.chapter) acc.push(step.chapter)
  return acc
}, [])

export const TOUR_TOTAL_MS = TOUR_STEPS.reduce((sum, s) => sum + s.hold, 0)

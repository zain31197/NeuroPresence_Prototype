export type Screen =
  | 'landing'
  | 'onboarding'
  | 'console'
  | 'clips'
  | 'offline'
  | 'devices'
  | 'settings'

export type Mode = 'realtime' | 'offline'

export type SessionState = 'idle' | 'warming' | 'live'

/** Consent gate presentation state (a UI state — never a classifier). */
export type GateState = 'verified' | 'disabled' | 'blocked'

export type MetricsMode = 'target' | 'baseline'

export type Scene = 'office' | 'study' | 'plain' | 'studio'

export interface SourceClip {
  id: string
  name: string
  /** Human label, e.g. "18s". */
  duration: string
  /** Human label, e.g. "512×512". */
  resolution: string
  scene: Scene
  palette: {
    from: string
    to: string
    key: string
    garment: string
    skin: string
    hair: string
  }
  /** Object URL when the user added their own file; undefined for seed clips. */
  src?: string
  /** File name shown on user-added clips. */
  fileName?: string
  userAdded?: boolean
}

export interface MetricSample {
  t: number
  latencyMs: number
  fps: number
  vramGb: number
  /** null in baseline mode — reported as "n/a (baseline)". */
  csim: number | null
}

export interface EnrolledUser {
  name: string
  embeddingId: string
  enrolledAt: Date
}

export type RenderStatus = 'idle' | 'rendering' | 'done'

export interface OfflineState {
  drivingFileName: string | null
  drivingSrc: string | null
  /** Duration of the uploaded driving video in seconds; null until metadata loads. */
  drivingDuration: number | null
  /** 'idle' | 'checking' | 'pass' | 'fail' */
  checkStatus: 'idle' | 'checking' | 'pass' | 'fail'
  simulatePoorInput: boolean
  resolution: 256 | 512 | 1024
  smoothing: number
  renderStatus: RenderStatus
  renderProgress: number
  renderStage: string
  renderedAt: { resolution: number; smoothing: number } | null
}

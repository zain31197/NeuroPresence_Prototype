/**
 * Appendix A — real measured numbers and engineering targets.
 * These values are quoted verbatim in the UI. Do not edit them.
 */

export const HARDWARE = {
  gpu: 'NVIDIA RTX 5050 laptop GPU',
  vram: '8 GB VRAM',
  os: 'Kubuntu Linux',
} as const

/** Measured proof-of-concept (unoptimized baseline, actual LivePortrait weights). */
export const MEASURED = {
  latencyMeanMs: 130.1,
  latencyP95Ms: 133.9,
  latencyP99Ms: 138.7,
  fps: 7.7,
  peakVramGb: 1.57,
  fineTuneFitGb: 6.68,
} as const

/** Engineering targets — the finished-product operating point. */
export const TARGETS = {
  frameComputeMs: 42,
  fps: 24,
  endToEndLatencyMs: 150,
  peakVramGb: 8,
  csim: 0.8,
  consentTrueAcceptPct: 95,
  enduranceMin: 30,
} as const

/** Simulation envelopes for the metrics panel (Appendix A). */
export const SIM_RANGES = {
  target: {
    latency: [38, 45] as const,
    fps: [22, 25] as const,
    vram: [3.5, 4.5] as const,
    csim: [0.83, 0.88] as const,
  },
  baseline: {
    latency: [MEASURED.latencyMeanMs - 3, MEASURED.latencyMeanMs + 3] as const,
    fps: [MEASURED.fps - 0.3, MEASURED.fps + 0.3] as const,
    vram: [MEASURED.peakVramGb - 0.04, MEASURED.peakVramGb + 0.04] as const,
    csim: null,
  },
} as const

export const PROJECT = {
  name: 'NeuroPresence',
  tagline: 'Show up composed in every meeting — using your own likeness.',
  university: 'FAST-NUCES Islamabad',
  supervisor: 'Muhammad Aamir Gulzar',
  team: [
    { name: 'Zain Shahid', roll: 'i232582' },
    { name: 'Muhammad Talha Arshad', roll: 'i232548' },
    { name: 'Sana Ullah Farooqi', roll: 'i232594' },
  ],
  disclosure:
    'Prototype build. Interface demonstration with simulated data; the reenactment pipeline is not implemented in this build.',
} as const

/** Appendix D — approved microcopy. Referenced instead of retyped. */
export const COPY = {
  tagline: PROJECT.tagline,
  enrollmentNote: 'NeuroPresence only animates your own consented likeness.',
  consentVerified: 'Enrolled user — animation permitted.',
  consentDisabled: 'Consent gate off — not recommended.',
  consentBlocked: 'Likeness does not match the enrolled user — animation blocked.',
  watermark: 'Synthetic media — reenacted.',
  offlineUploadPrompt: 'Drop a recording of yourself — front-facing, face clearly visible.',
  offlineNote: 'Offline mode has no latency limit, so higher fidelity settings are available.',
  virtualCameraHelp:
    "Select 'NeuroPresence Camera' as your camera in Zoom, Google Meet, or Microsoft Teams.",
  limitationNote:
    'Desktop apps supported. Mobile and some managed-enterprise clients block virtual cameras.',
  prototypeDisclosure: PROJECT.disclosure,
  offlineFailure:
    "We couldn't track the face reliably. Try a clearer, front-facing recording.",
} as const

export const VIRTUAL_CAMERA_NAME = 'NeuroPresence Camera'

import { HARDWARE, MEASURED, TARGETS, VIRTUAL_CAMERA_NAME } from './constants'

/* ------------------------------------------------------------------ *
 * Feasibility evidence.
 *
 * The POC-lite row of the evaluation rubric asks for four things beyond
 * the clickable prototype: a data/interface check, a baseline run, a
 * sample pipeline, and a risk experiment. This module holds the record
 * for the ones that are data rather than UI.
 *
 * HONESTY RULE, the one that matters here: a `result` is only ever
 * filled in for work that has actually been done, and every figure in
 * one traces to Appendix A of the build brief. Anything not yet run is
 * `planned` and carries no number. Nothing here is invented to make the
 * project look further along than it is.
 * ------------------------------------------------------------------ */

export type EvidenceStatus = 'run' | 'partial' | 'planned'

export interface RiskExperiment {
  id: string
  /** The thing that could sink the project. */
  risk: string
  /** The experiment that settles it. */
  experiment: string
  status: EvidenceStatus
  /** Present only for work already done. Sourced from Appendix A. */
  result?: string
  /** What the team does about it. */
  response: string
  severity: 'high' | 'medium' | 'low'
}

export const RISK_EXPERIMENTS: RiskExperiment[] = [
  {
    id: 'latency',
    risk: 'Reenactment is too slow to hold a real-time conversation.',
    experiment: `Timed baseline run: unoptimized LivePortrait weights on ${HARDWARE.gpu}, per-frame latency and throughput recorded.`,
    status: 'run',
    result: `${MEASURED.latencyMeanMs} ms mean (p95 ${MEASURED.latencyP95Ms}, p99 ${MEASURED.latencyP99Ms}), ${MEASURED.fps} FPS — ${(MEASURED.latencyMeanMs / TARGETS.frameComputeMs).toFixed(1)}× above the ${TARGETS.frameComputeMs} ms budget.`,
    response:
      'Quantisation, TensorRT export and a lighter warping stage. The gap is the engineering this project delivers; it is the work, not a blocker.',
    severity: 'high',
  },
  {
    id: 'vram',
    risk: 'The GPU cannot hold the model for inference, or for fine-tuning.',
    experiment:
      'Peak VRAM recorded during inference, plus a fine-tune fit check on 2 of 5 modules at FP32, batch 1.',
    status: 'run',
    result: `Inference peaked at ${MEASURED.peakVramGb} GB of ${HARDWARE.vram}. The fine-tune fit check peaked at ${MEASURED.fineTuneFitGb} GB, so it fits with roughly 1.3 GB spare.`,
    response:
      'Inference has ample room. Fine-tuning is tight at FP32: mixed precision and gradient checkpointing are the levers if the remaining three modules are added.',
    severity: 'high',
  },
  {
    id: 'integration',
    risk: 'Meeting apps refuse a virtual camera, making the product unusable where it matters.',
    experiment:
      'Client compatibility survey across Zoom, Google Meet and Microsoft Teams: desktop, mobile, and managed-enterprise builds.',
    status: 'partial',
    result:
      'Desktop clients read a v4l2loopback device as an ordinary webcam. Mobile clients and some managed-enterprise builds block virtual cameras outright.',
    response: `Scope the product to desktop and state the limitation plainly in the UI. It sits on Devices & Output next to ${VIRTUAL_CAMERA_NAME}, not buried in a footnote.`,
    severity: 'medium',
  },
  {
    id: 'identity',
    risk: 'The output stops looking like the user partway through a call.',
    experiment: `Cosine identity similarity (CSIM) sampled across a continuous session, against the ≥ ${TARGETS.csim.toFixed(2)} target.`,
    status: 'planned',
    response:
      'Not yet run: it needs the optimised pipeline to measure against. The metric already has a tile on the Console, so it gets reported from day one rather than bolted on at the end.',
    severity: 'high',
  },
  {
    id: 'consent',
    risk: 'The consent gate rejects the enrolled user, or admits someone else.',
    experiment: `True-accept rate for the enrolled user and false-accept rate for non-enrolled faces, against the ≥ ${TARGETS.consentTrueAcceptPct}% true-accept target.`,
    status: 'planned',
    response:
      'Not yet run. In this prototype the gate is interface state rather than a classifier, and it is labelled that way everywhere it appears.',
    severity: 'high',
  },
  {
    id: 'endurance',
    risk: 'Memory creeps during a long call and the process dies mid-meeting.',
    experiment: `Continuous run of at least ${TARGETS.enduranceMin} minutes, watching for VRAM growth and OOM.`,
    status: 'planned',
    response:
      'Not yet run. The fallback it protects, dropping to a pass-through camera rather than losing video, is already specified on Devices & Output.',
    severity: 'medium',
  },
]

/* ----------------------------- run record ---------------------------- */

export const BASELINE_RUN = {
  title: 'Unoptimized inference baseline',
  what: 'Actual LivePortrait weights driven end to end, timed per frame.',
  environment: [
    { label: 'GPU', value: HARDWARE.gpu },
    { label: 'VRAM', value: HARDWARE.vram },
    { label: 'OS', value: HARDWARE.os },
    { label: 'Model', value: 'LivePortrait, published weights, unmodified' },
    { label: 'Optimisation', value: 'None — this is the floor, not the product' },
  ],
  results: [
    { label: 'Mean per-frame latency', value: `${MEASURED.latencyMeanMs} ms`, tone: 'warn' as const },
    { label: 'p95 latency', value: `${MEASURED.latencyP95Ms} ms`, tone: 'warn' as const },
    { label: 'p99 latency', value: `${MEASURED.latencyP99Ms} ms`, tone: 'warn' as const },
    { label: 'Throughput', value: `${MEASURED.fps} FPS`, tone: 'warn' as const },
    { label: 'Peak VRAM (inference)', value: `${MEASURED.peakVramGb} GB`, tone: 'good' as const },
    {
      label: 'Fine-tune fit (2/5 modules, FP32, batch 1)',
      value: `${MEASURED.fineTuneFitGb} GB peak`,
      tone: 'good' as const,
    },
  ],
  verdict:
    'Feasible on the hardware we have, and not yet fast enough. Memory is comfortable; latency is the whole problem, and it is a known optimisation path rather than an open research question.',
} as const

/* ----------------------- what this build is ------------------------- */

export const SCOPE = {
  implemented: [
    'Every screen and control of the intended product, interactive end to end',
    'Session lifecycle: idle, warm-up, live, stop, with a running clock',
    'Telemetry stream with a Baseline/Target switch carrying the measured figures',
    'Consent gate with verified, disabled and blocked states that tear down a live session',
    'Disclosure watermark applied to the output frame and the offline render',
    'Offline studio: upload, input check, fidelity settings, render, download',
    'Source-clip library with real file upload and playback',
    'Hash routing, deep links, browser back and forward, light and dark themes',
  ],
  notImplemented: [
    'The reenactment model. No PyTorch, ONNX, TensorRT or inference of any kind.',
    'Face tracking, landmark detection and identity matching. No frame is analysed.',
    'The virtual camera device. v4l2loopback is described, not created.',
    'Any backend, database, authentication or network call.',
  ],
} as const

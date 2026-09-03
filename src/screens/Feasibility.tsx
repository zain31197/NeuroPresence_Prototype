import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Ban,
  Check,
  CircleDashed,
  ClipboardCheck,
  Cpu,
  FlaskConical,
  Loader2,
  Minus,
  Play,
  RotateCcw,
  ShieldQuestion,
  Workflow,
  X,
} from 'lucide-react'
import { DATA_CHECKS, type CheckState } from '../mock/dataCheck'
import {
  BASELINE_RUN,
  RISK_EXPERIMENTS,
  SCOPE,
  type EvidenceStatus,
} from '../mock/evidence'
import { useEngine } from '../mock/engine'
import { GapMeter } from '../components/GapMeter'
import { Button, Card, CardHeader, Chip, cx } from '../components/ui'
import { MountItem, MountStagger } from '../components/motion'

/* ------------------------------------------------------------------ *
 * Feasibility evidence.
 *
 * Built to be read by an examiner working down a rubric: the POC-lite
 * row asks for a clickable prototype, a data check, a baseline run, a
 * sample pipeline and a risk experiment. Each of those has a section
 * here, and the coverage strip at the top says where each one lives.
 * ------------------------------------------------------------------ */

/* ---------------------------- rubric strip --------------------------- */

const RUBRIC = [
  {
    id: 'prototype',
    label: 'Clickable high-fidelity prototype',
    detail: 'Six screens, interactive end to end, with no core functionality behind the interface.',
    where: 'The whole app',
    done: true,
  },
  {
    id: 'datacheck',
    label: 'API / data check',
    detail: 'The browser media path this build depends on, verified live on your machine.',
    where: 'Below — Data-path check',
    done: true,
  },
  {
    id: 'baseline',
    label: 'Baseline run',
    detail: 'Unoptimized LivePortrait weights timed on our own GPU. Measured, not estimated.',
    where: 'Below — Baseline run record',
    done: true,
  },
  {
    id: 'pipeline',
    label: 'Sample pipeline',
    detail: 'Capture → motion → consent gate → reenactment → virtual camera, animated while live.',
    where: 'Console',
    done: true,
  },
  {
    id: 'risk',
    label: 'Risk experiment',
    detail: 'Six risks, each with the experiment that settles it and its current status.',
    where: 'Below — Risk register',
    done: true,
  },
  {
    id: 'mvp',
    label: 'Full MVP',
    detail: 'Not required at this stage, and deliberately not attempted. The scope is stated below.',
    where: 'Out of scope',
    done: false,
  },
]

function RubricStrip() {
  return (
    <Card>
      <CardHeader
        icon={<ClipboardCheck size={16} />}
        title="What this page is"
        subtitle="POC-lite / feasibility evidence, laid out against the criterion it answers."
        right={<Chip tone="success">5 of 5 required</Chip>}
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {RUBRIC.map((row, i) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className={cx(
              'flex gap-2.5 rounded-control border px-3 py-2.5',
              row.done ? 'border-success/25 bg-success/[0.05]' : 'border-border bg-surface-2/40',
            )}
          >
            <span
              className={cx(
                'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                row.done ? 'bg-success text-[#04140a]' : 'border border-border text-text-muted',
              )}
            >
              {row.done ? <Check size={11} strokeWidth={3} /> : <Minus size={10} />}
            </span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-medium leading-tight text-text">
                {row.label}
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-text-muted">
                {row.detail}
              </span>
              <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-wider text-text-muted/70">
                {row.where}
              </span>
            </span>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}

/* --------------------------- data-path check -------------------------- */

interface Row {
  state: CheckState
  detail: string
  ms: number | null
}

const CHECK_ICON: Record<CheckState, React.ReactNode> = {
  pending: <CircleDashed size={14} className="text-text-muted" />,
  running: <Loader2 size={14} className="animate-spin text-primary" />,
  pass: <Check size={14} strokeWidth={3} className="text-success" />,
  fail: <X size={14} strokeWidth={3} className="text-danger" />,
  unavailable: <Ban size={14} className="text-warning" />,
}

function DataPathCheck() {
  const [rows, setRows] = useState<Record<string, Row>>({})
  const [busy, setBusy] = useState(true)
  const [ranAt, setRanAt] = useState<Date | null>(null)

  /*
   * A run token rather than a cancelled flag. StrictMode mounts, unmounts and
   * remounts in development, and a flag set by that first teardown would never
   * be cleared — leaving every check stuck on "running" forever. Bumping a
   * token invalidates whichever run is in flight and lets the next one own the
   * state, which is also exactly what Re-run needs.
   */
  const runToken = useRef(0)

  const runAll = useCallback(async () => {
    const token = ++runToken.current
    setBusy(true)
    setRows({})
    for (const check of DATA_CHECKS) {
      if (runToken.current !== token) return
      setRows((prev) => ({ ...prev, [check.id]: { state: 'running', detail: '', ms: null } }))
      const started = performance.now()
      let state: CheckState = 'fail'
      let detail = ''
      try {
        const outcome = await check.run()
        state = outcome.ok === 'unavailable' ? 'unavailable' : outcome.ok ? 'pass' : 'fail'
        detail = outcome.detail
      } catch (error) {
        state = 'fail'
        detail = error instanceof Error ? error.message : String(error)
      }
      const ms = Math.round(performance.now() - started)
      if (runToken.current !== token) return
      setRows((prev) => ({ ...prev, [check.id]: { state, detail, ms } }))
    }
    if (runToken.current !== token) return
    setRanAt(new Date())
    setBusy(false)
  }, [])

  // Run once on arrival so the evidence is already there when it is read.
  useEffect(() => {
    void runAll()
    return () => { runToken.current++ }
  }, [runAll])

  const done = Object.values(rows).filter((r) => r.state !== 'running' && r.state !== 'pending')
  const passed = done.filter((r) => r.state === 'pass').length
  const failed = done.filter((r) => r.state === 'fail').length
  const skipped = done.filter((r) => r.state === 'unavailable').length

  return (
    <Card>
      <CardHeader
        icon={<Workflow size={16} />}
        title="Data-path check"
        subtitle="Run live in your browser, right now — not a table of ticks."
        right={
          <div className="flex items-center gap-2">
            {ranAt && !busy ? (
              <Chip tone={failed ? 'danger' : 'success'}>
                {passed} passed{failed ? ` · ${failed} failed` : ''}
                {skipped ? ` · ${skipped} n/a` : ''}
              </Chip>
            ) : (
              <Chip tone="primary">Running…</Chip>
            )}
            <Button size="sm" onClick={() => void runAll()} disabled={busy}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
              Re-run
            </Button>
          </div>
        }
      />

      <p className="mb-3.5 rounded-control border border-border bg-surface-2/50 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-text-muted">
        There is no backend to check, so what gets checked is the data path this prototype actually
        uses: the media APIs that carry a clip in, hold a recording, and encode the offline render
        back out. The last row reports the model path — deliberately absent — rather than quietly
        passing it.
      </p>

      <ul className="divide-y divide-border">
        {DATA_CHECKS.map((check) => {
          const row = rows[check.id] ?? { state: 'pending' as CheckState, detail: '', ms: null }
          return (
            <li key={check.id} className="flex items-start gap-3 py-2.5">
              <span className="mt-0.5 shrink-0">{CHECK_ICON[row.state]}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="text-[13px] font-medium text-text">{check.label}</span>
                  {row.ms !== null ? (
                    <span className="font-mono text-[10px] tabular-nums text-text-muted/70">
                      {row.ms} ms
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-text-muted">{check.covers}</p>
                {row.detail ? (
                  <p
                    className={cx(
                      'mt-1 font-mono text-[10.5px] leading-relaxed',
                      row.state === 'fail'
                        ? 'text-danger'
                        : row.state === 'unavailable'
                          ? 'text-warning'
                          : 'text-text-muted/80',
                    )}
                  >
                    {row.detail}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/* --------------------------- baseline run ---------------------------- */

function BaselineRun() {
  return (
    <Card>
      <CardHeader
        icon={<Cpu size={16} />}
        title="Baseline run record"
        subtitle={BASELINE_RUN.what}
        right={<Chip tone="success">Measured</Chip>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <p className="np-label mb-2">Environment</p>
          <dl className="divide-y divide-border rounded-control border border-border bg-surface-2/40 px-3.5">
            {BASELINE_RUN.environment.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-3 py-2">
                <dt className="shrink-0 text-[12px] text-text-muted">{row.label}</dt>
                <dd className="text-right text-[12px] font-medium text-text">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <p className="np-label mb-2">Recorded figures</p>
          <dl className="divide-y divide-border rounded-control border border-border bg-surface-2/40 px-3.5">
            {BASELINE_RUN.results.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-3 py-2">
                <dt className="text-[12px] text-text-muted">{row.label}</dt>
                <dd
                  className={cx(
                    'shrink-0 font-mono text-[12px] font-semibold tabular-nums',
                    row.tone === 'warn' ? 'text-warning' : 'text-success',
                  )}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-4">
        <GapMeter />
      </div>

      <p className="mt-4 flex items-start gap-2.5 rounded-control border border-border bg-surface-2/50 px-3.5 py-3 text-[12px] leading-relaxed text-text">
        <FlaskConical size={14} className="mt-0.5 shrink-0 text-text-muted" />
        <span>
          <span className="font-semibold">Verdict. </span>
          {BASELINE_RUN.verdict}
        </span>
      </p>
    </Card>
  )
}

/* --------------------------- risk register --------------------------- */

const STATUS_META: Record<
  EvidenceStatus,
  { label: string; chip: 'success' | 'warning' | 'muted'; icon: React.ReactNode }
> = {
  run: { label: 'Experiment run', chip: 'success', icon: <Check size={11} strokeWidth={3} /> },
  partial: { label: 'Partly settled', chip: 'warning', icon: <AlertTriangle size={11} /> },
  planned: { label: 'Planned', chip: 'muted', icon: <CircleDashed size={11} /> },
}

function RiskRegister() {
  const runCount = RISK_EXPERIMENTS.filter((r) => r.status === 'run').length
  const partial = RISK_EXPERIMENTS.filter((r) => r.status === 'partial').length

  return (
    <Card data-tour="risk-register">
      <CardHeader
        icon={<ShieldQuestion size={16} />}
        title="Risk register and experiments"
        subtitle="Each risk paired with the experiment that settles it, and where that experiment stands."
        right={
          <Chip tone="primary">
            {runCount} run · {partial} partial · {RISK_EXPERIMENTS.length - runCount - partial} planned
          </Chip>
        }
      />

      <p className="mb-3.5 rounded-control border border-warning/25 bg-warning/[0.06] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-text">
        A result appears only where the work has actually been done. Rows marked{' '}
        <span className="font-semibold">Planned</span> carry no figure, because inventing one would
        defeat the point of the exercise.
      </p>

      <ul className="space-y-2.5">
        {RISK_EXPERIMENTS.map((item, i) => {
          const meta = STATUS_META[item.status]
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-control border border-border bg-surface-2/40 p-3.5"
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-text">
                  {item.risk}
                </p>
                <span className="flex shrink-0 items-center gap-1.5">
                  <Chip
                    tone={
                      item.severity === 'high'
                        ? 'danger'
                        : item.severity === 'medium'
                          ? 'warning'
                          : 'muted'
                    }
                  >
                    {item.severity}
                  </Chip>
                  <Chip tone={meta.chip} icon={meta.icon}>
                    {meta.label}
                  </Chip>
                </span>
              </div>

              <dl className="space-y-1.5 text-[12px] leading-relaxed">
                <div className="flex gap-2">
                  <dt className="w-[86px] shrink-0 text-text-muted">Experiment</dt>
                  <dd className="min-w-0 text-text-muted">{item.experiment}</dd>
                </div>
                {item.result ? (
                  <div className="flex gap-2">
                    <dt className="w-[86px] shrink-0 text-text-muted">Result</dt>
                    <dd className="min-w-0 font-medium text-text">{item.result}</dd>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <dt className="w-[86px] shrink-0 text-text-muted">Response</dt>
                  <dd className="min-w-0 text-text-muted">{item.response}</dd>
                </div>
              </dl>
            </motion.li>
          )
        })}
      </ul>
    </Card>
  )
}

/* ------------------------------- scope ------------------------------- */

function ScopeCard() {
  const { navigate, startTour } = useEngine()
  return (
    <Card>
      <CardHeader
        icon={<FlaskConical size={16} />}
        title="Scope of this build"
        subtitle="The line between the interface and the functionality behind it, stated plainly."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-control border border-success/25 bg-success/[0.05] p-3.5">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-success">
            Implemented and interactive
          </p>
          <ul className="space-y-1.5">
            {SCOPE.implemented.map((line) => (
              <li key={line} className="flex items-start gap-2 text-[12px] leading-relaxed text-text">
                <Check size={13} strokeWidth={3} className="mt-0.5 shrink-0 text-success" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-control border border-border bg-surface-2/40 p-3.5">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Deliberately not implemented
          </p>
          <ul className="space-y-1.5">
            {SCOPE.notImplemented.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 text-[12px] leading-relaxed text-text-muted"
              >
                <Ban size={13} className="mt-0.5 shrink-0 text-text-muted/70" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-border pt-4">
        <Button variant="primary" size="sm" onClick={startTour}>
          <Play size={13} />
          Play the guided demo
        </Button>
        <Button size="sm" onClick={() => navigate('console')}>
          See the pipeline on the Console
        </Button>
        <p className="text-[11px] leading-relaxed text-text-muted">
          The rubric asks for a prototype without core functionality behind the interface. That is
          exactly what this is, and every screen says so.
        </p>
      </div>
    </Card>
  )
}

/* ------------------------------- screen ------------------------------ */

export function Feasibility() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="np-page-title">Feasibility evidence</h2>
          <p className="mt-1 max-w-[52rem] text-[13px] leading-relaxed text-text-muted">
            What we have actually verified, what we measured on our own hardware, and what is still
            an open question. The prototype demonstrates the interface; this page is the evidence
            behind it.
          </p>
        </div>
        <Chip tone="accent">POC-lite</Chip>
      </div>

      <MountStagger className="space-y-4">
        <MountItem><RubricStrip /></MountItem>
        <MountItem><DataPathCheck /></MountItem>
        <MountItem><BaselineRun /></MountItem>
        <MountItem><RiskRegister /></MountItem>
        <MountItem><ScopeCard /></MountItem>
      </MountStagger>
    </div>
  )
}

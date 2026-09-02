import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import {
  Cctv,
  MonitorPlay,
  ScanFace,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { TARGETS, VIRTUAL_CAMERA_NAME } from '../mock/constants'
import { useEngine } from '../mock/engine'
import { Card, CardHeader, Chip, cx, SimulatedBadge } from './ui'

/* ------------------------------------------------------------------ *
 * The pipeline strip.
 *
 * Appendix B asks that every functional requirement map to something
 * visible. This is that map, drawn as the path a frame actually takes:
 * capture → motion → consent → reenactment → virtual camera. It animates
 * while a session is live and stops dead at the gate when the gate blocks,
 * which is the clearest way to show the safeguard has teeth.
 * ------------------------------------------------------------------ */

interface Stage {
  id: string
  label: string
  detail: string
  fr: string
  icon: LucideIcon
}

const STAGES: Stage[] = [
  { id: 'capture', label: 'Webcam', detail: 'Live driving signal', fr: 'FR-1', icon: Cctv },
  { id: 'motion', label: 'Motion', detail: 'Pose · expression · lips', fr: 'FR-1', icon: ScanFace },
  { id: 'gate', label: 'Consent gate', detail: 'Enrolled likeness only', fr: 'FR-3', icon: ShieldCheck },
  { id: 'reenact', label: 'Reenactment', detail: 'Source clip driven', fr: 'FR-2 · FR-6', icon: Sparkles },
  { id: 'output', label: 'Virtual camera', detail: VIRTUAL_CAMERA_NAME, fr: 'FR-4 · FR-5', icon: MonitorPlay },
]

/** Dots travelling along a connector while frames are flowing. */
function Connector({ flowing, blocked }: { flowing: boolean; blocked: boolean }) {
  const reduced = useReducedMotion()
  return (
    <div className="relative mx-1 hidden h-px min-w-[18px] flex-1 self-center sm:block">
      <div
        className={cx(
          'absolute inset-0 rounded-full transition-colors duration-300',
          blocked ? 'bg-danger/35' : flowing ? 'bg-primary/40' : 'bg-border',
        )}
      />
      {flowing && !reduced
        ? [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary"
              style={{ boxShadow: '0 0 8px rgb(59 130 246 / .9)' }}
              initial={{ left: '0%', opacity: 0 }}
              animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 1.5,
                delay: i * 0.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))
        : null}
    </div>
  )
}

function StageNode({
  stage,
  state,
  index,
}: {
  stage: Stage
  state: 'idle' | 'active' | 'blocked' | 'halted'
  index: number
}) {
  const Icon = stage.icon
  const reduced = useReducedMotion()

  const tone =
    state === 'blocked'
      ? 'border-danger/45 bg-danger/[0.10]'
      : state === 'halted'
        ? 'border-border bg-surface-2/30 opacity-45'
        : state === 'active'
          ? 'border-primary/45 bg-primary/[0.08]'
          : 'border-border bg-surface-2/40'

  const iconTone =
    state === 'blocked'
      ? 'text-danger'
      : state === 'halted'
        ? 'text-text-muted'
        : state === 'active'
          ? 'text-primary'
          : 'text-text-muted'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className={cx(
        'relative flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-control border px-1.5 py-3 text-center',
        'transition-colors duration-300 ease-out',
        tone,
      )}
    >
      <span className={cx('relative inline-flex h-8 w-8 items-center justify-center', iconTone)}>
        {state === 'active' && !reduced ? (
          <motion.span
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.22, ease: 'easeInOut' }}
          />
        ) : null}
        <Icon size={17} className="relative" />
      </span>
      {/* Wraps rather than truncates — a clipped "Consen…" tells the reader nothing. */}
      <span className="w-full text-balance text-[11.5px] font-medium leading-tight text-text">
        {stage.label}
      </span>
      <span className="w-full text-balance text-[10px] leading-tight text-text-muted">
        {stage.detail}
      </span>
      <span className="mt-auto font-mono text-[9px] uppercase tracking-wider text-text-muted/60">
        {stage.fr}
      </span>
    </motion.div>
  )
}

export function PipelineFlow() {
  const { session, gateState, watermark, metrics } = useEngine()

  const blocked = gateState === 'blocked'
  const live = session === 'live'
  const warming = session === 'warming'
  const flowing = live && !blocked

  const stageState = (index: number): 'idle' | 'active' | 'blocked' | 'halted' => {
    if (blocked) {
      if (index < 2) return 'active'
      if (index === 2) return 'blocked'
      return 'halted'
    }
    if (live || warming) return 'active'
    return 'idle'
  }

  return (
    <Card data-tour="pipeline">
      <CardHeader
        icon={<Sparkles size={16} />}
        title="Reenactment pipeline"
        subtitle={
          blocked
            ? 'Halted at the consent gate — nothing downstream runs.'
            : live
              ? 'Frames flowing from your webcam to the virtual camera.'
              : 'The path a frame takes once a session starts.'
        }
        right={
          <div className="flex items-center gap-2">
            {live ? (
              <Chip tone="success">
                {metrics ? `${metrics.latencyMs.toFixed(0)} ms / frame` : 'Streaming'}
              </Chip>
            ) : (
              <Chip>{blocked ? 'Blocked' : 'Idle'}</Chip>
            )}
            <SimulatedBadge />
          </div>
        }
      />

      <div className="flex items-stretch gap-1 overflow-x-auto pb-1 sm:overflow-visible">
        {STAGES.map((stage, i) => (
          <span key={stage.id} className="contents">
            {i > 0 ? (
              <Connector
                flowing={flowing}
                blocked={blocked && i === 3}
              />
            ) : null}
            <StageNode stage={stage} state={stageState(i)} index={i} />
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <p className="text-[11px] leading-relaxed text-text-muted">
          {blocked
            ? 'The gate is a hard stop: motion is still read, but nothing is animated or sent.'
            : `Budget: ≤ ${TARGETS.frameComputeMs} ms of reenactment compute per frame, ≤ ${TARGETS.endToEndLatencyMs} ms capture-to-camera.`}
        </p>
        {watermark ? (
          <Chip tone="accent" className="shrink-0">
            Disclosure attached at output
          </Chip>
        ) : null}
      </div>
    </Card>
  )
}

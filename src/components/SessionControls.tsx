import { ArrowRight, Loader2, Play, Square, Video } from 'lucide-react'
import { VIRTUAL_CAMERA_NAME } from '../mock/constants'
import { useEngine } from '../mock/engine'
import { Button, Chip, cx, StatusDot } from './ui'

function clock(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function SessionControls() {
  const {
    session,
    startSession,
    stopSession,
    gateState,
    sessionSeconds,
    inputDevice,
  } = useEngine()

  const blocked = gateState === 'blocked'
  const warming = session === 'warming'
  const live = session === 'live'

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {live ? (
          <Button variant="danger" size="lg" onClick={stopSession}>
            <Square size={15} />
            Stop Session
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={startSession}
            disabled={blocked || warming}
            title={blocked ? 'Consent gate blocked — animation is not permitted' : undefined}
          >
            {warming ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Warming up…
              </>
            ) : (
              <>
                <Play size={15} />
                Start Session
              </>
            )}
          </Button>
        )}

        {live ? (
          <Chip tone="danger" icon={<StatusDot tone="danger" pulse />}>
            <span className="font-mono tabular-nums">{clock(sessionSeconds)}</span>
          </Chip>
        ) : null}

        {blocked ? (
          <span className="text-[12px] font-medium text-danger">
            Blocked by the consent gate.
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[12px] text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Video size={13} />
          Driving: <span className="text-text">Webcam</span>
          <span className="text-text-muted/70">({inputDevice})</span>
        </span>
        <ArrowRight size={13} className="opacity-60" />
        <span
          className={cx(
            'inline-flex items-center gap-1.5 rounded-chip border px-2 py-1',
            live
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-border bg-surface-2 text-text-muted',
          )}
        >
          <StatusDot tone={live ? 'success' : 'muted'} pulse={live} />
          {VIRTUAL_CAMERA_NAME}
        </span>
      </div>
    </div>
  )
}

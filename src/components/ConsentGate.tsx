import { ShieldAlert, ShieldCheck, ShieldOff, UserX } from 'lucide-react'
import { COPY } from '../mock/constants'
import { useEngine } from '../mock/engine'
import type { GateState } from '../mock/types'
import { Avatar } from './Avatar'
import { Button, Card, CardHeader, Chip, cx, Toggle } from './ui'

const GATE_PRESENTATION: Record<
  GateState,
  {
    chip: 'success' | 'warning' | 'danger'
    chipLabel: string
    icon: typeof ShieldCheck
    message: string
    frame: string
    text: string
  }
> = {
  verified: {
    chip: 'success',
    chipLabel: 'Verified',
    icon: ShieldCheck,
    message: COPY.consentVerified,
    frame: 'border-success/25 bg-success/[0.06]',
    text: 'text-success',
  },
  disabled: {
    chip: 'warning',
    chipLabel: 'Disabled',
    icon: ShieldOff,
    message: COPY.consentDisabled,
    frame: 'border-warning/25 bg-warning/[0.07]',
    text: 'text-warning',
  },
  blocked: {
    chip: 'danger',
    chipLabel: 'Blocked',
    icon: ShieldAlert,
    message: COPY.consentBlocked,
    frame: 'border-danger/30 bg-danger/[0.08]',
    text: 'text-danger',
  },
}

export function ConsentGateCard() {
  const {
    gateState,
    gateEnabled,
    setGateEnabled,
    simulateNonEnrolledFace,
    blockedSecondsLeft,
    enrolledUser,
  } = useEngine()

  const view = GATE_PRESENTATION[gateState]
  const Icon = view.icon
  const name = enrolledUser?.name ?? 'Demo identity'

  return (
    <Card>
      <CardHeader
        icon={<ShieldCheck size={16} />}
        title="Consent Gate"
        subtitle="Animation is restricted to the enrolled likeness."
        right={<Chip tone={view.chip}>{view.chipLabel}</Chip>}
      />

      <div
        className={cx(
          'flex items-start gap-3 rounded-control border px-3.5 py-3 transition-colors duration-200 ease-out',
          view.frame,
        )}
      >
        <Avatar
          name={name}
          size={38}
          ring={gateState === 'blocked' ? 'danger' : gateState === 'disabled' ? 'warning' : 'success'}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon size={14} className={view.text} />
            <p className={cx('text-[13px] font-semibold', view.text)}>{view.message}</p>
          </div>
          <p className="mt-1 truncate text-[12px] text-text-muted">
            {gateState === 'blocked' ? (
              <>Recovering in {blockedSecondsLeft}s — demo state only.</>
            ) : (
              <>
                {name} · <span className="font-mono">{enrolledUser?.embeddingId ?? 'emb_demo'}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Toggle
          checked={gateEnabled}
          onChange={setGateEnabled}
          tone="success"
          label="Consent gate"
          description={
            gateEnabled
              ? 'Only your enrolled likeness can be animated.'
              : 'Turning the gate off is not recommended.'
          }
        />
      </div>

      <div className="mt-4 border-t border-border pt-3.5">
        <Button
          size="sm"
          block
          onClick={simulateNonEnrolledFace}
          disabled={!gateEnabled || gateState === 'blocked'}
        >
          <UserX size={14} />
          {gateState === 'blocked'
            ? `Blocked — recovering in ${blockedSecondsLeft}s`
            : 'Simulate non-enrolled face'}
        </Button>
        <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
          Demo control. Flips the gate to Blocked for four seconds and disables Start Session. The
          gate is interface state in this prototype, not a classifier.
        </p>
      </div>
    </Card>
  )
}

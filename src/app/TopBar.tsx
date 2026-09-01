import { AnimatePresence, motion } from 'framer-motion'
import { BadgeCheck, Clapperboard, MonitorPlay, ShieldCheck, ShieldOff, ShieldAlert } from 'lucide-react'
import { VIRTUAL_CAMERA_NAME } from '../mock/constants'
import { useEngine } from '../mock/engine'
import type { Mode, Screen } from '../mock/types'
import { Chip, Segmented, StatusDot } from '../components/ui'

const TITLES: Record<Screen, { title: string; subtitle: string }> = {
  landing: { title: 'Overview', subtitle: 'What NeuroPresence does and what we measured.' },
  onboarding: { title: 'Get started', subtitle: 'Enroll your identity and pick a source clip.' },
  console: { title: 'Console', subtitle: 'Real-time reenactment to your virtual camera.' },
  clips: { title: 'Source Clips', subtitle: 'The presentable clips that get reenacted.' },
  offline: { title: 'Offline Studio', subtitle: 'Higher fidelity, driven by a recording.' },
  devices: { title: 'Devices & Output', subtitle: 'Camera input and virtual-camera output.' },
  settings: { title: 'Settings', subtitle: 'Identity, safeguards and appearance.' },
}

export function TopBar() {
  const { screen, mode, setMode, session, gateState, gateEnabled, watermark } = useEngine()
  const { title, subtitle } = TITLES[screen]

  const live = session === 'live'
  const warming = session === 'warming'

  const gateChip =
    gateState === 'blocked'
      ? { tone: 'danger' as const, icon: <ShieldAlert size={11} />, label: 'Consent: BLOCKED' }
      : gateEnabled
        ? { tone: 'success' as const, icon: <ShieldCheck size={11} />, label: 'Consent: ON' }
        : { tone: 'warning' as const, icon: <ShieldOff size={11} />, label: 'Consent: OFF' }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-6">
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-semibold leading-tight text-text">{title}</h1>
        <p className="hidden truncate text-[12px] leading-tight text-text-muted lg:block">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <Segmented<Mode>
          ariaLabel="Operating mode"
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'realtime', label: 'Real-time', icon: <MonitorPlay size={13} /> },
            { value: 'offline', label: 'Offline', icon: <Clapperboard size={13} /> },
          ]}
        />

        <span className="hidden h-6 w-px bg-border sm:block" />

        <Chip tone={gateChip.tone} icon={gateChip.icon} className="hidden sm:inline-flex">
          {gateChip.label}
        </Chip>

        <Chip
          tone={watermark ? 'accent' : 'muted'}
          icon={<BadgeCheck size={11} />}
          className="hidden md:inline-flex"
        >
          Disclosure: {watermark ? 'ON' : 'OFF'}
        </Chip>

        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={live ? 'live' : warming ? 'warming' : 'idle'}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex"
          >
            <Chip
              tone={live ? 'danger' : warming ? 'primary' : 'muted'}
              icon={<StatusDot tone={live ? 'danger' : warming ? 'primary' : 'muted'} pulse={live} />}
            >
              {live ? 'LIVE' : warming ? 'Warming' : 'Idle'}
            </Chip>
          </motion.span>
        </AnimatePresence>

        <span
          className="hidden max-w-[220px] truncate text-[12px] text-text-muted lg:inline"
          title={`Output: ${VIRTUAL_CAMERA_NAME}`}
        >
          Output: <span className="text-text">{VIRTUAL_CAMERA_NAME}</span>
        </span>
      </div>
    </header>
  )
}

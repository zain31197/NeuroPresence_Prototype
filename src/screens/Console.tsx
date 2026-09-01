import { Film, Info, ShieldAlert } from 'lucide-react'
import { motion } from 'framer-motion'
import { COPY } from '../mock/constants'
import { useEngine } from '../mock/engine'
import { ConsentGateCard } from '../components/ConsentGate'
import { DrivingSignal } from '../components/DrivingSignal'
import { MetricsPanel } from '../components/MetricsPanel'
import { SessionControls } from '../components/SessionControls'
import { VideoFrame } from '../components/VideoFrame'
import { WatermarkCard } from '../components/WatermarkCard'
import { Button, Card, OverlayChip } from '../components/ui'
import { MountItem, MountStagger } from '../components/motion'

export function Console() {
  const {
    activeClip,
    session,
    warmupProgress,
    watermark,
    gateState,
    navigate,
    metricsMode,
  } = useEngine()

  const blocked = gateState === 'blocked'

  return (
    <div className="space-y-4">
      {blocked ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 rounded-card border border-danger/35 bg-danger/[0.08] px-4 py-3"
          role="status"
        >
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-danger" />
          <div>
            <p className="text-[13px] font-semibold text-danger">Consent gate blocked</p>
            <p className="mt-0.5 text-[12px] text-text-muted">{COPY.consentBlocked}</p>
          </div>
        </motion.div>
      ) : null}

      <MountStagger className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_392px]">
        {/* ----------------------- output preview ----------------------- */}
        <div className="space-y-4">
          <MountItem>
          <Card padding="p-4">
            <VideoFrame
              clip={activeClip}
              session={session}
              watermark={watermark}
              warmupProgress={warmupProgress}
              blocked={blocked}
              cornerRight={
                <OverlayChip>{activeClip.resolution}</OverlayChip>
              }
            />

            <div className="mt-4">
              <SessionControls />
            </div>
          </Card>
          </MountItem>

          <MountItem className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_240px]">
            {/* Compact source-clip selector. */}
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-text-muted">
                    <Film size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="np-label">Active source clip</p>
                    <p className="mt-1 truncate text-[14px] font-medium text-text">
                      {activeClip.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-text-muted">
                      {activeClip.duration} · {activeClip.resolution}
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate('clips')}>
                  Change
                </Button>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-control border border-border bg-surface-2/50 px-3 py-2.5">
                <Info size={13} className="mt-0.5 shrink-0 text-text-muted" />
                <p className="text-[11px] leading-relaxed text-text-muted">
                  The preview plays your source clip as a stand-in. This build does not run a
                  reenactment model —{' '}
                  {metricsMode === 'baseline'
                    ? 'the figures shown are our measured proof-of-concept numbers.'
                    : 'the figures shown are the finished-product targets.'}
                </p>
              </div>
            </Card>

            <DrivingSignal />
          </MountItem>
        </div>

        {/* --------------------- control + telemetry --------------------- */}
        <div className="space-y-4">
          <MountItem>
            <MetricsPanel />
          </MountItem>
          <MountItem>
            <ConsentGateCard />
          </MountItem>
          <MountItem>
            <WatermarkCard />
          </MountItem>
        </div>
      </MountStagger>
    </div>
  )
}

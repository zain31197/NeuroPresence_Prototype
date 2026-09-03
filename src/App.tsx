import { motion } from 'framer-motion'
import { Sidebar } from './app/Sidebar'
import { TopBar } from './app/TopBar'
import { GuidedTour } from './components/GuidedTour'
import { useEngine } from './mock/engine'
import { COPY } from './mock/constants'
import { Console } from './screens/Console'
import { Devices } from './screens/Devices'
import { Feasibility } from './screens/Feasibility'
import { Landing } from './screens/Landing'
import { OfflineStudio } from './screens/OfflineStudio'
import { Onboarding } from './screens/Onboarding'
import { Settings } from './screens/Settings'
import { SourceClips } from './screens/SourceClips'

const SCREENS = {
  console: Console,
  clips: SourceClips,
  offline: OfflineStudio,
  devices: Devices,
  feasibility: Feasibility,
  settings: Settings,
} as const

export default function App() {
  const { screen } = useEngine()

  // The landing page and the enrollment flow each own the whole viewport —
  // no application shell behind them.
  if (screen === 'landing') return <><Landing /><GuidedTour /></>
  if (screen === 'onboarding') return <><Onboarding /><GuidedTour /></>

  const Screen = SCREENS[screen]

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg">
      <GuidedTour />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {/*
           * A keyed motion.div — deliberately NOT wrapped in <AnimatePresence
           * mode="wait">. The exit-then-enter handoff there deadlocks when an
           * unrelated context update (e.g. the theme toggle) re-renders this
           * subtree mid-transition, leaving <main> stuck at opacity:0. Remounting
           * on `key` change replays the enter animation and can never wedge.
           */}
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-[1480px] px-6 py-6"
          >
            <Screen />
          </motion.div>

          <footer className="mx-auto w-full max-w-[1480px] px-6 pb-6 pt-1">
            <p className="border-t border-border pt-4 text-[11px] leading-relaxed text-text-muted">
              {COPY.prototypeDisclosure}
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}

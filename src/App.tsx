import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './app/Sidebar'
import { TopBar } from './app/TopBar'
import { useEngine } from './mock/engine'
import { COPY } from './mock/constants'
import { Console } from './screens/Console'
import { Devices } from './screens/Devices'
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
  settings: Settings,
} as const

export default function App() {
  const { screen } = useEngine()

  // The landing page and the enrollment flow each own the whole viewport —
  // no application shell behind them.
  if (screen === 'landing') return <Landing />
  if (screen === 'onboarding') return <Onboarding />

  const Screen = SCREENS[screen]

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto w-full max-w-[1480px] px-6 py-6"
            >
              <Screen />
            </motion.div>
          </AnimatePresence>

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

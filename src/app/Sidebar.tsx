import { motion } from 'framer-motion'
import {
  Clapperboard,
  Film,
  Home,
  LayoutDashboard,
  FlaskConical,
  MonitorPlay,
  Presentation,
  Settings as SettingsIcon,
} from 'lucide-react'
import { useEngine } from '../mock/engine'
import type { Screen } from '../mock/types'
import { Avatar } from '../components/Avatar'
import { cx, StatusDot } from '../components/ui'

const NAV: Array<{ screen: Screen; label: string; icon: typeof LayoutDashboard }> = [
  { screen: 'console', label: 'Console', icon: LayoutDashboard },
  { screen: 'clips', label: 'Source Clips', icon: Film },
  { screen: 'offline', label: 'Offline Studio', icon: Clapperboard },
  { screen: 'devices', label: 'Devices & Output', icon: MonitorPlay },
  { screen: 'feasibility', label: 'Feasibility', icon: FlaskConical },
  { screen: 'settings', label: 'Settings', icon: SettingsIcon },
]

function Logo() {
  return (
    <span
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
      style={{
        background: 'linear-gradient(135deg, rgb(var(--primary-rgb)) 0%, rgb(var(--accent-rgb)) 100%)',
      }}
      aria-hidden
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 19V5l12 14V5"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export function Sidebar() {
  const { screen, navigate, enrolledUser, startTour } = useEngine()

  return (
    <nav
      aria-label="Primary"
      className={cx(
        'flex h-full shrink-0 flex-col border-r border-border bg-surface',
        // Collapses to icons on narrower screens (brief §12).
        'w-[72px] xl:w-[252px]',
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
        <button
          type="button"
          onClick={() => navigate('landing')}
          title="Back to the overview"
          className="flex min-w-0 items-center gap-2.5 rounded-control transition-opacity duration-200 hover:opacity-80"
        >
          <Logo />
          <span className="hidden min-w-0 text-left xl:block">
            <span className="block truncate text-[15px] font-semibold leading-tight tracking-[-0.01em] text-text">
              NeuroPresence
            </span>
            <span className="block truncate text-[11px] leading-tight text-text-muted">
              Composed presence
            </span>
          </span>
        </button>
      </div>

      <ul className="flex-1 space-y-1 p-3">
        {NAV.map(({ screen: target, label, icon: Icon }) => {
          const active = screen === target
          return (
            <li key={target}>
              <button
                type="button"
                onClick={() => navigate(target)}
                aria-current={active ? 'page' : undefined}
                title={label}
                className={cx(
                  'relative flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-[13px] font-medium',
                  'transition-colors duration-200 ease-out',
                  'justify-center xl:justify-start',
                  active ? 'text-primary' : 'text-text-muted hover:bg-surface-2 hover:text-text',
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-control border border-primary/25 bg-primary/[0.09]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <Icon size={17} className="relative shrink-0" />
                <span className="relative hidden truncate xl:inline">{label}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="space-y-2.5 border-t border-border p-3">
        {/* The brief's §13 defense script, driven by the app itself. */}
        <button
          type="button"
          onClick={startTour}
          title="Play the guided demo"
          className={cx(
            'group/tour relative flex w-full items-center gap-3 overflow-hidden rounded-control px-3 py-2.5',
            'border border-primary/30 bg-primary/[0.08] text-[13px] font-medium text-primary',
            'transition-colors duration-200 hover:border-primary/50 hover:bg-primary/[0.14]',
            'justify-center xl:justify-start',
          )}
        >
          <Presentation size={17} className="relative shrink-0" />
          <span className="relative hidden truncate xl:inline">Guided demo</span>
          <span className="relative ml-auto hidden font-mono text-[10px] text-primary/60 xl:inline">
            3 min
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('landing')}
          title="Project overview"
          className={cx(
            'flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-[13px] font-medium',
            'text-text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-text',
            'justify-center xl:justify-start',
          )}
        >
          <Home size={17} className="shrink-0" />
          <span className="hidden truncate xl:inline">Project overview</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('settings')}
          className={cx(
            'flex w-full items-center gap-2.5 rounded-control border border-border bg-surface-2/60 p-2',
            'text-left transition-all duration-200 ease-out hover:shadow-hover',
            'justify-center xl:justify-start',
          )}
          title={enrolledUser ? `${enrolledUser.name} — enrolled` : 'Not enrolled'}
        >
          <Avatar
            name={enrolledUser?.name ?? 'Demo identity'}
            size={30}
            ring={enrolledUser ? 'success' : 'warning'}
          />
          <span className="hidden min-w-0 flex-1 xl:block">
            <span className="block truncate text-[12px] font-medium text-text">
              {enrolledUser?.name ?? 'Not enrolled'}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <StatusDot tone={enrolledUser ? 'success' : 'warning'} />
              {enrolledUser ? 'Enrolled' : 'Enrollment pending'}
            </span>
          </span>
        </button>

        <p
          className={cx(
            'rounded-chip border border-accent/25 bg-accent/[0.07] px-2 py-1.5 text-center',
            'text-[10px] font-medium leading-tight text-accent',
          )}
          title="Prototype build — simulated data"
        >
          <span className="xl:hidden">PROTO</span>
          <span className="hidden xl:inline">Prototype build — simulated data</span>
        </p>
      </div>
    </nav>
  )
}

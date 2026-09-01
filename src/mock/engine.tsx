import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { hashForScreen, isAppScreen, screenFromHash, TITLES } from '../app/routes'
import { INPUT_DEVICES, RENDER_STAGES, SEED_CLIPS, USER_CLIP_PALETTES } from './seedData'
import { HISTORY_LENGTH, initialSamplerState, nextSample, type SamplerState } from './sampler'
import type {
  EnrolledUser,
  GateState,
  MetricSample,
  MetricsMode,
  Mode,
  OfflineState,
  Screen,
  SessionState,
  SourceClip,
} from './types'

/* ------------------------------------------------------------------ *
 * The mock engine.
 *
 * Everything "behind the interface" lives here: session lifecycle,
 * telemetry stream, consent-gate state and the offline render. Nothing
 * in this file touches a model, a frame-analysis routine or a network.
 * All state is in memory — no localStorage, no backend.
 * ------------------------------------------------------------------ */

const WARMUP_MS = 1500
const BLOCKED_DEMO_MS = 4000
const METRICS_INTERVAL_MS = 500
const RENDER_MS = 5000

export interface EngineValue {
  // navigation
  screen: Screen
  navigate: (screen: Screen) => void
  mode: Mode
  setMode: (mode: Mode) => void

  // identity
  enrolledUser: EnrolledUser | null
  enrollUser: (name: string) => void
  onboardingDone: boolean
  completeOnboarding: () => void
  restartEnrollment: () => void

  // source clips
  clips: SourceClip[]
  activeClip: SourceClip
  activeClipId: string
  setActiveClip: (id: string) => void
  addClip: (file: File) => SourceClip

  // session
  session: SessionState
  warmupProgress: number
  startSession: () => void
  stopSession: () => void
  sessionSeconds: number

  // consent gate
  gateEnabled: boolean
  setGateEnabled: (on: boolean) => void
  gateState: GateState
  simulateNonEnrolledFace: () => void
  blockedSecondsLeft: number

  // disclosure watermark
  watermark: boolean
  setWatermark: (on: boolean) => void

  // telemetry
  metricsMode: MetricsMode
  setMetricsMode: (mode: MetricsMode) => void
  metrics: MetricSample | null
  history: MetricSample[]

  // devices
  inputDevice: string
  setInputDevice: (device: string) => void

  // offline studio
  offline: OfflineState
  setDrivingVideo: (file: File) => void
  clearDrivingVideo: () => void
  setSimulatePoorInput: (on: boolean) => void
  setOfflineResolution: (r: 256 | 512 | 1024) => void
  setSmoothing: (v: number) => void
  startRender: () => void
  resetRender: () => void

  // appearance
  theme: 'dark' | 'light'
  setTheme: (t: 'dark' | 'light') => void
}

const EngineContext = createContext<EngineValue | null>(null)

export function EngineProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('landing')
  const [mode, setModeState] = useState<Mode>('realtime')

  const [enrolledUser, setEnrolledUser] = useState<EnrolledUser | null>(null)
  const [onboardingDone, setOnboardingDone] = useState(false)

  const [clips, setClips] = useState<SourceClip[]>(SEED_CLIPS)
  const [activeClipId, setActiveClipId] = useState<string>(SEED_CLIPS[0].id)

  const [session, setSession] = useState<SessionState>('idle')
  const [warmupProgress, setWarmupProgress] = useState(0)
  const [sessionSeconds, setSessionSeconds] = useState(0)

  const [gateEnabled, setGateEnabledState] = useState(true)
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
  const [blockedSecondsLeft, setBlockedSecondsLeft] = useState(0)

  const [watermark, setWatermark] = useState(true)

  const [metricsMode, setMetricsModeState] = useState<MetricsMode>('target')
  const [metrics, setMetrics] = useState<MetricSample | null>(null)
  const [history, setHistory] = useState<MetricSample[]>([])
  const samplerRef = useRef<SamplerState>(initialSamplerState('target'))

  const [inputDevice, setInputDevice] = useState<string>(INPUT_DEVICES[0])

  const [offline, setOffline] = useState<OfflineState>({
    drivingFileName: null,
    drivingSrc: null,
    checkStatus: 'idle',
    simulatePoorInput: false,
    resolution: 512,
    smoothing: 60,
    renderStatus: 'idle',
    renderProgress: 0,
    renderStage: '',
    renderedAt: null,
  })

  const [theme, setThemeState] = useState<'dark' | 'light'>('light')

  /* ---------------------------- identity ---------------------------- */

  const enrollUser = useCallback((name: string) => {
    const trimmed = name.trim() || 'Zain Shahid'
    setEnrolledUser({
      name: trimmed,
      // A label, not a computation. No embedding is produced anywhere.
      embeddingId: 'emb_9f2a71c4',
      enrolledAt: new Date(),
    })
  }, [])


  /* ------------------------------ nav ------------------------------- */

  /**
   * Single entry point for every screen change, whether it came from a
   * click or from the browser's back/forward buttons.
   */
  const applyScreen = useCallback((next: Screen) => {
    setScreen(next)
    if (next === 'offline') setModeState('offline')
    if (next === 'console') setModeState('realtime')
    if (next === 'landing' || next === 'onboarding') {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
    // Deep-linking straight into the app (or arriving via back/forward)
    // should not land on an un-enrolled shell — fall back to the demo
    // identity, exactly as the "Skip" link does.
    if (isAppScreen(next)) {
      setEnrolledUser((prev) =>
        prev ?? { name: 'Zain Shahid', embeddingId: 'emb_9f2a71c4', enrolledAt: new Date() },
      )
    }
  }, [])

  const navigate = useCallback(
    (next: Screen) => {
      applyScreen(next)
    },
    [applyScreen],
  )

  const setMode = useCallback(
    (next: Mode) => {
      applyScreen(next === 'offline' ? 'offline' : 'console')
    },
    [applyScreen],
  )

  const completeOnboarding = useCallback(() => {
    setOnboardingDone(true)
    applyScreen('console')
  }, [applyScreen])

  const restartEnrollment = useCallback(() => {
    setOnboardingDone(false)
    applyScreen('onboarding')
  }, [applyScreen])

  /* ---------------------------- URL routing --------------------------- */

  // Hash → screen. Covers the first paint, hard refreshes and the
  // browser's back/forward buttons.
  useEffect(() => {
    const sync = () => {
      const next = screenFromHash(window.location.hash)
      if (next) applyScreen(next)
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [applyScreen])

  // Screen → hash + document title.
  useEffect(() => {
    const want = hashForScreen(screen)
    if (window.location.hash !== want) {
      // replace on the very first entry so Back still leaves the app
      const first = window.location.hash === '' || window.location.hash === '#'
      const url = `${window.location.pathname}${window.location.search}${want}`
      if (first) window.history.replaceState(null, '', url)
      else window.history.pushState(null, '', url)
    }
    document.title = TITLES[screen]
  }, [screen])

  /* --------------------------- source clips -------------------------- */

  const activeClip = useMemo(
    () => clips.find((c) => c.id === activeClipId) ?? clips[0],
    [clips, activeClipId],
  )

  const setActiveClip = useCallback((id: string) => setActiveClipId(id), [])

  const addClip = useCallback(
    (file: File) => {
      const userCount = clips.filter((c) => c.userAdded).length
      const palette = USER_CLIP_PALETTES[userCount % USER_CLIP_PALETTES.length]
      const clip: SourceClip = {
        id: `clip_user_${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Untitled clip',
        duration: '—',
        resolution: '512×512',
        scene: 'studio',
        palette,
        // Held in memory only, as an object URL. The file is never uploaded
        // anywhere and never analysed.
        src: URL.createObjectURL(file),
        fileName: file.name,
        userAdded: true,
      }
      setClips((prev) => [...prev, clip])
      return clip
    },
    [clips],
  )

  /* ---------------------------- consent gate -------------------------- */

  const gateState: GateState = !gateEnabled
    ? 'disabled'
    : blockedUntil !== null
      ? 'blocked'
      : 'verified'

  const setGateEnabled = useCallback((on: boolean) => {
    setGateEnabledState(on)
    if (on) setBlockedUntil(null)
  }, [])

  const simulateNonEnrolledFace = useCallback(() => {
    if (!gateEnabled) return
    setBlockedUntil(Date.now() + BLOCKED_DEMO_MS)
  }, [gateEnabled])

  // The blocked state recovers on its own after 4s, with a visible countdown.
  useEffect(() => {
    if (blockedUntil === null) {
      setBlockedSecondsLeft(0)
      return
    }
    const tick = () => {
      const left = blockedUntil - Date.now()
      if (left <= 0) {
        setBlockedUntil(null)
        setBlockedSecondsLeft(0)
      } else {
        setBlockedSecondsLeft(Math.ceil(left / 1000))
      }
    }
    tick()
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [blockedUntil])

  /* ---------------------------- session ------------------------------ */

  const stopSession = useCallback(() => {
    setSession('idle')
    setWarmupProgress(0)
    setSessionSeconds(0)
  }, [])

  const startSession = useCallback(() => {
    if (gateState === 'blocked') return
    setSession('warming')
    setWarmupProgress(0)
  }, [gateState])

  // A blocked gate tears down a running session — the safeguard has teeth.
  useEffect(() => {
    if (gateState === 'blocked' && session !== 'idle') stopSession()
  }, [gateState, session, stopSession])

  // idle → warming (1.5s progress) → live
  useEffect(() => {
    if (session !== 'warming') return
    const started = Date.now()
    const id = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / WARMUP_MS) * 100)
      setWarmupProgress(pct)
      if (pct >= 100) {
        window.clearInterval(id)
        setSession('live')
      }
    }, 50)
    return () => window.clearInterval(id)
  }, [session])

  // Session clock for the "Live 00:14" readout.
  useEffect(() => {
    if (session !== 'live') return
    const id = window.setInterval(() => setSessionSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [session])

  /* --------------------------- telemetry ----------------------------- */

  const setMetricsMode = useCallback((next: MetricsMode) => {
    setMetricsModeState(next)
    samplerRef.current = initialSamplerState(next)
    setHistory([])
  }, [])

  // Runs only while the session is live; values freeze on Stop.
  useEffect(() => {
    if (session !== 'live') return
    const emit = () => {
      const { state, sample } = nextSample(samplerRef.current, metricsMode)
      samplerRef.current = state
      setMetrics(sample)
      setHistory((prev) => [...prev, sample].slice(-HISTORY_LENGTH))
    }
    emit()
    const id = window.setInterval(emit, METRICS_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [session, metricsMode])

  /* ------------------------- offline studio -------------------------- */

  const setDrivingVideo = useCallback((file: File) => {
    const poor = /bad/i.test(file.name)
    setOffline((prev) => {
      if (prev.drivingSrc) URL.revokeObjectURL(prev.drivingSrc)
      return {
        ...prev,
        drivingFileName: file.name,
        drivingSrc: URL.createObjectURL(file),
        checkStatus: 'checking',
        simulatePoorInput: poor || prev.simulatePoorInput,
        renderStatus: 'idle',
        renderProgress: 0,
        renderStage: '',
        renderedAt: null,
      }
    })
  }, [])

  const clearDrivingVideo = useCallback(() => {
    setOffline((prev) => {
      if (prev.drivingSrc) URL.revokeObjectURL(prev.drivingSrc)
      return {
        ...prev,
        drivingFileName: null,
        drivingSrc: null,
        checkStatus: 'idle',
        renderStatus: 'idle',
        renderProgress: 0,
        renderStage: '',
        renderedAt: null,
      }
    })
  }, [])

  // The input-quality checklist is a timer, not a detector.
  useEffect(() => {
    if (offline.checkStatus !== 'checking') return
    const id = window.setTimeout(() => {
      setOffline((prev) => ({
        ...prev,
        checkStatus: prev.simulatePoorInput ? 'fail' : 'pass',
      }))
    }, 1400)
    return () => window.clearTimeout(id)
  }, [offline.checkStatus, offline.simulatePoorInput])

  const setSimulatePoorInput = useCallback((on: boolean) => {
    setOffline((prev) => ({
      ...prev,
      simulatePoorInput: on,
      checkStatus: prev.drivingFileName ? (on ? 'fail' : 'pass') : prev.checkStatus,
      renderStatus: 'idle',
      renderProgress: 0,
      renderedAt: on ? null : prev.renderedAt,
    }))
  }, [])

  const setOfflineResolution = useCallback(
    (r: 256 | 512 | 1024) => setOffline((prev) => ({ ...prev, resolution: r })),
    [],
  )

  const setSmoothing = useCallback(
    (v: number) => setOffline((prev) => ({ ...prev, smoothing: v })),
    [],
  )

  const startRender = useCallback(() => {
    setOffline((prev) => ({
      ...prev,
      renderStatus: 'rendering',
      renderProgress: 0,
      renderStage: RENDER_STAGES[0],
      renderedAt: null,
    }))
  }, [])

  const resetRender = useCallback(() => {
    setOffline((prev) => ({
      ...prev,
      renderStatus: 'idle',
      renderProgress: 0,
      renderStage: '',
      renderedAt: null,
    }))
  }, [])

  // Simulated render: 0→100% over ~5s with staged status text.
  useEffect(() => {
    if (offline.renderStatus !== 'rendering') return
    const started = Date.now()
    const id = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / RENDER_MS) * 100)
      const stageIndex = Math.min(
        RENDER_STAGES.length - 1,
        Math.floor((pct / 100) * RENDER_STAGES.length),
      )
      if (pct >= 100) {
        window.clearInterval(id)
        setOffline((prev) => ({
          ...prev,
          renderProgress: 100,
          renderStage: '',
          renderStatus: 'done',
          renderedAt: { resolution: prev.resolution, smoothing: prev.smoothing },
        }))
      } else {
        setOffline((prev) => ({
          ...prev,
          renderProgress: pct,
          renderStage: RENDER_STAGES[stageIndex],
        }))
      }
    }, 60)
    return () => window.clearInterval(id)
  }, [offline.renderStatus])

  /* ---------------------------- appearance ---------------------------- */

  const setTheme = useCallback((t: 'dark' | 'light') => setThemeState(t), [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const value = useMemo<EngineValue>(
    () => ({
      screen,
      navigate,
      mode,
      setMode,
      enrolledUser,
      enrollUser,
      onboardingDone,
      completeOnboarding,
      restartEnrollment,
      clips,
      activeClip,
      activeClipId,
      setActiveClip,
      addClip,
      session,
      warmupProgress,
      startSession,
      stopSession,
      sessionSeconds,
      gateEnabled,
      setGateEnabled,
      gateState,
      simulateNonEnrolledFace,
      blockedSecondsLeft,
      watermark,
      setWatermark,
      metricsMode,
      setMetricsMode,
      metrics,
      history,
      inputDevice,
      setInputDevice,
      offline,
      setDrivingVideo,
      clearDrivingVideo,
      setSimulatePoorInput,
      setOfflineResolution,
      setSmoothing,
      startRender,
      resetRender,
      theme,
      setTheme,
    }),
    [
      screen, navigate, mode, setMode, enrolledUser, enrollUser, onboardingDone,
      completeOnboarding, restartEnrollment, clips, activeClip, activeClipId,
      setActiveClip, addClip, session, warmupProgress, startSession, stopSession,
      sessionSeconds, gateEnabled, setGateEnabled, gateState, simulateNonEnrolledFace,
      blockedSecondsLeft, watermark, metricsMode, setMetricsMode, metrics, history,
      inputDevice, offline, setDrivingVideo, clearDrivingVideo, setSimulatePoorInput,
      setOfflineResolution, setSmoothing, startRender, resetRender, theme, setTheme,
    ],
  )

  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>
}

export function useEngine(): EngineValue {
  const ctx = useContext(EngineContext)
  if (!ctx) throw new Error('useEngine must be used inside <EngineProvider>')
  return ctx
}

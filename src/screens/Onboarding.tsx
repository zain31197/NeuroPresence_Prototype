import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Camera, Check, Loader2, ScanFace, Sparkles } from 'lucide-react'
import { COPY, PROJECT } from '../mock/constants'
import { useEngine } from '../mock/engine'
import { Avatar } from '../components/Avatar'
import { ClipSurface } from '../components/ClipCanvas'
import { Button, Card, cx, ProgressBar } from '../components/ui'

const STEPS = ['Welcome', 'Capture identity', 'Choose source clip'] as const
const ANALYSIS_MS = 2000

/* ------------------------- circular capture frame ------------------------- */

function IdentityPreview({
  name,
  scanning,
  enrolled,
}: {
  name: string
  scanning: boolean
  enrolled: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [camOn, setCamOn] = useState(false)
  const [canAsk, setCanAsk] = useState(true)

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCanAsk(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
      setCamOn(true)
    } catch {
      setCanAsk(false)
    }
  }, [])

  // Only auto-attach when the camera was *already* granted, so the flow never
  // interrupts a demo with a permission prompt.
  useEffect(() => {
    let cancelled = false
    const probe = async () => {
      try {
        const status = await navigator.permissions?.query({
          name: 'camera' as PermissionName,
        })
        if (!cancelled && status?.state === 'granted') void start()
      } catch {
        /* Permissions API unavailable — stay on the placeholder. */
      }
    }
    void probe()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [start])

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[188px] w-[188px]">
        {/* Scanning ring. */}
        <span
          className={cx(
            'absolute inset-0 rounded-full border-2 border-dashed',
            enrolled
              ? 'border-success/70'
              : scanning
                ? 'animate-ring-sweep border-primary/70'
                : 'border-border',
          )}
        />
        <span
          className={cx(
            'absolute inset-[7px] overflow-hidden rounded-full border bg-surface-2',
            enrolled ? 'border-success/40' : 'border-border',
          )}
        >
          <video
            ref={videoRef}
            className={cx(
              'h-full w-full -scale-x-100 object-cover transition-opacity duration-200',
              camOn ? 'opacity-100' : 'opacity-0',
            )}
            muted
            playsInline
          />
          {!camOn ? (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Avatar name={name || 'NP'} size={64} />
              <span className="px-4 text-center text-[11px] leading-tight text-text-muted">
                {canAsk ? 'Camera preview optional' : 'Camera unavailable'}
              </span>
            </span>
          ) : null}
        </span>

        {enrolled ? (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -bottom-1 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-bg bg-success text-[#04140a]"
          >
            <Check size={18} strokeWidth={3} />
          </motion.span>
        ) : null}
      </div>

      {!camOn && canAsk ? (
        <Button size="sm" variant="ghost" className="mt-3" onClick={() => void start()}>
          <Camera size={13} />
          Use camera preview
        </Button>
      ) : null}
    </div>
  )
}

/* --------------------------------- screen -------------------------------- */

export function Onboarding() {
  const {
    enrollUser,
    enrolledUser,
    completeOnboarding,
    clips,
    activeClipId,
    setActiveClip,
  } = useEngine()

  // Re-enrolling from Settings jumps straight to capture (brief §8.6).
  const [step, setStep] = useState(enrolledUser ? 1 : 0)
  const [name, setName] = useState(enrolledUser?.name ?? 'Zain Shahid')
  const [phase, setPhase] = useState<'ready' | 'analyzing' | 'enrolled'>('ready')
  const [progress, setProgress] = useState(0)

  // The "analysis" is a timer. No embedding is computed anywhere.
  useEffect(() => {
    if (phase !== 'analyzing') return
    const started = Date.now()
    const id = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / ANALYSIS_MS) * 100)
      setProgress(pct)
      if (pct >= 100) {
        window.clearInterval(id)
        enrollUser(name)
        setPhase('enrolled')
      }
    }, 40)
    return () => window.clearInterval(id)
  }, [phase, name, enrollUser])

  const skip = () => {
    enrollUser(name)
    completeOnboarding()
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-bg px-5 py-8">
      <div className="w-full max-w-[720px]">
        {/* Stepper. */}
        <ol className="mb-5 flex items-center gap-2" aria-label="Enrollment progress">
          {STEPS.map((label, index) => {
            const done = index < step
            const current = index === step
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={cx(
                    'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                    'transition-colors duration-200 ease-out',
                    done
                      ? 'bg-success text-[#04140a]'
                      : current
                        ? 'bg-primary text-white'
                        : 'border border-border bg-surface-2 text-text-muted',
                  )}
                >
                  {done ? <Check size={13} strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={cx(
                    'hidden truncate text-[12px] font-medium sm:block',
                    current ? 'text-text' : 'text-text-muted',
                  )}
                >
                  {label}
                </span>
                {index < STEPS.length - 1 ? (
                  <span
                    className={cx(
                      'h-px flex-1 transition-colors duration-200',
                      done ? 'bg-success/50' : 'bg-border',
                    )}
                  />
                ) : null}
              </li>
            )
          })}
        </ol>

        <Card padding="p-7">
          <AnimatePresence mode="wait">
            {/* ------------------------- 1 · Welcome ------------------------- */}
            {step === 0 ? (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <span
                  className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[16px]"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 19V5l12 14V5"
                      stroke="white"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h2 className="np-page-title">{PROJECT.name}</h2>
                <p className="mx-auto mt-2 max-w-[26rem] text-[15px] leading-relaxed text-text-muted">
                  {COPY.tagline}
                </p>

                <Button
                  variant="primary"
                  size="lg"
                  className="mt-6"
                  onClick={() => setStep(1)}
                >
                  Get started
                  <ArrowRight size={16} />
                </Button>

                <p className="mt-5 text-[12px] text-text-muted">{COPY.enrollmentNote}</p>

                <button
                  type="button"
                  onClick={skip}
                  className="mt-4 text-[12px] font-medium text-primary underline-offset-4 hover:underline"
                >
                  Skip — use demo identity
                </button>
              </motion.div>
            ) : null}

            {/* --------------------- 2 · Capture identity --------------------- */}
            {step === 1 ? (
              <motion.div
                key="capture"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6 text-center">
                  <h2 className="np-page-title">Capture your identity</h2>
                  <p className="mx-auto mt-1.5 max-w-[30rem] text-[13px] leading-relaxed text-text-muted">
                    This reference is what the consent gate checks against. {COPY.enrollmentNote}
                  </p>
                </div>

                <IdentityPreview
                  name={name}
                  scanning={phase === 'analyzing'}
                  enrolled={phase === 'enrolled'}
                />

                <div className="mx-auto mt-6 max-w-[24rem]">
                  <label htmlFor="np-name" className="np-label mb-1.5 block">
                    Your name
                  </label>
                  <input
                    id="np-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={phase !== 'ready'}
                    className={cx(
                      'h-10 w-full rounded-control border border-border bg-surface-2 px-3 text-[14px] text-text',
                      'transition-colors duration-200 ease-out placeholder:text-text-muted',
                      'hover:border-text-muted/60 disabled:opacity-60',
                    )}
                    placeholder="Zain Shahid"
                  />

                  <div className="mt-4 min-h-[74px]">
                    {phase === 'ready' ? (
                      <Button variant="primary" size="lg" block onClick={() => setPhase('analyzing')}>
                        <ScanFace size={16} />
                        Capture
                      </Button>
                    ) : null}

                    {phase === 'analyzing' ? (
                      <div>
                        <div className="mb-2 flex items-center justify-between text-[12px]">
                          <span className="inline-flex items-center gap-1.5 text-text">
                            <Loader2 size={13} className="animate-spin text-primary" />
                            Analyzing facial embedding…
                          </span>
                          <span className="font-mono tabular-nums text-text-muted">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <ProgressBar value={progress} label="Enrollment analysis" />
                        <p className="mt-2 text-[11px] text-text-muted">
                          Simulated in this build — the step is a timer, not a model.
                        </p>
                      </div>
                    ) : null}

                    {phase === 'enrolled' ? (
                      <div>
                        <div className="flex items-center gap-2 rounded-control border border-success/30 bg-success/[0.08] px-3.5 py-3">
                          <Check size={15} className="text-success" strokeWidth={3} />
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-success">
                              Identity enrolled
                            </p>
                            <p className="truncate text-[11px] text-text-muted">
                              {enrolledUser?.name} ·{' '}
                              <span className="font-mono">{enrolledUser?.embeddingId}</span>
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          size="lg"
                          block
                          className="mt-3"
                          onClick={() => setStep(2)}
                        >
                          Continue
                          <ArrowRight size={16} />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ) : null}

            {/* --------------------- 3 · Choose source clip -------------------- */}
            {step === 2 ? (
              <motion.div
                key="clip"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-5 text-center">
                  <h2 className="np-page-title">Choose a source clip</h2>
                  <p className="mx-auto mt-1.5 max-w-[32rem] text-[13px] leading-relaxed text-text-muted">
                    This is the presentable recording of you that gets animated. You can add your
                    own later from Source Clips.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {clips.map((clip) => {
                    const selected = clip.id === activeClipId
                    return (
                      <button
                        key={clip.id}
                        type="button"
                        onClick={() => setActiveClip(clip.id)}
                        aria-pressed={selected}
                        className={cx(
                          'group overflow-hidden rounded-control border text-left',
                          'transition-all duration-200 ease-out',
                          selected
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-border hover:border-text-muted/60',
                        )}
                      >
                        <span className="relative block aspect-video w-full overflow-hidden bg-black">
                          <ClipSurface clip={clip} animated={false} />
                          {selected ? (
                            <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          ) : null}
                        </span>
                        <span className="block px-2.5 py-2">
                          <span className="block truncate text-[12px] font-medium text-text">
                            {clip.name}
                          </span>
                          <span className="block text-[11px] text-text-muted">
                            {clip.duration} · {clip.resolution}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  block
                  className="mt-6"
                  onClick={completeOnboarding}
                >
                  <Sparkles size={16} />
                  Finish
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Card>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-text-muted">
          {COPY.prototypeDisclosure}
        </p>
      </div>
    </div>
  )
}

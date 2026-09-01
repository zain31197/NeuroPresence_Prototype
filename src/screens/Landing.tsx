import { Fragment, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Clapperboard,
  Cpu,
  Gauge,
  GraduationCap,
  Info,
  Layers,
  Menu,
  MonitorPlay,
  Moon,
  Radio,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Sun,
  Timer,
  Video,
  Wand2,
  X,
  Zap,
} from 'lucide-react'
import { COPY, HARDWARE, MEASURED, PROJECT, TARGETS, VIRTUAL_CAMERA_NAME } from '../mock/constants'
import { MEETING_APPS } from '../mock/seedData'
import { useEngine } from '../mock/engine'
import { Avatar } from '../components/Avatar'
import { LandingPreview } from '../components/LandingPreview'
import {
  AuroraBackdrop,
  CountUp,
  GrowBar,
  Reveal,
  RevealGroup,
  RevealItem,
  ScrollProgress,
  scrollToSection,
  TiltCard,
  useScrollSpy,
  WordReveal,
} from '../components/motion'
import { Button, cx } from '../components/ui'

/* ------------------------------------------------------------------ *
 * Landing page.
 *
 * The one screen that explains the whole project: what it does, how the
 * pipeline is meant to work, the safeguards, and — the part that matters
 * at a proposal defense — the measured proof-of-concept numbers next to
 * the engineering targets.
 * ------------------------------------------------------------------ */

const NAV_LINKS = [
  { id: 'how', label: 'How it works' },
  { id: 'modes', label: 'Two modes' },
  { id: 'safeguards', label: 'Safeguards' },
  { id: 'proof', label: 'Proof of concept' },
  { id: 'team', label: 'Team' },
]

const SECTION_IDS = NAV_LINKS.map((link) => link.id)

function Wordmark({ size = 34 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-[10px]"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, rgb(var(--primary-rgb)) 0%, rgb(var(--accent-rgb)) 100%)',
        }}
        aria-hidden
      >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
          <path
            d="M6 19V5l12 14V5"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[16px] font-semibold tracking-[-0.02em] text-text">NeuroPresence</span>
    </span>
  )
}

/* ------------------------------- nav ------------------------------- */

function LandingNav() {
  const { navigate, theme, setTheme, enrolledUser } = useEngine()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const active = useScrollSpy(SECTION_IDS)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const launch = () => navigate(enrolledUser ? 'console' : 'onboarding')

  return (
    <header
      className={cx(
        'sticky top-0 z-40 transition-all duration-300 ease-out',
        scrolled
          ? 'border-b border-border bg-surface/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-5 sm:px-8">
        <button type="button" onClick={() => navigate('landing')} aria-label="NeuroPresence home">
          <Wordmark />
        </button>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Sections">
          {NAV_LINKS.map((link) => {
            const isActive = active === link.id
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                aria-current={isActive ? 'true' : undefined}
                className={cx(
                  'relative rounded-control px-3 py-2 text-[13px] font-medium',
                  'transition-colors duration-200',
                  isActive ? 'text-text' : 'text-text-muted hover:text-text',
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="landing-nav-active"
                    className="absolute inset-0 rounded-control bg-surface-2"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <span className="relative">{link.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-text-muted transition-all duration-200 hover:text-text hover:shadow-hover"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <Button variant="primary" onClick={launch} className="hidden sm:inline-flex">
            Launch prototype
            <ArrowRight size={15} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </Button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-text-muted lg:hidden"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-surface px-5 py-3 lg:hidden">
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    scrollToSection(link.id)
                  }}
                  className="block w-full rounded-control px-3 py-2 text-left text-[14px] font-medium text-text-muted hover:bg-surface-2 hover:text-text"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
          <Button variant="primary" block className="mt-3" onClick={launch}>
            Launch prototype
            <ArrowRight size={15} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </Button>
        </div>
      ) : null}
    </header>
  )
}

/* ------------------------------- hero ------------------------------ */

function Hero() {
  const { navigate, enrolledUser } = useEngine()
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const launch = () => navigate(enrolledUser ? 'console' : 'onboarding')

  // The product shot drifts a little slower than the page as you scroll.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const previewY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -60])
  const previewScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 0.965])

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      <AuroraBackdrop />
      <div className="np-grid-bg pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />

      <div className="relative mx-auto max-w-content px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 12 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="np-eyebrow">
              <Sparkles size={13} className="text-accent" />
              FYP-1 proposal defense · {PROJECT.university}
            </span>
          </motion.div>

          <h1 className="mt-6 text-[36px] font-semibold leading-[1.12] tracking-[-0.03em] text-text sm:text-[52px]">
            <WordReveal text="Show up composed in every meeting" delay={0.12} />{' '}
            <motion.span
              initial={reduced ? undefined : { opacity: 0, y: 14 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.46, ease: [0.16, 1, 0.3, 1] }}
              className="np-gradient-text inline-block motion-safe:animate-gradient-pan"
            >
              using your own likeness
            </motion.span>
          </h1>

          <motion.p
            initial={reduced ? undefined : { opacity: 0, y: 18 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.56, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-text-muted sm:text-[17px]"
          >
            NeuroPresence records one presentable clip of you, then drives it with your live
            webcam motion in real time. Your meeting app reads the result as an ordinary
            camera — no plugin, no re-recording, no bad-hair-day compromise.
          </motion.p>

          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 18 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.66, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Button variant="primary" size="lg" onClick={launch}>
              Launch the prototype
              <ArrowRight size={16} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
            </Button>
            <Button size="lg" onClick={() => scrollToSection('proof')}>
              <Gauge size={16} />
              See the measured numbers
            </Button>
          </motion.div>

          <motion.p
            initial={reduced ? undefined : { opacity: 0 }}
            animate={reduced ? undefined : { opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.76 }}
            className="mt-5 text-[12px] text-text-muted"
          >
            Interactive interface demonstration · simulated telemetry · no pipeline in this build
          </motion.p>
        </div>

        <motion.div style={{ y: previewY, scale: previewScale }} className="relative">
          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 34, scale: 0.97 }}
            animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto mt-14 max-w-4xl sm:mt-16"
          >
            <LandingPreview />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/* --------------------------- stat strip ---------------------------- */

const HERO_STATS = [
  { value: MEASURED.latencyMeanMs, decimals: 1, suffix: ' ms', label: 'Measured baseline latency' },
  { value: TARGETS.frameComputeMs, decimals: 0, suffix: ' ms', label: 'Per-frame target' },
  { value: TARGETS.fps, decimals: 0, suffix: ' FPS', label: 'Throughput target' },
  { value: TARGETS.csim, decimals: 2, suffix: '', label: 'Identity similarity target' },
]

function StatStrip() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <RevealGroup className="grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
          {HERO_STATS.map((stat) => (
            <RevealItem key={stat.label} className="px-2 py-7 text-center sm:px-6">
              <p className="font-mono text-[26px] font-semibold leading-none tracking-[-0.02em] text-text sm:text-[30px]">
                <CountUp value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-[12px] leading-snug text-text-muted">{stat.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

/* ------------------------- section heading ------------------------- */

function SectionHeading({
  eyebrow,
  title,
  accent,
  body,
  icon,
}: {
  eyebrow: string
  title: string
  accent?: string
  body?: string
  icon?: React.ReactNode
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <span className="np-eyebrow">
        {icon}
        {eyebrow}
      </span>
      <h2 className="mt-5 text-[30px] font-semibold leading-tight tracking-[-0.025em] text-text sm:text-[38px]">
        {title}
        {accent ? <span className="np-gradient-text"> {accent}</span> : null}
      </h2>
      {body ? (
        <p className="mt-4 text-[15px] leading-relaxed text-text-muted sm:text-[16px]">{body}</p>
      ) : null}
    </Reveal>
  )
}

/* ------------------------------ problem ---------------------------- */

const PROBLEMS = [
  {
    icon: Camera,
    title: 'The camera catches you unready',
    body: 'Back-to-back calls, poor light, a room you would rather not show. Turning the camera off costs you presence in the conversation.',
  },
  {
    icon: Layers,
    title: 'Filters and backdrops miss the point',
    body: 'Blur and virtual backgrounds fix the room, not the framing, the lighting on your face, or how put-together you actually look.',
  },
  {
    icon: ShieldCheck,
    title: 'Synthetic video needs guardrails',
    body: 'Any tool that animates a face invites misuse. Consent and disclosure have to be built in from the first commit, not bolted on.',
  },
]

function Problem() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <SectionHeading
          eyebrow="The problem"
          icon={<Video size={13} className="text-primary" />}
          title="Being on camera is a"
          accent="presentation tax"
          body="Every meeting asks you to be camera-ready on demand. Most people pay that tax by turning the camera off."
        />

        <RevealGroup className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PROBLEMS.map(({ icon: Icon, title, body }) => (
            <RevealItem key={title}>
              <div className="h-full rounded-card border border-border bg-surface p-6 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-hover">
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-control border border-border bg-surface-2 text-primary">
                  <Icon size={18} />
                </span>
                <h3 className="text-[15px] font-semibold text-text">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-text-muted">{body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

/* ---------------------------- how it works -------------------------- */

const PIPELINE = [
  {
    icon: Video,
    step: '01',
    title: 'Enroll once',
    body: 'Record a short, well-lit source clip of yourself looking presentable. Enroll your identity so the consent gate has a reference.',
    tag: 'Source clip',
  },
  {
    icon: Wand2,
    step: '02',
    title: 'Drive it live',
    body: 'Your webcam supplies the driving signal — head pose, lip motion, expression. A reenactment model warps the source clip to follow it.',
    tag: 'Driving signal',
  },
  {
    icon: MonitorPlay,
    step: '03',
    title: 'Stream as a camera',
    body: `The result is written to a virtual camera. Pick "${VIRTUAL_CAMERA_NAME}" in Zoom, Meet or Teams — they see an ordinary webcam.`,
    tag: 'Virtual camera',
  },
]

function Connector({ delay }: { delay: number }) {
  const reduced = useReducedMotion()
  return (
    <div className="hidden items-center justify-center md:flex" aria-hidden>
      <svg width="52" height="16" viewBox="0 0 52 16" fill="none">
        <motion.path
          d="M2 8 H42"
          stroke="rgb(var(--border-rgb))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 6"
          className={reduced ? undefined : 'motion-safe:animate-dash-flow'}
          initial={reduced ? undefined : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay }}
        />
        <path d="M40 3 L47 8 L40 13" stroke="rgb(var(--border-rgb))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  )
}

function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-20 border-y border-border bg-surface-2/40 py-20 sm:py-28">
      <div className="np-grid-bg pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black,transparent)]" />
      <div className="relative mx-auto max-w-content px-5 sm:px-8">
        <SectionHeading
          eyebrow="How it works"
          icon={<Zap size={13} className="text-accent" />}
          title="One clip of you,"
          accent="driven in real time"
          body="Identity-preserving neural face reenactment, wrapped in a tool that behaves like a webcam."
        />

        <div className="mt-14 grid grid-cols-1 items-stretch gap-5 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {PIPELINE.map(({ icon: Icon, step, title, body, tag }, index) => (
            <Fragment key={step}>
              <Reveal delay={index * 0.12} className="h-full">
                <div className="flex h-full flex-col rounded-card border border-border bg-surface p-6 shadow-card">
                  <div className="mb-5 flex items-center justify-between">
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center rounded-control text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, rgb(var(--primary-rgb)) 0%, rgb(var(--accent-rgb)) 100%)',
                      }}
                    >
                      <Icon size={19} />
                    </span>
                    <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-text-muted">
                      {step}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-semibold text-text">{title}</h3>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-text-muted">{body}</p>
                  <span className="mt-4 inline-flex w-fit items-center rounded-chip border border-primary/25 bg-primary/[0.07] px-2 py-1 text-[11px] font-medium text-primary">
                    {tag}
                  </span>
                </div>
              </Reveal>
              {index < PIPELINE.length - 1 ? (
                <Connector delay={0.2 + index * 0.12} />
              ) : null}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------- modes ------------------------------ */

const MODES = [
  {
    icon: Radio,
    name: 'Real-time',
    tagline: 'For live meetings',
    accent: 'primary' as const,
    points: [
      'Driven by your live webcam',
      'Latency-bounded — ≤ 42 ms per frame target',
      'Streams continuously to the virtual camera',
      'Consent gate and disclosure run inline',
    ],
  },
  {
    icon: Clapperboard,
    name: 'Offline',
    tagline: 'For async recording',
    accent: 'accent' as const,
    points: [
      'Driven by a recording you upload',
      'No latency limit — up to 1024 × 1024 output',
      'Temporal smoothing for steadier motion',
      'Doubles as the quality reference for real-time',
    ],
  },
]

function Modes() {
  return (
    <section id="modes" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <SectionHeading
          eyebrow="Two modes"
          icon={<Layers size={13} className="text-primary" />}
          title="The same feature set,"
          accent="live or offline"
          body="Real-time is the primary mode. Offline removes the time constraint and produces the higher-fidelity result we measure against."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {MODES.map(({ icon: Icon, name, tagline, accent, points }, index) => (
            <Reveal key={name} delay={index * 0.1}>
              <TiltCard className="h-full" intensity={4}>
                <div
                  className={cx(
                    'flex h-full flex-col rounded-card border bg-surface p-7 shadow-card',
                    accent === 'primary' ? 'border-primary/25' : 'border-accent/25',
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={cx(
                        'inline-flex h-12 w-12 items-center justify-center rounded-control',
                        accent === 'primary'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent/10 text-accent',
                      )}
                    >
                      <Icon size={21} />
                    </span>
                    <div>
                      <h3 className="text-[18px] font-semibold text-text">{name}</h3>
                      <p className="text-[13px] text-text-muted">{tagline}</p>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <BadgeCheck
                          size={15}
                          className={cx(
                            'mt-0.5 shrink-0',
                            accent === 'primary' ? 'text-primary' : 'text-accent',
                          )}
                        />
                        <span className="text-[13px] leading-relaxed text-text">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------- safeguards ---------------------------- */

function Safeguards() {
  return (
    <section
      id="safeguards"
      className="scroll-mt-20 border-y border-border bg-surface-2/40 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <SectionHeading
          eyebrow="Built-in safeguards"
          icon={<ShieldCheck size={13} className="text-success" />}
          title="Consented self-reenactment,"
          accent="and it says so"
          body="This tool animates one face: yours. That constraint is a feature of the product, not a setting we hope people leave alone."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-card border border-success/25 bg-surface p-7 shadow-card">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-control bg-success/10 text-success">
                <ScanFace size={19} />
              </span>
              <h3 className="mt-5 text-[17px] font-semibold text-text">Consent gate</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
                Animation is permitted only for the likeness you enrolled. A non-matching face is
                blocked before a single frame is produced, and the session stops.
              </p>
              <div className="mt-5 space-y-2.5">
                <GateRow tone="success" label="Verified" body={COPY.consentVerified} />
                <GateRow tone="danger" label="Blocked" body={COPY.consentBlocked} />
              </div>
              <p className="mt-5 text-[12px] text-text-muted">
                Target true-accept rate for the enrolled user:{' '}
                <span className="font-mono text-text">≥ {TARGETS.consentTrueAcceptPct}%</span>
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-card border border-accent/25 bg-surface p-7 shadow-card">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-control bg-accent/10 text-accent">
                <BadgeCheck size={19} />
              </span>
              <h3 className="mt-5 text-[17px] font-semibold text-text">Disclosure watermark</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
                An optional, unobtrusive overlay tells the other participants that the feed is
                reenacted. Recommended on, and visible in whatever the meeting app receives.
              </p>

              <div className="mt-5 overflow-hidden rounded-control border border-border bg-[#0B0F14]">
                <div className="relative aspect-[16/7]">
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(120% 100% at 30% 20%, #1e2b45 0%, #0d141c 70%)',
                    }}
                  />
                  <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-chip border border-white/15 bg-black/60 px-2.5 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                    <ShieldCheck size={12} className="text-accent" />
                    {COPY.watermark}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-[12px] leading-relaxed text-text-muted">
                We never describe this product as a deepfake tool. It is consented
                self-reenactment, and the disclosure is how we keep that claim honest.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function GateRow({
  tone,
  label,
  body,
}: {
  tone: 'success' | 'danger'
  label: string
  body: string
}) {
  return (
    <div
      className={cx(
        'flex items-start gap-2.5 rounded-control border px-3 py-2.5',
        tone === 'success'
          ? 'border-success/25 bg-success/[0.07]'
          : 'border-danger/25 bg-danger/[0.07]',
      )}
    >
      <span
        className={cx(
          'mt-0.5 inline-flex shrink-0 items-center rounded-chip px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em]',
          tone === 'success' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
        )}
      >
        {label}
      </span>
      <span className="text-[12px] leading-relaxed text-text">{body}</span>
    </div>
  )
}

/* --------------------------- proof of concept ----------------------- */

const MEASUREMENTS = [
  { label: 'Mean per-frame latency', value: `${MEASURED.latencyMeanMs} ms` },
  { label: 'p95 latency', value: `${MEASURED.latencyP95Ms} ms` },
  { label: 'p99 latency', value: `${MEASURED.latencyP99Ms} ms` },
  { label: 'Throughput', value: `${MEASURED.fps} FPS` },
  { label: 'Peak VRAM (inference)', value: `${MEASURED.peakVramGb} GB` },
  { label: 'Fine-tune fit check', value: `${MEASURED.fineTuneFitGb} GB peak` },
]

const TARGET_ROWS = [
  { label: 'Per-frame reenactment compute', value: `≤ ${TARGETS.frameComputeMs} ms`, icon: Timer },
  { label: 'Throughput', value: `≥ ${TARGETS.fps} FPS`, icon: Gauge },
  { label: 'End-to-end latency', value: `≤ ${TARGETS.endToEndLatencyMs} ms`, icon: Zap },
  { label: 'Peak GPU memory', value: `≤ ${TARGETS.peakVramGb} GB`, icon: Cpu },
  { label: 'Identity preservation (CSIM)', value: `≥ ${TARGETS.csim.toFixed(2)}`, icon: ScanFace },
  { label: 'Endurance', value: `≥ ${TARGETS.enduranceMin} min, no OOM`, icon: ShieldCheck },
]

function Proof() {
  const latencyScale = 145
  const fpsScale = 27

  return (
    <section id="proof" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <SectionHeading
          eyebrow="Proof of concept"
          icon={<Gauge size={13} className="text-warning" />}
          title="We already ran it."
          accent="Here is the gap we close"
          body={`Unoptimized baseline with actual LivePortrait weights on ${HARDWARE.gpu}. These are measured numbers, not estimates.`}
        />

        {/* The headline comparison. */}
        <Reveal className="mt-14">
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <div className="border-b border-border bg-surface-2/50 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-text">
                  Measured baseline vs. engineering target
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-chip border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-text-muted">
                  <Cpu size={12} />
                  {HARDWARE.gpu} · {HARDWARE.vram}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              {/* Latency */}
              <div className="p-6 sm:p-8">
                <p className="np-label">Per-frame latency — lower is better</p>
                <div className="mt-6 space-y-6">
                  <BarRow
                    label="Measured baseline"
                    value={MEASURED.latencyMeanMs}
                    decimals={1}
                    unit="ms"
                    percent={(MEASURED.latencyMeanMs / latencyScale) * 100}
                    tone="rgb(var(--warning-rgb))"
                    toneText="text-warning"
                  />
                  <BarRow
                    label="Engineering target"
                    value={TARGETS.frameComputeMs}
                    decimals={0}
                    unit="ms"
                    percent={(TARGETS.frameComputeMs / latencyScale) * 100}
                    tone="rgb(var(--success-rgb))"
                    toneText="text-success"
                    delay={0.18}
                  />
                </div>
                <p className="mt-6 rounded-control border border-border bg-surface-2/60 px-3.5 py-3 text-[12px] leading-relaxed text-text-muted">
                  A{' '}
                  <span className="font-mono font-semibold text-text">
                    <CountUp
                      value={
                        Math.round(
                          (1 - TARGETS.frameComputeMs / MEASURED.latencyMeanMs) * 1000,
                        ) / 10
                      }
                      decimals={1}
                      suffix="%"
                    />
                  </span>{' '}
                  reduction in per-frame compute. That optimisation work — quantisation, kernel
                  fusion, resolution scheduling — is the engineering this project delivers.
                </p>
              </div>

              {/* Throughput */}
              <div className="p-6 sm:p-8">
                <p className="np-label">Throughput — higher is better</p>
                <div className="mt-6 space-y-6">
                  <BarRow
                    label="Measured baseline"
                    value={MEASURED.fps}
                    decimals={1}
                    unit="FPS"
                    percent={(MEASURED.fps / fpsScale) * 100}
                    tone="rgb(var(--warning-rgb))"
                    toneText="text-warning"
                    delay={0.1}
                  />
                  <BarRow
                    label="Engineering target"
                    value={TARGETS.fps}
                    decimals={0}
                    unit="FPS"
                    percent={(TARGETS.fps / fpsScale) * 100}
                    tone="rgb(var(--success-rgb))"
                    toneText="text-success"
                    delay={0.28}
                  />
                </div>
                <p className="mt-6 rounded-control border border-border bg-surface-2/60 px-3.5 py-3 text-[12px] leading-relaxed text-text-muted">
                  Peak inference VRAM measured at{' '}
                  <span className="font-mono font-semibold text-text">
                    {MEASURED.peakVramGb} GB
                  </span>{' '}
                  — comfortably inside the {TARGETS.peakVramGb} GB budget, which is what makes the
                  latency work worth doing on this hardware.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Full tables. */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-card border border-border bg-surface p-6 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-control bg-warning/10 text-warning">
                  <Gauge size={15} />
                </span>
                <div>
                  <h3 className="text-[14px] font-semibold text-text">Measured proof-of-concept</h3>
                  <p className="text-[11px] text-text-muted">
                    Unoptimized baseline · {HARDWARE.os}
                  </p>
                </div>
              </div>
              <dl className="divide-y divide-border">
                {MEASUREMENTS.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-[13px] text-text-muted">{row.label}</dt>
                    <dd className="font-mono text-[13px] font-medium tabular-nums text-text">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
                Fine-tune fit check: 2 of 5 modules, FP32, batch 1.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-card border border-border bg-surface p-6 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-control bg-success/10 text-success">
                  <Sparkles size={15} />
                </span>
                <div>
                  <h3 className="text-[14px] font-semibold text-text">Engineering targets</h3>
                  <p className="text-[11px] text-text-muted">The finished-product operating point</p>
                </div>
              </div>
              <dl className="divide-y divide-border">
                {TARGET_ROWS.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="flex items-center gap-2 text-[13px] text-text-muted">
                      <Icon size={13} className="shrink-0 opacity-70" />
                      {label}
                    </dt>
                    <dd className="whitespace-nowrap font-mono text-[13px] font-medium tabular-nums text-text">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-6 flex items-start gap-3 rounded-card border border-accent/25 bg-accent/[0.06] px-5 py-4">
            <Info size={16} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-[13px] leading-relaxed text-text">
              <span className="font-semibold">Where honesty sits in this build.</span> The numbers
              above are measured. The telemetry inside the prototype is{' '}
              <span className="font-semibold">simulated</span> and permanently labelled as such —
              the interface is real, the reenactment pipeline is not implemented here.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function BarRow({
  label,
  value,
  decimals,
  unit,
  percent,
  tone,
  toneText,
  delay = 0,
}: {
  label: string
  value: number
  decimals: number
  unit: string
  percent: number
  tone: string
  toneText: string
  delay?: number
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-text">{label}</span>
        <span className={cx('font-mono text-[22px] font-semibold tabular-nums', toneText)}>
          <CountUp value={value} decimals={decimals} />
          <span className="ml-1 text-[12px] font-medium text-text-muted">{unit}</span>
        </span>
      </div>
      <GrowBar percent={percent} tone={tone} delay={delay} height={10} />
    </div>
  )
}

/* ---------------------------- capabilities -------------------------- */

const CAPABILITIES = [
  { fr: 'FR-1', icon: Camera, title: 'Live capture', body: 'Webcam input supplies head pose, lip motion and expression as the driving signal.' },
  { fr: 'FR-2', icon: Wand2, title: 'Clip reenactment', body: 'The selected source clip is animated to follow that motion, frame by frame.' },
  { fr: 'FR-3', icon: ScanFace, title: 'Likeness verification', body: 'The consent gate checks the face against your enrolled identity before animating.' },
  { fr: 'FR-4', icon: MonitorPlay, title: 'Virtual camera output', body: `Any meeting app can select "${VIRTUAL_CAMERA_NAME}" as an ordinary webcam.` },
  { fr: 'FR-5', icon: BadgeCheck, title: 'Disclosure watermark', body: 'An optional overlay marks the feed as synthetic for the other participants.' },
  { fr: 'FR-6', icon: ShieldCheck, title: 'Identity preservation', body: 'CSIM is tracked through the session so you keep looking like yourself.' },
  { fr: 'FR-7', icon: Gauge, title: 'Live telemetry', body: 'Latency, throughput and GPU memory are reported continuously while running.' },
  { fr: 'FR-8', icon: Clapperboard, title: 'Offline studio', body: 'The same feature set driven by an uploaded recording, at higher fidelity.' },
]

function Capabilities() {
  return (
    <section className="border-y border-border bg-surface-2/40 py-20 sm:py-28">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <SectionHeading
          eyebrow="Capabilities"
          icon={<Layers size={13} className="text-primary" />}
          title="Eight requirements,"
          accent="all on screen"
          body="Every functional requirement in the proposal maps to something you can click in the prototype."
        />

        <RevealGroup className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.06}>
          {CAPABILITIES.map(({ fr, icon: Icon, title, body }) => (
            <RevealItem key={fr}>
              <div className="group h-full rounded-card border border-border bg-surface p-5 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/35 hover:shadow-hover">
                <div className="mb-3.5 flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-control bg-surface-2 text-text-muted transition-colors duration-300 group-hover:bg-primary/10 group-hover:text-primary">
                    <Icon size={16} />
                  </span>
                  <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-text-muted">
                    {fr}
                  </span>
                </div>
                <h3 className="text-[14px] font-semibold text-text">{title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-text-muted">{body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

/* ---------------------------- integration --------------------------- */

function Integration() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="np-eyebrow">
              <MonitorPlay size={13} className="text-primary" />
              Integration
            </span>
            <h2 className="mt-5 text-[30px] font-semibold leading-tight tracking-[-0.025em] text-text sm:text-[36px]">
              No plugin.{' '}
              <span className="np-gradient-text">Just pick the camera.</span>
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-text-muted">
              {COPY.virtualCameraHelp} Because we present as a standard camera device, integration
              is app-agnostic — nothing to install inside the meeting client, and nothing to
              maintain per app.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                'Start a session in NeuroPresence.',
                'Open your meeting app.',
                `Pick "${VIRTUAL_CAMERA_NAME}" as your camera.`,
              ].map((step, index) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-[12px] font-semibold text-text-muted">
                    {index + 1}
                  </span>
                  <span className="text-[14px] text-text">{step}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 rounded-control border border-warning/25 bg-warning/[0.07] px-3.5 py-3 text-[12px] leading-relaxed text-text">
              {COPY.limitationNote}
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="rounded-card border border-border bg-surface p-8 shadow-card">
              <p className="np-label mb-5 text-center">Reads NeuroPresence as an ordinary webcam</p>
              <div className="grid grid-cols-1 gap-3">
                {MEETING_APPS.map((app, index) => (
                  <motion.div
                    key={app.name}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3.5 rounded-control border border-border bg-surface-2/50 px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-hover"
                  >
                    <span
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-[13px] font-bold text-white"
                      style={{ backgroundColor: app.tint }}
                      aria-hidden
                    >
                      {app.mark}
                    </span>
                    <span className="flex-1 text-[14px] font-medium text-text">{app.name}</span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      Supported
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 rounded-control border border-border bg-surface-2/50 px-4 py-3">
                <p className="text-[12px] leading-relaxed text-text-muted">
                  If the pipeline fails or exceeds its latency budget, output falls back to a
                  pass-through camera — the meeting keeps running.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------- team ------------------------------ */

function Team() {
  return (
    <section id="team" className="scroll-mt-20 border-y border-border bg-surface-2/40 py-20 sm:py-28">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <SectionHeading
          eyebrow="The project"
          icon={<GraduationCap size={13} className="text-accent" />}
          title="A final-year research project at"
          accent={PROJECT.university}
        />

        <RevealGroup className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PROJECT.team.map((member) => (
            <RevealItem key={member.roll}>
              <div className="flex h-full flex-col items-center rounded-card border border-border bg-surface p-7 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-hover">
                <Avatar name={member.name} size={58} />
                <p className="mt-4 text-[15px] font-semibold text-text">{member.name}</p>
                <p className="mt-1 font-mono text-[12px] text-text-muted">{member.roll}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-3 rounded-card border border-border bg-surface px-6 py-4 shadow-card">
            <GraduationCap size={17} className="shrink-0 text-text-muted" />
            <p className="text-[13px] text-text">
              Supervised by{' '}
              <span className="font-semibold">{PROJECT.supervisor}</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* -------------------------------- CTA ------------------------------- */

function FinalCta() {
  const { navigate, enrolledUser } = useEngine()

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <AuroraBackdrop />
      <div className="relative mx-auto max-w-content px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl2 border border-border bg-surface px-6 py-14 text-center shadow-raised sm:px-14">
            <div className="np-grid-bg pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_70%_at_50%_50%,black,transparent)]" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-[30px] font-semibold leading-tight tracking-[-0.025em] text-text sm:text-[38px]">
                Walk through the whole product,{' '}
                <span className="np-gradient-text">screen by screen</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-text-muted">
                Enroll an identity, start a live session, watch the telemetry, flip between the
                measured baseline and the target, trip the consent gate, and render offline.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(enrolledUser ? 'console' : 'onboarding')}
                >
                  Launch the prototype
                  <ArrowRight size={16} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                </Button>
                <Button size="lg" onClick={() => navigate('console')}>
                  Skip to the Console
                </Button>
              </div>
              <p className="mt-6 text-[12px] text-text-muted">{COPY.prototypeDisclosure}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------- footer ----------------------------- */

function Footer() {
  const { navigate } = useEngine()

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-content px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Wordmark size={30} />
            <p className="mt-3 text-[13px] leading-relaxed text-text-muted">{PROJECT.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-2 sm:gap-x-16">
            <div>
              <p className="np-label mb-3">Explore</p>
              <ul className="space-y-2">
                {NAV_LINKS.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(link.id)}
                      className="text-[13px] text-text-muted transition-colors hover:text-text"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="np-label mb-3">Prototype</p>
              <ul className="space-y-2">
                {(
                  [
                    ['console', 'Console'],
                    ['clips', 'Source Clips'],
                    ['offline', 'Offline Studio'],
                    ['devices', 'Devices & Output'],
                    ['settings', 'Settings'],
                  ] as const
                ).map(([screen, label]) => (
                  <li key={screen}>
                    <button
                      type="button"
                      onClick={() => navigate(screen)}
                      className="text-[13px] text-text-muted transition-colors hover:text-text"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="np-rule my-8" />

        <div className="flex flex-col gap-3 text-[12px] text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            {PROJECT.university} · Supervised by {PROJECT.supervisor}
          </p>
          <p className="max-w-xl sm:text-right">{COPY.prototypeDisclosure}</p>
        </div>
      </div>
    </footer>
  )
}

/* ------------------------------- screen ----------------------------- */

export function Landing() {
  return (
    <div className="min-h-full bg-bg">
      <ScrollProgress />
      <LandingNav />
      <main>
        <Hero />
        <StatStrip />
        <Problem />
        <HowItWorks />
        <Modes />
        <Safeguards />
        <Proof />
        <Capabilities />
        <Integration />
        <Team />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

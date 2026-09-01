import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion'
import { cx } from './ui'

/* ------------------------------------------------------------------ *
 * Shared motion primitives.
 *
 * Everything here degrades to a plain, instant render when the reader
 * has asked for reduced motion.
 * ------------------------------------------------------------------ */

const EASE = [0.16, 1, 0.3, 1] as const

/** Reveals its children once, when they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'span'
}) {
  const reduced = useReducedMotion()
  const Component = motion[as]

  return (
    <Component
      className={className}
      initial={reduced ? undefined : { opacity: 0, y }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.62, delay, ease: EASE }}
    >
      {children}
    </Component>
  )
}

/** Parent that staggers its <RevealItem> children into view. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  delay?: number
}) {
  const reduced = useReducedMotion()
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : stagger, delayChildren: delay } },
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-70px' }}
    >
      {children}
    </motion.div>
  )
}

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div className={className} variants={reduced ? undefined : revealItem}>
      {children}
    </motion.div>
  )
}

/** Counts up to `value` the first time it scrolls into view. */
export function CountUp({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  duration = 1.5,
  className,
}: {
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced ? value : 0)

  useEffect(() => {
    if (!inView || reduced) {
      if (reduced) setShown(value)
      return
    }
    let raf = 0
    const started = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / (duration * 1000))
      // easeOutExpo, so it lands softly rather than stopping dead
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setShown(value * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration, reduced])

  return (
    <span ref={ref} className={cx('tabular-nums', className)}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  )
}

/** Card that lifts and tilts very slightly toward the pointer. */
export function TiltCard({
  children,
  className,
  intensity = 6,
}: {
  children: ReactNode
  className?: string
  intensity?: number
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 200,
    damping: 22,
  })
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 200,
    damping: 22,
  })

  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200 }}
      onPointerMove={(event) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        px.set((event.clientX - rect.left) / rect.width - 0.5)
        py.set((event.clientY - rect.top) / rect.height - 0.5)
      }}
      onPointerLeave={() => {
        px.set(0)
        py.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

/** Soft, slowly drifting colour blooms behind the hero. */
export function AuroraBackdrop({ className }: { className?: string }) {
  return (
    <div className={cx('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div
        className="absolute -left-[18%] -top-[30%] h-[560px] w-[560px] rounded-full blur-[110px] motion-safe:animate-float-slow"
        style={{ background: 'var(--glow-a)' }}
      />
      <div
        className="absolute -right-[12%] top-[-10%] h-[480px] w-[480px] rounded-full blur-[110px] motion-safe:animate-float-slow"
        style={{ background: 'var(--glow-b)', animationDelay: '-6s' }}
      />
      <div
        className="absolute bottom-[-30%] left-[35%] h-[420px] w-[420px] rounded-full blur-[120px] motion-safe:animate-float-slow"
        style={{ background: 'var(--glow-a)', animationDelay: '-3s' }}
      />
    </div>
  )
}

/** Grows from 0 to `percent` of its track when scrolled into view. */
export function GrowBar({
  percent,
  tone,
  delay = 0,
  height = 12,
}: {
  percent: number
  tone: string
  delay?: number
  height?: number
}) {
  const reduced = useReducedMotion()
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-surface-2"
      style={{ height }}
      aria-hidden
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: tone }}
        initial={reduced ? { width: `${percent}%` } : { width: 0 }}
        whileInView={{ width: `${percent}%` }}
        viewport={{ once: true, margin: '-70px' }}
        transition={{ duration: reduced ? 0 : 1.15, delay, ease: EASE }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Mount-time stagger — for panels that are already in view when a
 * screen opens, where a scroll trigger would never fire.
 * ------------------------------------------------------------------ */

export function MountStagger({
  children,
  className,
  stagger = 0.07,
  delay = 0.04,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  delay?: number
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduced ? 0 : stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function MountItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={
        reduced
          ? undefined
          : {
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
            }
      }
    >
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ *
 * Headline + scroll feedback
 * ------------------------------------------------------------------ */

/**
 * Reveals a line of text word by word, each rising out of its own
 * clipping box. Collapses to plain text under reduced motion.
 */
export function WordReveal({
  text,
  className,
  delay = 0,
  stagger = 0.05,
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
}) {
  const reduced = useReducedMotion()
  if (reduced) return <span className={className}>{text}</span>

  const words = text.split(' ').filter(Boolean)

  return (
    <span className={className}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="inline-block overflow-hidden pb-[0.08em] align-bottom"
        >
          <motion.span
            className="inline-block"
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.85, delay: delay + index * stagger, ease: EASE }}
          >
            {word}
            {index < words.length - 1 ? ' ' : null}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/** Thin reading-progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 })

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left"
      style={{
        scaleX,
        background:
          'linear-gradient(90deg, rgb(var(--primary-rgb)) 0%, rgb(var(--accent-rgb)) 100%)',
      }}
    />
  )
}

/**
 * Tracks which section is currently in view, for the landing-page nav.
 * Returns the id of the section nearest the top of the viewport.
 */
export function useScrollSpy(ids: string[], offset = 140) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => {
      let current: string | null = null
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top - offset <= 0) current = id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids, offset])

  return active
}

/** Smooth-scrolls to a section without writing an anchor into the URL. */
export function scrollToSection(id: string, offset = 76) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
}

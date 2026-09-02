import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Presentation,
  X,
} from 'lucide-react'
import { useEngine } from '../mock/engine'
import { TOUR_CHAPTERS, TOUR_STEPS } from '../mock/tour'
import { Button, cx } from './ui'

/* ------------------------------------------------------------------ *
 * Guided demo overlay.
 *
 * A dimming layer with a hole cut over whatever the current step is
 * talking about, plus a presenter dock carrying the line to say. The
 * overlay is click-through everywhere except the dock, so the presenter
 * can still drive the app by hand at any point without leaving the tour.
 * ------------------------------------------------------------------ */

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 10

/**
 * Tracks the element a step points at.
 *
 * One rAF loop measures the target and eases the reported rect toward it,
 * so the mask hole and the ring read from a single source of truth and stay
 * locked together. Framer Motion is deliberately not used here: it drives
 * SVG geometry through style rather than attributes, which leaves the mask
 * rect at zero width and the hole never opens.
 */
function useSpotlight(target: string | undefined, stepIndex: number): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null)
  const currentRef = useRef<Rect | null>(null)

  useLayoutEffect(() => {
    if (!target) {
      currentRef.current = null
      setRect(null)
      return
    }

    document
      .querySelector<HTMLElement>(`[data-tour="${target}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })

    let raf = 0
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const loop = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        const goal: Rect = {
          top: r.top - PAD,
          left: r.left - PAD,
          width: r.width + PAD * 2,
          height: r.height + PAD * 2,
        }
        const from = currentRef.current
        // Jump on the first frame of a step; glide for everything after.
        const next =
          from === null || reduced
            ? goal
            : {
                top: from.top + (goal.top - from.top) * 0.22,
                left: from.left + (goal.left - from.left) * 0.22,
                width: from.width + (goal.width - from.width) * 0.22,
                height: from.height + (goal.height - from.height) * 0.22,
              }
        currentRef.current = next
        setRect(next)
      }
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [target, stepIndex])

  return rect
}

/** Thin bar that drains over the current step's dwell time. */
function StepTimer({ ms, playing, stepKey }: { ms: number; playing: boolean; stepKey: string }) {
  return (
    <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div
        key={stepKey + String(playing)}
        className="h-full rounded-full bg-primary"
        initial={{ width: playing ? '0%' : '100%' }}
        animate={{ width: '100%' }}
        transition={playing ? { duration: ms / 1000, ease: 'linear' } : { duration: 0 }}
      />
    </div>
  )
}

export function GuidedTour() {
  const {
    tourActive,
    tourIndex,
    tourPlaying,
    endTour,
    tourNext,
    tourPrev,
    tourGoTo,
    setTourPlaying,
  } = useEngine()

  const step = TOUR_STEPS[tourIndex]
  const rect = useSpotlight(tourActive ? step?.target : undefined, tourIndex)
  const last = tourIndex === TOUR_STEPS.length - 1

  // Presenter keys: arrows step, space plays/pauses, Escape leaves.
  useEffect(() => {
    if (!tourActive) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); endTour() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setTourPlaying(false); tourNext() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setTourPlaying(false); tourPrev() }
      else if (e.key === ' ') { e.preventDefault(); setTourPlaying(!tourPlaying) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [tourActive, tourPlaying, endTour, tourNext, tourPrev, setTourPlaying])

  if (!tourActive || !step) return null

  const chapterIndex = TOUR_CHAPTERS.indexOf(step.chapter)

  /*
   * A short subject sitting low would be hidden behind the dock, so the dock
   * moves out of its way. A tall subject is left alone — it reaches the upper
   * half regardless, and moving the dock would only cover its head instead.
   */
  const vh = typeof window === 'undefined' ? 0 : window.innerHeight
  const dockAtTop =
    rect !== null &&
    vh > 0 &&
    rect.height < vh * 0.55 &&
    rect.top + rect.height > vh - 300

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {/* Dimming layer with a hole over the subject. */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <mask id="np-tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect ? (
              <rect
                x={rect.left}
                y={rect.top}
                width={Math.max(0, rect.width)}
                height={Math.max(0, rect.height)}
                rx="16"
                fill="black"
              />
            ) : null}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgb(3 6 10 / 0.68)"
          mask="url(#np-tour-mask)"
        />
      </svg>

      {/* Ring around the subject. */}
      {rect ? (
        <div
          className="absolute rounded-[16px] ring-2 ring-primary/70"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: '0 0 0 1px rgb(59 130 246 / .25), 0 0 40px rgb(59 130 246 / .30)',
          }}
        >
          <span className="absolute inset-0 rounded-[16px] ring-1 ring-inset ring-white/10" />
        </div>
      ) : null}

      {/* Presenter dock — flips to the top when it would sit over the subject. */}
      <div
        className={cx(
          'absolute inset-x-0 flex justify-center p-4 transition-[top,bottom] duration-300 sm:p-6',
          dockAtTop ? 'top-0' : 'bottom-0',
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={cx(
            'pointer-events-auto w-full max-w-[720px] overflow-hidden rounded-card',
            'border border-white/12 bg-[#0d1219]/95 text-white shadow-hero backdrop-blur-xl',
          )}
          role="region"
          aria-label="Guided demo"
        >
          {/* Chapter rail. */}
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-chip bg-primary/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
              <Presentation size={11} />
              Guided demo
            </span>
            <div className="flex flex-1 items-center gap-1.5">
              {TOUR_CHAPTERS.map((chapter, i) => (
                <span key={chapter} className="flex flex-1 items-center gap-1.5">
                  <span
                    className={cx(
                      'h-1 flex-1 rounded-full transition-colors duration-300',
                      i < chapterIndex
                        ? 'bg-primary/70'
                        : i === chapterIndex
                          ? 'bg-primary'
                          : 'bg-white/12',
                    )}
                  />
                </span>
              ))}
            </div>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-white/45">
              {tourIndex + 1}/{TOUR_STEPS.length}
            </span>
          </div>

          {/* Narration. */}
          <div className="px-5 pb-4 pt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/80">
                  {step.chapter} · {step.title}
                </p>
                <p className="mt-2 text-[15px] font-medium leading-snug text-white">
                  “{step.say}”
                </p>
                {step.note ? (
                  <p className="mt-2 text-[12px] leading-relaxed text-white/55">{step.note}</p>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-5">
            <StepTimer ms={step.hold} playing={tourPlaying && !last} stepKey={step.id} />
          </div>

          {/* Transport. */}
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { setTourPlaying(false); tourPrev() }}
                disabled={tourIndex === 0}
                aria-label="Previous step"
                className="inline-flex h-8 w-8 items-center justify-center rounded-control text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setTourPlaying(!tourPlaying)}
                aria-label={tourPlaying ? 'Pause the guided demo' : 'Play the guided demo'}
                className="inline-flex h-8 items-center gap-1.5 rounded-control bg-white/10 px-3 text-[12px] font-medium text-white transition-colors hover:bg-white/16"
              >
                {tourPlaying ? <Pause size={13} /> : <Play size={13} />}
                {tourPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                onClick={() => { setTourPlaying(false); tourNext() }}
                disabled={last}
                aria-label="Next step"
                className="inline-flex h-8 w-8 items-center justify-center rounded-control text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight size={16} />
              </button>

              {/* Step dots — jump anywhere. */}
              <div className="ml-2 hidden items-center gap-1 sm:flex">
                {TOUR_STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setTourPlaying(false); tourGoTo(i) }}
                    aria-label={`Go to step ${i + 1}: ${s.title}`}
                    aria-current={i === tourIndex ? 'step' : undefined}
                    className={cx(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === tourIndex ? 'w-5 bg-primary' : 'w-1.5 bg-white/25 hover:bg-white/50',
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-[10px] text-white/35 lg:inline">
                ← → step · space play · esc exit
              </span>
              {last ? (
                <Button size="sm" variant="primary" onClick={endTour}>
                  Finish
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={endTour}
                  className="inline-flex h-8 items-center gap-1.5 rounded-control px-2.5 text-[12px] font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X size={13} />
                  Exit
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>,
    document.body,
  )
}

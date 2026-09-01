import { useEffect, useRef, useState } from 'react'

/**
 * Eases a displayed number toward its latest value so metric tiles tick
 * smoothly instead of jumping. Snaps immediately when the reader has asked
 * for reduced motion, or when the value is null.
 */
export function useAnimatedNumber(target: number | null, stiffness = 0.16): number | null {
  const [display, setDisplay] = useState<number | null>(target)
  const displayRef = useRef<number | null>(target)
  const rafRef = useRef(0)

  useEffect(() => {
    if (target === null) {
      displayRef.current = null
      setDisplay(null)
      return
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const current = displayRef.current
    // A jump this large is a mode switch, not a new sample — land on the new
    // value at once so Target/Baseline reads as an instant change.
    const isModeSwitch =
      current !== null && Math.abs(target - current) > Math.abs(target) * 0.3

    if (reduced || current === null || isModeSwitch) {
      displayRef.current = target
      setDisplay(target)
      return
    }

    const step = () => {
      const from = displayRef.current
      if (from === null) return
      const delta = target - from
      if (Math.abs(delta) < Math.max(1e-4, Math.abs(target) * 1e-4)) {
        displayRef.current = target
        setDisplay(target)
        return
      }
      const next = from + delta * stiffness
      displayRef.current = next
      setDisplay(next)
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, stiffness])

  return display
}

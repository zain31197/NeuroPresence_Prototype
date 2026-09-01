import { useEffect, useRef } from 'react'
import type { SourceClip } from '../mock/types'
import { cx } from './ui'

/* ------------------------------------------------------------------ *
 * Procedural stand-in for a source clip.
 *
 * No video files ship with this prototype, so each seed clip is drawn:
 * a softly lit, abstract head-and-shoulders framing that loops with a
 * gentle idle motion. This is the *source clip* being "driven" — it is
 * never presented as model output.
 * ------------------------------------------------------------------ */

let noiseTile: HTMLCanvasElement | null = null

function getNoiseTile(): HTMLCanvasElement {
  if (noiseTile) return noiseTile
  const size = 128
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')
  if (ctx) {
    const img = ctx.createImageData(size, size)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 255
      img.data[i] = v
      img.data[i + 1] = v
      img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
  }
  noiseTile = c
  return c
}

function hashSeed(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 100000
  return h / 100000
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  clip: SourceClip,
  t: number,
) {
  const { palette, scene } = clip

  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, palette.from)
  bg.addColorStop(1, palette.to)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Key light spilling in from the upper left.
  const key = ctx.createRadialGradient(w * 0.24, h * 0.14, 0, w * 0.24, h * 0.14, h * 1.05)
  key.addColorStop(0, `${palette.key}30`)
  key.addColorStop(0.45, `${palette.key}10`)
  key.addColorStop(1, 'transparent')
  ctx.fillStyle = key
  ctx.fillRect(0, 0, w, h)

  // Out-of-focus set dressing.
  ctx.save()
  ctx.filter = 'blur(10px)'
  ctx.globalAlpha = 0.5

  if (scene === 'office') {
    // Window blinds, right third.
    ctx.fillStyle = `${palette.key}22`
    for (let i = 0; i < 9; i += 1) {
      const x = w * 0.62 + i * (w * 0.045)
      ctx.fillRect(x, -h * 0.05, w * 0.016, h * 0.82)
    }
    ctx.fillStyle = '#ffffff10'
    ctx.fillRect(w * 0.6, h * 0.02, w * 0.42, h * 0.78)
  } else if (scene === 'study') {
    // Bookshelf + a warm lamp bloom.
    ctx.fillStyle = '#00000040'
    ctx.fillRect(w * 0.58, h * 0.08, w * 0.4, h * 0.5)
    const spines = ['#8a5a3b', '#5f6f56', '#7a4a4a', '#4d5a72', '#8a7a45']
    for (let i = 0; i < 11; i += 1) {
      ctx.fillStyle = spines[i % spines.length]
      const bh = h * (0.14 + ((i * 37) % 7) * 0.012)
      ctx.fillRect(w * 0.6 + i * (w * 0.034), h * 0.34 - bh + h * 0.14, w * 0.022, bh)
    }
    const lamp = ctx.createRadialGradient(w * 0.14, h * 0.66, 0, w * 0.14, h * 0.66, h * 0.5)
    lamp.addColorStop(0, '#f59e0b55')
    lamp.addColorStop(1, 'transparent')
    ctx.fillStyle = lamp
    ctx.fillRect(0, 0, w, h)
  } else if (scene === 'studio') {
    const left = ctx.createRadialGradient(w * 0.02, h * 0.5, 0, w * 0.02, h * 0.5, h * 0.8)
    left.addColorStop(0, `${palette.key}55`)
    left.addColorStop(1, 'transparent')
    ctx.fillStyle = left
    ctx.fillRect(0, 0, w, h)
    const right = ctx.createRadialGradient(w, h * 0.35, 0, w, h * 0.35, h * 0.8)
    right.addColorStop(0, '#3b82f644')
    right.addColorStop(1, 'transparent')
    ctx.fillStyle = right
    ctx.fillRect(0, 0, w, h)
  } else {
    // Plain wall: a single soft falloff so the subject separates.
    const wall = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, h * 0.9)
    wall.addColorStop(0, '#ffffff0e')
    wall.addColorStop(1, 'transparent')
    ctx.fillStyle = wall
    ctx.fillRect(0, 0, w, h)
  }

  ctx.restore()

  // Desk edge — a horizon line that grounds the framing.
  if (scene !== 'plain') {
    ctx.save()
    ctx.filter = 'blur(6px)'
    ctx.fillStyle = '#00000055'
    ctx.fillRect(0, h * 0.88 + Math.sin(t * 0.4) * 0.4, w, h * 0.2)
    ctx.restore()
  }
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  clip: SourceClip,
  t: number,
  talkAmount: number,
) {
  const { palette } = clip
  const headR = h * 0.155
  const cx0 = w * 0.5 + Math.sin(t * 0.62) * headR * 0.05
  const headY = h * 0.44 + Math.sin(t * 1.05) * headR * 0.022
  const tilt = Math.sin(t * 0.47) * 0.022

  ctx.save()
  ctx.translate(cx0, headY)
  ctx.rotate(tilt)
  ctx.translate(-cx0, -headY)

  // Shoulders + torso.
  const shoulderW = h * 0.72
  const shoulderTop = headY + headR * 1.45
  ctx.fillStyle = palette.garment
  roundedRect(ctx, cx0 - shoulderW / 2, shoulderTop, shoulderW, h * 0.6, h * 0.16)
  ctx.fill()

  // Collar / lapels.
  ctx.fillStyle = '#ffffff14'
  ctx.beginPath()
  ctx.moveTo(cx0 - headR * 0.66, shoulderTop + headR * 0.05)
  ctx.lineTo(cx0, shoulderTop + headR * 0.92)
  ctx.lineTo(cx0 + headR * 0.66, shoulderTop + headR * 0.05)
  ctx.lineTo(cx0 + headR * 0.34, shoulderTop - headR * 0.04)
  ctx.lineTo(cx0, shoulderTop + headR * 0.4)
  ctx.lineTo(cx0 - headR * 0.34, shoulderTop - headR * 0.04)
  ctx.closePath()
  ctx.fill()

  // Neck.
  ctx.fillStyle = palette.skin
  roundedRect(
    ctx,
    cx0 - headR * 0.34,
    headY + headR * 0.5,
    headR * 0.68,
    headR * 1.1,
    headR * 0.24,
  )
  ctx.fill()
  ctx.fillStyle = '#00000038'
  roundedRect(
    ctx,
    cx0 - headR * 0.34,
    headY + headR * 0.5,
    headR * 0.68,
    headR * 0.5,
    headR * 0.24,
  )
  ctx.fill()

  // Head.
  ctx.fillStyle = palette.skin
  ctx.beginPath()
  ctx.ellipse(cx0, headY, headR * 0.79, headR, 0, 0, Math.PI * 2)
  ctx.fill()

  // Modelled shading on the shadow side.
  const shade = ctx.createLinearGradient(cx0 - headR, headY, cx0 + headR, headY)
  shade.addColorStop(0, '#ffffff10')
  shade.addColorStop(0.55, 'transparent')
  shade.addColorStop(1, '#00000045')
  ctx.fillStyle = shade
  ctx.beginPath()
  ctx.ellipse(cx0, headY, headR * 0.79, headR, 0, 0, Math.PI * 2)
  ctx.fill()

  // Ears.
  ctx.fillStyle = palette.skin
  ctx.beginPath()
  ctx.ellipse(cx0 - headR * 0.78, headY + headR * 0.08, headR * 0.1, headR * 0.17, 0, 0, Math.PI * 2)
  ctx.ellipse(cx0 + headR * 0.78, headY + headR * 0.08, headR * 0.1, headR * 0.17, 0, 0, Math.PI * 2)
  ctx.fill()

  // Hair.
  ctx.fillStyle = palette.hair
  ctx.beginPath()
  ctx.ellipse(cx0, headY - headR * 0.3, headR * 0.83, headR * 0.72, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx0, headY - headR * 0.14, headR * 0.84, headR * 0.5, 0, Math.PI * 1.05, Math.PI * 1.95)
  ctx.fill()

  // Blink: a short closure roughly every four seconds.
  const blinkPhase = (t % 4.1) / 4.1
  const blinking = blinkPhase > 0.965
  const eyeY = headY - headR * 0.06
  const eyeDx = headR * 0.31
  const eyeRy = blinking ? headR * 0.012 : headR * 0.062

  ctx.fillStyle = '#141a22'
  ctx.beginPath()
  ctx.ellipse(cx0 - eyeDx, eyeY, headR * 0.1, eyeRy, 0, 0, Math.PI * 2)
  ctx.ellipse(cx0 + eyeDx, eyeY, headR * 0.1, eyeRy, 0, 0, Math.PI * 2)
  ctx.fill()

  // Brows.
  ctx.strokeStyle = palette.hair
  ctx.lineWidth = Math.max(1, headR * 0.055)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx0 - eyeDx - headR * 0.13, eyeY - headR * 0.2)
  ctx.lineTo(cx0 - eyeDx + headR * 0.13, eyeY - headR * 0.235)
  ctx.moveTo(cx0 + eyeDx - headR * 0.13, eyeY - headR * 0.235)
  ctx.lineTo(cx0 + eyeDx + headR * 0.13, eyeY - headR * 0.2)
  ctx.stroke()

  // Nose.
  ctx.strokeStyle = '#00000030'
  ctx.lineWidth = Math.max(1, headR * 0.05)
  ctx.beginPath()
  ctx.moveTo(cx0 + headR * 0.01, eyeY + headR * 0.08)
  ctx.lineTo(cx0 - headR * 0.05, eyeY + headR * 0.31)
  ctx.stroke()

  // Mouth — opens a little while the session is driving the clip.
  const mouthY = eyeY + headR * 0.47
  const mouthW = headR * (0.3 - talkAmount * 0.04)
  const open = headR * (0.022 + talkAmount * 0.075)
  ctx.fillStyle = '#7a4548'
  roundedRect(ctx, cx0 - mouthW / 2, mouthY, mouthW, open, open / 2)
  ctx.fill()
  // Lip line, so a closed mouth still reads as a mouth.
  ctx.strokeStyle = '#00000030'
  ctx.lineWidth = Math.max(1, headR * 0.028)
  ctx.beginPath()
  ctx.moveTo(cx0 - mouthW * 0.58, mouthY - headR * 0.012)
  ctx.quadraticCurveTo(cx0, mouthY - headR * 0.05, cx0 + mouthW * 0.58, mouthY - headR * 0.012)
  ctx.stroke()

  // Rim light along the key side of the head.
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.strokeStyle = `${palette.key}40`
  ctx.lineWidth = Math.max(1.2, headR * 0.05)
  ctx.beginPath()
  ctx.ellipse(cx0, headY, headR * 0.79, headR, 0, Math.PI * 0.78, Math.PI * 1.4)
  ctx.stroke()
  ctx.restore()

  ctx.restore()
}

function drawFinish(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Vignette.
  const vign = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.25, w * 0.5, h * 0.5, h * 0.95)
  vign.addColorStop(0, 'transparent')
  vign.addColorStop(1, '#00000070')
  ctx.fillStyle = vign
  ctx.fillRect(0, 0, w, h)

  // Sensor grain, drifting so it never looks like a still image.
  const tile = getNoiseTile()
  ctx.save()
  ctx.globalAlpha = 0.035
  const ox = (t * 37) % tile.width
  const oy = (t * 53) % tile.height
  for (let x = -ox; x < w; x += tile.width) {
    for (let y = -oy; y < h; y += tile.height) {
      ctx.drawImage(tile, x, y)
    }
  }
  ctx.restore()
}

/**
 * Draws one complete stand-in frame. Shared by the live canvas and by the
 * offline export so the downloaded file matches what was on screen.
 */
export function drawClipFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  clip: SourceClip,
  t: number,
  talk = 0,
) {
  ctx.clearRect(0, 0, w, h)
  drawBackdrop(ctx, w, h, clip, t)
  drawSubject(ctx, w, h, clip, t, talk)
  drawFinish(ctx, w, h, t)
}

/** Deterministic per-clip time offset, so two clips never look identical. */
export function clipSeed(clip: SourceClip) {
  return hashSeed(clip.id) * 12
}

export function ClipCanvas({
  clip,
  animated = true,
  talking = false,
  className,
}: {
  clip: SourceClip
  animated?: boolean
  talking?: boolean
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const talkRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const seed = hashSeed(clip.id) * 12
    let raf = 0
    let disposed = false

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(rect.width * dpr))
      const h = Math.max(1, Math.round(rect.height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    const frame = (now: number) => {
      if (disposed) return
      resize()
      const w = canvas.width
      const h = canvas.height
      const t = animated && !reduced ? seed + now / 1000 : seed

      // Ease the mouth motion in and out instead of snapping.
      const targetTalk = talking && animated && !reduced ? 1 : 0
      talkRef.current += (targetTalk - talkRef.current) * 0.08
      const speech =
        talkRef.current *
        (0.45 + 0.55 * Math.abs(Math.sin(t * 6.1) * 0.7 + Math.sin(t * 2.7) * 0.3))

      drawClipFrame(ctx, w, h, clip, t, speech)

      if (animated && !reduced) raf = requestAnimationFrame(frame)
    }

    frame(performance.now())

    const ro = new ResizeObserver(() => frame(performance.now()))
    ro.observe(canvas)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [clip, animated, talking])

  return (
    <canvas
      ref={canvasRef}
      className={cx('block h-full w-full', className)}
      role="img"
      aria-label={`Source clip stand-in: ${clip.name}`}
    />
  )
}

/**
 * Renders a clip: the real file when the user supplied one, otherwise the
 * procedural stand-in. Frames are only ever displayed — never analysed.
 */
export function ClipSurface({
  clip,
  animated = true,
  talking = false,
  className,
}: {
  clip: SourceClip
  animated?: boolean
  talking?: boolean
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (animated) {
      void el.play().catch(() => {
        /* autoplay refused — the poster frame stands in */
      })
    } else {
      el.pause()
    }
  }, [animated, clip.src])

  if (clip.src) {
    return (
      <video
        ref={videoRef}
        src={clip.src}
        className={cx('block h-full w-full object-cover', className)}
        muted
        loop
        playsInline
        aria-label={`Source clip: ${clip.name}`}
      />
    )
  }

  return <ClipCanvas clip={clip} animated={animated} talking={talking} className={className} />
}

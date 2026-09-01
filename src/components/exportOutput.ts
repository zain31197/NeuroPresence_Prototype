import type { SourceClip } from '../mock/types'
import { clipSeed, drawClipFrame } from './ClipCanvas'

/**
 * Produces a downloadable file for the Offline Studio result.
 *
 * The "render" itself is a timer in the mock engine; this only turns the
 * on-screen stand-in into a file so the Download button is not a dead end.
 * Where the browser can encode video the result is a short WebM loop,
 * otherwise a single still frame.
 */

const MIME_CANDIDATES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
]

function supportedMime(): string | null {
  if (typeof MediaRecorder === 'undefined') return null
  return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? null
}

async function stillFrame(clip: SourceClip, size: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  drawClipFrame(ctx, size, size, clip, clipSeed(clip), 0.4)
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed'))),
      'image/png',
    )
  })
}

export interface ExportResult {
  blob: Blob
  extension: 'webm' | 'png'
}

export async function exportRenderedClip(
  clip: SourceClip,
  size: number,
  seconds = 3,
): Promise<ExportResult> {
  const mime = supportedMime()
  if (!mime || typeof HTMLCanvasElement.prototype.captureStream !== 'function') {
    return { blob: await stillFrame(clip, size), extension: 'png' }
  }

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return { blob: await stillFrame(clip, size), extension: 'png' }

  const seed = clipSeed(clip)
  const stream = canvas.captureStream(30)
  const recorder = new MediaRecorder(stream, { mimeType: mime })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }

  const started = performance.now()
  let raf = 0
  const paint = (now: number) => {
    const elapsed = (now - started) / 1000
    const talk = 0.45 + 0.55 * Math.abs(Math.sin(elapsed * 6.1))
    drawClipFrame(ctx, size, size, clip, seed + elapsed, talk)
    if (elapsed < seconds) raf = requestAnimationFrame(paint)
  }

  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime }))
  })

  recorder.start()
  raf = requestAnimationFrame(paint)

  await new Promise((resolve) => window.setTimeout(resolve, seconds * 1000))
  cancelAnimationFrame(raf)
  recorder.stop()
  stream.getTracks().forEach((track) => track.stop())

  const blob = await done
  if (blob.size === 0) return { blob: await stillFrame(clip, size), extension: 'png' }
  return { blob, extension: 'webm' }
}

/** Triggers a browser download for a blob or an existing object URL. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function downloadUrl(url: string, filename: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

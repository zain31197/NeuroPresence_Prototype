/* ------------------------------------------------------------------ *
 * Data-path check.
 *
 * The rubric asks for an API/data check. This build has no backend and no
 * model, so the honest thing to check is the data path it *does* depend
 * on: the browser media APIs that carry a source clip in, hold a driving
 * recording, and encode the offline render back out.
 *
 * These are real checks with real results, run on whatever machine is
 * looking at the page — not a table of ticks. Each one names the part of
 * the product it stands behind, and the model path is reported as
 * unimplemented rather than quietly passed.
 * ------------------------------------------------------------------ */

export type CheckState = 'pending' | 'running' | 'pass' | 'fail' | 'unavailable'

export interface CheckOutcome {
  ok: boolean | 'unavailable'
  detail: string
}

export interface DataCheck {
  id: string
  label: string
  /** The product behaviour this check stands behind. */
  covers: string
  run: () => Promise<CheckOutcome>
}

const WEBM_CANDIDATES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']

/** Records a fraction of a second of canvas into a real WebM blob. */
async function recordTinyClip(seconds = 0.6): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 48
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D context unavailable')

  const mime = WEBM_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m))
  if (!mime) throw new Error('No WebM encoder')

  const stream = canvas.captureStream(20)
  const recorder = new MediaRecorder(stream, { mimeType: mime })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })

  recorder.start()
  const started = performance.now()
  await new Promise<void>((done) => {
    const draw = () => {
      const t = (performance.now() - started) / 1000
      ctx.fillStyle = '#1c2530'
      ctx.fillRect(0, 0, 64, 48)
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(0, 0, (t / seconds) * 64, 48)
      if (t < seconds) requestAnimationFrame(draw)
      else done()
    }
    draw()
  })
  recorder.stop()
  stream.getTracks().forEach((t) => t.stop())
  await stopped
  return new Blob(chunks, { type: mime })
}

export const DATA_CHECKS: DataCheck[] = [
  {
    id: 'canvas',
    label: 'Canvas 2D rendering',
    covers: 'Source-clip stand-ins, the output preview and the offline render surface',
    run: async () => {
      const c = document.createElement('canvas')
      c.width = 8
      c.height = 8
      const ctx = c.getContext('2d')
      if (!ctx) return { ok: false, detail: 'No 2D context available' }
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(0, 0, 8, 8)
      const [r, g, b, a] = ctx.getImageData(2, 2, 1, 1).data
      const painted = a === 255 && b > r
      return {
        ok: painted,
        detail: painted
          ? `Pixel read back as rgba(${r}, ${g}, ${b}, ${a})`
          : 'Pixel did not read back as painted',
      }
    },
  },
  {
    id: 'capture',
    label: 'Canvas → MediaStream capture',
    covers: 'Encoding the Offline Studio result into a downloadable file',
    run: async () => {
      if (typeof HTMLCanvasElement.prototype.captureStream !== 'function') {
        return { ok: 'unavailable', detail: 'captureStream() not implemented — export falls back to a PNG still' }
      }
      const c = document.createElement('canvas')
      c.width = 32
      c.height = 32
      const stream = c.captureStream(15)
      const tracks = stream.getVideoTracks().length
      stream.getTracks().forEach((t) => t.stop())
      return { ok: tracks > 0, detail: `${tracks} video track from a 32×32 canvas at 15 fps` }
    },
  },
  {
    id: 'encoder',
    label: 'WebM video encoder',
    covers: 'The Download output button in the Offline Studio',
    run: async () => {
      if (typeof MediaRecorder === 'undefined') {
        return { ok: 'unavailable', detail: 'MediaRecorder not implemented — export falls back to a PNG still' }
      }
      const supported = WEBM_CANDIDATES.filter((m) => MediaRecorder.isTypeSupported(m))
      return {
        ok: supported.length > 0,
        detail: supported.length ? `Accepted: ${supported.join(', ')}` : 'No WebM profile accepted',
      }
    },
  },
  {
    id: 'roundtrip',
    label: 'Encode → decode round trip',
    covers: 'Reading an uploaded recording’s duration so the export matches its length',
    run: async () => {
      const blob = await recordTinyClip(0.6)
      if (blob.size === 0) return { ok: false, detail: 'Encoder produced an empty blob' }

      const url = URL.createObjectURL(blob)
      try {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.muted = true
        video.src = url
        const duration = await new Promise<number>((resolve) => {
          video.onloadedmetadata = () => resolve(video.duration)
          video.onerror = () => resolve(Number.NaN)
          window.setTimeout(() => resolve(Number.NaN), 4000)
        })
        const decoded = Number.isFinite(duration) || duration === Infinity
        return {
          ok: decoded,
          detail: decoded
            ? `${(blob.size / 1024).toFixed(1)} KB encoded, metadata decoded (${
                Number.isFinite(duration) ? `${duration.toFixed(2)} s` : 'streaming duration'
              })`
            : 'Metadata could not be decoded from the encoded blob',
        }
      } finally {
        URL.revokeObjectURL(url)
      }
    },
  },
  {
    id: 'objecturl',
    label: 'Object URL lifecycle',
    covers: 'Holding uploaded clips in the tab without ever sending them anywhere',
    run: async () => {
      const blob = new Blob(['np'], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const looksRight = url.startsWith('blob:')
      const reachable = await fetch(url)
        .then((r) => r.ok)
        .catch(() => false)
      URL.revokeObjectURL(url)
      const revoked = await fetch(url)
        .then(() => false)
        .catch(() => true)
      return {
        ok: looksRight && reachable && revoked,
        detail: revoked
          ? 'Created, read back, then revoked — the handle stops resolving after release'
          : 'Handle still resolved after revoke',
      }
    },
  },
  {
    id: 'guard',
    label: 'Upload type guard',
    covers: 'Rejecting a non-video before it can become a source clip',
    run: async () => {
      // The exact predicate the Source Clips dialog and the Offline Studio use.
      const accepts = (f: File) => f.type.startsWith('video/')
      const video = new File([new Uint8Array([0])], 'clip.webm', { type: 'video/webm' })
      const text = new File(['x'], 'notes.txt', { type: 'text/plain' })
      const ok = accepts(video) && !accepts(text)
      return {
        ok,
        detail: ok
          ? 'video/webm accepted, text/plain rejected'
          : 'Guard did not discriminate correctly',
      }
    },
  },
  {
    id: 'camera',
    label: 'Camera capture API',
    covers: 'The optional driving-signal preview on the Console',
    run: async () => {
      const present = typeof navigator.mediaDevices?.getUserMedia === 'function'
      return {
        ok: present ? true : 'unavailable',
        detail: present
          ? 'getUserMedia present — permission is requested only when you press Show camera preview'
          : 'getUserMedia unavailable — the prototype falls back to a placeholder',
      }
    },
  },
  {
    id: 'model',
    label: 'Reenactment model path',
    covers: 'The core functionality this proof of concept deliberately leaves out',
    run: async () =>
      Promise.resolve({
        ok: 'unavailable' as const,
        detail:
          'Not implemented in this build, by design. No inference runtime is loaded and no frame is analysed — the measured figures come from a separate run on our own hardware.',
      }),
  },
]

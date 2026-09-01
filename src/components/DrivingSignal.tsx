import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Waves } from 'lucide-react'
import { useEngine } from '../mock/engine'
import { Button, Chip, cx, StatusDot } from './ui'

type CamState = 'off' | 'requesting' | 'on' | 'denied'

/**
 * Optional webcam passthrough (brief §10.4).
 *
 * Purely a display: the stream is attached to a <video> element and nothing
 * reads, samples or analyses the frames. Opt-in, so the prototype never
 * surprises a presenter with a permission prompt, and it works fully when
 * permission is refused.
 */
export function DrivingSignal() {
  const { session, inputDevice } = useEngine()
  const [cam, setCam] = useState<CamState>('off')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCam('off')
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCam('denied')
      return
    }
    setCam('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
      setCam('on')
    } catch {
      setCam('denied')
    }
  }, [])

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  const live = session === 'live'

  return (
    <div className="rounded-control border border-border bg-surface-2/50 p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="np-label">Driving signal</span>
        <Chip tone={live ? 'success' : 'muted'} icon={<StatusDot tone={live ? 'success' : 'muted'} pulse={live} />}>
          {live ? 'Capturing' : 'Idle'}
        </Chip>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-[6px] border border-border bg-black">
        <video
          ref={videoRef}
          className={cx(
            'h-full w-full -scale-x-100 object-cover',
            cam === 'on' ? 'opacity-100' : 'opacity-0',
          )}
          muted
          playsInline
        />

        {cam !== 'on' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2 text-center">
            {/* Placeholder motion trace — stands in for the live driving signal. */}
            <Waves
              size={20}
              className={cx('text-text-muted', live && 'motion-safe:animate-pulse')}
            />
            <p className="text-[11px] leading-tight text-text-muted">
              {cam === 'denied'
                ? 'Camera unavailable — placeholder in use'
                : cam === 'requesting'
                  ? 'Requesting camera…'
                  : 'Preview off'}
            </p>
          </div>
        ) : null}

        <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-chip bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white/70">
          {inputDevice}
        </span>
      </div>

      <div className="mt-2.5">
        {cam === 'on' ? (
          <Button size="sm" block onClick={stop}>
            <CameraOff size={13} />
            Turn off preview
          </Button>
        ) : (
          <Button size="sm" block onClick={start} disabled={cam === 'requesting'}>
            <Camera size={13} />
            {cam === 'denied' ? 'Retry camera preview' : 'Show camera preview'}
          </Button>
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
          Display only — frames are shown, never analysed. Optional; the prototype works without
          it.
        </p>
      </div>
    </div>
  )
}

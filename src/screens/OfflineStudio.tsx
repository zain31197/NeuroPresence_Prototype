import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  Download,
  Film,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { COPY } from '../mock/constants'
import { useEngine } from '../mock/engine'
import { INPUT_CHECKS_PASS } from '../mock/seedData'
import { ClipSurface } from '../components/ClipCanvas'
import { WatermarkOverlay } from '../components/VideoFrame'
import { downloadBlob, downloadUrl, exportRenderedClip } from '../components/exportOutput'
import { Button, Card, CardHeader, Chip, cx, ProgressBar, Select, Toggle } from '../components/ui'

function StepBadge({ n, done }: { n: number; done?: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
        done ? 'bg-success text-[#04140a]' : 'border border-border bg-surface-2 text-text-muted',
      )}
    >
      {done ? <Check size={13} strokeWidth={3} /> : n}
    </span>
  )
}

export function OfflineStudio() {
  const {
    clips,
    activeClip,
    activeClipId,
    setActiveClip,
    offline,
    setDrivingVideo,
    clearDrivingVideo,
    setSimulatePoorInput,
    setOfflineResolution,
    setSmoothing,
    startRender,
    resetRender,
    watermark,
  } = useEngine()

  const [dragging, setDragging] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const checksPassed = offline.checkStatus === 'pass'
  const checking = offline.checkStatus === 'checking'
  const failed = offline.checkStatus === 'fail'
  const rendering = offline.renderStatus === 'rendering'
  const rendered = offline.renderStatus === 'done'

  const accept = (file: File | undefined) => {
    if (!file || !file.type.startsWith('video/')) return
    setDrivingVideo(file)
  }

  const handleDownload = async () => {
    setPreparing(true)
    try {
      const size = offline.renderedAt?.resolution ?? offline.resolution
      if (activeClip.src) {
        // The user supplied this clip — hand back the file they chose.
        downloadUrl(activeClip.src, `neuropresence_offline_${size}.mp4`)
        return
      }
      // Match the stand-in's length to the driving video the user uploaded,
      // rather than always emitting a fixed 3s clip. Clamped so a very long
      // upload can't tie up a multi-minute canvas capture.
      const seconds = Math.min(60, Math.max(2, Math.round(offline.drivingDuration ?? 3)))
      const { blob, extension } = await exportRenderedClip(activeClip, size, seconds)
      downloadBlob(blob, `neuropresence_offline_${size}.${extension}`)
    } finally {
      setPreparing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="np-page-title">Offline Studio</h2>
          <p className="mt-1 max-w-[46rem] text-[13px] leading-relaxed text-text-muted">
            The same reenactment feature set, driven by a recording instead of your live webcam.
            {' '}
            {COPY.offlineNote}
          </p>
        </div>
        <Chip tone="accent">Non-real-time</Chip>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* ------------------------- steps 1–3 ------------------------- */}
        <div className="space-y-4">
          {/* 1 · Source clip */}
          <Card>
            <CardHeader
              icon={<StepBadge n={1} done />}
              title="Pick a source clip"
              subtitle="The presentable recording that gets animated."
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {clips.map((clip) => {
                const selected = clip.id === activeClipId
                return (
                  <button
                    key={clip.id}
                    type="button"
                    onClick={() => setActiveClip(clip.id)}
                    aria-pressed={selected}
                    className={cx(
                      'overflow-hidden rounded-control border text-left transition-all duration-200 ease-out',
                      selected
                        ? 'border-primary ring-2 ring-primary/25'
                        : 'border-border hover:border-text-muted/60',
                    )}
                  >
                    <span className="relative block aspect-video w-full overflow-hidden bg-black">
                      <ClipSurface clip={clip} animated={false} />
                      {selected ? (
                        <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      ) : null}
                    </span>
                    <span className="block truncate px-2 py-1.5 text-[11px] font-medium text-text">
                      {clip.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* 2 · Driving video */}
          <Card>
            <CardHeader
              icon={<StepBadge n={2} done={checksPassed} />}
              title="Upload a driving video"
              subtitle={COPY.offlineUploadPrompt}
              right={
                offline.drivingFileName ? (
                  <Button size="sm" variant="ghost" onClick={clearDrivingVideo}>
                    <Trash2 size={14} />
                    Remove
                  </Button>
                ) : null
              }
            />

            {!offline.drivingFileName ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  accept(e.dataTransfer.files?.[0])
                }}
                className={cx(
                  'flex flex-col items-center justify-center rounded-control border-2 border-dashed px-6 py-10 text-center',
                  'transition-colors duration-200 ease-out',
                  dragging ? 'border-primary bg-primary/[0.06]' : 'border-border bg-surface-2/40',
                )}
              >
                <UploadCloud size={26} className="mb-3 text-text-muted" />
                <p className="text-[13px] font-medium text-text">{COPY.offlineUploadPrompt}</p>
                <p className="mt-1 text-[12px] text-text-muted">
                  MP4, MOV or WebM · stays in this tab
                </p>
                <Button size="sm" className="mt-4" onClick={() => inputRef.current?.click()}>
                  Browse files
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => accept(e.target.files?.[0] ?? undefined)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[200px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-control border border-border bg-black">
                  {offline.drivingSrc ? (
                    <video
                      src={offline.drivingSrc}
                      className="aspect-video w-full object-cover"
                      muted
                      loop
                      playsInline
                      autoPlay
                    />
                  ) : (
                    // The guided demo loads a stand-in recording with no file
                    // behind it — draw the placeholder rather than an empty box.
                    <div className="relative aspect-video w-full">
                      <ClipSurface clip={activeClip} animated talking />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1 pt-4 text-[9px] font-medium uppercase tracking-wider text-white/70">
                        Stand-in recording
                      </span>
                    </div>
                  )}
                  <p className="truncate px-2 py-1.5 text-[11px] text-text-muted">
                    {offline.drivingFileName}
                  </p>
                </div>

                <div>
                  <p className="np-label mb-2">Input quality</p>
                  <ul className="space-y-1.5">
                    {checking ? (
                      <li className="flex items-center gap-2 text-[13px] text-text-muted">
                        <Loader2 size={14} className="animate-spin text-primary" />
                        Checking the recording…
                      </li>
                    ) : failed ? (
                      <>
                        <li className="flex items-center gap-2 text-[13px] text-danger">
                          <X size={14} strokeWidth={3} />
                          Face partially occluded
                        </li>
                        {INPUT_CHECKS_PASS.slice(1).map((label) => (
                          <li
                            key={label}
                            className="flex items-center gap-2 text-[13px] text-text-muted"
                          >
                            <span className="inline-block h-3.5 w-3.5 text-center leading-none">
                              –
                            </span>
                            {label}
                          </li>
                        ))}
                      </>
                    ) : (
                      INPUT_CHECKS_PASS.map((label) => (
                        <li key={label} className="flex items-center gap-2 text-[13px] text-text">
                          <Check size={14} strokeWidth={3} className="text-success" />
                          {label}
                        </li>
                      ))
                    )}
                  </ul>

                  {failed ? (
                    <div className="mt-3 flex items-start gap-2 rounded-control border border-danger/30 bg-danger/[0.08] px-3 py-2.5">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-danger" />
                      <p className="text-[12px] leading-relaxed text-text">
                        {COPY.offlineFailure}
                      </p>
                    </div>
                  ) : null}

                  <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
                    Simulated check. Frames are displayed but never analysed in this build.
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* 3 · Fidelity */}
          <Card>
            <CardHeader
              icon={<StepBadge n={3} done={rendered} />}
              title="Fidelity settings"
              subtitle={COPY.offlineNote}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                id="np-res"
                label="Output resolution"
                value={offline.resolution}
                onChange={(e) =>
                  setOfflineResolution(Number(e.target.value) as 256 | 512 | 1024)
                }
              >
                <option value={256}>256 × 256 — fastest</option>
                <option value={512}>512 × 512 — balanced</option>
                <option value={1024}>1024 × 1024 — highest fidelity</option>
              </Select>

              <div>
                <label htmlFor="np-smoothing" className="np-label mb-1.5 block">
                  Temporal smoothing
                  <span className="ml-2 font-mono text-[12px] normal-case tracking-normal text-text">
                    {offline.smoothing}%
                  </span>
                </label>
                <input
                  id="np-smoothing"
                  type="range"
                  min={0}
                  max={100}
                  value={offline.smoothing}
                  onChange={(e) => setSmoothing(Number(e.target.value))}
                  className="h-9 w-full accent-[color:var(--primary)]"
                />
                <p className="text-[11px] text-text-muted">
                  Higher values steady the motion between frames.
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-border pt-4">
              {!rendering && !rendered ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={startRender}
                  disabled={!checksPassed}
                  title={!checksPassed ? 'Upload a driving video that passes the input check' : undefined}
                >
                  <Sparkles size={16} />
                  Render
                </Button>
              ) : null}

              {rendering ? (
                <div>
                  <div className="mb-2 flex items-center justify-between text-[12px]">
                    <span className="inline-flex items-center gap-1.5 text-text">
                      <Loader2 size={13} className="animate-spin text-primary" />
                      {offline.renderStage || 'Reenacting…'}
                    </span>
                    <span className="font-mono tabular-nums text-text-muted">
                      {Math.round(offline.renderProgress)}%
                    </span>
                  </div>
                  <ProgressBar value={offline.renderProgress} label="Offline render" />
                </div>
              ) : null}

              {rendered ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-success">
                    <Check size={15} strokeWidth={3} />
                    Render complete
                  </span>
                  <Button size="sm" variant="ghost" onClick={resetRender}>
                    <RotateCcw size={14} />
                    Render again
                  </Button>
                </div>
              ) : null}

              {!checksPassed && !rendering && !rendered ? (
                <p className="mt-2.5 text-[11px] text-text-muted">
                  {offline.drivingFileName
                    ? 'Rendering unlocks once the input check passes.'
                    : 'Upload a driving video to enable rendering.'}
                </p>
              ) : null}
            </div>
          </Card>
        </div>

        {/* --------------------------- output --------------------------- */}
        <div className="space-y-4">
          <Card data-tour="offline-render">
            <CardHeader
              icon={<Film size={16} />}
              title="Output"
              subtitle={
                rendered
                  ? 'Offline quality reference.'
                  : 'Your rendered result appears here.'
              }
              right={rendered ? <Chip tone="success">Ready</Chip> : <Chip>Pending</Chip>}
            />

            <div className="relative aspect-video w-full overflow-hidden rounded-control border border-border bg-black">
              <ClipSurface clip={activeClip} animated={rendered} talking={rendered} />
              {!rendered ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/70 px-4 text-center backdrop-blur-[2px]">
                  {rendering ? (
                    <>
                      <Loader2 size={20} className="mb-2 animate-spin text-primary" />
                      <p className="text-[13px] font-medium text-text">
                        {offline.renderStage || 'Reenacting…'}
                      </p>
                      <p className="mt-1 font-mono text-[12px] tabular-nums text-text-muted">
                        {Math.round(offline.renderProgress)}%
                      </p>
                    </>
                  ) : (
                    <>
                      <Film size={20} className="mb-2 text-text-muted" />
                      <p className="text-[13px] font-medium text-text">No render yet</p>
                      <p className="mt-0.5 text-[12px] text-text-muted">
                        Complete steps 1–3, then press Render.
                      </p>
                    </>
                  )}
                </div>
              ) : null}

              {rendered && watermark ? (
                <div className="absolute bottom-2 right-2">
                  <WatermarkOverlay size="sm" />
                </div>
              ) : null}
            </div>

            {rendered && offline.renderedAt ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <dl className="mt-4 space-y-2 rounded-control border border-border bg-surface-2/50 px-3.5 py-3 text-[12px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-muted">Rendered at</dt>
                    <dd className="font-mono text-text">
                      {offline.renderedAt.resolution} × {offline.renderedAt.resolution}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-muted">Temporal smoothing</dt>
                    <dd className="font-mono text-text">{offline.renderedAt.smoothing}%</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-muted">Source clip</dt>
                    <dd className="truncate text-text">{activeClip.name}</dd>
                  </div>
                  {!activeClip.src && offline.drivingDuration ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-text-muted">Output length</dt>
                      <dd className="font-mono text-text">
                        {Math.min(60, Math.max(2, Math.round(offline.drivingDuration)))}s
                        {offline.drivingDuration > 60 ? ' (capped)' : ''}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-muted">Latency budget</dt>
                    <dd className="text-text">None — offline quality reference</dd>
                  </div>
                </dl>

                <Button
                  variant="primary"
                  block
                  className="mt-3"
                  onClick={() => void handleDownload()}
                  disabled={preparing}
                >
                  {preparing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Preparing download…
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      Download output
                    </>
                  )}
                </Button>
                <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
                  Downloads the source-clip stand-in shown above. It is not model output — this
                  build has no reenactment pipeline.
                </p>
              </motion.div>
            ) : null}
          </Card>

          {/* Dev switch for the honest fail-state demo. */}
          <Card>
            <CardHeader
              icon={<AlertTriangle size={16} />}
              title="Demo controls"
              subtitle="For showing the input constraints during a walkthrough."
            />
            <Toggle
              checked={offline.simulatePoorInput}
              onChange={setSimulatePoorInput}
              tone="primary"
              label="Simulate poor input"
              description="Fails the input-quality check, as a recording with an occluded face would."
            />
            <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
              A driving file whose name contains “bad” trips the same state automatically.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Film, Plus, UploadCloud, X } from 'lucide-react'
import { useEngine } from '../mock/engine'
import { ClipSurface } from '../components/ClipCanvas'
import { Button, Card, OverlayChip, cx } from '../components/ui'

/* ------------------------------ add dialog ------------------------------ */

function AddClipDialog({ onClose }: { onClose: () => void }) {
  const { addClip, setActiveClip } = useEngine()
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const accept = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('video/')) {
      setError('That file is not a video. Choose an MP4, MOV or WebM recording.')
      return
    }
    const clip = addClip(file)
    setActiveClip(clip.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Add source clip"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[520px] rounded-card border border-border bg-surface p-6 shadow-raised"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="np-section-heading">Add source clip</h2>
            <p className="mt-0.5 text-[13px] text-text-muted">
              A short, well-lit recording of you looking presentable.
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </Button>
        </div>

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
            'flex flex-col items-center justify-center rounded-control border-2 border-dashed px-6 py-9 text-center',
            'transition-colors duration-200 ease-out',
            dragging ? 'border-primary bg-primary/[0.06]' : 'border-border bg-surface-2/40',
          )}
        >
          <UploadCloud size={24} className="mb-3 text-text-muted" />
          <p className="text-[13px] font-medium text-text">Drop a video file here</p>
          <p className="mt-1 text-[12px] text-text-muted">MP4, MOV or WebM · nothing is uploaded</p>
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

        {error ? (
          <p className="mt-3 rounded-control border border-danger/30 bg-danger/[0.08] px-3 py-2 text-[12px] text-danger">
            {error}
          </p>
        ) : null}

        <p className="mt-4 text-[11px] leading-relaxed text-text-muted">
          The file stays in this browser tab for the length of the session. No processing, no
          analysis, no upload — this prototype only lists it as a clip.
        </p>
      </motion.div>
    </div>
  )
}

/* --------------------------------- screen -------------------------------- */

export function SourceClips() {
  const { clips, activeClipId, setActiveClip, navigate } = useEngine()
  const [adding, setAdding] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="np-page-title">Source clips</h2>
          <p className="mt-1 max-w-[46rem] text-[13px] leading-relaxed text-text-muted">
            Your pre-recorded, presentable clips. The active clip is the one your live motion
            drives during a session — it is not the live input.
          </p>
        </div>
        <Button variant="primary" onClick={() => setAdding(true)}>
          <Plus size={15} />
          Add source clip
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {clips.map((clip) => {
          const active = clip.id === activeClipId
          return (
            <Card
              key={clip.id}
              padding="p-0"
              interactive
              className={cx(
                'overflow-hidden',
                active ? 'border-primary/60 ring-1 ring-primary/25' : 'hover:border-primary/35',
              )}
            >
              <div
                className="relative aspect-video w-full overflow-hidden bg-black"
                onMouseEnter={() => setHovered(clip.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <ClipSurface clip={clip} animated={hovered === clip.id} />
                {active ? (
                  <span className="absolute left-2 top-2">
                    <OverlayChip className="border-primary/50 text-primary">Active</OverlayChip>
                  </span>
                ) : null}
                {clip.userAdded ? (
                  <span className="absolute right-2 top-2">
                    <OverlayChip>Added by you</OverlayChip>
                  </span>
                ) : null}
              </div>

              <div className="p-4">
                <p className="truncate text-[14px] font-medium text-text" title={clip.name}>
                  {clip.name}
                </p>
                <p className="mt-0.5 text-[12px] text-text-muted">
                  {clip.duration} · {clip.resolution}
                </p>

                <div className="mt-3.5">
                  {active ? (
                    <Button size="sm" block variant="ghost" onClick={() => navigate('console')}>
                      <Check size={14} className="text-success" />
                      Active — open Console
                    </Button>
                  ) : (
                    <Button size="sm" block onClick={() => setActiveClip(clip.id)}>
                      Set as active
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}

        {/* Add-clip card. */}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={cx(
            'flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-card',
            'border-2 border-dashed border-border bg-surface/40 px-4 text-center',
            'transition-colors duration-200 ease-out hover:border-primary/60 hover:bg-primary/[0.04]',
          )}
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-2 text-text-muted">
            <Plus size={18} />
          </span>
          <span className="text-[13px] font-medium text-text">Add source clip</span>
          <span className="max-w-[14rem] text-[11px] leading-relaxed text-text-muted">
            Upload a short, well-lit recording of yourself
          </span>
        </button>
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <Film size={16} className="mt-0.5 shrink-0 text-text-muted" />
          <p className="text-[12px] leading-relaxed text-text-muted">
            Seed clips are drawn by the prototype rather than shipped as video files, so the repo
            stays small and nothing here can be mistaken for model output. A clip you add plays
            back as the file you chose.
          </p>
        </div>
      </Card>

      <AnimatePresence>
        {adding ? <AddClipDialog onClose={() => setAdding(false)} /> : null}
      </AnimatePresence>
    </div>
  )
}

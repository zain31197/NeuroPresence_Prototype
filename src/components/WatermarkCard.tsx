import { BadgeCheck } from 'lucide-react'
import { useEngine } from '../mock/engine'
import { ClipSurface } from './ClipCanvas'
import { WatermarkOverlay } from './VideoFrame'
import { Card, CardHeader, Chip, Toggle } from './ui'

export function WatermarkCard() {
  const { watermark, setWatermark, activeClip } = useEngine()

  return (
    <Card data-tour="watermark-card">
      <CardHeader
        icon={<BadgeCheck size={16} />}
        title="Disclosure Watermark"
        subtitle="Tells other participants the feed is reenacted."
        right={
          <Chip tone={watermark ? 'accent' : 'muted'}>{watermark ? 'On' : 'Off'}</Chip>
        }
      />

      <Toggle
        checked={watermark}
        onChange={setWatermark}
        tone="accent"
        label="Show synthetic-media disclosure"
        description="Recommended. Overlays the output your meeting app receives."
      />

      <div className="mt-4">
        <p className="np-label mb-2">Preview</p>
        <div className="relative aspect-video w-full overflow-hidden rounded-control border border-border bg-black">
          <ClipSurface clip={activeClip} animated={false} />
          <div className="absolute inset-0 bg-black/25" />
          {watermark ? (
            <div className="absolute bottom-1.5 right-1.5">
              <WatermarkOverlay size="sm" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-end justify-end p-2">
              <span className="rounded-chip border border-dashed border-white/20 px-1.5 py-1 text-[9px] text-white/45">
                No disclosure shown
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

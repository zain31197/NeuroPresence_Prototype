import { Camera, Info, MonitorPlay, ShieldAlert, Video } from 'lucide-react'
import { COPY, VIRTUAL_CAMERA_NAME } from '../mock/constants'
import { useEngine } from '../mock/engine'
import { INPUT_DEVICES, MEETING_APPS } from '../mock/seedData'
import { Card, CardHeader, Chip, cx, Select, StatusDot } from '../components/ui'

const HOW_TO = [
  'Start a session here.',
  'Open your meeting app.',
  `Pick '${VIRTUAL_CAMERA_NAME}' as your camera.`,
]

export function Devices() {
  const { inputDevice, setInputDevice, session } = useEngine()
  const live = session === 'live'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="np-page-title">Devices &amp; Output</h2>
        <p className="mt-1 max-w-[46rem] text-[13px] leading-relaxed text-text-muted">
          NeuroPresence presents itself as an ordinary camera, so meeting apps need no plugin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* --------------------------- input --------------------------- */}
        <Card>
          <CardHeader
            icon={<Camera size={16} />}
            title="Input device"
            subtitle="The camera that supplies your driving signal."
          />
          <Select
            id="np-input-device"
            label="Webcam"
            value={inputDevice}
            onChange={(e) => setInputDevice(e.target.value)}
            hint="Head pose, lip motion and expression are read from this camera in the finished system."
          >
            {INPUT_DEVICES.map((device) => (
              <option key={device} value={device}>
                {device}
              </option>
            ))}
          </Select>

          <div className="mt-4 flex items-center gap-2 rounded-control border border-border bg-surface-2/50 px-3.5 py-2.5">
            <Video size={14} className="shrink-0 text-text-muted" />
            <p className="text-[12px] text-text-muted">
              Driving: <span className="text-text">Webcam</span> ·{' '}
              <span className="text-text">{inputDevice}</span>
            </p>
          </div>
        </Card>

        {/* -------------------------- output --------------------------- */}
        <Card className="border-primary/40 ring-1 ring-primary/20">
          <CardHeader
            icon={<MonitorPlay size={16} />}
            title="Output device"
            subtitle="Where the reenacted feed is written."
            right={
              <Chip
                tone={live ? 'success' : 'primary'}
                icon={<StatusDot tone={live ? 'success' : 'primary'} pulse={live} />}
              >
                {live ? 'Streaming' : 'Ready'}
              </Chip>
            }
          />

          <div className="rounded-control border border-primary/35 bg-primary/[0.07] px-4 py-3.5">
            <p className="text-[15px] font-semibold text-text">{VIRTUAL_CAMERA_NAME}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-text-muted">
              {COPY.virtualCameraHelp}
            </p>
          </div>

          <div className="mt-4">
            <p className="np-label mb-2">Supported clients</p>
            <div className="flex flex-wrap gap-2">
              {MEETING_APPS.map((app) => (
                <span
                  key={app.name}
                  className="inline-flex items-center gap-2 rounded-control border border-border bg-surface-2 px-2.5 py-1.5 text-[12px] text-text"
                >
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-[5px] text-[10px] font-bold text-white"
                    style={{ backgroundColor: app.tint }}
                    aria-hidden
                  >
                    {app.mark}
                  </span>
                  {app.name}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
              {COPY.limitationNote}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ------------------------ how to use ------------------------- */}
        <Card>
          <CardHeader
            icon={<Info size={16} />}
            title="How to use in a meeting"
            subtitle="Three steps, once per meeting."
          />
          <ol className="space-y-2.5">
            {HOW_TO.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span
                  className={cx(
                    'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                    'border border-border bg-surface-2 text-[11px] font-semibold text-text-muted',
                  )}
                >
                  {index + 1}
                </span>
                <span className="pt-0.5 text-[13px] text-text">{step}</span>
              </li>
            ))}
          </ol>
        </Card>

        {/* -------------------------- fallback -------------------------- */}
        <Card>
          <CardHeader
            icon={<ShieldAlert size={16} />}
            title="Fallback behaviour"
            subtitle="What happens when the pipeline cannot keep up."
          />
          <div className="rounded-control border border-warning/25 bg-warning/[0.07] px-3.5 py-3">
            <p className="text-[13px] leading-relaxed text-text">
              If the pipeline fails or exceeds its latency budget, output falls back to a
              pass-through camera.
            </p>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
            Informational. In the finished system the fallback keeps the meeting running rather
            than dropping your video; in this prototype it is a stated behaviour, not a running
            watchdog.
          </p>
        </Card>
      </div>
    </div>
  )
}

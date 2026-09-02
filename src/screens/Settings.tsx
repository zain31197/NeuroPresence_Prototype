import { BadgeCheck, GraduationCap, Info, Lock, Moon, Palette, ShieldCheck, Sun, UserRound } from 'lucide-react'
import { COPY, PROJECT } from '../mock/constants'
import { useEngine } from '../mock/engine'
import { Avatar } from '../components/Avatar'
import { Button, Card, CardHeader, Chip, Segmented, Toggle } from '../components/ui'

export function Settings() {
  const {
    enrolledUser,
    restartEnrollment,
    gateEnabled,
    setGateEnabled,
    watermark,
    setWatermark,
    theme,
    setTheme,
  } = useEngine()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="np-page-title">Settings</h2>
        <p className="mt-1 max-w-[46rem] text-[13px] leading-relaxed text-text-muted">
          Identity, safeguards and appearance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* -------------------------- identity -------------------------- */}
        <Card>
          <CardHeader
            icon={<UserRound size={16} />}
            title="Identity"
            subtitle="The enrolled likeness the consent gate checks against."
            right={
              <Chip tone={enrolledUser ? 'success' : 'warning'}>
                {enrolledUser ? 'Enrolled' : 'Not enrolled'}
              </Chip>
            }
          />
          <div className="flex items-center gap-3.5 rounded-control border border-border bg-surface-2/50 px-3.5 py-3">
            <Avatar
              name={enrolledUser?.name ?? 'NP'}
              size={44}
              ring={enrolledUser ? 'success' : 'warning'}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-text">
                {enrolledUser?.name ?? 'No identity enrolled'}
              </p>
              <p className="truncate text-[12px] text-text-muted">
                {enrolledUser ? (
                  <>
                    <span className="font-mono">{enrolledUser.embeddingId}</span> · enrolled{' '}
                    {enrolledUser.enrolledAt.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </>
                ) : (
                  'Run enrollment to create a reference identity.'
                )}
              </p>
            </div>
          </div>
          <Button className="mt-4" onClick={restartEnrollment}>
            Re-enroll
          </Button>
          <p className="mt-2.5 text-[11px] leading-relaxed text-text-muted">
            {COPY.enrollmentNote} No embedding is computed in this build — the identifier is a
            label.
          </p>
        </Card>

        {/* ----------------------- consent policy ----------------------- */}
        <Card>
          <CardHeader
            icon={<ShieldCheck size={16} />}
            title="Consent policy"
            subtitle="Default: the consent gate is on."
            right={<Chip tone={gateEnabled ? 'success' : 'warning'}>{gateEnabled ? 'ON' : 'OFF'}</Chip>}
          />
          <Toggle
            checked={gateEnabled}
            onChange={setGateEnabled}
            tone="success"
            label="Consent gate"
            description={COPY.consentVerified}
          />
          <div className="mt-4 flex items-start gap-2.5 rounded-control border border-border bg-surface-2/50 px-3.5 py-3">
            <Lock size={14} className="mt-0.5 shrink-0 text-text-muted" />
            <p className="text-[12px] leading-relaxed text-text-muted">
              Animation is restricted to the enrolled likeness. This restriction is a product
              policy, not a user preference — the toggle exists so the safeguard can be
              demonstrated, and the finished system targets a true-accept rate of ≥ 95% for the
              enrolled user.
            </p>
          </div>
        </Card>

        {/* --------------------- disclosure policy ---------------------- */}
        <Card>
          <CardHeader
            icon={<BadgeCheck size={16} />}
            title="Disclosure policy"
            subtitle="Whether the synthetic-media overlay is shown by default."
            right={<Chip tone={watermark ? 'accent' : 'muted'}>{watermark ? 'ON' : 'OFF'}</Chip>}
          />
          <Toggle
            checked={watermark}
            onChange={setWatermark}
            tone="accent"
            label="Show synthetic-media disclosure"
            description={`Overlay reads: “${COPY.watermark}”`}
          />
          <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
            Recommended on. Other participants can then see that the feed is reenacted.
          </p>
        </Card>

        {/* -------------------------- appearance ------------------------ */}
        <Card>
          <CardHeader
            icon={<Palette size={16} />}
            title="Appearance"
            subtitle="Dark is the default — it matches the studio tools this sits beside."
          />
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] font-medium text-text">Theme</span>
            <Segmented<'dark' | 'light'>
              ariaLabel="Theme"
              size="sm"
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'dark', label: 'Dark', icon: <Moon size={13} /> },
                { value: 'light', label: 'Light', icon: <Sun size={13} /> },
              ]}
            />
          </div>
        </Card>
      </div>

      {/* ---------------------------- about ---------------------------- */}
      <Card>
        <CardHeader
          icon={<GraduationCap size={16} />}
          title="About"
          subtitle={`${PROJECT.name} — final-year project`}
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <p className="np-label mb-2">Team</p>
            <ul className="space-y-1.5">
              {PROJECT.team.map((member) => (
                <li key={member.roll} className="flex items-center gap-2.5">
                  <Avatar name={member.name} size={26} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] text-text">{member.name}</span>
                    <span className="block font-mono text-[11px] text-text-muted">
                      {member.roll}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="np-label mb-2">Supervisor</p>
            <p className="text-[13px] text-text">{PROJECT.supervisor}</p>

            <p className="np-label mb-2 mt-4">University</p>
            <p className="text-[13px] text-text">{PROJECT.university}</p>
          </div>

          <div>
            <p className="np-label mb-2">Product</p>
            <p className="text-[13px] text-text">{PROJECT.name}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-text-muted">{PROJECT.tagline}</p>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-control border border-accent/25 bg-accent/[0.07] px-3.5 py-3">
          <Info size={14} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-[12px] leading-relaxed text-text">{COPY.prototypeDisclosure}</p>
        </div>
      </Card>
    </div>
  )
}

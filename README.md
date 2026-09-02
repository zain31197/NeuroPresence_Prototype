# NeuroPresence — Proof-of-Concept UI Prototype

A high-fidelity, interactive prototype of the NeuroPresence desktop application: a tool that lets
you appear composed and professional in online meetings by driving a pre-recorded **source clip**
of yourself with live motion, and streaming the result to meeting apps as a **virtual camera**.

> **This is a UI prototype with simulated data. There is no real pipeline.**
> Prototype build. Interface demonstration with simulated data; the reenactment pipeline is not
> implemented in this build.
>
> No neural network, no LivePortrait, no PyTorch/ONNX/TensorRT, no face tracking, no identity
> matching, no virtual camera, no backend, no database, no network calls. Every number, gate
> decision and render you see is produced by `src/mock/`.

---

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

Build static files for deployment (Netlify / Vercel / GitHub Pages):

```bash
npm run build        # → dist/
npm run preview      # serve the production build locally
```

The build uses a relative `base`, so `dist/` works from any path.

Requires Node 18+. Tested on Node 24.

---

## What is real and what is simulated

| Area | In this prototype |
|---|---|
| Every screen, control and state | **Real** — built, interactive, keyboard accessible |
| Session lifecycle (idle → warming → live) | Simulated timers |
| Live metrics (latency, FPS, VRAM, CSIM) | Simulated sampler, `src/mock/sampler.ts` |
| Baseline figures | **Real measured numbers** from our hardware (see below) |
| Consent gate | UI state, not a classifier |
| Output preview | The selected source clip, drawn procedurally — never model output |
| Webcam "driving signal" thumbnail | Optional real passthrough; frames are displayed, never analysed |
| Offline render | 5-second progress timer; the download is the on-screen stand-in |
| Virtual camera | A label in a dropdown |

The metrics panel carries a permanent **`simulated`** badge, and a prototype disclosure appears in
the sidebar, the page footer and Settings → About.

---

## Screens

0. **Landing / project overview** (opens here) — the whole project in one scrolling page: the
   problem, the pipeline, the two modes, the safeguards, the measured-vs-target proof section, the
   FR map, meeting integration and the team. **Launch prototype** enters the app; the sidebar logo
   and **Project overview** return to it.
1. **Onboarding / Identity Enrollment** — three steps: welcome → capture identity (a 2-second
   simulated "Analyzing facial embedding…") → choose a source clip. A **Skip — use demo identity**
   link jumps straight to the Console. Reachable again from Settings → Re-enroll.
2. **Console** (home, the centrepiece) — the 16:9 **Virtual Camera Output** frame, Start/Stop with
   a 1.5s warm-up, the **reenactment pipeline** strip (webcam → motion → consent gate → reenactment
   → virtual camera, animating while live and halting at the gate when the gate blocks), the live
   telemetry panel, the consent gate card, the disclosure watermark card, the active source-clip
   selector, and the optional driving-signal thumbnail.
3. **Source Clips** — three seed clips plus a mock **Add source clip** upload. Sets the active clip
   used everywhere else.
4. **Offline Studio** — the non-real-time mode: pick a clip → upload a driving video → input-quality
   checklist → resolution and temporal smoothing → simulated render → output and download.
5. **Devices & Output** — camera input selection, the **NeuroPresence Camera** output card, Zoom /
   Google Meet / Microsoft Teams support, the desktop-only limitation, and the fallback note.
6. **Settings** — identity and re-enrollment, consent policy, disclosure policy, theme, and About
   (team, supervisor, university, prototype disclosure).

---

## Page management (URLs)

Every screen has a hash route, so the browser's back and forward buttons work, a screen can be
linked to or bookmarked, and a hard refresh lands where you left off. Hash routes rather than
history paths, because the build ships as static files — `#/console` still resolves on a refresh
with no server rewrite rules.

| Route | Screen |
|---|---|
| `#/` | Landing / project overview |
| `#/enroll` | Onboarding — identity enrollment |
| `#/console` | Console |
| `#/source-clips` | Source Clips |
| `#/offline-studio` | Offline Studio |
| `#/devices` | Devices & Output |
| `#/settings` | Settings |

The document title follows the route. Landing-page section links scroll programmatically and never
write an anchor into the URL, so `#/…` always means "a screen". Deep-linking straight into an app
screen falls back to the demo identity, so the shell is never half-enrolled.

Useful during a defense: open the browser on `…/#/console` and the laptop is already on the
centrepiece screen with no clicking.

---

## Measured numbers vs. targets

The **Baseline** view of the metrics panel shows our actual measurements — not invented figures.

**Hardware:** NVIDIA RTX 5050 laptop GPU, 8 GB VRAM. OS: Kubuntu Linux.

**Measured proof-of-concept** (unoptimized baseline, actual LivePortrait weights):

| Metric | Value |
|---|---|
| Mean per-frame latency | 130.1 ms |
| p95 latency | 133.9 ms |
| p99 latency | 138.7 ms |
| Throughput | 7.7 FPS |
| Peak VRAM (inference) | 1.57 GB |
| Fine-tune fit check (2 of 5 modules, FP32, batch 1) | 6.68 GB peak |

**Engineering targets** (the finished-product operating point):

| Attribute | Target |
|---|---|
| Per-frame reenactment compute | ≤ 42 ms |
| Throughput | ≥ 24 FPS |
| End-to-end latency (capture → virtual camera) | ≤ 150 ms worst case |
| Peak GPU memory | ≤ 8 GB |
| Identity preservation (CSIM) | ≥ 0.80 |
| Consent gate true-accept (enrolled user) | ≥ 95% |
| Endurance | ≥ 30 min continuous, no OOM |

**Target** display mode simulates the operating goal (latency 38–45 ms, FPS 22–25, VRAM 3.5–4.5 GB,
CSIM 0.83–0.88). **Baseline** display mode holds near the measured constants, and reports CSIM as
`n/a (baseline)` because the baseline run produced no identity-similarity figure.

Switching to **Baseline** also reveals the **engineering gap** panel: both figures drawn to the same
scale, with the 88.1 ms that has to come out and the 3.1× speed-up stated plainly. That gap is the
project.

---

## Guided demo (the script, driven by the app)

The click-path below is also built into the prototype. Press **Guided demo** in the sidebar, or
**Watch the 3-min tour** on the landing page, and the app walks itself through all nine steps:
it starts the session, flips Target → Baseline, trips the consent gate, renders in the Offline
Studio and ends on Devices & Output — spotlighting each panel as it goes and showing the line to
say underneath.

| Control | Action |
|---|---|
| `→` / `←` | Next / previous step (also pauses auto-advance) |
| `space` | Play or pause |
| `esc` | Exit the tour |
| Step dots | Jump straight to any chapter |

It auto-advances by default so it can run unattended, and pausing lets you talk over a step for as
long as you like. The overlay is click-through, so you can still drive the app by hand at any point
without leaving the tour. Nothing extra is simulated — the tour operates exactly the same controls a
presenter would click.

---

## Demo script for the defense

A rehearsed 3–4 minute click-path — the same one the guided demo automates.

1. **Open on the Console, session idle.**
   "This is NeuroPresence. I've already enrolled my identity; my presentable source clip is loaded."
2. **Start Session.**
   "Starting a live session — the system warms up, then streams to a virtual camera." (LIVE chips
   appear.)
3. **Point at the metrics panel, in Target mode.**
   "This is the live telemetry: per-frame latency, frames per second, GPU memory, and identity
   similarity. These are the targets our finished system runs at."
4. **Flip to Baseline.**
   "And this is our *measured* proof-of-concept on the actual RTX 5050 — 130 ms per frame, 7.7 FPS.
   That gap, 130 down to 42 milliseconds, is exactly the engineering our project delivers."
   *(The honest, high-impact moment — state clearly that these are measured numbers.)*
5. **Toggle the disclosure watermark.**
   "We can attach a synthetic-media disclosure so other participants know the feed is reenacted."
6. **Simulate non-enrolled face.**
   "The consent gate only animates my own enrolled likeness — a non-matching face is blocked."
7. **Switch to Offline mode, render once.**
   "The same feature set also runs offline: upload a recording, and with no latency limit we
   produce a higher-fidelity result."
8. **Devices & Output.**
   "Integration is app-agnostic: we present as a virtual camera that Zoom, Meet, and Teams read as
   an ordinary webcam — no per-app plugin."
9. **Close.**
   "This prototype is the interface; the reenactment pipeline is our FYP build. Our proof of concept
   has already measured feasibility on our hardware."

**Honesty note for the presenter:** always say the metrics are simulated in the prototype, and that
130 ms is the measured baseline you intend to reduce to 42 ms. Never imply the prototype is doing
real reenactment.

### Demo tips

- **If anything goes wrong on the day, press Guided demo.** It resets the session, the gate, the
  watermark and the render, then plays the whole path itself.
- The Offline Studio render needs a video file. Any short `.mp4`/`.mov`/`.webm` works — nothing is
  processed. A file whose name contains **"bad"**, or the **Simulate poor input** switch, shows the
  honest failure state instead. (The guided demo loads its own stand-in recording, so you never have
  to pick a file mid-sentence.)
- The driving-signal thumbnail on the Console asks for camera permission only when you press
  **Show camera preview**, so it will never interrupt the walkthrough.
- **Start Session** is disabled while the consent gate is blocked — that is the safeguard working,
  not a bug.

---

## Tech stack

React 18 · Vite 6 · TypeScript · Tailwind CSS 3 · lucide-react · Framer Motion.

State lives in React context (`src/mock/engine.tsx`) and in memory only — no `localStorage`, no
`sessionStorage`, no backend.

```
neuropresence-poc/
  public/clips/            placeholder source clips (empty — clips are drawn, see below)
  src/
    app/                   Sidebar, TopBar
    screens/               Onboarding, Console, SourceClips, OfflineStudio, Devices, Settings
    components/            MetricsPanel, ConsentGate, WatermarkCard, SessionControls,
                           VideoFrame, ClipCanvas, DrivingSignal, Sparkline, ui primitives
    mock/                  engine.tsx (session + gate + render), sampler.ts (metrics),
                           seedData.ts, constants.ts (Appendix A numbers, approved microcopy)
    index.css              design tokens
  tailwind.config.js
```

### Why there are no video files

The three seed source clips are **drawn** on a canvas (`src/components/ClipCanvas.tsx`) rather than
shipped as videos: the repo stays small, the clips look consistent, and nothing in the build can be
mistaken for model output. A clip you add through **Add source clip** plays back as the real file
you chose. To use your own footage as a seed clip instead, drop files in `public/clips/` and give
the corresponding entry in `src/mock/seedData.ts` a `src` field.

---

## Accessibility and responsiveness

- All controls are focusable and operable from the keyboard, with visible focus rings.
- `prefers-reduced-motion` disables the metric ticking, the pulsing LIVE dot and the clip animation.
- Metric values use fixed-width tabular numerals, so nothing reflows as they update.
- Usable from 1024 px upward; the sidebar collapses to icons on narrower screens.
- **Light theme by default**, with the brief's dark palette one click away in Settings →
  Appearance (or the moon icon in the landing-page header). Both are designed, not inverted.

---

## Project

**Team:** Zain Shahid (i232582), Muhammad Talha Arshad (i232548), Sana Ullah Farooqi (i232594)
**Supervisor:** Muhammad Aamir Gulzar
**University:** FAST-NUCES Islamabad

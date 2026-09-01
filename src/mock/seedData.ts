import type { SourceClip } from './types'

/**
 * Three seed source clips so the app is populated on first run.
 * Each renders as a procedurally drawn stand-in (see components/ClipCanvas.tsx);
 * no video files are shipped and nothing here is model output.
 */
export const SEED_CLIPS: SourceClip[] = [
  {
    id: 'clip_office_navy',
    name: 'Office — Navy Blazer',
    duration: '18s',
    resolution: '512×512',
    scene: 'office',
    palette: {
      from: '#16202c',
      to: '#0d141c',
      key: '#3b82f6',
      garment: '#1e2b45',
      skin: '#c08d6e',
      hair: '#241a16',
    },
  },
  {
    id: 'clip_home_study',
    name: 'Home Study',
    duration: '24s',
    resolution: '512×512',
    scene: 'study',
    palette: {
      from: '#241c18',
      to: '#120f0d',
      key: '#f59e0b',
      garment: '#3a3f4a',
      skin: '#b5825f',
      hair: '#1c1310',
    },
  },
  {
    id: 'clip_plain_wall',
    name: 'Plain Wall',
    duration: '12s',
    resolution: '512×512',
    scene: 'plain',
    palette: {
      from: '#1b2430',
      to: '#0f151c',
      key: '#8b5cf6',
      garment: '#2b3440',
      skin: '#c7946f',
      hair: '#201713',
    },
  },
]

/** Palettes cycled through when the user adds their own clip. */
export const USER_CLIP_PALETTES: SourceClip['palette'][] = [
  {
    from: '#132226',
    to: '#0b1316',
    key: '#22c55e',
    garment: '#1f3a36',
    skin: '#c18f6c',
    hair: '#211814',
  },
  {
    from: '#221826',
    to: '#110c14',
    key: '#8b5cf6',
    garment: '#33284a',
    skin: '#bb8763',
    hair: '#1d1411',
  },
]

export const INPUT_DEVICES = [
  'FaceTime HD Camera',
  'USB Webcam',
  'Integrated Camera (1080p)',
] as const

export const MEETING_APPS = [
  { name: 'Zoom', mark: 'Z', tint: '#2D8CFF' },
  { name: 'Google Meet', mark: 'M', tint: '#00AC47' },
  { name: 'Microsoft Teams', mark: 'T', tint: '#6264A7' },
] as const

export const RENDER_STAGES = [
  'Aligning face…',
  'Transferring motion…',
  'Compositing…',
  'Finalizing…',
] as const

export const INPUT_CHECKS_PASS = [
  'Face detected',
  'Front-facing',
  'Adequate lighting',
  'Single face',
] as const

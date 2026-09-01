import type { Screen } from '../mock/types'

/* ------------------------------------------------------------------ *
 * Page management.
 *
 * Hash routes rather than history paths: the build is deployed as
 * static files (Netlify / Vercel / GitHub Pages), and a hash URL still
 * resolves on a hard refresh without any server rewrite rules.
 *
 * In-page anchors on the landing page scroll programmatically and never
 * touch the hash, so `#/…` always means "a screen" and nothing else.
 * ------------------------------------------------------------------ */

export const ROUTES: Record<Screen, string> = {
  landing: '#/',
  onboarding: '#/enroll',
  console: '#/console',
  clips: '#/source-clips',
  offline: '#/offline-studio',
  devices: '#/devices',
  settings: '#/settings',
}

const BY_HASH = new Map<string, Screen>(
  (Object.entries(ROUTES) as Array<[Screen, string]>).map(([screen, hash]) => [hash, screen]),
)

export const TITLES: Record<Screen, string> = {
  landing: 'NeuroPresence — Composed presence for online meetings',
  onboarding: 'Get started · NeuroPresence',
  console: 'Console · NeuroPresence',
  clips: 'Source Clips · NeuroPresence',
  offline: 'Offline Studio · NeuroPresence',
  devices: 'Devices & Output · NeuroPresence',
  settings: 'Settings · NeuroPresence',
}

/** Screens that live behind the application shell. */
export function isAppScreen(screen: Screen) {
  return screen !== 'landing' && screen !== 'onboarding'
}

export function hashForScreen(screen: Screen) {
  return ROUTES[screen]
}

/**
 * Resolves a location hash to a screen. Returns null for anything that is
 * not a route — an in-page anchor, or an unknown path — so the caller can
 * leave the current screen alone.
 */
export function screenFromHash(hash: string): Screen | null {
  if (!hash || hash === '#') return 'landing'
  if (!hash.startsWith('#/')) return null

  const normalized = hash.replace(/\/+$/, '') || '#/'
  return BY_HASH.get(normalized === '#' ? '#/' : normalized) ?? 'landing'
}

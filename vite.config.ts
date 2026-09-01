import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the static build works from any path
// (Netlify / Vercel / GitHub Pages / opened from disk).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173, open: true },
})

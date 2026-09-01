/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Channel-based so every utility supports an alpha modifier
      // (bg-success/10, border-danger/40, …).
      colors: {
        bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2-rgb) / <alpha-value>)',
        border: 'rgb(var(--border-rgb) / <alpha-value>)',
        text: 'rgb(var(--text-rgb) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted-rgb) / <alpha-value>)',
        primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
        'primary-hover': 'rgb(var(--primary-hover-rgb) / <alpha-value>)',
        success: 'rgb(var(--success-rgb) / <alpha-value>)',
        warning: 'rgb(var(--warning-rgb) / <alpha-value>)',
        danger: 'rgb(var(--danger-rgb) / <alpha-value>)',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        control: '9px',
        chip: '6px',
        xl2: '20px',
      },
      // Themed elevation — light leans on shadow, dark on borders.
      boxShadow: {
        card: 'var(--shadow-card)',
        raised: 'var(--shadow-raised)',
        hover: 'var(--shadow-hover)',
        hero: 'var(--shadow-hero)',
      },
      maxWidth: {
        content: '1180px',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.45', transform: 'scale(.86)' },
        },
        'ring-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(0,-24px,0) scale(1.05)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'dash-flow': {
          '0%': { strokeDashoffset: '48' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'ring-sweep': 'ring-sweep 2.4s linear infinite',
        'fade-up': 'fade-up .25s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.8s linear infinite',
        'gradient-pan': 'gradient-pan 7s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 14s ease-in-out infinite',
        marquee: 'marquee 34s linear infinite',
        'dash-flow': 'dash-flow 1.4s linear infinite',
      },
    },
  },
  plugins: [],
}

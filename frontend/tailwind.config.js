/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       { DEFAULT: '#04060f', 1: '#070a17', 2: '#0b0f1e', 3: '#111828', 4: '#162035' },
        cyan:     { neon: '#00e5ff', dim: '#00c4dd', DEFAULT: '#00e5ff' },
        purple:   { neon: '#8b5cf6', dim: '#7c3aed', DEFAULT: '#8b5cf6' },
        pink:     { neon: '#ec4899', DEFAULT: '#ec4899' },
      },
      fontFamily: {
        sans:   ['Inter', 'system-ui', 'sans-serif'],
        mono:   ['JetBrains Mono', 'Fira Code', 'monospace'],
        display:['Space Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan':   '0 0 0 1px rgba(0,229,255,0.15), 0 0 30px rgba(0,229,255,0.15), 0 0 80px rgba(0,229,255,0.06)',
        'neon-purple': '0 0 0 1px rgba(139,92,246,0.15), 0 0 30px rgba(139,92,246,0.15), 0 0 80px rgba(139,92,246,0.06)',
        'neon-green':  '0 0 20px rgba(34,197,94,0.3)',
        'neon-red':    '0 0 20px rgba(244,63,94,0.3)',
        'glass':       '0 8px 40px rgba(0,0,0,0.5)',
        'card-lift':   '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(0,229,255,0.06)',
        'inner-shine': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      animation: {
        'float':        'float 8s ease-in-out infinite',
        'float-slow':   'float-slow 12s ease-in-out infinite',
        'pulse-cyan':   'pulse-glow-cyan 2.5s ease-in-out infinite',
        'pulse-purple': 'pulse-glow-purple 2.5s ease-in-out infinite',
        'rotate-slow':  'rotate-slow 20s linear infinite',
        'shimmer':      'shimmer 2.5s linear infinite',
        'fade-up':      'fadeUp 0.6s ease-out forwards',
        'scale-in':     'scale-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'border-rotate':'border-rotate 6s linear infinite',
        'aurora':       'aurora-drift 18s ease-in-out infinite alternate',
        'scan':         'scan 3s ease-in-out infinite',
        'blink':        'blink 1s step-start infinite',
      },
    },
  },
  plugins: [],
}

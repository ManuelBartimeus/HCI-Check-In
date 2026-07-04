/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Design System Colors (from DESIGN-framer.md) ────────────────
      colors: {
        canvas: '#090909',
        'surface-1': '#141414',
        'surface-2': '#1c1c1c',
        hairline: '#262626',
        'hairline-soft': '#1a1a1a',
        ink: '#ffffff',
        'ink-muted': '#999999',
        'accent-blue': '#0099ff',
        'gradient-violet': '#6a4cf5',
        'gradient-magenta': '#d44df0',
        'gradient-orange': '#ff7a3d',
        'gradient-coral': '#ff5577',
        'semantic-success': '#22c55e',
      },

      // ── Typography ──────────────────────────────────────────────────
      fontFamily: {
        display: ['"Mona Sans"', '"Hubot Sans"', 'Inter', 'sans-serif'],
        body: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display-xxl': ['110px', { lineHeight: '0.85', letterSpacing: '-5.5px' }],
        'display-xl': ['85px', { lineHeight: '0.95', letterSpacing: '-4.25px' }],
        'display-lg': ['62px', { lineHeight: '1.00', letterSpacing: '-3.1px' }],
        'display-md': ['32px', { lineHeight: '1.13', letterSpacing: '-1.0px' }],
        'headline': ['22px', { lineHeight: '1.20', letterSpacing: '-0.8px' }],
        'subhead': ['24px', { lineHeight: '1.30', letterSpacing: '-0.01px' }],
        'body-lg': ['18px', { lineHeight: '1.30', letterSpacing: '-0.18px' }],
        'body': ['15px', { lineHeight: '1.30', letterSpacing: '-0.15px' }],
        'body-sm': ['14px', { lineHeight: '1.40', letterSpacing: '-0.14px' }],
        'caption': ['13px', { lineHeight: '1.20', letterSpacing: '-0.13px' }],
        'micro': ['12px', { lineHeight: '1.20', letterSpacing: '-0.12px' }],
      },

      // ── Border Radius ────────────────────────────────────────────────
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '10px',
        'lg': '15px',
        'xl': '20px',
        '2xl': '30px',
        'pill': '100px',
        'full': '9999px',
      },

      // ── Spacing ──────────────────────────────────────────────────────
      spacing: {
        'hair': '1px',
        'xxs': '4px',
        'xs': '8px',
        'sm': '12px',
        'md': '15px',
        'lg': '20px',
        'xl': '30px',
        'xxl': '40px',
        'section': '96px',
      },

      // ── Box Shadows ──────────────────────────────────────────────────
      boxShadow: {
        'card': '0 0 0 0.5px rgba(255,255,255,0.08), 0 10px 30px rgba(0,0,0,0.4)',
        'card-hover': '0 0 0 0.5px rgba(255,255,255,0.14), 0 20px 40px rgba(0,0,0,0.5)',
        'focus': '0 0 0 1px rgba(0,153,255,0.5), 0 0 0 3px rgba(0,153,255,0.15)',
        'glow-violet': '0 0 60px rgba(106,76,245,0.35)',
        'glow-magenta': '0 0 60px rgba(212,77,240,0.35)',
      },

      // ── Animations ────────────────────────────────────────────────────
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-down': { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(106,76,245,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(106,76,245,0.6)' },
        },
        'pulse-glow-red': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,77,77,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255,77,77,0.6)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 1.5s infinite linear',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pulse-glow-red': 'pulse-glow-red 2s ease-in-out infinite',
      },

      // ── Backdrop Blur ────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

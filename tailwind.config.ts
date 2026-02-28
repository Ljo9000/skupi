import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          purple:       '#6C47FF',
          'purple-light': '#8B6FFF',
        },
        // Dark palette
        dark: {
          900: '#0D0F1A',
          800: '#13162A',
          700: '#1C2040',
          600: '#2A2F55',
          500: '#363B6B',
        },
        // Semantic (override Tailwind defaults with our tones)
        success: {
          DEFAULT: '#22C55E',
          bg:     'rgba(34,197,94,0.12)',
          border: 'rgba(34,197,94,0.25)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg:     'rgba(245,158,11,0.1)',
          border: 'rgba(245,158,11,0.2)',
        },
        // 5C: renamed from 'danger' to 'error' to match globals.css CSS variables
        error: {
          DEFAULT: '#EF4444',
          bg:     'rgba(239,68,68,0.1)',
          border: 'rgba(239,68,68,0.2)',
        },
        // Text aliases for readability
        'text-primary':   '#FFFFFF',
        'text-secondary': '#A0A8C8',
        'text-muted':     '#8A93BC',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      // 5A: Fixed radius scale — xl and 2xl were both 24px (bug)
      borderRadius: {
        sm:    '6px',
        md:    '10px',
        lg:    '12px',   // covers rounded-[12px] uses
        xl:    '16px',   // cards
        '2xl': '24px',   // large modals / hero elements
        full:  '9999px',
      },
      // 5B: Utility class for the 11px uppercase label pattern (~12 occurrences)
      fontSize: {
        'xs-label': ['11px', { lineHeight: '16px', letterSpacing: '0.06em', fontWeight: '600' }],
      },
      boxShadow: {
        'dark-sm': '0 1px 3px rgba(0,0,0,0.4)',
        'dark-md': '0 4px 20px rgba(0,0,0,0.5)',
        'dark-lg': '0 16px 60px rgba(0,0,0,0.6)',
        'purple':  '0 8px 24px rgba(108,71,255,0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
}

export default config

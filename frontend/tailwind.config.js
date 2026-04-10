/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59F0A', // Main Orange - Updated
          600: '#D97706', // Hover Orange - Updated
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        dark: {
          50: '#F8F9FB',
          100: '#E5E7EB',
          200: '#D1D5DB',
          300: '#9CA3AF',
          400: '#6B7280',
          500: '#4B5563',
          600: '#374151',
          700: '#2B2B2B', // Dark Text
          800: '#1E1E1E', // Accent Dark
          900: '#111827',
        },
        success: '#16A34A',
        error: '#DC2626',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        serif:   ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        mono:    ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
        heading: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
      },
      fontSize: {
        // Prototype heading scale
        'display':  ['4.5rem',  { lineHeight: '1.05', fontWeight: '700' }], // 72px — hero h1 desktop
        'h1':       ['3.75rem', { lineHeight: '1.1',  fontWeight: '700' }], // 60px
        'h2':       ['3rem',    { lineHeight: '1.15', fontWeight: '600' }], // 48px — section titles
        'h3':       ['2rem',    { lineHeight: '1.2',  fontWeight: '600' }], // 32px
        'h4':       ['1.5rem',  { lineHeight: '1.3',  fontWeight: '600' }], // 24px
        'h5':       ['1.25rem', { lineHeight: '1.4',  fontWeight: '600' }], // 20px
        'label':    ['0.6875rem',{ lineHeight: '1',   fontWeight: '600', letterSpacing: '0.1em' }], // 11px badge/label
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'large': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'xl': '0 10px 40px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(244, 160, 0, 0.3)',
        'glow-strong': '0 0 30px rgba(244, 160, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

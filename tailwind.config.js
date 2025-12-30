/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.html',
    './src/**/*.{js,jsx,ts,tsx,vue}',
    './ui_components/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Liquid Glass Chic Design System - INSTITUTIONAL
        background: 'rgb(var(--bg-main) / <alpha-value>)',
        foreground: 'rgb(var(--text-main) / <alpha-value>)',
        
        glass: {
          DEFAULT: 'rgba(var(--bg-glass), var(--glass-opacity))',
          hover: 'rgba(var(--bg-glass), var(--glass-opacity-hover))',
          strong: 'rgba(var(--bg-glass), var(--glass-opacity-strong))',
          border: 'rgba(var(--border-glass), var(--border-opacity))',
          'border-hover': 'rgba(var(--border-glass), var(--border-opacity-hover))',
        },

        muted: 'rgb(var(--text-muted) / <alpha-value>)',
        subtle: 'rgb(var(--text-subtle) / <alpha-value>)',
        
        accent: {
          DEFAULT: 'rgb(var(--accent-primary) / <alpha-value>)',
          primary: 'rgb(var(--accent-primary) / <alpha-value>)',
          secondary: 'rgb(var(--accent-secondary) / <alpha-value>)',
        },

        info: 'rgb(var(--info) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',

        // Legacy civic colors (kept for compatibility)
        civic: {
          background: '#0E1116',
          glass: 'rgba(255, 255, 255, 0.06)',
          'glass-hover': 'rgba(255, 255, 255, 0.09)',
          primary: '#3A7AFE',
          'primary-dark': '#2E65E6',
          'primary-light': '#4D8BFF',
          secondary: '#2EC4B6',
          'secondary-dark': '#27A89C',
          'secondary-light': '#3DD5C7',
          text: '#E6EAF0',
          'text-secondary': '#A9B0C2',
          'text-muted': '#7C859C',
        },

        // Legacy brand colors for A KI PRI SA YÉ (kept for compatibility)
        primary: {
          DEFAULT: '#3A7AFE',
          50: '#e6f0ff',
          100: '#b3d4ff',
          200: '#80b8ff',
          300: '#4d9cff',
          400: '#1a80ff',
          500: '#3A7AFE',
          600: '#2E65E6',
          700: '#2250CC',
          800: '#163BB3',
          900: '#0A2699',
        },
        
        dark: {
          DEFAULT: '#0E1116',
          50: '#1a2028',
          100: '#151922',
          200: '#10131a',
          300: '#0E1116',
          400: '#090b10',
          500: '#07080c',
          600: '#05070a',
          700: '#000000',
        },
        
        // DOM-COM territory colors
        territory: {
          guadeloupe: '#0066cc',
          martinique: '#cc0000',
          guyane: '#008844',
          reunion: '#ff6600',
          mayotte: '#9933cc',
          saintpierre: '#006699',
          saintbarth: '#ffcc00',
          saintmartin: '#ff3399',
          wallis: '#663399',
          polynesie: '#00cccc',
          nouvellecaledonie: '#cc6600',
          taaf: '#3366cc',
        },
      },
      
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans', 'Source Sans 3', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      
      backdropBlur: {
        civic: '12px',
        glass: 'var(--blur-civic)',
        strong: 'var(--blur-strong)',
      },
      
      borderRadius: {
        xl: 'var(--radius)',
        '2xl': 'calc(var(--radius) + 4px)',
        civic: 'var(--radius)',
        '4xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      minHeight: {
        '44': '2.75rem', // WCAG 2.1 AA minimum touch target
      },
      minWidth: {
        '44': '2.75rem', // WCAG 2.1 AA minimum touch target
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px - WCAG minimum
        'base': ['0.875rem', { lineHeight: '1.5rem' }], // 14px default (changed from 16px)
        'lg': ['1rem', { lineHeight: '1.75rem' }],      // 16px
        'xl': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1' }],           // 48px
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 2px 16px rgba(0, 0, 0, 0.12)',
        'hard': '0 4px 24px rgba(0, 0, 0, 0.15)',
        'dark': '0 4px 16px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      // Contrast ratios for WCAG 2.1 AA compliance (minimum 4.5:1)
      contrast: {
        '4.5': '4.5', // WCAG AA normal text
        '7': '7', // WCAG AAA normal text
      },
    },
  },
  plugins: [],
};

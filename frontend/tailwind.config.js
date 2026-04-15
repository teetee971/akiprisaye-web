/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './ui_components/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  
  theme: {
    extend: {
      colors: {
        // Design system moderne optimisé
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
          DEFAULT:  'rgb(var(--accent-primary) / <alpha-value>)',
          primary: 'rgb(var(--accent-primary) / <alpha-value>)',
          secondary: 'rgb(var(--accent-secondary) / <alpha-value>)',
        },
        
        info: 'rgb(var(--info) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
        
        // Couleurs essentielles — mappées sur les tokens CSS
        civic: {
          background: 'rgb(var(--bg-main) / <alpha-value>)',
          glass: 'rgba(var(--bg-glass), var(--glass-opacity))',
          primary: 'rgb(var(--accent-primary) / <alpha-value>)',
          secondary: 'rgb(var(--accent-secondary) / <alpha-value>)',
          text: 'rgb(var(--text-main) / <alpha-value>)',
        },
      },
      
      fontFamily:  {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      
      backdropBlur: {
        civic: '12px',
        glass: 'var(--blur-civic)',
      },
      
      borderRadius: {
        civic: 'var(--radius)',
      },
      
      minHeight:  {
        '44': '2.75rem',
      },
      
      minWidth: {
        '44': '2.75rem',
      },
      
            // Animations essentielles uniquement
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up':  'slideUp 0.5s ease-out',
        'slide-up-delay-1': 'slideUp 0.5s ease-out 0.1s both',
        'slide-up-delay-2': 'slideUp 0.5s ease-out 0.2s both',
        'slide-up-delay-3': 'slideUp 0.5s ease-out 0.3s both',
        'float': 'floatY 4s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      
      keyframes:  {
        fadeIn: {
          '0%': { opacity:  '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':  { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  
  plugins: [],
};

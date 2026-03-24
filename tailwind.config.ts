import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      boxShadow: {
        'glow': '0 0 48px -12px rgba(13, 148, 136, 0.35)',
        'glow-lg': '0 0 64px -16px rgba(13, 148, 136, 0.28)',
        'glass': '0 8px 32px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.85)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        '3d': '0 1px 0 #fff, 0 2px 0 #eee, 0 3px 0 #ddd, 0 4px 0 #ccc, 0 5px 0 #bbb, 0 6px 0 #aaa, 0 7px 0 #999, 0 8px 0 #888, 0 9px 0 #777, 0 10px 10px rgba(0,0,0,0.2)',
        '3d-gold': '0 1px 0 rgba(255,255,255,0.3), 0 2px 0 rgba(255,255,255,0.2), 0 3px 0 rgba(210,180,140,0.4), 0 4px 0 rgba(184,134,11,0.5), 0 5px 0 rgba(160,120,0,0.5), 0 6px 0 rgba(140,100,0,0.5), 0 7px 0 rgba(120,85,0,0.5), 0 8px 0 rgba(100,70,0,0.5), 0 9px 0 rgba(80,55,0,0.5), 0 10px 15px rgba(0,0,0,0.35)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};

export default config;

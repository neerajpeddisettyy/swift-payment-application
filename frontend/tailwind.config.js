/** Swift design tokens */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: 'rgb(var(--color-midnight) / <alpha-value>)', // sidebar, balance card, virtual card
        obsidian: 'rgb(var(--color-obsidian) / <alpha-value>)', // app background
        surface: 'rgb(var(--color-surface) / <alpha-value>)', // cards
        surface2: 'rgb(var(--color-surface2) / <alpha-value>)', // raised / hover surfaces
        cobalt: '#EE3524', // primary actions
        credit: 'rgb(var(--color-credit) / <alpha-value>)', // money in
        ink: 'rgb(var(--color-ink) / <alpha-value>)', // primary text
        muted: 'rgb(var(--color-muted) / <alpha-value>)', // secondary text
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '70%': { transform: 'scale(1.06)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-up': 'fade-up 0.35s ease-out',
        'sheet-up': 'sheet-up 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
        pop: 'pop 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

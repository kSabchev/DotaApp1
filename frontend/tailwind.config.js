/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        radiant: '#4ade80',
        'radiant-dark': '#16a34a',
        dire: '#f87171',
        'dire-dark': '#dc2626',
        'dota-bg': '#0d1117',
        'dota-surface': '#161b22',
        'dota-border': '#30363d',
        'dota-accent': '#c89b3c',
        'dota-hover': '#1c2129',
      },
    },
  },
  plugins: [],
}

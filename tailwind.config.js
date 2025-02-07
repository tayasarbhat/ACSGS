/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        primary: '#6366f1',
        'primary-dark': '#4f46e5',
        secondary: '#ec4899',
        accent: '#8b5cf6',
      },
    },
  },
  plugins: [],
};
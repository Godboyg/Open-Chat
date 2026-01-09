// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // 👈 includes TS + TSX
  ],
  theme: {
    extend: {
      keyframes: {
        expand: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(50)', opacity: '1' }, // ✅ works fine
        },
      },
      animation: {
        expand: 'expand 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
};
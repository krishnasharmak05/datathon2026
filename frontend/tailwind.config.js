/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Allow manual class toggle or defaults
  theme: {
    extend: {
      colors: {
        police: {
          dark: '#0B111E',
          card: '#161F30',
          accent: '#2A75D3',
          glow: '#00F0FF',
          crimson: '#FF2A54',
          gold: '#FFD700',
        }
      },
      boxShadow: {
        glow: '0 0 15px rgba(0, 240, 255, 0.4)',
        crimsonGlow: '0 0 15px rgba(255, 42, 84, 0.4)',
      }
    },
  },
  plugins: [],
}

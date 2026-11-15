/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#0B0F19',
        surface: '#111827',
        'card-bg': '#162032',
        'card-border': '#1F2D44',
        'accent-primary': '#4F46E5', // Indigo
        'accent-secondary': '#06B6D4', // Cyan
        platforms: {
          bluesky: '#0085FF',
          mastodon: '#6364FF',
          devto: '#F3F4F6',
          telegram: '#26A5E4',
          discord: '#5865F2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 25px -5px rgba(79, 70, 229, 0.25)',
        'glow-success': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
      }
    },
  },
  plugins: [],
}

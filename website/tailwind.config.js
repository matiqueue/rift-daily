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
        rift: {
          bg: '#09090b',
          card: 'rgba(24, 24, 27, 0.7)',
          cardBorder: 'rgba(255, 255, 255, 0.1)',
          emerald: '#10B981',
          emeraldSoft: 'rgba(16, 185, 129, 0.15)',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

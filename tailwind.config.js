/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light Professional Theme - Finance Friendly
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',  // Main accent color
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        background: {
          DEFAULT: 'transparent',  // Gradient Background
          card: '#FFFFFF',         // White Cards
        },
        text: {
          primary: '#1F2937',   // Dark Grey Text
          secondary: '#6B7280', // Medium Grey Text
          light: '#9CA3AF',     // Light Grey Text
        },
        // Error/Blocked Theme
        error: {
          background: '#FFF1F2',
          text: '#7F1D1D',
          accent: '#DC2626',
          border: '#FCA5A5',
        },
        // Success Theme
        success: {
          background: '#F0FDF4',
          text: '#14532D',
          accent: '#22C55E',
        },
      },
      backgroundColor: {
        'app': '#FFFFFF',
      },
    },
  },
  plugins: [],
}




import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // Use root path for all environments
  base: '/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    host: true, // Allow external connections
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/expense-tracker-api': {
        target: 'http://localhost:8086',
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Prevents source code and JSX structure from being reconstructed in DevTools
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Strips console.log statements from production build
        drop_debugger: true, // Strips debugger statements
      },
      format: {
        comments: false, // Strips code comments
      },
    },
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable', 'html2canvas'],
          'vendor-icons': ['lucide-react'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
}))

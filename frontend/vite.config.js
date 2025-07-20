import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // Ensure _redirects file is copied
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist'
  },
  // Fix for React Router - serve index.html for all routes
  preview: {
    port: 5173,
    host: true
  }
})
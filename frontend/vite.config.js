import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    
    // Base public path when served in production
    base: env.VITE_BASE_PATH || '/',
    
    // Build configuration
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'terser' : false,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: {
            // Split vendor and app code
            vendor: ['react', 'react-dom', 'react-router-dom'],
            // Split tone.js as it's large and used in specific components
            tone: ['tone'],
          },
        },
      },
    },
    
    // Development server configuration
    server: {
      port: 5173,
      host: true,
      strictPort: true,
      open: false,
      proxy: {
        // Proxy API requests to the backend in development
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    
    // Preview server configuration (for testing production build locally)
    preview: {
      port: 4173,
      host: true,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    
    // Environment variables
    define: {
      'process.env': {},
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
  };
});
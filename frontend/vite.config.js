import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

// Force install the correct esbuild binary for the current platform
import { platform, arch } from 'os';
import { execSync } from 'child_process';

const isRender = process.env.RENDER === 'true';

// Install the correct esbuild binary for the current platform
if (isRender) {
  try {
    const platformName = platform() === 'win32' ? 'windows' : platform() === 'darwin' ? 'darwin' : 'linux';
    const archName = arch() === 'x64' ? '64' : '32';
    const pkg = `@esbuild/${platformName}-${archName}`;
    console.log(`Installing ${pkg}...`);
    execSync(`npm install --no-save ${pkg}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to install esbuild binary:', error);
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'tone',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled'
    ],
    esbuildOptions: {
      // Ensure JSX is handled properly
      loader: {
        '.js': 'jsx'
      },
      // Target modern browsers
      target: 'es2020',
      // Force the correct platform for esbuild
      platform: 'node',
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      // Handle large dependencies
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'audio-vendor': ['tone']
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    open: true, // Automatically open browser
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Handle WebSockets if needed
        ws: true
      },
    },
    // Enable HMR (Hot Module Replacement)
    hmr: {
      overlay: true
    }
  },
  
  // Preview server configuration (for testing production build locally)
  preview: {
    port: 4173,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  
  // Environment variables
  define: {
    'process.env': {},
    // Add any global constants here
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  },
  
  // CSS handling
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/variables.scss";`
      }
    }
  }
});
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  build: {
    rollupOptions: {
      output: isSsrBuild
        ? {}
        : {
            manualChunks(id) {
              if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
                return 'vendor-react';
              }
              if (id.includes('node_modules/lucide-react/')) {
                return 'vendor-lucide';
              }
              if (id.includes('/components/admin/')) {
                return 'chunk-admin';
              }
              if (
                id.includes('/components/ProductDetailModal') ||
                id.includes('/components/ShareModal') ||
                id.includes('/components/InverterInfoModal') ||
                id.includes('/components/SmartSearchOverlay') ||
                id.includes('/components/site/SaharaMatchModal')
              ) {
                return 'chunk-modals';
              }
              if (
                id.includes('/utils/excel') ||
                id.includes('/utils/csv') ||
                id.includes('/utils/specNormalizer')
              ) {
                return 'chunk-utils';
              }
            },
          },
    },
    chunkSizeWarningLimit: 800,
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    cors: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:3004',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:3004',
        changeOrigin: true,
      },
    },
  },
  // @ts-ignore
  test: {
    environment: 'happy-dom',
    env: {
      NODE_ENV: 'test',
      ALLOW_TEMP_DATA_DIR: '1',
    },
    setupFiles: ['./src/test-setup.ts'],
    include: ['tests/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    exclude: ['backend/**', 'node_modules/**', 'tests/browser/**', 'tests/**/*.mjs'],
  },
}));

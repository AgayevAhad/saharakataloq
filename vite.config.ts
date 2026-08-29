/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    extensions: ['.web.tsx', '.tsx', '.web.ts', '.ts', '.web.jsx', '.jsx', '.web.js', '.js'],
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    cors: true,
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
  // @ts-ignore
  test: {
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}', 'Test/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['backend/**', 'node_modules/**'],
  },
});

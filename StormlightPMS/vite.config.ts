import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    // Tighter chunk-size warning — we now code-split + vendor-split, so any
    // chunk above 300 KB should be inspected.
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'query-vendor': ['@tanstack/react-query'],
          'forms-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'date-vendor': ['date-fns', 'date-fns-tz'],
          'csv-vendor': ['papaparse'],
        },
      },
    },
  },
});

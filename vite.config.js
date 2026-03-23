import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/DTR_OJT/',   // ← match exactly, case sensitive
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/dtr-ojt-api': {
        target: 'http://127.0.0.1:80',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
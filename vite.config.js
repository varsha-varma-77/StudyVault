import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
    // Proxy /api and /uploads to the Express backend
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        resources: resolve(import.meta.dirname, 'resources.html'),
        upload: resolve(import.meta.dirname, 'upload.html'),
        profile: resolve(import.meta.dirname, 'profile.html'),
        auth: resolve(import.meta.dirname, 'auth.html'),
      },
    },
  },
});

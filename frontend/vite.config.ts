import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The dev server proxies /api/* to Spring Boot, so the browser never hits CORS problems.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});

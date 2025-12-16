import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/catholic-history-atlas/', // Update this to match your GitHub repo name, or '/' for custom domain
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('leaflet')) {
              return 'vendor-leaflet';
            }
            return 'vendor-other';
          }

          // Data chunks by century
          if (id.includes('/data/people/century-')) {
            const match = id.match(/century-(\d+)/);
            if (match) {
              const century = parseInt(match[1]);
              if (century <= 4) return 'data-early';
              if (century <= 13) return 'data-medieval';
              return 'data-modern';
            }
          }

          // Static data
          if (id.includes('/data/events.json') || id.includes('/data/places.json')) {
            return 'data-static';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600, // Adjust warning limit
  },
});

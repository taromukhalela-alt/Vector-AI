import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import sitemap from 'vite-plugin-sitemap'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    sitemap({
      hostname: 'https://vector-ai.co.za',

      dynamicRoutes: [
        '/',
        '/chat',
        '/notes',
        '/match-animation',
        '/voice-tutor',
      ],
    }),
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },

      '/auth': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },

      '/chat': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },

      '/match-animation': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
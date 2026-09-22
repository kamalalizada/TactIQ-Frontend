import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// The API port differs between setups, so it stays configurable.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_URL ?? 'http://localhost:5199'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        // Keeps the browser on one origin, so JWT and SignalR need no CORS dance.
        '/api': { target, changeOrigin: true },
        '/hubs': { target, changeOrigin: true, ws: true },
      },
    },
  }
})

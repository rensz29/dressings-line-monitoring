import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Allow the dev server to be reached through an ngrok tunnel (URL rotates,
    // so allow the whole domain). Use `true` to allow any host.
    allowedHosts: [".ngrok-free.app"],
    proxy: {
      // Same-origin in dev → the bridge server. No CORS needed from the app.
      "/api": "http://localhost:8080",
      "/ws": { target: "ws://localhost:8080", ws: true },
    },
  },
})

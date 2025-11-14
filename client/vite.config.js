import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Read config file
const __dirname = dirname(fileURLToPath(import.meta.url))
const configPath = join(__dirname, 'config.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: config.devPort,
    proxy: {
      '/socket.io': {
        target: config.serverUrl,
        ws: true,  // Enable WebSocket proxying
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../server/static',  // Build to server folder
    emptyOutDir: true
  }
})

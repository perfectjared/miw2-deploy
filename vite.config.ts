import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    // Add HMR settings to prevent issues with game state
    hmr: {
      overlay: false // Disable error overlay to prevent interference
    }
  },
  build: {
    target: 'esnext'
  },
  // Add optimization settings
  optimizeDeps: {
    include: ['phaser']
  }
})


import { defineConfig } from 'vite'

export default defineConfig({
  base: '/miw2-deploy/', // GitHub Pages base path
  server: {
    host: true,
    // Add HMR settings to prevent issues with game state
    hmr: {
      overlay: false // Disable error overlay to prevent interference
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets'
  },
  // Add optimization settings
  optimizeDeps: {
    include: ['phaser']
  }
})


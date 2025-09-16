import { defineConfig } from 'vite'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => ({
  base: mode === 'production' ? '/miw2-deploy/' : '/', // GitHub Pages base path only for production builds
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
  },
  plugins: [
    {
      name: 'copy-external-scripts',
      writeBundle() {
        // Copy rexuiplugin.js to dist
        copyFileSync(
          resolve(__dirname, 'public/rexuiplugin.js'),
          resolve(__dirname, 'dist/rexuiplugin.js')
        )
      }
    }
  ]
}))


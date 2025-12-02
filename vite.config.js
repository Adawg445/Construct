import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 5173,
    open: false,  // Don't auto-open browser
    cors: true,   // Enable CORS for local network access
    strictPort: false
  },
  publicDir: 'public',
  // Ensure public directory files are served correctly
  build: {
    rollupOptions: {
      output: {
        // Preserve directory structure
        preserveModules: false
      }
    }
  }
})

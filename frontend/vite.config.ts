import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Allow importing the framework-free core from ../shared (sibling of frontend/)
    fs: { allow: ['..'] },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the framework stack from app code: vendor changes only on
        // dependency upgrades, so it stays cached across app deploys — and
        // both chunks land under the 500 kB warning threshold.
        manualChunks(id: string) {
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Allow importing the framework-free core from ../shared (sibling of frontend/)
    fs: { allow: ['..'] },
  },
})

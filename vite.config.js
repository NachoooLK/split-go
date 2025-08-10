import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base se puede ajustar con VITE_BASE_PATH si se despliega bajo subruta
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          react: ['react', 'react-dom']
        }
      }
    }
  }
})



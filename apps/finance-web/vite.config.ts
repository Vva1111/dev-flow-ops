import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    proxy: {
      '/api': mode === 'e2e' ? 'http://127.0.0.1:3101' : 'http://127.0.0.1:3001',
    },
  },
}))

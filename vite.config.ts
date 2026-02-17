import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/autumn-ascendant/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})

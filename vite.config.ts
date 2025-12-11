import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/catholic-history-atlas/', // Update this to match your GitHub repo name, or '/' for custom domain
})

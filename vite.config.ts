import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps asset paths relative so the built app works from any subpath
export default defineConfig({
  base: './',
  plugins: [react()],
})

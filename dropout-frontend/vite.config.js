import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/dropout-frontend/' // Replace with your exact GitHub repository name
})
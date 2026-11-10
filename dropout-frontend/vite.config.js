import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/dropout-frontend/', // Make sure this matches your exact GitHub repo name!
})
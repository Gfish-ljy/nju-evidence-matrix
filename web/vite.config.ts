import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  // GitHub Pages project site: /nju-evidence-matrix/
  base: command === 'build' ? '/nju-evidence-matrix/' : '/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    fs: { allow: ['..'] },
  },
}))

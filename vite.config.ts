import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': '/src',
      '@pages': '/src/ui/pages',
      '@components': '/src/lib/components',
      '@lib': '/src/lib',
      '@store': '/src/store',
      '@styles': '/src/styles',
      '@utils': '/src/utils',
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})


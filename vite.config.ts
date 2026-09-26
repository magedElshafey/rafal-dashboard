/// <reference types="vitest" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(() => ({
  resolve: {
    dedupe: ['react', 'react-dom', 'react-i18next'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [...react(), tailwindcss()],

  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
}))

/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
  },
  // Vitest picks up this block. Component/hook/store tests need a DOM, so we run
  // under jsdom; the E2E specs in e2e/ belong to Playwright and are excluded here.
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
})

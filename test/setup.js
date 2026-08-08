// Global test setup, loaded before every Vitest file (see vite.config.js `test.setupFiles`).
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Keep tests isolated: unmount any mounted React trees and wipe persisted state
// so localStorage-backed hooks/store start each test from a clean slate.
afterEach(() => {
  cleanup()
  localStorage.clear()
})

import { test, expect } from '@playwright/test'
import { seed, sampleForest } from './helpers.js'

// Seed a forest so pressing Start stays on the Timer view (no onboarding jump).
test.beforeEach(async ({ page }) => {
  await seed(page, { 'pomodoro.forests': [sampleForest()] })
  await page.goto('/')
})

test('loads with the default focus timer', async ({ page }) => {
  await expect(page).toHaveTitle(/Bloom/)
  await expect(page.getByText('25:00')).toBeVisible()
  await expect(page.getByRole('button', { name: /start/i })).toBeVisible()
})

test('start and pause via the button and the spacebar', async ({ page }) => {
  await page.getByRole('button', { name: /start/i }).click()
  await expect(page.getByRole('button', { name: /pause/i })).toBeVisible()
  await expect(page).toHaveTitle(/Focus/) // tab title reflects the countdown

  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: /start/i })).toBeVisible()
})

test('switching mode tabs changes the displayed duration', async ({ page }) => {
  await page.getByRole('tab', { name: 'Short Break' }).click()
  await expect(page.getByText('5:00')).toBeVisible()
  await page.getByRole('tab', { name: 'Long Break' }).click()
  await expect(page.getByText('15:00')).toBeVisible()
})

test('skip advances to the next phase', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip to next phase' }).click()
  await expect(page.getByText('5:00')).toBeVisible() // focus → short break
})

test('reset restores the full duration', async ({ page }) => {
  await page.getByRole('button', { name: /start/i }).click()
  await page.waitForTimeout(1100) // let a second tick off
  await page.getByRole('button', { name: 'Reset timer' }).click()
  await expect(page.getByText('25:00')).toBeVisible()
})

import { test, expect } from '@playwright/test'
import { seed, sampleForest } from './helpers.js'

// Each Playwright test gets an isolated browser context, so localStorage starts
// empty here → no forest exists yet.
test('first Start with no forest sends the user to the globe to pick a place', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /start/i }).click()

  // The view switches to Forest and prompts for a country.
  await expect(page.getByRole('tab', { name: 'Forest' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText(/Pick where to grow your first forest/i)).toBeVisible()
  await expect(page.getByText(/Tap a country to plant here/i)).toBeVisible()
})

test('with a forest already chosen, Start stays on the timer', async ({ page }) => {
  await seed(page, { 'pomodoro.forests': [sampleForest()] })
  await page.goto('/')
  await page.getByRole('button', { name: /start/i }).click()

  await expect(page.getByRole('tab', { name: 'Timer' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('button', { name: /pause/i })).toBeVisible()
})

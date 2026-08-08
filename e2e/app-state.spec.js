import { test, expect } from '@playwright/test'
import { seed, sampleForest } from './helpers.js'

test.describe('seeded app state', () => {
  test.beforeEach(async ({ page }) => {
    // 120 focus minutes today = 2 trees, pinned to a forest in the USA.
    await seed(page, {
      'pomodoro.forests': [sampleForest()],
      'pomodoro.history': [{ ts: Date.now(), minutes: 120, taskId: null, forestId: 'f-test' }],
    })
    await page.goto('/')
  })

  test('statistics reflect the seeded history', async ({ page }) => {
    await expect(page.getByText('2h all-time')).toBeVisible()
  })

  test('the forest view shows the grown trees', async ({ page }) => {
    await page.getByRole('tab', { name: 'Forest' }).click()
    await expect(page.getByText(/2 trees grown in United States/i)).toBeVisible()
    await expect(page.getByText('2 / 24 🌳')).toBeVisible()
  })

  test('theme toggle flips the document theme', async ({ page }) => {
    const html = page.locator('html')
    await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    await expect(html).toHaveAttribute('data-theme', 'dark')
    await page.getByRole('button', { name: 'Switch to light mode' }).click()
    await expect(html).toHaveAttribute('data-theme', 'light')
  })
})

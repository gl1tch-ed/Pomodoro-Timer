import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('add, activate, complete and remove a task', async ({ page }) => {
  // Add
  await page.getByLabel('New task title').fill('Write E2E tests')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText('Write E2E tests')).toBeVisible()

  // Activate (click the row) → it becomes the focused task
  await page.getByText('Write E2E tests').click()
  await expect(page.getByText('Focusing on')).toBeVisible()
  await expect(page.locator('.active-task-title')).toHaveText('Write E2E tests')

  // Complete
  await page.getByRole('button', { name: 'Mark task as done' }).click()
  await expect(page.getByRole('button', { name: 'Mark task as not done' })).toBeVisible()

  // Remove → back to the empty state
  await page.getByRole('button', { name: 'Delete task' }).click()
  await expect(page.getByText(/No tasks yet/i)).toBeVisible()
})

test('estimate stepper adjusts the pomodoro count', async ({ page }) => {
  await expect(page.getByText('1🍅')).toBeVisible()
  await page.getByRole('button', { name: 'Increase estimate' }).click()
  await expect(page.getByText('2🍅')).toBeVisible()
})

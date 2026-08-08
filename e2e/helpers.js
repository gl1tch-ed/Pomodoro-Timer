// Shared E2E helpers.

// A ready-made forest so pressing Start does NOT trigger the onboarding redirect.
export function sampleForest() {
  return {
    id: 'f-test',
    index: 0,
    countryId: 'USA',
    countryName: 'United States',
    hueIndex: 0,
    startedAt: Date.now(),
    completedAt: null,
    focusMinutes: 0,
    breaks: 0,
    tasksCompleted: 0,
  }
}

/**
 * Seed localStorage BEFORE the app boots. `addInitScript` runs on every
 * navigation prior to page scripts, so the store hydrates from this state.
 */
export async function seed(page, data) {
  await page.addInitScript((entries) => {
    for (const [key, value] of entries) {
      window.localStorage.setItem(key, JSON.stringify(value))
    }
  }, Object.entries(data))
}

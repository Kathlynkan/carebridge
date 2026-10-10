// Child journey: quests and leaderboard.              Owner: Jachin
// Seed data used:
//   child@carebridge.sg = Ethan (c_1)
//   h_1 "Fraction addition worksheet" is status='assigned' at the start of each run
//   h_2 is status='verified' (Ethan has 120 points in seed)
//
// Note: tests run sequentially across projects (chromium then mobile) against one
// shared database. The submit test mutates h_1, so it is marked chromium-only.
// Mobile tests check structure and read-only behaviour only.
import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Child quests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'child')
    await expect(page).toHaveURL(/\/child$/)
  })

  test('My Quests page shows the quest and finished sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Quests to do/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Finished/i })).toBeVisible()
    // Ethan always has homework in some state regardless of prior test mutations
    await expect(page.locator('[data-test="homework-card"]').first()).toBeVisible()
  })

  // Mutates h_1 from 'assigned' -> 'submitted'; only run once on chromium so the
  // mobile project (which runs after) is not left with zero assigned quests.
  test('clicking I\'m done! submits the quest and shows waiting message', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'state-mutating test runs on chromium only')

    await expect(page.locator('[data-test="submit-quest-btn"]').first()).toBeVisible()
    const todoBefore = await page.locator('[data-test="submit-quest-btn"]').count()

    await page.locator('[data-test="submit-quest-btn"]').first().click()

    await expect(page.locator('[data-test="submit-quest-btn"]')).toHaveCount(todoBefore - 1)
    await expect(page.locator('[data-test="waiting-message"]').first()).toBeVisible()
  })

  test('badge shelf renders all expected badges', async ({ page }) => {
    await expect(page.getByText('First Quest')).toBeVisible()
    await expect(page.getByText('Century')).toBeVisible()
  })
})

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'child')
    await page.goto('/child/leaderboard')
  })

  test('leaderboard page loads and shows entries', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Leaderboard/i })).toBeVisible()
    await expect(page.locator('[data-test="podium-1"]')).toBeVisible()
  })

  test('switching to Most improved tab activates it', async ({ page }) => {
    await page.locator('[data-test="tab-improved"]').click()
    await expect(page.locator('[data-test="tab-improved"]')).toHaveClass(/active/)
  })
})

// Parent portal journey.                               Owner: Jachin
// Seed data used:
//   parent@kidslapis.sg = Ms Grace Wong, parent of Ethan (c_1) and Mia (c_7)
//   Ethan has 7+ sessions with varied moods (frustrated, okay, happy) and
//   a recurring struggle ("Finding common denominators")
//
// All tests are read-only: they do not mutate any data, so they are safe
// to run on both Desktop Chrome and iPhone 6 in sequence.
import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Parent portal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'parent')
    await expect(page).toHaveURL(/\/parent$/)
  })

  test('lands on parent home and shows greeting', async ({ page }) => {
    // PageHeader uses firstName(auth.user.name), Ms Grace's first name resolves to "Ms Grace"
    await expect(page.getByText(/Hello/)).toBeVisible()
    await expect(page.getByText("Here's what's been happening at student care.")).toBeVisible()
  })

  test('shows the selected child name and berries', async ({ page }) => {
    // Ethan is the first child for parent@kidslapis.sg
    await expect(page.getByText('Ethan Wong')).toBeVisible()
    // The child card shows level and berry count
    await expect(page.getByText(/berries earned/)).toBeVisible()
  })

  test('shows the handover card', async ({ page }) => {
    const handover = page.locator('[data-test="handover-card"]')
    await expect(handover).toBeVisible()
    // The parent-audience summary uses the "Working on" label, not the volunteer "Continue" label
    await expect(handover).toContainText('Working on')
  })

  test('shows recurring struggles badge for Ethan', async ({ page }) => {
    // Ethan has "Finding common denominators" in multiple sessions -> recurring badge appears
    await expect(page.locator('[data-test="recurring-badge"]').first()).toBeVisible()
  })

  test('shows session timeline with mood labels', async ({ page }) => {
    const timeline = page.locator('[data-test="session-timeline"]')
    await expect(timeline).toBeVisible()
    // Ethan has sessions with mood: frustrated -> "😕 Found it hard",
    //   okay -> "🙂 Doing okay", happy -> "😊 Happy"
    // At least one of these should appear in his recent sessions
    const moodLabels = ['Found it hard', 'Doing okay', 'Happy', 'A bit tired']
    let foundMood = false
    for (const label of moodLabels) {
      const count = await timeline.getByText(label).count()
      if (count > 0) {
        foundMood = true
        break
      }
    }
    expect(foundMood, 'Expected at least one mood label in session timeline').toBe(true)
  })

  test('shows the SkillProgressChart', async ({ page }) => {
    // Chart only renders when the child has sessions; Ethan has 7+
    await expect(page.locator('[data-test="skill-progress-chart"]')).toBeVisible()
  })

  test('shows child switcher when parent has two children', async ({ page }) => {
    // Ms Grace has Ethan (c_1) and Mia (c_7)
    const switcher = page.locator('[data-test="child-switcher"]')
    await expect(switcher).toBeVisible()
    await expect(switcher.getByRole('button', { name: /Ethan/ })).toBeVisible()
    await expect(switcher.getByRole('button', { name: /Mia/ })).toBeVisible()
  })

  test('switching children updates the child display', async ({ page }) => {
    // Start on Ethan, switch to Mia
    await expect(page.getByText('Ethan Wong')).toBeVisible()
    await page.locator('[data-test="child-switcher"]').getByRole('button', { name: /Mia/ }).click()
    await expect(page.getByText('Mia Wong')).toBeVisible()
    // Ethan's name should no longer be in the child-info card
    // (it may still appear in the switcher button, so scope to the heading area)
    await expect(page.locator('h2', { hasText: 'Ethan Wong' })).toHaveCount(0)
  })
})

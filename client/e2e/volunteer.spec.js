// Core journey: volunteer opens a child and sees the handover.   Owner: Yuqi
// Ning Xuan: add "record a session" tests here once POST /sessions works.
import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Volunteer handover', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'volunteer')
    // the Today tab depends on the real day of the week,
    // so tests use the "All my children" tab
    await page.locator('[data-test="tab-all"]').click()
  })

  test('sees only the children assigned to them', async ({ page }) => {
    // Aisha (volunteer@) is assigned Ethan, Arjun and Chloe in the seed data
    await expect(page.locator('[data-test="child-card"]')).toHaveCount(3)
  })

  test('search filters the children by name', async ({ page }) => {
    await page.locator('[data-test="child-search"]').fill('eth')
    await expect(page.locator('[data-test="child-card"]')).toHaveCount(1)
    await expect(page.locator('[data-test="child-card"]')).toContainText('Ethan')
  })

  test('level filter shows only that level', async ({ page }) => {
    // Ethan and Chloe are P4, Arjun is P3
    await page.locator('[data-test="level-filter"]').selectOption('P4')
    await expect(page.locator('[data-test="child-card"]')).toHaveCount(2)
  })

  test('opening a child shows the handover and history', async ({ page }) => {
    await page.locator('[data-test="child-card"]', { hasText: 'Ethan Wong' }).click()
    await expect(page).toHaveURL(/\/children\/c_1$/)

    const handover = page.locator('[data-test="handover-card"]')
    // works for both the AI summary and the fallback
    await expect(handover).toContainText('4/5')
    // Ethan's "Finding common denominators" appears twice in his last 5 sessions
    await expect(page.locator('[data-test="recurring-badge"]').first()).toBeVisible()

    await expect(page.locator('[data-test="session-card"]').first()).toBeVisible()
  })

  test('can open the record-session form', async ({ page }) => {
    await page.locator('[data-test="child-card"]', { hasText: 'Ethan Wong' }).click()
    await page.locator('[data-test="record-session"]').click()
    await expect(page.locator('[data-test="session-form"]')).toBeVisible()
  })
})
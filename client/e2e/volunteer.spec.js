// Core journey: volunteer opens a child and sees the handover.   Owner: Yuqi
// Ning Xuan: add "record a session" tests here once POST /sessions works.
import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Volunteer handover', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'volunteer')
  })

  test('sees only the children assigned to them', async ({ page }) => {
    // Aisha (volunteer@) is assigned Ethan, Arjun and Chloe in the seed data
    await expect(page.locator('[data-test="child-card"]')).toHaveCount(3)
  })

  test('opening a child shows the handover and history', async ({ page }) => {
    await page.locator('[data-test="child-card"]', { hasText: 'Ethan Wong' }).click()
    await expect(page).toHaveURL(/\/children\/c_1$/)

    const handover = page.locator('[data-test="handover-card"]')
    await expect(handover).toContainText('Fractions')
    await expect(handover).toContainText('4/5 correct')

    await expect(page.locator('[data-test="session-card"]').first()).toBeVisible()
  })

  test('can open the record-session form', async ({ page }) => {
    await page.locator('[data-test="child-card"]', { hasText: 'Ethan Wong' }).click()
    await page.locator('[data-test="record-session"]').click()
    await expect(page.locator('[data-test="session-form"]')).toBeVisible()
  })
})

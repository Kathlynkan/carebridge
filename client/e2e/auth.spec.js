// Core journey: logging in sends each role to the right home page.   Owner: Kai Sen
// Run all E2E tests:  pnpm test:e2e   (starts the API + Vue servers for you)
import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Authentication', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('progress')
  })

  test('volunteer lands on My Children', async ({ page }) => {
    await loginAs(page, 'volunteer')
    await expect(page).toHaveURL(/\/volunteer$/)
  })

  test('coordinator lands on the dashboard', async ({ page }) => {
    await loginAs(page, 'coordinator')
    await expect(page).toHaveURL(/\/coordinator$/)
    await expect(page.getByText('Sessions this week')).toBeVisible()
  })

  test('parent lands on the parent page', async ({ page }) => {
    await loginAs(page, 'parent')
    await expect(page).toHaveURL(/\/parent$/)
    await expect(page.getByText('Ethan Wong')).toBeVisible()
  })

  test('child lands on My Quests', async ({ page }) => {
    await loginAs(page, 'child')
    await expect(page).toHaveURL(/\/child$/)
    await expect(page.getByText('Quests to do')).toBeVisible()
  })

  test('wrong password shows an error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('volunteer@carebridge.sg')
    await page.getByLabel('Password').fill('wrong-password')
    await page.getByRole('button', { name: 'Log in', exact: true }).click()
    await expect(page.locator('[data-test="login-error"]')).toContainText('Incorrect')
  })

  test('protected pages redirect to login', async ({ page }) => {
    await page.goto('/coordinator')
    await expect(page).toHaveURL(/\/login\?redirect=/)
  })

  test('a parent cannot open the coordinator dashboard', async ({ page }) => {
    await loginAs(page, 'parent')
    await page.goto('/coordinator')
    await expect(page).toHaveURL(/\/parent$/)
  })
})

// The child's pirate adventure: berries, the Road to Becoming King of the Pirates, handing a quest in, the Bounty Board.   Owner: Jachin
import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Child: Road to Becoming King of the Pirates', () => {
  test('sees the wanted poster, berries, rank and the road', async ({ page }) => {
    await loginAs(page, 'child')
    await expect(page.locator('[data-test="wanted-poster"]')).toContainText('WANTED')
    await expect(page.locator('[data-test="wanted-poster"]')).toContainText('Luffy')
    await expect(page.locator('[data-test="berries"]')).toContainText(/฿\d+/)
    await expect(page.locator('[data-test="rank"]')).toBeVisible()
    await expect(page.locator('[data-test="road"]')).toBeVisible()
    await expect(page.locator('[data-test="road-next"]')).toContainText('to go')
  })

  test('shows every pirate badge, earned ones and locked ones', async ({ page }) => {
    await loginAs(page, 'child')
    await expect(page.locator('[data-test="badge"]')).toHaveCount(5)
  })

  test('handing a quest in sends it to the Captain and does NOT pay the berries yet', async ({ page }) => {
    await loginAs(page, 'child')
    const button = page.locator('[data-test="quest-done"]').first()
    // The desktop and phone runs share one database: the second run finds every quest already handed in.
    // eslint-disable-next-line playwright/no-conditional-in-test -- needed because the two runs share data
    if ((await button.count()) === 0) return

    const berriesBefore = await page.locator('[data-test="berries"]').innerText()
    const waitingBefore = await page.locator('[data-test="quest-waiting"]').count()
    await button.click()

    await expect(page.locator('[data-test="toast"]')).toContainText('Quest handed in')
    await expect(page.locator('[data-test="quest-waiting"]')).toHaveCount(waitingBefore + 1)
    await expect(page.locator('[data-test="berries"]')).toHaveText(berriesBefore)
  })

  test('the Bounty Board shows first names and highlights me', async ({ page }) => {
    await loginAs(page, 'child')
    await page.getByRole('link', { name: 'Bounty Board' }).first().click()
    await expect(page).toHaveURL(/\/child\/leaderboard$/)
    await expect(page.locator('[data-test="bounty-row"]').first()).toBeVisible()
    await expect(page.locator('[data-test="bounty-board"]')).toContainText(/you/i)
    // privacy: children are shown by first name only, never "Luffy Wong"
    await expect(page.locator('[data-test="bounty-board"]')).not.toContainText('Wong')
  })
})

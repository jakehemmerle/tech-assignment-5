const { test, expect } = require('@playwright/test');

test.describe('bv beads viewer', () => {
  test('loads the index page with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Poker Rewards Codex');
  });

  test('renders the main app container', async ({ page }) => {
    await page.goto('/');
    const app = page.locator('[x-data="beadsApp()"]');
    await expect(app).toBeVisible({ timeout: 10000 });
  });

  test('displays navigation tabs', async ({ page }) => {
    await page.goto('/');
    // Use first() to avoid strict mode violations from responsive duplicates
    await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Issues').first()).toBeVisible();
    await expect(page.getByText('Insights').first()).toBeVisible();
    await expect(page.getByText('Graph').first()).toBeVisible();
  });

  test('can navigate to issues view', async ({ page }) => {
    await page.goto('/');
    // Wait for the app to initialize
    await expect(page.locator('[x-data="beadsApp()"]')).toBeVisible({ timeout: 10000 });
    // Click on Issues tab using the direct href selector
    await page.locator('a[href="#/issues"]').first().click();
    // Verify the URL hash changed
    await expect(page).toHaveURL(/.*#\/issues/);
  });

  test('serves static assets correctly', async ({ page }) => {
    const response = await page.goto('/styles.css');
    expect(response.status()).toBe(200);

    const jsResponse = await page.goto('/viewer.js');
    expect(jsResponse.status()).toBe(200);
  });

  test('data directory is served', async ({ page }) => {
    const response = await page.goto('/data/meta.json');
    expect(response.status()).toBe(200);
  });
});

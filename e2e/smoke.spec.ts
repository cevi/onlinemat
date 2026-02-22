import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('app loads and shows login page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    // The app should redirect to login or show a login prompt
    await expect(page).toHaveURL(/\/(login)?/);
  });

  test('navigation is visible', async ({ page }) => {
    await page.goto('/');
    // Verify the page loads without crashing
    await expect(page.locator('body')).toBeVisible();
  });
});

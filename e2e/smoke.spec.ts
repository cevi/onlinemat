import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('app loads and shows home page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Onlinemat', { exact: true })).toBeVisible();
  });

  test('login button is visible on home page', async ({ page }) => {
    await page.goto('/');
    // Two "Anmelden" buttons (sidebar + main content); check the main one
    await expect(page.getByRole('main').getByRole('button', { name: /Anmelden/ })).toBeVisible();
  });

  test('feature cards are rendered', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Material durchstöbern')).toBeVisible();
    await expect(page.getByText('Online reservieren')).toBeVisible();
    await expect(page.getByText('Abteilungsübergreifend suchen')).toBeVisible();
  });

  test('page does not crash on navigation to /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Anmelden/ }).first()).toBeVisible();
  });
});

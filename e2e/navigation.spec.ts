import { test, expect } from '@playwright/test';
import { setupAuth } from './helpers/auth';

test.describe('Navigation - authenticated regular user', () => {
  test('sidebar shows expected menu items', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto('/');

    await expect(page.getByText('Onlinemat Dashboard')).toBeVisible({ timeout: 10_000 });

    // Core menu items visible to all authenticated users (scope to menu to avoid page headings)
    const menu = page.getByRole('menu');
    await expect(menu.getByText('Home')).toBeVisible();
    await expect(menu.getByText('Suchen')).toBeVisible();
    await expect(menu.getByText('Abteilungen')).toBeVisible();
    await expect(menu.getByText('Profile')).toBeVisible();
    await expect(menu.getByText('Abmelden')).toBeVisible();
  });

  test('clicking Abteilungen navigates to /abteilungen', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto('/');

    await expect(page.getByText('Onlinemat Dashboard')).toBeVisible({ timeout: 10_000 });

    // Click the Abteilungen menu item in the sidebar
    await page.getByRole('menuitem', { name: /Abteilungen/i }).click();
    await expect(page).toHaveURL(/\/abteilungen/);
  });

  test('clicking Suchen navigates to /suche', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto('/');

    await expect(page.getByText('Onlinemat Dashboard')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('menuitem', { name: /Suchen/i }).click();
    await expect(page).toHaveURL(/\/suche/);
  });

  test('clicking Profile navigates to /profile', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto('/');

    await expect(page.getByText('Onlinemat Dashboard')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('menuitem', { name: /Profile/i }).click();
    await expect(page).toHaveURL(/\/profile/);
  });
});

test.describe('Navigation - staff user', () => {
  test('sidebar shows additional staff menu items', async ({ page }) => {
    await setupAuth(page, 'staff');
    await page.goto('/');

    await expect(page.getByText('Onlinemat Dashboard')).toBeVisible({ timeout: 10_000 });

    // Staff-only items in the sidebar menu
    const menu = page.getByRole('menu');
    await expect(menu.getByText('Nutzende')).toBeVisible();
    await expect(menu.getByText('Statistiken')).toBeVisible();
    await expect(menu.getByText('Release Notes')).toBeVisible();
  });

  test('clicking Nutzende navigates to /users', async ({ page }) => {
    await setupAuth(page, 'staff');
    await page.goto('/');

    await expect(page.getByText('Onlinemat Dashboard')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('menuitem', { name: /Nutzende/i }).click();
    await expect(page).toHaveURL(/\/users/);
  });
});

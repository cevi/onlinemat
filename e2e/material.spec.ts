import { test, expect } from '@playwright/test';
import { setupAuth } from './helpers/auth';
import { TEST_ABTEILUNG_SLUG } from './helpers/constants';

test.describe('Material browsing - admin', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}/mat`);
    // Wait for materials to load
    await expect(page.getByText('Blache', { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test('material table renders with seeded items', async ({ page }) => {
    await expect(page.getByText('Blache', { exact: true })).toBeVisible();
    await expect(page.getByText('Kochtopf', { exact: true })).toBeVisible();
    await expect(page.getByText('Seil 10m')).toBeVisible();
  });

  test('search filters materials', async ({ page }) => {
    const searchInput = page.getByPlaceholder('nach Material suchen');
    await searchInput.fill('Blache');
    await searchInput.press('Enter');

    await expect(page.getByText('Blache', { exact: true })).toBeVisible();
    await expect(page.getByText('Kochtopf')).not.toBeVisible();
  });

  test('admin sees material management buttons', async ({ page }) => {
    await expect(page.getByText('Material hinzufügen')).toBeVisible();
  });

  test('add to cart button increments cart count', async ({ page }) => {
    // Find the add-to-cart button for the first material row
    const blacheRow = page.locator('table tbody tr').filter({ hasText: 'Blache' });
    const addToCartButton = blacheRow.getByRole('button').first();
    await addToCartButton.click();

    // The cart tab should show a count
    // Look for the cart tab in the menu which shows item count
    await expect(page.locator('[role="menuitem"]').filter({ hasText: /shopping/i }).or(
      page.locator('.ant-menu-item').filter({ hasText: '1' })
    )).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Material browsing - member', () => {
  test('member does not see material management buttons', async ({ page }) => {
    await setupAuth(page, 'member');
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}/mat`);

    await expect(page.getByText('Blache', { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Material hinzufügen')).not.toBeVisible();
  });

  test('member can still see and browse materials', async ({ page }) => {
    await setupAuth(page, 'member');
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}/mat`);

    await expect(page.getByText('Blache', { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Kochtopf', { exact: true })).toBeVisible();
  });
});

test.describe('Material browsing - guest', () => {
  test('guest sees the guest banner', async ({ page }) => {
    await setupAuth(page, 'guest');
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}/mat`);

    await expect(page.getByText('Du bist als Gast in dieser Abteilung')).toBeVisible({ timeout: 15_000 });
  });
});

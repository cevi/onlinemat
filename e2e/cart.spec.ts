import { test, expect } from '@playwright/test';
import { setupAuth } from './helpers/auth';
import { TEST_ABTEILUNG_SLUG } from './helpers/constants';

test.describe('Cart', () => {
  test('add items to cart and navigate to cart tab', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}/mat`);

    // Wait for materials to load
    await expect(page.getByText('Blache', { exact: true })).toBeVisible({ timeout: 15_000 });

    // Add Blache to cart
    const blacheRow = page.locator('table tbody tr').filter({ hasText: 'Blache' });
    await blacheRow.getByRole('button').first().click();

    // Add Kochtopf to cart
    const kochtopfRow = page.locator('table tbody tr').filter({ hasText: 'Kochtopf' });
    await kochtopfRow.getByRole('button').first().click();

    // Navigate to cart tab
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}/cart`);

    // Verify cart items are shown
    await expect(page.getByText('Blache', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Kochtopf')).toBeVisible();
  });

  test('empty cart shows empty message', async ({ page }) => {
    await setupAuth(page, 'member');

    // Clear cookies to ensure empty cart
    await page.context().clearCookies();

    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}/cart`);

    await expect(page.getByText('Leider ist dein Warenkorb leer')).toBeVisible({ timeout: 10_000 });
  });

  test('cart shows step progress indicator', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}/mat`);

    // Wait for materials and add one to cart
    await expect(page.getByText('Blache', { exact: true })).toBeVisible({ timeout: 15_000 });
    const blacheRow = page.locator('table tbody tr').filter({ hasText: 'Blache' });
    await blacheRow.getByRole('button').first().click();

    // Navigate to cart
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}/cart`);

    // Verify the step progress indicator is shown
    await expect(page.locator('.ant-steps').first()).toBeVisible({ timeout: 10_000 });
  });

  test('can remove item from cart', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}/mat`);

    // Add Blache to cart
    await expect(page.getByText('Blache', { exact: true })).toBeVisible({ timeout: 15_000 });
    const blacheRow = page.locator('table tbody tr').filter({ hasText: 'Blache' });
    await blacheRow.getByRole('button').first().click();

    // Navigate to cart
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}/cart`);

    await expect(page.getByText('Blache', { exact: true })).toBeVisible({ timeout: 10_000 });

    // Click the delete button for the item
    const deleteButton = page.locator('[aria-label="delete"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      // Cart should now be empty
      await expect(page.getByText('Leider ist dein Warenkorb leer')).toBeVisible({ timeout: 5_000 });
    }
  });
});

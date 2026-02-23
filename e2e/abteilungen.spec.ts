import { test, expect } from '@playwright/test';
import { setupAuth } from './helpers/auth';
import { TEST_ABTEILUNG_SLUG } from './helpers/constants';

test.describe('Abteilungen page', () => {
  test('shows department list heading', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto('/abteilungen');

    await expect(page.getByRole('heading', { name: 'Abteilungen' })).toBeVisible({ timeout: 10_000 });
  });

  test('renders the test Abteilung card', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto('/abteilungen');

    await expect(page.getByText('Test Abteilung')).toBeVisible({ timeout: 10_000 });
  });

  test('search filter narrows results', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto('/abteilungen');

    await expect(page.getByText('Test Abteilung')).toBeVisible({ timeout: 10_000 });

    // Type a search term
    const searchInput = page.getByPlaceholder('Abteilung suchen...');
    await searchInput.fill('Test');
    await expect(page.getByText('Test Abteilung')).toBeVisible();

    // Search for something that doesn't match
    await searchInput.fill('Nonexistent');
    await expect(page.getByText('Test Abteilung')).not.toBeVisible();
  });

  test('clicking an Abteilung card navigates to detail page', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto('/abteilungen');

    await expect(page.getByText('Test Abteilung')).toBeVisible({ timeout: 10_000 });

    // Click the "Details" button on the card to navigate
    await page.getByRole('button', { name: 'Details' }).click();
    await expect(page).toHaveURL(new RegExp(`/abteilungen/${TEST_ABTEILUNG_SLUG}`));
  });

  test('admin user sees "Abteilung hinzufügen" button', async ({ page }) => {
    // Staff users can create Abteilungen
    await setupAuth(page, 'staff');
    await page.goto('/abteilungen');

    await expect(page.getByRole('heading', { name: 'Abteilungen' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Abteilung hinzufügen')).toBeVisible();
  });
});

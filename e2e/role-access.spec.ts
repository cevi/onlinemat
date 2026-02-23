import { test, expect } from '@playwright/test';
import { setupAuth } from './helpers/auth';
import { TEST_ABTEILUNG_SLUG } from './helpers/constants';

test.describe('Role-based access - Admin', () => {
  test('admin sees all tabs on Abteilung detail page', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}`);

    // Wait for the page to load
    await expect(page.getByText('Abteilung Test Abteilung')).toBeVisible({ timeout: 15_000 });

    const menu = page.locator('[role="menu"]');

    // Admin should see all tabs
    await expect(menu.getByText('Material')).toBeVisible();
    await expect(menu.getByText('Standorte')).toBeVisible();
    await expect(menu.getByText('Kategorien')).toBeVisible();
    await expect(menu.getByText('Bestellungen')).toBeVisible();
    await expect(menu.getByText('Gruppen')).toBeVisible();
    await expect(menu.getByText('Mitglieder')).toBeVisible();
    await expect(menu.getByText('Einstellungen')).toBeVisible();
  });

  test('admin can navigate to settings tab', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}/settings`);

    await expect(page.getByText('Abteilungsname')).toBeVisible({ timeout: 15_000 });
  });

  test('admin can navigate to members tab', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}/members`);

    // Members tab should render the members list
    await expect(page.getByText('Mitglieder')).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Role-based access - Member', () => {
  test('member sees limited tabs on Abteilung detail page', async ({ page }) => {
    await setupAuth(page, 'member');
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}`);

    await expect(page.getByText('Abteilung Test Abteilung')).toBeVisible({ timeout: 15_000 });

    const menu = page.locator('[role="menu"]');

    // Member should see these tabs
    await expect(menu.getByText('Material')).toBeVisible();
    await expect(menu.getByText('Standorte')).toBeVisible();
    await expect(menu.getByText('Kategorien')).toBeVisible();
    await expect(menu.getByText('Bestellungen')).toBeVisible();
    await expect(menu.getByText('Gruppen')).toBeVisible();

    // Member should NOT see admin-only tabs
    await expect(menu.getByText('Mitglieder')).not.toBeVisible();
    await expect(menu.getByText('Einstellungen')).not.toBeVisible();
  });
});

test.describe('Role-based access - Guest', () => {
  test('guest sees minimal tabs on Abteilung detail page', async ({ page }) => {
    await setupAuth(page, 'guest');
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}`);

    await expect(page.getByText('Abteilung Test Abteilung')).toBeVisible({ timeout: 15_000 });

    const menu = page.locator('[role="menu"]');

    // Guest should see only Material and Bestellungen
    await expect(menu.getByText('Material')).toBeVisible();
    await expect(menu.getByText('Bestellungen')).toBeVisible();

    // Guest should NOT see these tabs
    await expect(menu.getByText('Standorte')).not.toBeVisible();
    await expect(menu.getByText('Kategorien')).not.toBeVisible();
    await expect(menu.getByText('Mitglieder')).not.toBeVisible();
    await expect(menu.getByText('Einstellungen')).not.toBeVisible();
  });

  test('guest sees the guest banner', async ({ page }) => {
    await setupAuth(page, 'guest');
    await page.goto(`/abteilungen/${TEST_ABTEILUNG_SLUG}`);

    await expect(page.getByText('Du bist als Gast in dieser Abteilung')).toBeVisible({ timeout: 15_000 });
  });
});

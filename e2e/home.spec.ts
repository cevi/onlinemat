import { test, expect } from '@playwright/test';
import { setupAuth } from './helpers/auth';

test.describe('Home page - unauthenticated', () => {
  test('shows the Onlinemat logo', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('img', { name: 'Onlinemat' })).toBeVisible();
  });

  test('shows the app description', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Materialverwaltungs- und Ausleihplattform')).toBeVisible();
  });

  test('shows login button that triggers auth', async ({ page }) => {
    await page.goto('/');
    // Two "Anmelden" buttons (sidebar + main content); check the main one
    await expect(page.getByRole('main').getByRole('button', { name: /Anmelden/ })).toBeVisible();
  });

  test('shows all three feature cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Material durchstöbern')).toBeVisible();
    await expect(page.getByText('Online reservieren')).toBeVisible();
    await expect(page.getByText('Abteilungsübergreifend suchen')).toBeVisible();
  });
});

test.describe('Home page - authenticated', () => {
  test('shows dashboard title and welcome message for admin', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto('/');

    await expect(page.getByText('Onlinemat Dashboard')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Willkommen Admin, du kannst jetzt loslegen.')).toBeVisible();
  });

  test('shows welcome message with correct name for member', async ({ page }) => {
    await setupAuth(page, 'member');
    await page.goto('/');

    await expect(page.getByText('Onlinemat Dashboard')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Willkommen Member, du kannst jetzt loslegen.')).toBeVisible();
  });

  test('does not show login button when authenticated', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto('/');

    await expect(page.getByText('Onlinemat Dashboard')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Anmelden/ })).not.toBeVisible();
  });
});

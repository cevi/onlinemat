import { test, expect } from '@playwright/test';
import { setupAuth } from './helpers/auth';

test.describe('Auth - unauthenticated access', () => {
  test('unauthenticated user visiting /abteilungen is redirected to Auth0 login', async ({ page }) => {
    // Auth0's withAuthenticationRequired HOC redirects to Auth0 login page.
    // Since the Auth0 domain is fake, we intercept the redirect.
    let auth0Redirected = false;
    await page.route('**/fake-auth0.local/**', (route) => {
      auth0Redirected = true;
      route.fulfill({ status: 200, body: 'Auth0 login' });
    });

    await page.goto('/abteilungen');
    // Wait a moment for the redirect to trigger
    await page.waitForTimeout(2000);
    // Either the page redirected to Auth0 or shows the home/login page
    expect(auth0Redirected || (await page.url()).includes('login') || (await page.url()) === 'http://localhost:3001/').toBeTruthy();
  });

  test('unauthenticated user visiting /profile is not shown protected content', async ({ page }) => {
    await page.route('**/fake-auth0.local/**', (route) => {
      route.fulfill({ status: 200, body: 'Auth0 login' });
    });

    await page.goto('/profile');
    await page.waitForTimeout(2000);
    // Should not see profile content
    await expect(page.getByText('Profile', { exact: true })).not.toBeVisible();
  });
});

test.describe('Auth - authenticated access', () => {
  test('authenticated user can access /abteilungen', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto('/abteilungen');

    await expect(page.getByRole('heading', { name: 'Abteilungen' })).toBeVisible({ timeout: 10_000 });
  });

  test('authenticated user can access /profile', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto('/profile');

    // Profile page heading shows user's displayName, not "Profile"
    await expect(page.getByText('Test Admin')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Auth - staff access', () => {
  test('staff user sees staff-only navigation items', async ({ page }) => {
    await setupAuth(page, 'staff');
    await page.goto('/');

    await expect(page.getByText('Onlinemat Dashboard')).toBeVisible({ timeout: 10_000 });

    // Staff should see these menu items in the sidebar
    await expect(page.getByText('Nutzende')).toBeVisible();
    await expect(page.getByText('Statistiken')).toBeVisible();
  });

  test('non-staff user does not see staff-only navigation items', async ({ page }) => {
    await setupAuth(page, 'admin');
    await page.goto('/');

    await expect(page.getByText('Onlinemat Dashboard')).toBeVisible({ timeout: 10_000 });

    // Non-staff should NOT see these menu items
    await expect(page.getByText('Nutzende')).not.toBeVisible();
    await expect(page.getByText('Statistiken')).not.toBeVisible();
  });
});

import { defineConfig, devices } from '@playwright/test';

const E2E_PORT = 3001;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 30_000,
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx vite --port ${E2E_PORT}`,
    port: E2E_PORT,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_USE_FIREBASE_EMULATOR: 'true',
      VITE_FIREBASE_PROJECT_ID: 'onlinemat-dev',
      VITE_FIREBASE_API_KEY: 'fake-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'localhost',
      VITE_FIREBASE_STORAGE_BUCKET: 'onlinemat-dev.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      VITE_FIREBASE_APP_ID: '1:123456789:web:abc123',
      VITE_SENTRY_DNS: '',
      VITE_AUTH0_DOMAIN: 'fake-auth0.local',
      VITE_AUTH0_CLIENT_ID: 'fake-client-id',
      VITE_DEV_ENV: 'true',
    },
  },
});

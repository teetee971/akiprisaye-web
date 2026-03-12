import { defineConfig, devices } from '@playwright/test';

const useLocalServer = process.env.PLAYWRIGHT_USE_LOCAL_SERVER === '1';
const strictUxAudit = process.env.UX_AUDIT_STRICT === '1';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? (strictUxAudit ? 1 : 0) : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://teetee971.github.io/akiprisaye-web/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: useLocalServer
    ? {
        command: 'npm run dev -- --host 0.0.0.0 --port 4173',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        cwd: '.',
      }
    : undefined,
});

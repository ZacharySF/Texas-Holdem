import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    headless: true,
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.CI
        ? undefined
        : process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
  projects: [
    {
      name: 'phone',
      use: { viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' },
    },
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command:
      'npm exec vite preview -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: !process.env.CI,
  },
});

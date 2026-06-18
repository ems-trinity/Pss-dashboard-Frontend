import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@trinity.local';
const ADMIN_PASS  = 'admin123';

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    await page.goto('/reports');
  });

  test('energy tab renders table', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /reports/i })).toBeVisible();
    await expect(page.locator('table')).toBeVisible({ timeout: 8_000 });
  });

  test('faults tab renders table', async ({ page }) => {
    await page.getByRole('button', { name: 'faults' }).click();
    await expect(page.locator('table')).toBeVisible({ timeout: 8_000 });
  });
});

import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@trinity.local';
const ADMIN_PASS  = 'admin123';

test.describe('Organisations CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    await page.goto('/organisations');
    await page.waitForSelector('table');
  });

  test('creates a new organisation', async ({ page }) => {
    const orgName = `E2E Org ${Date.now()}`;
    await page.getByRole('button', { name: /add/i }).click();
    await page.getByLabel(/name/i).fill(orgName);
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(orgName)).toBeVisible({ timeout: 5_000 });
  });

  test('shows validation error when name is empty', async ({ page }) => {
    await page.getByRole('button', { name: /add/i }).click();
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible();
  });
});

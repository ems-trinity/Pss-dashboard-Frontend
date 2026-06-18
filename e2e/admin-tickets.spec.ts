import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@trinity.local';
const ADMIN_PASS  = 'admin123';

test.describe('Tickets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    await page.goto('/tickets');
    await page.waitForSelector('table');
  });

  test('creates a ticket', async ({ page }) => {
    const title = `E2E Ticket ${Date.now()}`;
    await page.getByRole('button', { name: /new ticket/i }).click();
    await page.getByLabel(/title/i).fill(title);
    await page.getByRole('button', { name: /create ticket/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5_000 });
  });

  test('filter dropdown renders', async ({ page }) => {
    await expect(page.locator('select')).toBeVisible();
  });
});

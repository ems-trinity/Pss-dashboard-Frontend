import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@trinity.local';
const ADMIN_PASS  = 'admin123';

test.describe('Customers CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    await page.goto('/customers');
    await page.waitForSelector('table');
  });

  test('creates a customer and shows temp password', async ({ page }) => {
    const email = `e2e-${Date.now()}@test.com`;
    await page.getByRole('button', { name: /add/i }).click();
    await page.getByPlaceholder('Jane Smith').fill('E2E Customer');
    await page.getByPlaceholder('jane@company.com').fill(email);
    await page.getByPlaceholder('+91 9876543210').fill('+91 9999999999');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText('Customer created. Share this temporary password:')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /done/i }).click();
    await expect(page.getByText(email)).toBeVisible();
  });

  test('shows error when email is missing', async ({ page }) => {
    await page.getByRole('button', { name: /add/i }).click();
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible();
  });
});

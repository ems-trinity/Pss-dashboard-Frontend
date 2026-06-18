import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@trinity.local';
const ADMIN_PASS  = 'admin123';

test.describe('Auth', () => {
  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    await expect(page.getByText('Overview')).toBeVisible();
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });

  test('logout redirects to login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');

    await page.getByRole('button', { name: /logout/i }).click();
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/login/);
  });
});

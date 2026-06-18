import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@trinity.local';
const ADMIN_PASS  = 'admin123';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
  });

  const navItems = [
    { href: '/organisations', heading: /organisations/i },
    { href: '/customers',     heading: /customers/i },
    { href: '/team',          heading: /my team/i },
    { href: '/projects',      heading: /projects/i },
    { href: '/groups',        heading: /groups/i },
    { href: '/tickets',       heading: /tickets/i },
    { href: '/reports',       heading: /reports/i },
    { href: '/audit-log',     heading: /audit log/i },
  ];

  for (const { href, heading } of navItems) {
    test(`navigates to ${href}`, async ({ page }) => {
      await page.goto(href);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 8_000 });
    });
  }
});

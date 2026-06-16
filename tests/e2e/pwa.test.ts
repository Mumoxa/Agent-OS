import { test, expect } from '@playwright/test';

const PWA_BASE = process.env.PWA_BASE ?? 'http://localhost:5173';

test('PWA dashboard loads', async ({ page }) => {
  await page.goto(PWA_BASE);
  await expect(page.locator('h1')).toContainText('Dashboard');
});

test('PWA shows live connection status', async ({ page }) => {
  await page.goto(PWA_BASE);
  await expect(page.locator('text=Live')).toBeVisible({ timeout: 10_000 });
});

test('PWA navigation works', async ({ page }) => {
  await page.goto(PWA_BASE);
  await page.click('text=Approvals');
  await expect(page.locator('h1')).toContainText('Approval Inbox');
});

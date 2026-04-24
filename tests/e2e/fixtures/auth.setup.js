const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { buildUrl, paths, runtime } = require('./env');

const authFile = path.resolve(__dirname, '../output/playwright/.auth/admin.json');

test('login com admin baseline e persistencia de sessao', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto(buildUrl(paths.login), { waitUntil: 'domcontentloaded' });
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();

  await page.locator('input[name="email"]').fill(runtime.adminEmail);
  await page.locator('input[name="password"]').fill(runtime.adminPassword);
  const loginRequest = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().includes('/auth/login')
  );
  await page.locator('button[type="submit"]').click();
  const loginResponse = await loginRequest;
  expect(loginResponse.ok()).toBeTruthy();
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 30_000 });

  await page.goto(buildUrl(paths.operations), { waitUntil: 'domcontentloaded' });
  await expect(page).not.toHaveURL(/\/auth(\/|$)/);
  await expect(page.getByRole('button', { name: /Criar novo pedido/i })).toBeVisible({ timeout: 30_000 });

  await page.context().storageState({ path: authFile });
});

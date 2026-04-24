const { test, expect } = require('@playwright/test');
const { buildUrl, paths } = require('../fixtures/env');
const {
  listGroups,
  listRoles,
  loginInternalApi,
  seedFleetOpsCustomer,
  seedUserWithRole,
} = require('../fixtures/internal-api');

async function loginConsole(page, { email, password }) {
  await page.goto(buildUrl('/auth/login'), { waitUntil: 'domcontentloaded' });
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  const loginRequest = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().includes('/auth/login')
  );
  await page.getByRole('button', { name: 'Sign in' }).click();
  const loginResponse = await loginRequest;
  expect(loginResponse.ok()).toBeTruthy();
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 30_000 });
}

async function openFleetOpsShell(page) {
  await page.goto(buildUrl(paths.operations), { waitUntil: 'networkidle' });
  await expect(page).not.toHaveURL(/\/auth(\/|$)/);
  await expect(page.locator('header.next-view-header')).toBeVisible({ timeout: 30_000 });
}

test('runtime local expoe roles oficiais do produto e nenhum grupo seedado', async () => {
  const token = await loginInternalApi();
  const roles = await listRoles(token);
  const groups = await listGroups(token);
  const roleNames = roles.map((role) => role.name);

  expect(roleNames).toEqual(expect.arrayContaining([
    'Operations Manager',
    'Operations Administrator',
    'Driver Coordinator',
    'Driver',
    'Fleet-Ops Customer',
    'IAM Administrator',
  ]));
  expect(groups).toEqual([]);
});

test('role oficial Driver Coordinator autentica e abre FleetOps sem admin bootstrap', async ({ browser }) => {
  const user = await seedUserWithRole('Driver Coordinator', Date.now());
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();

  await loginConsole(page, user);
  await openFleetOpsShell(page);
  await expect(page.getByRole('button', { name: /Criar novo pedido|Create new order/i })).toBeVisible({
    timeout: 30_000,
  });

  await context.close();
});

test('role oficial Fleet-Ops Customer autentica e abre FleetOps sem admin bootstrap', async ({ browser }) => {
  const user = await seedFleetOpsCustomer(Date.now());
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();

  await loginConsole(page, user);
  await openFleetOpsShell(page);
  await expect(page.locator('main')).toContainText(/Mapa|Tabela|Quadro|Pedidos|Orders/i, { timeout: 30_000 });

  await context.close();
});

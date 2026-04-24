const { test, expect } = require('@playwright/test');
const { buildUrl, paths } = require('../fixtures/env');

const emptyStorageState = { cookies: [], origins: [] };

async function expectOrdersShellVisible(page) {
  const main = page.locator('main');
  await expect(page).not.toHaveURL(/\/auth(\/|$)/);
  await expect(main).toContainText(/Mapa/i, { timeout: 30_000 });
  await expect(main).toContainText(/Tabela/i, { timeout: 30_000 });
  await expect(main).toContainText(/Quadro/i, { timeout: 30_000 });
}

test('login publico exibe idioma e branding Rota Pulse', async ({ browser }) => {
  const context = await browser.newContext({ storageState: emptyStorageState });
  const page = await context.newPage();

  await page.goto(buildUrl(paths.login), { waitUntil: 'domcontentloaded' });

  await expect(page.locator('html')).toHaveAttribute('lang', /pt/i);
  await expect(page).toHaveTitle(/Rota Pulse/i);
  await expect(page.locator('body')).toContainText(/Entrar/i);
  await expect(page.locator('body')).not.toContainText(/Track Order|Fleetbase|SocketCluster/i);

  await context.close();
});

test('operations entrypoint abre sem redirecionar para auth', async ({ page }) => {
  await page.goto(buildUrl(paths.operations), { waitUntil: 'domcontentloaded' });
  await expect(page).not.toHaveURL(/\/auth(\/|$)/);
  await expect(page.getByRole('button', { name: /Criar novo pedido/i })).toBeVisible({ timeout: 30_000 });
});

test('root autenticado prioriza operacoes sem dashboard baseline', async ({ page }) => {
  await page.goto(buildUrl('/'), { waitUntil: 'networkidle' });
  const header = page.locator('header.next-view-header');
  const body = page.locator('body');

  await expect(header).toBeVisible({ timeout: 30_000 });
  await expect(page).not.toHaveURL(/\/auth(\/|$)/);
  await expect(page).toHaveURL(/\/fleet-ops(?:[/?#]|$)/);
  await expect(page).toHaveTitle(/Rota Pulse/i);
  await expect(header).toContainText(/Opera..es|Operacoes/i);
  await expect(header).toContainText(/Desenvolvedores/i);
  await expect(header).toContainText(/IAM/i);
  await expect(header).toContainText(/Financeiro/i);
  await expect(header).toContainText(/Extens/i);
  await expect(body).not.toContainText(/Storefront|Vitrine/i);
  await expect(body).not.toContainText(/Fleetbase|Default Dashboard|Fleetbase Blog|Visit Blog|Track Order|Developers|Ledger|Extensions/i);
});

test('orders shell expoe os modos mapa, tabela e kanban', async ({ page }) => {
  await page.goto(buildUrl(paths.orders), { waitUntil: 'domcontentloaded' });
  await expectOrdersShellVisible(page);
});

test('routes shell renderiza o mapa principal', async ({ page }) => {
  await page.goto(buildUrl(paths.routes), { waitUntil: 'networkidle' });

  await expect(page.locator('#leafletMap')).toBeVisible();
});

test('scheduler shell renderiza container principal', async ({ page }) => {
  await page.goto(buildUrl(paths.scheduler), { waitUntil: 'networkidle' });

  await expect(page.locator('#fleet-ops-scheduler-container')).toBeVisible();
});

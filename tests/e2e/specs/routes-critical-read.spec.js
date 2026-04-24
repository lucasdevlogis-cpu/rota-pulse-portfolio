const { test, expect } = require('@playwright/test');
const { buildUrl, paths } = require('../fixtures/env');
const { getFirstRoute, seedPlacePair, waitForRouteByOrderPublicId } = require('../fixtures/internal-api');

async function selectComboOption(page, index, optionText) {
  const combo = page.locator('[role="combobox"]').nth(index);
  await combo.click();

  const searchInput = page.locator('input[aria-autocomplete="list"]:visible').last();
  if (await searchInput.count()) {
    await searchInput.fill(optionText);
  }

  await page.getByRole('option', { name: new RegExp(escapeRegExp(optionText), 'i') }).click();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function createOrderAndCapturePublicId(page, suffix) {
  const { pickupName, dropoffName } = await seedPlacePair(suffix);

  await page.goto(buildUrl(`${paths.orders}/new`), { waitUntil: 'networkidle' });

  await selectComboOption(page, 0, 'Transport');
  await selectComboOption(page, 5, pickupName);
  await selectComboOption(page, 6, dropoffName);

  const createResponse = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().includes('/int/v1/orders')
  );
  await page.getByRole('button', { name: /^Create Order$/i }).last().click();

  const response = await createResponse;
  expect(response.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/fleet-ops\/order_/);

  const publicId = new URL(page.url()).pathname.split('/').filter(Boolean).pop();
  expect(publicId).toMatch(/^order_/i);

  return { pickupName, dropoffName, publicId };
}

test('routes new carrega waypoints do pedido selecionado', async ({ page }) => {
  const suffix = Date.now();
  const { pickupName, dropoffName, publicId } = await createOrderAndCapturePublicId(page, suffix);

  await page.goto(buildUrl(`${paths.routes}/new?selectedOrders=${publicId}`), { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(new RegExp(`/fleet-ops/routes/new\\?selectedOrders=${escapeRegExp(publicId)}`));

  const panel = page.locator('.route-optimization-wizard-panel');
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await expect(panel.getByRole('button', { name: 'Run' })).toBeVisible();
  await expect(panel.getByText(pickupName)).toBeVisible();
  await expect(panel.getByText(dropoffName)).toBeVisible();
});

test('routes details abre para uma rota real existente', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const route = (await getFirstRoute()) ?? (await createRouteFromNewOrder(page));

  expect(route.uuid).toBeTruthy();

  await page.goto(buildUrl(`${paths.routes}/${route.uuid}`), { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(new RegExp(`/fleet-ops/routes/${escapeRegExp(route.uuid)}$`));
  await expect(page.locator('#leafletMap')).toBeVisible({ timeout: 30_000 });
  expect(pageErrors).toEqual([]);
});

async function createRouteFromNewOrder(page) {
  const { publicId } = await createOrderAndCapturePublicId(page, Date.now());
  return waitForRouteByOrderPublicId(publicId);
}

const { test, expect } = require('@playwright/test');
const { buildUrl, paths } = require('../fixtures/env');
const { seedDriver, seedVehicle } = require('../fixtures/internal-api');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isCollectionResponse(response, resource) {
  const url = new URL(response.url());
  return response.request().method() === 'GET' && url.pathname.endsWith(`/int/v1/${resource}`);
}

async function openFilteredResource(page, resourcePath, apiResource, searchQuery) {
  const responsePromise = page.waitForResponse((response) => isCollectionResponse(response, apiResource));

  await page.goto(buildUrl(`${resourcePath}?query=${encodeURIComponent(searchQuery)}`), { waitUntil: 'networkidle' });

  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
}

test('lista driver criado por API na tela de gerenciamento', async ({ page }) => {
  const suffix = Date.now();
  const { driverName } = await seedDriver(suffix);

  await openFilteredResource(page, paths.drivers, 'drivers', driverName);

  await expect(page.getByText(new RegExp(escapeRegExp(driverName), 'i')).first()).toBeVisible();
});

test('lista vehicle criado por API na tela de gerenciamento', async ({ page }) => {
  const suffix = Date.now();
  const { plateNumber, vehicleDisplayName } = await seedVehicle(suffix);

  await openFilteredResource(page, paths.vehicles, 'vehicles', plateNumber);

  await expect(page.getByText(new RegExp(escapeRegExp(vehicleDisplayName), 'i')).first()).toBeVisible();
  await expect(page.getByText(new RegExp(escapeRegExp(plateNumber), 'i')).first()).toBeVisible();
});

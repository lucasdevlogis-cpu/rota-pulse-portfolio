const { test, expect } = require('@playwright/test');
const { buildUrl } = require('../fixtures/env');
const { seedPlacePair } = require('../fixtures/internal-api');

function hasPathname(response, pathname) {
  const url = new URL(response.url());
  return response.request().method() === 'GET' && url.pathname === pathname;
}

test('places abre listagem filtrada e carrega formulario-base no fluxo new', async ({ page }) => {
  const suffix = Date.now();
  const { pickupName } = await seedPlacePair(suffix);
  const listResponsePromise = page.waitForResponse((response) => hasPathname(response, '/int/v1/places'));

  await page.goto(buildUrl(`/fleet-ops/manage/places?query=${encodeURIComponent(pickupName)}`), {
    waitUntil: 'domcontentloaded',
  });

  const listResponse = await listResponsePromise;
  expect(listResponse.ok()).toBeTruthy();

  await expect(page).toHaveURL(/\/fleet-ops\/manage\/places/);
  await expect(page.getByRole('heading', { name: /^locais$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^novo$/i })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /endere/i })).toBeVisible();
  await expect(page.getByText(new RegExp(pickupName, 'i')).first()).toBeVisible();

  await page.getByRole('button', { name: /^novo$/i }).click();

  await expect(page).toHaveURL(/\/fleet-ops\/manage\/places\/new(?:\?|$)/);
  await expect(page.getByRole('heading', { name: /criar novo local/i })).toBeVisible();
  await expect(page.getByRole('textbox', { name: /^nome$/i })).toBeVisible();
  await expect(page.getByRole('textbox', { name: /^rua 1$/i })).toBeVisible();
  await expect(page.getByRole('combobox').first()).toBeVisible();
});

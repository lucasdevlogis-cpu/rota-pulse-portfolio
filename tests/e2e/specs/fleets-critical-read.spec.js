const { test, expect } = require('@playwright/test');
const { buildUrl } = require('../fixtures/env');

function hasPathname(response, pathname) {
  const url = new URL(response.url());
  return response.request().method() === 'GET' && url.pathname === pathname;
}

test('fleets abre listagem e carrega formulario-base no fluxo new', async ({ page }) => {
  const listResponsePromise = page.waitForResponse((response) => hasPathname(response, '/int/v1/fleets'));

  await page.goto(buildUrl('/fleet-ops/manage/fleets'), { waitUntil: 'domcontentloaded' });

  const listResponse = await listResponsePromise;
  expect(listResponse.ok()).toBeTruthy();

  await expect(page).toHaveURL(/\/fleet-ops\/manage\/fleets$/);
  await expect(page.getByRole('heading', { name: /^frotas$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^novo$/i })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /^nome$/i })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();

  await page.getByRole('button', { name: /^novo$/i }).click();

  await expect(page).toHaveURL(/\/fleet-ops\/manage\/fleets\/new(?:\?|$)/);
  await expect(page.getByRole('heading', { name: /create a new fleet/i })).toBeVisible();
  await expect(page.getByText(/nome da frota/i)).toBeVisible();
  await expect(page.getByText(/frota principal/i).first()).toBeVisible();
  await expect(page.getByText(/status/i).first()).toBeVisible();
});

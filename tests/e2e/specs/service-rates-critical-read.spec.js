const { test, expect } = require('@playwright/test');
const { buildUrl } = require('../fixtures/env');

function hasPathname(response, pathname) {
  const url = new URL(response.url());
  return response.request().method() === 'GET' && url.pathname === pathname;
}

test('service-rates abre listagem e carrega dados-base no fluxo new', async ({ page }) => {
  const listResponsePromise = page.waitForResponse((response) => hasPathname(response, '/int/v1/service-rates'));

  await page.goto(buildUrl('/fleet-ops/service-rates'), { waitUntil: 'domcontentloaded' });

  const listResponse = await listResponsePromise;
  expect(listResponse.ok()).toBeTruthy();

  await expect(page).toHaveURL(/\/fleet-ops\/service-rates$/);
  await expect(page.getByRole('heading', { name: /tarifas de servi/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^novo$/i })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /^id$/i })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /zona/i })).toBeVisible();

  const orderConfigsResponsePromise = page.waitForResponse((response) => hasPathname(response, '/int/v1/order-configs'));
  const serviceAreasResponsePromise = page.waitForResponse((response) => hasPathname(response, '/int/v1/service-areas'));

  await page.getByRole('button', { name: /^novo$/i }).click();

  const orderConfigsResponse = await orderConfigsResponsePromise;
  const serviceAreasResponse = await serviceAreasResponsePromise;
  expect(orderConfigsResponse.ok()).toBeTruthy();
  expect(serviceAreasResponse.ok()).toBeTruthy();

  await expect(page).toHaveURL(/\/fleet-ops\/service-rates\/new$/);
  await expect(page.getByRole('heading', { name: /criar um novo tarifa de servi/i })).toBeVisible();
  await expect(page.getByText(/nome do serv/i).first()).toBeVisible();
  await expect(page.getByText(/^tipo de pedido/i)).toBeVisible();
  await expect(page.getByText(/^selecione o tipo de pedido/i)).toBeVisible();
  await expect(page.getByText(/^restringir/i).first()).toBeVisible();
});

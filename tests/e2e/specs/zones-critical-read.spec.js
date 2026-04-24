const { test, expect } = require('@playwright/test');
const { buildUrl, paths } = require('../fixtures/env');

function hasPathname(response, pathname) {
  const url = new URL(response.url());
  return response.request().method() === 'GET' && url.pathname === pathname;
}

test('zones expoe painel de areas de servico no mapa operacional', async ({ page }) => {
  const serviceAreasResponsePromise = page.waitForResponse((response) => hasPathname(response, '/int/v1/service-areas'));

  await page.goto(buildUrl(paths.orders), { waitUntil: 'domcontentloaded' });

  const serviceAreasResponse = await serviceAreasResponsePromise;
  expect(serviceAreasResponse.ok()).toBeTruthy();

  await expect(page).not.toHaveURL(/\/auth(\/|$)/);
  await expect(page.locator('.next-leaflet-container-map').first()).toBeVisible({ timeout: 30_000 });

  const serviceAreasButton = page.locator('#map-toolbar-service-areas-button .toolbar-button');
  await expect(serviceAreasButton).toBeVisible({ timeout: 30_000 });
  await serviceAreasButton.click();

  const panel = page.locator('#map-toolbar-service-areas-button .next-dd-menu').first();
  await expect(panel).toBeVisible();
  await expect(panel).toContainText(/reas de servi/i);
  await expect(panel.getByText(/criar nova/i)).toBeVisible();
  await expect(panel.getByText(/mostrar todas/i)).toBeVisible();
  await expect(panel.getByText(/ocultar todas/i)).toBeVisible();
});

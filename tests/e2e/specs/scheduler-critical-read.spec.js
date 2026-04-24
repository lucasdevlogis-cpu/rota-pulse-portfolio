const { test, expect } = require('@playwright/test');
const { buildUrl, paths } = require('../fixtures/env');
const { seedPlacePair } = require('../fixtures/internal-api');

const uiLabels = {
  scheduleDialog: /^(Scheduling for|Agendando para)/i,
  saveChanges: /^(Save Changes|Salvar Altera..es)$/i,
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function selectComboOption(page, index, optionText) {
  const combo = page.locator('[role="combobox"]').nth(index);
  await combo.click();

  const searchInput = page.locator('input[aria-autocomplete="list"]:visible').last();
  if (await searchInput.count()) {
    await searchInput.fill(optionText);
  }

  await page.getByRole('option', { name: new RegExp(escapeRegExp(optionText), 'i') }).click();
}

async function createOrderAndOpenDetail(page, suffix) {
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
}

async function openScheduler(page) {
  await page.goto(buildUrl(paths.scheduler), { waitUntil: 'domcontentloaded' });

  const bootMessage = page.getByText(/iniciando/i);
  if ((await bootMessage.count()) > 0) {
    await expect(bootMessage).toBeHidden({ timeout: 30_000 });
  }

  const loading = page.getByText(/carregando scheduler/i);
  if ((await loading.count()) > 0) {
    await expect(loading).toBeHidden({ timeout: 30_000 });
  }

  await expect(page.locator('#fleet-ops-scheduler-container')).toBeVisible({ timeout: 30_000 });
}

async function firstVisibleSchedulerCard(page, timeout = 10_000) {
  const anyCard = page.locator('#fleet-ops-scheduler-sidebar .order-schedule-card').first();
  try {
    await expect(anyCard).toBeVisible({ timeout });
  } catch {
    return null;
  }

  const unscheduledCard = page
    .locator('#fleet-ops-scheduler-sidebar .next-content-panel-wrapper')
    .first()
    .locator('.order-schedule-card')
    .first();

  if (await unscheduledCard.isVisible()) {
    return unscheduledCard;
  }

  return anyCard;
}

test('scheduler abre modal de agendamento para um card visivel', async ({ page }) => {
  await openScheduler(page);
  await expect(page.getByText(/pedidos n.o agendados/i).first()).toBeVisible();

  let orderCard = await firstVisibleSchedulerCard(page);
  if (!orderCard) {
    await createOrderAndOpenDetail(page, Date.now());
    await openScheduler(page);
    orderCard = await firstVisibleSchedulerCard(page);
  }

  if (!orderCard) {
    throw new Error('Scheduler did not expose any order card to inspect.');
  }

  const tracking = (await orderCard.locator('.card-title span').first().innerText()).trim();
  expect(tracking).toMatch(/^FLE/);

  await orderCard.locator('.card-title').click();

  const dialog = page.getByRole('dialog', { name: uiLabels.scheduleDialog });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Date Input' })).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Time Input' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: uiLabels.saveChanges })).toBeVisible();
});

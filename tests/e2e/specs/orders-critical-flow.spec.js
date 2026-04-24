const { test, expect } = require('@playwright/test');
const { buildUrl, paths } = require('../fixtures/env');
const { seedDriver, seedPlacePair } = require('../fixtures/internal-api');

const uiLabels = {
  assignDriver: /^(Assign Driver|Atribuir Motorista)$/i,
  changeDriver: /^(Change Driver|Change Assigned Driver|Alterar Motorista|Mudar Motorista)$/i,
  scheduleDialog: /^(Scheduling for|Agendando para)/i,
  saveChanges: /^(Save Changes|Salvar Alterações)$/i,
};

async function selectComboOption(page, index, optionText) {
  const combo = page.locator('[role="combobox"]').nth(index);
  await combo.click();

  const searchInput = page.locator('input[aria-autocomplete="list"]:visible').last();
  if (await searchInput.count()) {
    await searchInput.fill(optionText);
  }

  await page.getByRole('option', { name: new RegExp(escapeRegExp(optionText), 'i') }).click();
  await expect(page.locator('input[aria-autocomplete="list"]:visible')).toHaveCount(0);
}

async function createOrderAndOpenDetail(page, suffix) {
  const { pickupName, dropoffName } = await seedPlacePair(suffix);

  await page.goto(buildUrl(`${paths.orders}/new`), { waitUntil: 'networkidle' });
  const createDialog = page.getByRole('dialog').last();
  await expect(createDialog.getByRole('heading', { name: /^(Criar um novo pedido|Create a new order)$/i })).toBeVisible();

  await selectComboOption(page, 0, 'Transport');
  await selectComboOption(page, 5, pickupName);
  await selectComboOption(page, 6, dropoffName);

  const [response] = await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes('/int/v1/orders')),
    createDialog.getByRole('button', { name: /^Create Order$/i }).click(),
  ]);
  expect(response.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/fleet-ops\/order_/);

  return { pickupName, dropoffName };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nextScheduleSlot() {
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 1);
  scheduledAt.setHours(9, 30, 0, 0);

  const date = scheduledAt.toISOString().slice(0, 10);
  const time = `${String(scheduledAt.getHours()).padStart(2, '0')}:${String(scheduledAt.getMinutes()).padStart(2, '0')}`;
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(scheduledAt);

  return {
    date,
    time,
    label: `${formattedDate} ${time}`,
  };
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

async function scheduleVisibleOrderFromScheduler(page, scheduledSlot) {
  await page.goto(buildUrl(paths.scheduler), { waitUntil: 'networkidle' });

  let orderCard = await firstVisibleSchedulerCard(page);
  if (!orderCard) {
    await createOrderAndOpenDetail(page, Date.now());
    await page.goto(buildUrl(paths.scheduler), { waitUntil: 'networkidle' });
    orderCard = await firstVisibleSchedulerCard(page);
  }

  if (!orderCard) {
    throw new Error('Scheduler did not expose any order card to schedule.');
  }

  const tracking = (await orderCard.locator('.card-title span').first().innerText()).trim();
  expect(tracking).toMatch(/^FLE/);

  await orderCard.locator('.card-title').click();

  const dialog = page.getByRole('dialog', { name: uiLabels.scheduleDialog });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Date Input' }).fill(scheduledSlot.date);
  await dialog.getByRole('textbox', { name: 'Time Input' }).fill(scheduledSlot.time);

  const scheduleResponse = page.waitForResponse(
    (response) =>
      ['PATCH', 'PUT'].includes(response.request().method()) &&
      /\/int\/v1\/orders\//.test(response.url())
  );
  await dialog.getByRole('button', { name: uiLabels.saveChanges }).click();

  const response = await scheduleResponse;
  expect(response.ok()).toBeTruthy();
  await page.waitForLoadState('networkidle');

  return { tracking };
}

test('cria order por UI e abre detalhe com pickup e dropoff persistidos', async ({ page }) => {
  const suffix = Date.now();
  const { pickupName, dropoffName } = await createOrderAndOpenDetail(page, suffix);
  const orderDialog = page.getByRole('dialog').last();
  await expect(orderDialog).toContainText(pickupName);
  await expect(orderDialog).toContainText(dropoffName);
});

test('atribui driver no detalhe do pedido e reflete o estado persistido', async ({ page }) => {
  const suffix = Date.now();
  const { driverName } = await seedDriver(suffix);

  await createOrderAndOpenDetail(page, suffix);

  await page.getByRole('button', { name: uiLabels.assignDriver }).click();
  await selectComboOption(page, 0, driverName);

  const assignResponse = page.waitForResponse(
    (response) =>
      ['PATCH', 'PUT'].includes(response.request().method()) &&
      /\/int\/v1\/orders\//.test(response.url())
  );
  await page.getByRole('dialog', { name: uiLabels.assignDriver }).getByRole('button', { name: uiLabels.saveChanges }).click();

  const response = await assignResponse;
  expect(response.ok()).toBeTruthy();

  await expect(page.getByText(new RegExp(escapeRegExp(driverName), 'i')).first()).toBeVisible();
  await expect(page.getByRole('button', { name: uiLabels.changeDriver })).toBeVisible();
});

test('agenda order pelo scheduler e preserva scheduled_at apos reload', async ({ page }) => {
  const scheduledSlot = nextScheduleSlot();

  const { tracking } = await scheduleVisibleOrderFromScheduler(page, scheduledSlot);
  await page.reload({ waitUntil: 'networkidle' });

  const scheduledCard = page
    .locator('#fleet-ops-scheduler-sidebar .order-schedule-card')
    .filter({ hasText: tracking });

  await expect(scheduledCard).toContainText(scheduledSlot.label);
});

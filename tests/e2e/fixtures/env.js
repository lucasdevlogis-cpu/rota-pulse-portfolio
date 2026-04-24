const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const runtime = {
  baseURL: process.env.ROTA_PULSE_E2E_BASE_URL || 'http://localhost:4200',
  apiURL: process.env.ROTA_PULSE_E2E_API_URL || 'http://localhost:8000',
  adminEmail: process.env.ROTA_PULSE_E2E_ADMIN_EMAIL || 'admin@fleetbase.local',
  adminPassword: process.env.ROTA_PULSE_E2E_ADMIN_PASSWORD || 'Fleetbase!2026Local',
  opsBasePath: process.env.ROTA_PULSE_E2E_OPS_BASE_PATH || '/fleet-ops',
};

const paths = {
  login: '/',
  operations: runtime.opsBasePath,
  orders: runtime.opsBasePath,
  routes: `${runtime.opsBasePath}/routes`,
  scheduler: `${runtime.opsBasePath}/scheduler`,
  drivers: `${runtime.opsBasePath}/manage/drivers`,
  vehicles: `${runtime.opsBasePath}/manage/vehicles`,
};

function buildUrl(pathname) {
  return new URL(pathname, runtime.baseURL).toString();
}

module.exports = {
  buildUrl,
  paths,
  runtime,
};

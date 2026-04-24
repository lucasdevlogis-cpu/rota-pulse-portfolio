const { runtime } = require('../../tests/e2e/fixtures/env');
const { loginInternalApi } = require('../../tests/e2e/fixtures/internal-api');

const seedKey = process.env.ROTA_PULSE_DEMO_SEED || 'case-brasil-sp-001';

const demo = {
  pickup: {
    name: 'RP Demo Origem CD Guarulhos',
    latitude: -23.4543,
    longitude: -46.5337,
  },
  dropoff: {
    name: 'RP Demo Destino Cliente Vila Olimpia',
    latitude: -23.5955,
    longitude: -46.6847,
  },
  driver: {
    name: 'RP Demo Motorista Joao Silva',
    email: 'rp.demo.motorista@rotapulse.local',
    phone: '+5511990000001',
  },
  vehicle: {
    make: 'Mercedes-Benz',
    model: 'Sprinter Demo Rota Pulse',
    year: '2022',
    plate_number: 'RPD2026',
    status: 'operational',
    online: false,
  },
};

async function request(token, path, options = {}) {
  const response = await fetch(`${runtime.apiURL}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed with status ${response.status}: ${text}`);
  }

  return body;
}

function normalizeName(value) {
  return String(value || '').trim().toUpperCase();
}

async function findPlace(token, name) {
  const results = await request(token, `/int/v1/places/search?searchQuery=${encodeURIComponent(name)}&limit=25`);
  return Array.isArray(results) ? results.find((place) => normalizeName(place.name) === normalizeName(name)) : null;
}

async function ensurePlace(token, place) {
  const existing = await findPlace(token, place.name);
  if (existing) {
    return existing;
  }

  const body = await request(token, '/int/v1/places', {
    method: 'POST',
    body: JSON.stringify({
      place: {
        name: place.name,
        address: place.name,
        location: {
          latitude: place.latitude,
          longitude: place.longitude,
        },
      },
    }),
  });

  return body.place;
}

async function ensureDriver(token) {
  const body = await request(token, '/int/v1/drivers?limit=100');
  const existing = Array.isArray(body.drivers)
    ? body.drivers.find((driver) => driver.email === demo.driver.email || driver.name === demo.driver.name)
    : null;

  if (existing) {
    return existing;
  }

  const created = await request(token, '/int/v1/drivers', {
    method: 'POST',
    body: JSON.stringify({
      driver: {
        ...demo.driver,
        password: 'password',
        status: 'active',
      },
    }),
  });

  return created.driver;
}

async function ensureVehicle(token) {
  const body = await request(token, '/int/v1/vehicles?limit=100');
  const existing = Array.isArray(body.vehicles)
    ? body.vehicles.find((vehicle) => vehicle.plate_number === demo.vehicle.plate_number || vehicle.display_name?.includes(demo.vehicle.model))
    : null;

  if (existing) {
    return existing;
  }

  const created = await request(token, '/int/v1/vehicles', {
    method: 'POST',
    body: JSON.stringify({ vehicle: demo.vehicle }),
  });

  return created.vehicle;
}

async function getDefaultOrderConfig(token) {
  return request(token, '/int/v1/orders/default-config');
}

async function findDemoOrder(token) {
  const matches = [];
  let page = 1;
  let lastPage = 1;

  do {
    const body = await request(token, `/int/v1/orders?limit=50&page=${page}`);
    if (Array.isArray(body.orders)) {
      matches.push(...body.orders.filter((order) => {
        const pickupName = order.payload?.pickup?.name;
        const dropoffName = order.payload?.dropoff?.name;

        return normalizeName(pickupName) === normalizeName(demo.pickup.name)
          && normalizeName(dropoffName) === normalizeName(demo.dropoff.name);
      }));
    }

    lastPage = Number(body.meta?.last_page || 1);
    page += 1;
  } while (page <= lastPage);

  if (matches.length === 0) {
    return null;
  }

  return matches.sort((left, right) => new Date(right.created_at) - new Date(left.created_at))[0];
}

function nextScheduleSlot() {
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 1);
  scheduledAt.setHours(9, 30, 0, 0);
  return scheduledAt.toISOString();
}

async function ensureOrder(token, orderConfig, pickup, dropoff) {
  const existing = await findDemoOrder(token);
  if (existing) {
    return existing;
  }

  const created = await request(token, '/int/v1/orders', {
    method: 'POST',
    body: JSON.stringify({
      order: {
        order_config_uuid: orderConfig.uuid,
        type: 'default',
        status: 'created',
        dispatched: false,
        notes: 'Rota Pulse demo local - case Brasil de planejamento e roteirizacao.',
        meta: {
          rota_pulse_demo: true,
          rota_pulse_demo_seed: seedKey,
        },
        payload: {
          pickup_uuid: pickup.uuid,
          dropoff_uuid: dropoff.uuid,
        },
      },
    }),
  });

  return created.order;
}

async function updateOrderPlan(token, order, driver, vehicle) {
  const updated = await request(token, `/int/v1/orders/${order.public_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      order: {
        driver_assigned_uuid: driver.uuid,
        vehicle_assigned_uuid: vehicle.uuid,
        scheduled_at: nextScheduleSlot(),
        meta: {
          ...(order.meta || {}),
          rota_pulse_demo: true,
          rota_pulse_demo_seed: seedKey,
        },
      },
    }),
  });

  return updated.order;
}

async function main() {
  const token = await loginInternalApi();
  const orderConfig = await getDefaultOrderConfig(token);
  const pickup = await ensurePlace(token, demo.pickup);
  const dropoff = await ensurePlace(token, demo.dropoff);
  const driver = await ensureDriver(token);
  const vehicle = await ensureVehicle(token);
  const order = await ensureOrder(token, orderConfig, pickup, dropoff);
  const plannedOrder = await updateOrderPlan(token, order, driver, vehicle);

  const summary = {
    seed: seedKey,
    console: runtime.baseURL,
    api: runtime.apiURL,
    order: {
      public_id: plannedOrder.public_id,
      tracking: plannedOrder.tracking,
      status: plannedOrder.status,
      scheduled_at: plannedOrder.scheduled_at,
    },
    pickup: pickup.name,
    dropoff: dropoff.name,
    driver: driver.name,
    vehicle: vehicle.display_name || `${vehicle.make} ${vehicle.model}`,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

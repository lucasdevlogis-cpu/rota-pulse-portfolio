const { runtime } = require('./env');

async function loginInternalApi() {
  const response = await fetch(`${runtime.apiURL}/int/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      identity: runtime.adminEmail,
      password: runtime.adminPassword,
    }),
  });

  if (!response.ok) {
    throw new Error(`Internal API login failed with status ${response.status}`);
  }

  const body = await response.json();
  if (!body.token) {
    throw new Error('Internal API login did not return a token');
  }

  return body.token;
}

async function createPlace(token, { name, latitude, longitude }) {
  const response = await fetch(`${runtime.apiURL}/int/v1/places`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      place: {
        name,
        address: name,
        location: {
          latitude,
          longitude,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Create place failed with status ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function createDriver(token, { name, email, phone, password = 'password', status = 'active' }) {
  const response = await fetch(`${runtime.apiURL}/int/v1/drivers`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      driver: {
        name,
        email,
        phone,
        password,
        status,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Create driver failed with status ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function createVehicle(token, { make, model, year, plateNumber, status = 'operational', online = false }) {
  const response = await fetch(`${runtime.apiURL}/int/v1/vehicles`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      vehicle: {
        make,
        model,
        year,
        plate_number: plateNumber,
        status,
        online,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Create vehicle failed with status ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function internalApiRequest(token, path, options = {}) {
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

async function listRoles(token) {
  const body = await internalApiRequest(token, '/int/v1/roles?limit=100');
  return Array.isArray(body.roles) ? body.roles : [];
}

async function listGroups(token) {
  const body = await internalApiRequest(token, '/int/v1/groups?limit=100');
  return Array.isArray(body.groups) ? body.groups : [];
}

async function findRoleByName(token, roleName) {
  const roles = await listRoles(token);
  const role = roles.find((candidate) => candidate.name === roleName);

  if (!role) {
    throw new Error(`Role '${roleName}' was not found in the local runtime`);
  }

  return role;
}

async function verifyAndActivateUser(token, userUuid) {
  await internalApiRequest(token, `/int/v1/users/verify/${userUuid}`, { method: 'PATCH' });
  await internalApiRequest(token, `/int/v1/users/activate/${userUuid}`, { method: 'PATCH' });
}

async function changeUserPassword(token, userUuid, password) {
  await internalApiRequest(token, '/int/v1/auth/change-user-password', {
    method: 'POST',
    body: JSON.stringify({
      user: userUuid,
      password,
      password_confirmation: password,
      send_credentials: false,
    }),
  });
}

function buildAccessProfileData(kind, suffix, name) {
  return {
    email: `rp.${kind}.${suffix}@rotapulse.com.br`,
    name,
    password: `RotaPulse!${suffix}Aa1`,
    phone: `+55119${String(suffix).slice(-8)}`,
  };
}

async function seedUserWithRole(roleName, suffix = Date.now()) {
  const token = await loginInternalApi();
  const role = await findRoleByName(token, roleName);
  const profile = buildAccessProfileData('officialuser', suffix, 'Rota Pulse Official User');

  const body = await internalApiRequest(token, '/int/v1/users', {
    method: 'POST',
    body: JSON.stringify({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      user: {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role_uuid: role.id,
      },
    }),
  });

  await verifyAndActivateUser(token, body.user.uuid);
  await changeUserPassword(token, body.user.uuid, profile.password);

  return {
    ...profile,
    roleName,
    userUuid: body.user.uuid,
  };
}

async function seedFleetOpsCustomer(suffix = Date.now()) {
  const token = await loginInternalApi();
  const profile = buildAccessProfileData('customer', suffix, 'Rota Pulse Customer');

  const body = await internalApiRequest(token, '/int/v1/contacts', {
    method: 'POST',
    body: JSON.stringify({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      type: 'customer',
      contact: {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        type: 'customer',
      },
    }),
  });

  await internalApiRequest(token, '/int/v1/customers/reset-credentials', {
    method: 'POST',
    body: JSON.stringify({
      customer: body.contact.uuid,
      password: profile.password,
      password_confirmation: profile.password,
      send_credentials: false,
    }),
  });
  await verifyAndActivateUser(token, body.contact.user_uuid);

  return {
    ...profile,
    contactUuid: body.contact.uuid,
    roleName: 'Fleet-Ops Customer',
    userUuid: body.contact.user_uuid,
  };
}

async function findRoutes(token, params = {}) {
  const searchParams = new URLSearchParams({ limit: '100', ...params });
  const response = await fetch(`${runtime.apiURL}/int/v1/routes?${searchParams.toString()}`, {
    headers: { authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`List routes failed with status ${response.status}: ${await response.text()}`);
  }

  const body = await response.json();
  return Array.isArray(body.routes) ? body.routes : [];
}

async function getFirstRoute() {
  const token = await loginInternalApi();
  const routes = await findRoutes(token, { limit: '1' });

  return routes[0] ?? null;
}

async function waitForRouteByOrderPublicId(orderPublicId, timeoutMs = 10_000) {
  const token = await loginInternalApi();
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const routes = await findRoutes(token);
    const route = routes.find((candidate) => candidate.order_public_id === orderPublicId);
    if (route) {
      return route;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Route for order '${orderPublicId}' did not become available within ${timeoutMs}ms`);
}

async function findPlaces(token, searchQuery) {
  const response = await fetch(
    `${runtime.apiURL}/int/v1/places/search?searchQuery=${encodeURIComponent(searchQuery)}&limit=10`,
    {
      headers: { authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Search places failed with status ${response.status}`);
  }

  return response.json();
}

async function waitForPlace(token, searchQuery, timeoutMs = 10_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const results = await findPlaces(token, searchQuery);
    if (Array.isArray(results) && results.some((place) => place.name === searchQuery)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Seeded place '${searchQuery}' did not become searchable within ${timeoutMs}ms`);
}

async function seedPlacePair(suffix) {
  const token = await loginInternalApi();
  const pickupName = `RP T050 PICKUP ${suffix}`;
  const dropoffName = `RP T050 DROPOFF ${suffix}`;

  await createPlace(token, {
    name: pickupName,
    latitude: -23.55052,
    longitude: -46.633308,
  });

  await createPlace(token, {
    name: dropoffName,
    latitude: -23.561414,
    longitude: -46.656006,
  });

  await waitForPlace(token, pickupName);
  await waitForPlace(token, dropoffName);

  return { pickupName, dropoffName };
}

async function seedDriver(suffix) {
  const token = await loginInternalApi();
  const driverName = `RP Driver ${suffix}`;

  const response = await createDriver(token, {
    name: driverName,
    email: `rp.driver.${suffix}@example.com`,
    phone: `+55119${String(suffix).slice(-8)}`,
  });

  return {
    driverName,
    driverId: response.driver.public_id,
    driverUuid: response.driver.uuid,
  };
}

async function seedVehicle(suffix) {
  const token = await loginInternalApi();
  const plateNumber = `RP${String(suffix).slice(-6)}`;
  const vehicleModel = `Vehicle ${suffix}`;

  const response = await createVehicle(token, {
    make: 'RP',
    model: vehicleModel,
    year: '2026',
    plateNumber,
  });

  return {
    plateNumber,
    vehicleDisplayName: response.vehicle.display_name,
    vehicleId: response.vehicle.public_id,
    vehicleUuid: response.vehicle.uuid,
  };
}

module.exports = {
  createDriver,
  createVehicle,
  findRoleByName,
  getFirstRoute,
  listGroups,
  listRoles,
  loginInternalApi,
  seedFleetOpsCustomer,
  seedPlacePair,
  seedDriver,
  seedUserWithRole,
  seedVehicle,
  waitForRouteByOrderPublicId,
};

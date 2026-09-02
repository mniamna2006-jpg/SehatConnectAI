const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadFreshWithMocks } = require("./helpers/load-with-mocks");

const servicePath = path.resolve(__dirname, "../src/services/auth.service.js");

function createUser(role, overrides = {}) {
  return {
    user_id: `${role.toLowerCase()}-user`,
    full_name: `${role} User`,
    email: `${role.toLowerCase()}@example.com`,
    phone: null,
    password_hash: "stored-password-hash",
    role,
    preferred_language: "ENGLISH",
    is_active: true,
    ...overrides,
  };
}

function loadAuthService({
  user,
  passwordMatches = true,
  hospitalAdmin = null,
  hospitalStaff = null,
}) {
  const updates = [];
  const prisma = {
    user: {
      findFirst: async () => user,
      update: async (query) => {
        updates.push(query);
        return user;
      },
    },
    hospitalAdmin: {
      findUnique: async () => hospitalAdmin,
    },
    hospitalStaff: {
      findUnique: async () => hospitalStaff,
    },
  };
  const service = loadFreshWithMocks(servicePath, {
    bcryptjs: {
      compare: async () => passwordMatches,
      hash: async () => "new-password-hash",
    },
    jsonwebtoken: {
      sign: () => "signed-token",
    },
    "../config/prisma": prisma,
  });

  return { service, updates };
}

test("patient login accepts valid PATIENT credentials and updates last_login", async () => {
  const patient = createUser("PATIENT");
  const { service, updates } = loadAuthService({ user: patient });

  const result = await service.login({
    email: patient.email,
    password: "correct-password",
  });

  assert.equal(result.token, "signed-token");
  assert.equal(result.user.role, "PATIENT");
  assert.equal(updates.length, 1);
  assert.equal(updates[0].where.user_id, patient.user_id);
  assert.ok(updates[0].data.last_login instanceof Date);
});

for (const role of ["ADMIN", "STAFF"]) {
  test(`patient login rejects ${role} with generic credentials error`, async () => {
    const user = createUser(role);
    const { service, updates } = loadAuthService({ user });

    await assert.rejects(
      service.login({ email: user.email, password: "correct-password" }),
      { message: "Invalid credentials" }
    );
    assert.equal(updates.length, 0);
  });
}

test("patient login does not reveal inactive hospital account state", async () => {
  const admin = createUser("ADMIN", { is_active: false });
  const { service, updates } = loadAuthService({ user: admin });

  await assert.rejects(
    service.login({ email: admin.email, password: "correct-password" }),
    { message: "Invalid credentials" }
  );
  assert.equal(updates.length, 0);
});

test("patient login keeps inactive PATIENT rejection and does not update last_login", async () => {
  const patient = createUser("PATIENT", { is_active: false });
  const { service, updates } = loadAuthService({ user: patient });

  await assert.rejects(
    service.login({ email: patient.email, password: "correct-password" }),
    { message: "User account is inactive" }
  );
  assert.equal(updates.length, 0);
});

test("hospital login remains functional for ADMIN", async () => {
  const admin = createUser("ADMIN");
  const hospital = {
    hospital_id: "hospital-1",
    name: "City Hospital",
    facility_type: "HOSPITAL",
    city: "Karachi",
    is_active: true,
  };
  const { service, updates } = loadAuthService({
    user: admin,
    hospitalAdmin: { hospital },
  });

  const result = await service.loginHospitalUser({
    email: admin.email,
    password: "correct-password",
  });

  assert.equal(result.user.role, "ADMIN");
  assert.equal(result.user.hospital.hospital_id, hospital.hospital_id);
  assert.equal(updates.length, 1);
});

test("hospital login remains functional for STAFF", async () => {
  const staff = createUser("STAFF");
  const hospital = {
    hospital_id: "hospital-1",
    name: "City Hospital",
    facility_type: "HOSPITAL",
    city: "Karachi",
    is_active: true,
  };
  const department = {
    department_id: "department-1",
    name: "Cardiology",
  };
  const { service, updates } = loadAuthService({
    user: staff,
    hospitalStaff: {
      hospital,
      department,
      is_active: true,
    },
  });

  const result = await service.loginHospitalUser({
    email: staff.email,
    password: "correct-password",
  });

  assert.equal(result.user.role, "STAFF");
  assert.equal(result.user.hospital.hospital_id, hospital.hospital_id);
  assert.equal(result.user.department.department_id, department.department_id);
  assert.equal(updates.length, 1);
});

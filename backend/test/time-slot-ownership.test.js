const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadFreshWithMocks } = require("./helpers/load-with-mocks");
const { createExpressMock, createResponse } = require("./helpers/route-harness");

const routePath = path.resolve(__dirname, "../src/routes/timeSlot.routes.js");

function loadHandler(prisma) {
  const harness = createExpressMock();
  loadFreshWithMocks(routePath, {
    express: harness.express,
    "../config/prisma": prisma,
    "../middleware/auth.middleware": {
      authenticateToken: (_req, _res, next) => next(),
      authorizeRoles: () => (_req, _res, next) => next(),
    },
    "../utils/date.helpers": {
      getPakistanDayOfWeekForDate: () => "MONDAY",
      addTime12hFields: (value) => value,
    },
  });
  return harness.findRoute("POST", "/generate").handlers.at(-1);
}

test("public slot read excludes inactive or unavailable doctor resources", async () => {
  let slotWhere;
  const prisma = {
    timeSlot: {
      findMany: async ({ where }) => {
        slotWhere = where;
        return [];
      },
    },
  };
  const harness = createExpressMock();
  loadFreshWithMocks(routePath, {
    express: harness.express,
    "../config/prisma": prisma,
    "../middleware/auth.middleware": {
      authenticateToken: (_req, _res, next) => next(),
      authorizeRoles: () => (_req, _res, next) => next(),
    },
    "../utils/date.helpers": {
      getPakistanDayOfWeekForDate: () => "MONDAY",
      addTime12hFields: (value) => value,
    },
  });
  const response = createResponse();

  await harness
    .findRoute("GET", "/doctor/:doctorId/date/:date")
    .handlers.at(-1)(
      { params: { doctorId: "doctor-1", date: "2026-09-07" } },
      response
    );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(slotWhere.doctor, {
    is_active: true,
    is_available: true,
    department: { is_active: true },
    hospital: { is_active: true },
  });
  assert.deepEqual(slotWhere.hospital, { is_active: true });
});

test("cross-hospital admin cannot generate time slots", async () => {
  const creates = [];
  const prisma = {
    hospitalAdmin: {
      findUnique: async () => ({
        hospital_id: "hospital-a",
        hospital: { is_active: true },
      }),
    },
    doctor: {
      findUnique: async () => ({
        doctor_id: "doctor-b",
        hospital_id: "hospital-b",
        is_active: true,
      }),
    },
    doctorSchedule: {
      findFirst: async () => ({
        start_time: "09:00",
        end_time: "10:00",
        appointment_duration: 30,
      }),
    },
    timeSlot: {
      create: async (query) => {
        creates.push(query);
        return query.data;
      },
    },
  };
  const response = createResponse();

  await loadHandler(prisma)(
    {
      body: {
        doctor_id: "doctor-b",
        hospital_id: "hospital-b",
        date: "2026-09-07",
      },
      user: { user_id: "admin-a", role: "ADMIN" },
    },
    response
  );

  assert.equal(response.statusCode, 403);
  assert.equal(creates.length, 0);
});

test("hospital_id must match same-hospital doctor during slot generation", async () => {
  const creates = [];
  const prisma = {
    hospitalAdmin: {
      findUnique: async () => ({
        hospital_id: "hospital-a",
        hospital: { is_active: true },
      }),
    },
    doctor: {
      findUnique: async () => ({
        doctor_id: "doctor-a",
        hospital_id: "hospital-a",
        is_active: true,
      }),
    },
    doctorSchedule: { findFirst: async () => null },
    timeSlot: {
      create: async (query) => {
        creates.push(query);
        return query.data;
      },
    },
  };
  const response = createResponse();

  await loadHandler(prisma)(
    {
      body: {
        doctor_id: "doctor-a",
        hospital_id: "hospital-b",
        date: "2026-09-07",
      },
      user: { user_id: "admin-a", role: "ADMIN" },
    },
    response
  );

  assert.equal(response.statusCode, 403);
  assert.equal(creates.length, 0);
});

test("inactive hospital admin cannot generate time slots", async () => {
  const creates = [];
  const prisma = {
    hospitalAdmin: {
      findUnique: async () => ({
        hospital_id: "hospital-a",
        hospital: { is_active: false },
      }),
    },
    doctor: {
      findUnique: async () => ({
        doctor_id: "doctor-a",
        hospital_id: "hospital-a",
        is_active: true,
      }),
    },
    doctorSchedule: { findFirst: async () => null },
    timeSlot: {
      create: async (query) => {
        creates.push(query);
        return query.data;
      },
    },
  };
  const response = createResponse();

  await loadHandler(prisma)(
    {
      body: {
        doctor_id: "doctor-a",
        hospital_id: "hospital-a",
        date: "2026-09-07",
      },
      user: { user_id: "admin-a", role: "ADMIN" },
    },
    response
  );

  assert.equal(response.statusCode, 403);
  assert.equal(creates.length, 0);
});

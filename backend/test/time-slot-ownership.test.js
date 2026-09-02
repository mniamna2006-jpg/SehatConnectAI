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

test("cross-hospital admin cannot generate time slots", async () => {
  const creates = [];
  const prisma = {
    hospitalAdmin: { findUnique: async () => ({ hospital_id: "hospital-a" }) },
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
    hospitalAdmin: { findUnique: async () => ({ hospital_id: "hospital-a" }) },
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

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadFreshWithMocks } = require("./helpers/load-with-mocks");
const { createExpressMock, createResponse } = require("./helpers/route-harness");

const routePath = path.resolve(__dirname, "../src/routes/schedule.routes.js");

function loadCreateScheduleHandler(prisma) {
  const harness = createExpressMock();

  loadFreshWithMocks(routePath, {
    express: harness.express,
    "../config/prisma": prisma,
    "../middleware/auth.middleware": {
      authenticateToken: (_req, _res, next) => next(),
      authorizeRoles: () => (_req, _res, next) => next(),
    },
    "../utils/date.helpers": {
      addTime12hFields: (value) => value,
    },
  });

  const route = harness.findRoute("POST", "/");
  return route.handlers[route.handlers.length - 1];
}

async function invokeCreateSchedule(handler, doctorId = "doctor-1") {
  const response = createResponse();
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    await handler(
      {
        body: {
          doctor_id: doctorId,
          day_of_week: "MONDAY",
          start_time: "09:00",
          end_time: "12:00",
          appointment_duration: 30,
        },
        user: { user_id: "admin-user-1", role: "ADMIN" },
      },
      response
    );
  } finally {
    console.error = originalConsoleError;
  }

  return response;
}

function createPrisma({ adminHospitalId, doctorHospitalId, doctorExists = true }) {
  const state = { createCalls: [] };
  const prisma = {
    hospitalAdmin: {
      findUnique: async () => ({ hospital_id: adminHospitalId }),
    },
    doctor: {
      findUnique: async () =>
        doctorExists ? { hospital_id: doctorHospitalId } : null,
    },
    doctorSchedule: {
      create: async (query) => {
        state.createCalls.push(query);
        return { schedule_id: "schedule-1", ...query.data };
      },
    },
  };

  return { prisma, state };
}

test("same-hospital admin can create a doctor schedule", async () => {
  const { prisma, state } = createPrisma({
    adminHospitalId: "hospital-1",
    doctorHospitalId: "hospital-1",
  });
  const handler = loadCreateScheduleHandler(prisma);

  const response = await invokeCreateSchedule(handler);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.success, true);
  assert.equal(state.createCalls.length, 1);
});

test("cross-hospital doctor schedule is rejected before any create", async () => {
  const { prisma, state } = createPrisma({
    adminHospitalId: "hospital-1",
    doctorHospitalId: "hospital-2",
  });
  const handler = loadCreateScheduleHandler(prisma);

  const response = await invokeCreateSchedule(handler, "doctor-hospital-2");

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    success: false,
    message: "You do not have permission to manage this doctor's schedule",
  });
  assert.equal(state.createCalls.length, 0);
});

test("missing doctor returns not found without creating a schedule", async () => {
  const { prisma, state } = createPrisma({
    adminHospitalId: "hospital-1",
    doctorHospitalId: "hospital-1",
    doctorExists: false,
  });
  const handler = loadCreateScheduleHandler(prisma);

  const response = await invokeCreateSchedule(handler, "doctor-missing");

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, {
    success: false,
    message: "Doctor not found",
  });
  assert.equal(state.createCalls.length, 0);
});

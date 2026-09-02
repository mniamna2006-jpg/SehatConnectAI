const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadFreshWithMocks } = require("./helpers/load-with-mocks");
const { createExpressMock, createResponse } = require("./helpers/route-harness");

const routePath = path.resolve(__dirname, "../src/routes/admin.routes.js");

test("admin dashboard patient total excludes patients from other hospitals", async () => {
  let patientWhere;
  const prisma = {
    hospitalAdmin: {
      findUnique: async () => ({
        hospital_id: "hospital-a",
        hospital: {
          hospital_id: "hospital-a",
          name: "Hospital A",
          facility_type: "HOSPITAL",
          city: "Karachi",
          is_active: true,
        },
      }),
    },
    department: { count: async () => 0 },
    doctor: { count: async () => 0 },
    hospitalStaff: { count: async () => 0 },
    patient: {
      count: async ({ where }) => {
        patientWhere = where;
        return where.appointments.some.hospital_id === "hospital-a" ? 3 : 99;
      },
    },
    appointment: { findMany: async () => [], groupBy: async () => [] },
    queue: { groupBy: async () => [] },
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
      getPakistanDate: () => new Date("2026-09-03T00:00:00.000Z"),
      formatTime12h: (value) => value,
      addTime12hFields: (value) => value,
    },
  });
  const route = harness.findRoute("GET", "/dashboard");
  const response = createResponse();

  await route.handlers.at(-1)(
    { user: { user_id: "admin-user-a", role: "ADMIN" } },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.patients.total, 3);
  assert.deepEqual(patientWhere, {
    appointments: { some: { hospital_id: "hospital-a" } },
  });
});

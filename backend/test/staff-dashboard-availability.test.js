const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadFreshWithMocks } = require("./helpers/load-with-mocks");
const { createExpressMock, createResponse } = require("./helpers/route-harness");

const routePath = path.resolve(__dirname, "../src/routes/staff.routes.js");

test("staff available-today count excludes inactive and temporarily unavailable doctors", async () => {
  let availabilityWhere;
  const prisma = {
    hospitalStaff: {
      findUnique: async () => ({
        staff_id: "staff-1",
        hospital_id: "hospital-1",
        employee_id: "S-1",
        position: "Receptionist",
        is_active: true,
        department: null,
        hospital: {
          hospital_id: "hospital-1",
          name: "Hospital 1",
          facility_type: "HOSPITAL",
          city: "Karachi",
          is_active: true,
        },
      }),
    },
    appointment: { findMany: async () => [], groupBy: async () => [] },
    queue: { groupBy: async () => [] },
    doctor: { count: async () => 0 },
    doctorAvailability: {
      count: async ({ where }) => {
        availabilityWhere = where;
        return 0;
      },
    },
    department: { count: async () => 0 },
  };
  const harness = createExpressMock();
  const authorizeRoles = (...roles) => {
    const middleware = (_req, _res, next) => next();
    middleware.allowedRoles = roles;
    return middleware;
  };
  loadFreshWithMocks(routePath, {
    express: harness.express,
    bcryptjs: { hash: async () => "hash" },
    crypto: { randomUUID: () => "token" },
    "../config/prisma": prisma,
    "../middleware/auth.middleware": {
      authenticateToken: (_req, _res, next) => next(),
      authorizeRoles,
    },
    "../utils/date.helpers": {
      getPakistanDate: () => new Date("2026-09-03T00:00:00.000Z"),
      getPakistanDayOfWeek: () => "THURSDAY",
      formatTime12h: (value) => value,
      addTime12hFields: (value) => value,
    },
  });
  const response = createResponse();

  const dashboardRoute = harness.findRoute("GET", "/dashboard");
  const todayRoute = harness.findRoute("GET", "/appointments/today");

  assert.deepEqual(dashboardRoute.handlers[1].allowedRoles, ["STAFF"]);
  assert.deepEqual(todayRoute.handlers[1].allowedRoles, ["STAFF"]);

  await dashboardRoute.handlers.at(-1)(
    { user: { user_id: "staff-user-1", role: "STAFF" } },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(availabilityWhere.doctor, {
    hospital_id: "hospital-1",
    is_active: true,
    is_available: true,
  });
});

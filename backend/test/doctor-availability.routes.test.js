const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadFreshWithMocks } = require("./helpers/load-with-mocks");
const { createExpressMock, createResponse } = require("./helpers/route-harness");

const routePath = path.resolve(__dirname, "../src/routes/doctor.routes.js");

function createPrisma({
  doctorHospitalId = "hospital-1",
  adminHospitalId = "hospital-1",
  doctorActive = true,
  hospitalActive = true,
  departmentActive = true,
  available = false,
  notificationFailure = false,
} = {}) {
  const state = {
    doctor: {
      doctor_id: "doctor-1",
      hospital_id: doctorHospitalId,
      department_id: "department-1",
      name: "Dr Test",
      is_active: doctorActive,
      is_available: available,
      hospital: { is_active: hospitalActive },
      department: { is_active: departmentActive },
    },
    subscriptions: [],
    notifications: [],
    doctorReadQueries: [],
    availabilityUpdateWhere: null,
  };

  const tx = {
    doctor: {
      updateMany: async ({ where, data }) => {
        state.availabilityUpdateWhere = where;
        if (
          state.doctor.doctor_id !== where.doctor_id ||
          state.doctor.hospital_id !== where.hospital_id ||
          !state.doctor.is_active ||
          state.doctor.is_available === data.is_available
        ) {
          return { count: 0 };
        }
        state.doctor.is_available = data.is_available;
        return { count: 1 };
      },
      findUnique: async () => ({ ...state.doctor }),
    },
    doctorAvailabilitySubscription: {
      findMany: async () =>
        state.subscriptions.map((subscription) => ({
          patient: { user_id: subscription.user_id },
        })),
    },
    notification: {
      createMany: async ({ data }) => {
        if (notificationFailure) {
          throw new Error("notification write failed");
        }
        state.notifications.push(...data);
        return { count: data.length };
      },
    },
  };

  const prisma = {
    hospitalAdmin: {
      findUnique: async () => ({ hospital_id: adminHospitalId }),
    },
    patient: {
      findUnique: async () => ({ patient_id: "patient-1" }),
    },
    doctor: {
      findUnique: async () => ({ ...state.doctor }),
      findMany: async (query) => {
        state.doctorReadQueries.push(query.where);
        return [{ ...state.doctor }];
      },
      findFirst: async (query) => {
        state.doctorReadQueries.push(query.where);
        return { ...state.doctor, schedules: [] };
      },
      update: async ({ data }) => {
        Object.assign(state.doctor, data);
        return { ...state.doctor };
      },
    },
    doctorAvailabilitySubscription: {
      findUnique: async () =>
        state.subscriptions.find((item) => item.patient_id === "patient-1") ||
        null,
      upsert: async () => {
        let subscription = state.subscriptions.find(
          (item) => item.patient_id === "patient-1"
        );
        if (!subscription) {
          subscription = {
            subscription_id: "subscription-1",
            patient_id: "patient-1",
            doctor_id: "doctor-1",
            user_id: "patient-user-1",
          };
          state.subscriptions.push(subscription);
        }
        return subscription;
      },
      deleteMany: async () => {
        const count = state.subscriptions.length;
        state.subscriptions = [];
        return { count };
      },
    },
    $transaction: async (callback) => {
      const previousDoctor = { ...state.doctor };
      const previousNotifications = [...state.notifications];
      try {
        return await callback(tx);
      } catch (error) {
        state.doctor = previousDoctor;
        state.notifications = previousNotifications;
        throw error;
      }
    },
  };

  return { prisma, state };
}

function loadRoutes(prisma) {
  const harness = createExpressMock();
  loadFreshWithMocks(routePath, {
    express: harness.express,
    "../config/prisma": prisma,
    "../middleware/auth.middleware": {
      authenticateToken: (_req, _res, next) => next(),
      authorizeRoles: () => (_req, _res, next) => next(),
    },
    "../utils/date.helpers": { addTime12hFields: (value) => value },
  });
  return harness;
}

async function invoke(route, { body = {}, userId = "admin-user-1" } = {}) {
  const response = createResponse();
  await route.handlers.at(-1)(
    {
      body,
      params: { doctor_id: "doctor-1" },
      user: { user_id: userId },
    },
    response
  );
  return response;
}

test("same-hospital admin can change persistent doctor availability", async () => {
  const { prisma, state } = createPrisma();
  const route = loadRoutes(prisma).findRoute(
    "PATCH",
    "/:doctor_id/availability"
  );

  const response = await invoke(route, { body: { is_available: true } });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.is_available, true);
  assert.equal(state.doctor.is_available, true);
  assert.deepEqual(state.availabilityUpdateWhere.hospital, {
    is_active: true,
  });
  assert.deepEqual(state.availabilityUpdateWhere.department, {
    is_active: true,
  });
});

test("public doctor reads exclude inactive hospital and department records", async () => {
  const { prisma, state } = createPrisma();
  const harness = loadRoutes(prisma);
  const response = createResponse();

  await harness.findRoute("GET", "/hospital/:hospitalId").handlers.at(-1)(
    { params: { hospitalId: "hospital-1" } },
    response
  );
  await harness.findRoute("GET", "/department/:departmentId").handlers.at(-1)(
    { params: { departmentId: "department-1" } },
    createResponse()
  );
  await harness.findRoute("GET", "/:doctor_id").handlers.at(-1)(
    { params: { doctor_id: "doctor-1" } },
    createResponse()
  );

  assert.equal(response.body.data[0].is_available, false);
  assert.deepEqual(state.doctorReadQueries[0], {
    hospital_id: "hospital-1",
    is_active: true,
    hospital: { is_active: true },
    department: { is_active: true },
  });
  assert.deepEqual(state.doctorReadQueries[1], {
    department_id: "department-1",
    is_active: true,
    hospital: { is_active: true },
    department: { is_active: true },
  });
  assert.deepEqual(state.doctorReadQueries[2], {
    doctor_id: "doctor-1",
    is_active: true,
    hospital: { is_active: true },
    department: { is_active: true },
  });
});

test("cross-hospital admin cannot change doctor availability", async () => {
  const { prisma, state } = createPrisma({ adminHospitalId: "hospital-2" });
  const route = loadRoutes(prisma).findRoute(
    "PATCH",
    "/:doctor_id/availability"
  );

  const response = await invoke(route, { body: { is_available: true } });

  assert.equal(response.statusCode, 403);
  assert.equal(state.doctor.is_available, false);
  assert.equal(state.notifications.length, 0);
});

test("unavailable to available notifies each subscribed patient once", async () => {
  const { prisma, state } = createPrisma();
  state.subscriptions.push(
    { patient_id: "patient-1", doctor_id: "doctor-1", user_id: "user-1" },
    { patient_id: "patient-2", doctor_id: "doctor-1", user_id: "user-2" }
  );
  const route = loadRoutes(prisma).findRoute(
    "PATCH",
    "/:doctor_id/availability"
  );

  const first = await invoke(route, { body: { is_available: true } });
  const duplicate = await invoke(route, { body: { is_available: true } });

  assert.equal(first.statusCode, 200);
  assert.equal(duplicate.statusCode, 200);
  assert.equal(state.notifications.length, 2);
  assert.deepEqual(
    state.notifications.map((item) => item.user_id),
    ["user-1", "user-2"]
  );
  assert.equal(
    state.notifications.every((item) => item.type === "DOCTOR_AVAILABILITY"),
    true
  );
});

test("available to unavailable persists without availability alerts", async () => {
  const { prisma, state } = createPrisma({ available: true });
  state.subscriptions.push({
    patient_id: "patient-1",
    doctor_id: "doctor-1",
    user_id: "user-1",
  });
  const route = loadRoutes(prisma).findRoute(
    "PATCH",
    "/:doctor_id/availability"
  );

  const response = await invoke(route, { body: { is_available: false } });

  assert.equal(response.statusCode, 200);
  assert.equal(state.doctor.is_available, false);
  assert.equal(state.notifications.length, 0);
});

test("inactive doctor cannot be toggled available", async () => {
  const { prisma, state } = createPrisma({ doctorActive: false });
  const route = loadRoutes(prisma).findRoute(
    "PATCH",
    "/:doctor_id/availability"
  );

  const response = await invoke(route, { body: { is_available: true } });

  assert.equal(response.statusCode, 400);
  assert.equal(state.doctor.is_available, false);
});

test("doctor in inactive department cannot be toggled available", async () => {
  const { prisma, state } = createPrisma({ departmentActive: false });
  const route = loadRoutes(prisma).findRoute(
    "PATCH",
    "/:doctor_id/availability"
  );

  const response = await invoke(route, { body: { is_available: true } });

  assert.equal(response.statusCode, 400);
  assert.equal(state.doctor.is_available, false);
  assert.equal(state.notifications.length, 0);
});

test("availability alert failure rolls back doctor state", async () => {
  const { prisma, state } = createPrisma({ notificationFailure: true });
  state.subscriptions.push({
    patient_id: "patient-1",
    doctor_id: "doctor-1",
    user_id: "user-1",
  });
  const route = loadRoutes(prisma).findRoute(
    "PATCH",
    "/:doctor_id/availability"
  );
  const originalConsoleError = console.error;
  console.error = () => {};

  let response;
  try {
    response = await invoke(route, { body: { is_available: true } });
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(response.statusCode, 500);
  assert.equal(state.doctor.is_available, false);
  assert.equal(state.notifications.length, 0);
});

test("patient subscription is idempotent and exposes current state", async () => {
  const { prisma, state } = createPrisma({ available: true });
  const harness = loadRoutes(prisma);
  const subscribe = harness.findRoute(
    "POST",
    "/:doctor_id/availability-subscription"
  );
  const current = harness.findRoute(
    "GET",
    "/:doctor_id/availability-subscription"
  );

  const first = await invoke(subscribe, { userId: "patient-user-1" });
  const duplicate = await invoke(subscribe, { userId: "patient-user-1" });
  const status = await invoke(current, { userId: "patient-user-1" });

  assert.equal(first.statusCode, 200);
  assert.equal(duplicate.statusCode, 200);
  assert.equal(state.subscriptions.length, 1);
  assert.deepEqual(status.body.data, {
    doctor_id: "doctor-1",
    subscribed: true,
    is_available: true,
  });
  assert.equal(state.notifications.length, 0);
});

test("patient can unsubscribe only own doctor subscription", async () => {
  const { prisma, state } = createPrisma();
  state.subscriptions.push({
    patient_id: "patient-1",
    doctor_id: "doctor-1",
    user_id: "patient-user-1",
  });
  const route = loadRoutes(prisma).findRoute(
    "DELETE",
    "/:doctor_id/availability-subscription"
  );

  const response = await invoke(route, { userId: "patient-user-1" });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.subscribed, false);
  assert.equal(state.subscriptions.length, 0);
});

test("doctor deactivation also clears temporary availability", async () => {
  const { prisma, state } = createPrisma({ available: true });
  const route = loadRoutes(prisma).findRoute(
    "PATCH",
    "/:doctor_id/deactivate"
  );

  const response = await invoke(route);

  assert.equal(response.statusCode, 200);
  assert.equal(state.doctor.is_active, false);
  assert.equal(state.doctor.is_available, false);
});

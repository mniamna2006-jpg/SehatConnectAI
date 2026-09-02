const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadFreshWithMocks } = require("./helpers/load-with-mocks");
const { createExpressMock, createResponse } = require("./helpers/route-harness");

const routePath = path.resolve(__dirname, "../src/routes/queue.routes.js");

function loadUpdateQueueHandler(prisma) {
  const harness = createExpressMock();

  loadFreshWithMocks(routePath, {
    express: harness.express,
    "../config/prisma": prisma,
    "../middleware/auth.middleware": {
      authenticateToken: (_req, _res, next) => next(),
      authorizeRoles: () => (_req, _res, next) => next(),
    },
    "../services/notification.service": {
      notifyPatientForAppointment: async () => {
        throw new Error("Queue route must use its transaction client");
      },
    },
    "../utils/date.helpers": {
      formatTime12h: (value) => value,
    },
  });

  const route = harness.findRoute("PATCH", "/:queue_id/status");
  return route.handlers[route.handlers.length - 1];
}

async function invokeUpdate(
  handler,
  status,
  queueId = "queue-1",
  suppressConsoleError = true
) {
  const response = createResponse();
  const originalConsoleError = console.error;
  if (suppressConsoleError) {
    console.error = () => {};
  }

  try {
    await handler(
      {
        params: { queue_id: queueId },
        body: { status },
        user: { user_id: "staff-user-1", role: "STAFF" },
      },
      response
    );
  } finally {
    if (suppressConsoleError) {
      console.error = originalConsoleError;
    }
  }

  return response;
}

function clone(value) {
  return structuredClone(value);
}

function createPrisma({
  queueStatus = "WAITING",
  staffHospitalId = "hospital-1",
  queueHospitalId = "hospital-1",
  notificationFails = false,
  notifications = [],
  synchronizeQueueReads = false,
  staffExists = true,
} = {}) {
  let queueReadCount = 0;
  let releaseQueueReads;
  let transactionTail = Promise.resolve();
  const queueReadsReady = new Promise((resolve) => {
    releaseQueueReads = resolve;
  });
  const state = {
    queue: {
      queue_id: "queue-1",
      hospital_id: queueHospitalId,
      appointment_id: "appointment-1",
      token_number: 17,
      queue_status: queueStatus,
      called_at: null,
      completed_at: null,
    },
    appointment: {
      appointment_id: "appointment-1",
      patient_id: "patient-1",
      appointment_time: "09:30",
      status:
        queueStatus === "IN_PROGRESS"
          ? "IN_PROGRESS"
          : queueStatus === "COMPLETED"
            ? "COMPLETED"
            : "CHECKED_IN",
      patient: {
        user_id: "patient-user-1",
      },
    },
    notifications: clone(notifications),
    transactionCalls: 0,
  };

  const prisma = {
    hospitalStaff: {
      findUnique: async () =>
        staffExists
          ? {
              hospital_id: staffHospitalId,
              is_active: true,
            }
          : null,
    },
    queue: {
      findFirst: async (query) => {
        if (
          query.where.queue_id !== state.queue.queue_id ||
          query.where.hospital_id !== state.queue.hospital_id
        ) {
          return null;
        }

        const queueSnapshot = clone(state.queue);
        const appointment = { ...state.appointment };
        const patientRequested =
          query.include?.appointment?.include?.patient === true ||
          Boolean(query.include?.appointment?.include?.patient?.select?.user_id);

        if (!patientRequested) {
          delete appointment.patient;
        }

        if (synchronizeQueueReads) {
          queueReadCount += 1;
          if (queueReadCount === 2) {
            releaseQueueReads();
          }
          await queueReadsReady;
        }

        return {
          ...queueSnapshot,
          appointment,
        };
      },
    },
    async $transaction(callback) {
      const previousTransaction = transactionTail;
      let releaseTransaction;
      transactionTail = new Promise((resolve) => {
        releaseTransaction = resolve;
      });
      await previousTransaction;

      state.transactionCalls += 1;
      const snapshot = clone({
        queue: state.queue,
        appointment: state.appointment,
        notifications: state.notifications,
      });
      const transaction = {
        queue: {
          update: async ({ where, data }) => {
            if (
              where.queue_status !== undefined &&
              where.queue_status !== state.queue.queue_status
            ) {
              const error = new Error("Record to update not found");
              error.code = "P2025";
              throw error;
            }
            Object.assign(state.queue, data);
            return clone(state.queue);
          },
        },
        appointment: {
          update: async ({ data }) => {
            Object.assign(state.appointment, data);
            const { patient: _patient, ...appointment } = state.appointment;
            return clone(appointment);
          },
        },
        notification: {
          create: async ({ data }) => {
            if (notificationFails) {
              throw new Error("Notification write failed");
            }

            const notification = {
              notification_id: `notification-${state.notifications.length + 1}`,
              ...data,
            };
            state.notifications.push(notification);
            return notification;
          },
        },
      };

      try {
        const result = await callback(transaction);
        releaseTransaction();
        return result;
      } catch (error) {
        state.queue = snapshot.queue;
        state.appointment = snapshot.appointment;
        state.notifications = snapshot.notifications;
        releaseTransaction();
        throw error;
      }
    },
  };

  return { prisma, state };
}

const transitionCases = [
  {
    from: "WAITING",
    to: "CALLED",
    title: "You Are Being Called",
    message: "Your queue token 17 is being called. Please proceed to the consultation area.",
    appointmentStatus: "CHECKED_IN",
  },
  {
    from: "CALLED",
    to: "IN_PROGRESS",
    title: "Consultation Started",
    message: "Your consultation is now in progress.",
    appointmentStatus: "IN_PROGRESS",
  },
  {
    from: "IN_PROGRESS",
    to: "COMPLETED",
    title: "Consultation Completed",
    message: "Your consultation has been completed.",
    appointmentStatus: "COMPLETED",
  },
];

for (const transition of transitionCases) {
  test(`${transition.from} to ${transition.to} atomically creates one patient queue notification`, async () => {
    const { prisma, state } = createPrisma({ queueStatus: transition.from });
    const handler = loadUpdateQueueHandler(prisma);

    const response = await invokeUpdate(handler, transition.to);

    assert.equal(response.statusCode, 200);
    assert.equal(state.queue.queue_status, transition.to);
    assert.equal(state.appointment.status, transition.appointmentStatus);
    assert.equal(response.body.data.appointment.patient, undefined);
    assert.equal(state.notifications.length, 1);
    assert.deepEqual(state.notifications[0], {
      notification_id: "notification-1",
      user_id: "patient-user-1",
      type: "QUEUE_UPDATE",
      title: transition.title,
      message: transition.message,
      related_appointment_id: "appointment-1",
    });
  });
}

test("invalid queue transition creates no notification or mutation", async () => {
  const { prisma, state } = createPrisma({ queueStatus: "WAITING" });
  const handler = loadUpdateQueueHandler(prisma);

  const response = await invokeUpdate(handler, "COMPLETED");

  assert.equal(response.statusCode, 400);
  assert.equal(state.queue.queue_status, "WAITING");
  assert.equal(state.appointment.status, "CHECKED_IN");
  assert.deepEqual(state.notifications, []);
  assert.equal(state.transactionCalls, 0);
});

test("repeating an already applied transition creates no extra notification", async () => {
  const { prisma, state } = createPrisma({ queueStatus: "WAITING" });
  const handler = loadUpdateQueueHandler(prisma);

  const firstResponse = await invokeUpdate(handler, "CALLED");
  const repeatedResponse = await invokeUpdate(handler, "CALLED");

  assert.equal(firstResponse.statusCode, 200);
  assert.equal(repeatedResponse.statusCode, 400);
  assert.equal(state.queue.queue_status, "CALLED");
  assert.equal(state.notifications.length, 1);
});

test("concurrent duplicate transition creates exactly one notification", async () => {
  const { prisma, state } = createPrisma({
    queueStatus: "WAITING",
    synchronizeQueueReads: true,
  });
  const handler = loadUpdateQueueHandler(prisma);

  const originalConsoleError = console.error;
  console.error = () => {};
  let responses;

  try {
    responses = await Promise.all([
      invokeUpdate(handler, "CALLED", "queue-1", false),
      invokeUpdate(handler, "CALLED", "queue-1", false),
    ]);
  } finally {
    console.error = originalConsoleError;
  }

  assert.deepEqual(
    responses.map((response) => response.statusCode).sort(),
    [200, 409]
  );
  assert.equal(state.queue.queue_status, "CALLED");
  assert.equal(state.notifications.length, 1);
});

test("staff from another hospital cannot update queue or notify patient", async () => {
  const { prisma, state } = createPrisma({
    queueStatus: "WAITING",
    staffHospitalId: "hospital-2",
  });
  const handler = loadUpdateQueueHandler(prisma);

  const response = await invokeUpdate(handler, "CALLED");

  assert.equal(response.statusCode, 404);
  assert.equal(state.queue.queue_status, "WAITING");
  assert.deepEqual(state.notifications, []);
  assert.equal(state.transactionCalls, 0);
});

test("user without a staff profile cannot update queue or notify patient", async () => {
  const { prisma, state } = createPrisma({
    queueStatus: "WAITING",
    staffExists: false,
  });
  const handler = loadUpdateQueueHandler(prisma);

  const response = await invokeUpdate(handler, "CALLED");

  assert.equal(response.statusCode, 404);
  assert.equal(state.queue.queue_status, "WAITING");
  assert.deepEqual(state.notifications, []);
  assert.equal(state.transactionCalls, 0);
});

test("notification failure rolls back queue and appointment status changes", async () => {
  const { prisma, state } = createPrisma({
    queueStatus: "CALLED",
    notificationFails: true,
  });
  const handler = loadUpdateQueueHandler(prisma);

  const response = await invokeUpdate(handler, "IN_PROGRESS");

  assert.equal(response.statusCode, 500);
  assert.equal(state.queue.queue_status, "CALLED");
  assert.equal(state.appointment.status, "CHECKED_IN");
  assert.deepEqual(state.notifications, []);
  assert.equal(state.transactionCalls, 1);
});

test("queue status endpoint cannot duplicate initial CHECKED_IN notification", async () => {
  const initialNotification = {
    notification_id: "notification-initial",
    user_id: "patient-user-1",
    type: "QUEUE_UPDATE",
    title: "Added to Queue",
    message: "You have been checked in and added to the queue.",
    related_appointment_id: "appointment-1",
  };
  const { prisma, state } = createPrisma({
    queueStatus: "WAITING",
    notifications: [initialNotification],
  });
  const handler = loadUpdateQueueHandler(prisma);

  const response = await invokeUpdate(handler, "CHECKED_IN");

  assert.equal(response.statusCode, 400);
  assert.deepEqual(state.notifications, [initialNotification]);
  assert.equal(state.transactionCalls, 0);
});

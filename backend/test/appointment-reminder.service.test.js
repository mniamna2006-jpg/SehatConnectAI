const assert = require("node:assert/strict");
const test = require("node:test");

const {
  processAppointmentReminders,
} = require("../src/services/appointment-reminder.service");

const NOW = new Date("2026-09-03T04:00:00.000Z"); // 09:00 Asia/Karachi

function appointment(overrides = {}) {
  return {
    appointment_id: "appointment-1",
    appointment_date: new Date("2026-09-04T00:00:00.000Z"),
    appointment_time: "09:00",
    status: "BOOKED",
    reminder_sent_at: null,
    patient: { user_id: "patient-user-1" },
    ...overrides,
  };
}

function clone(value) {
  return structuredClone(value);
}

function createPrisma(initialAppointments, { failNotificationFor = null } = {}) {
  const state = {
    appointments: clone(initialAppointments),
    notifications: [],
  };
  let transactionTail = Promise.resolve();

  const prisma = {
    appointment: {
      findMany: async () => clone(state.appointments),
    },
    async $transaction(callback) {
      const previousTransaction = transactionTail;
      let releaseTransaction;
      transactionTail = new Promise((resolve) => {
        releaseTransaction = resolve;
      });
      await previousTransaction;

      const snapshot = clone(state);
      const transaction = {
        appointment: {
          updateMany: async ({ where, data }) => {
            const record = state.appointments.find(
              (candidate) => candidate.appointment_id === where.appointment_id
            );
            const eligibleStatus = where.status.in.includes(record?.status);
            const unclaimed = record && record.reminder_sent_at == null;

            if (!record || !eligibleStatus || !unclaimed) {
              return { count: 0 };
            }

            Object.assign(record, data);
            return { count: 1 };
          },
        },
        notification: {
          create: async ({ data }) => {
            if (data.related_appointment_id === failNotificationFor) {
              throw new Error("Notification insert failed");
            }

            state.notifications.push({
              notification_id: `notification-${state.notifications.length + 1}`,
              ...data,
            });
          },
        },
      };

      try {
        const result = await callback(transaction);
        releaseTransaction();
        return result;
      } catch (error) {
        state.appointments = snapshot.appointments;
        state.notifications = snapshot.notifications;
        releaseTransaction();
        throw error;
      }
    },
  };

  return { prisma, state };
}

test("appointment exactly 24 hours away creates one patient reminder", async () => {
  const { prisma, state } = createPrisma([appointment()]);

  const result = await processAppointmentReminders(NOW, prisma);

  assert.deepEqual(result, { created: 1, failed: 0 });
  assert.equal(state.notifications.length, 1);
  assert.deepEqual(state.notifications[0], {
    notification_id: "notification-1",
    user_id: "patient-user-1",
    type: "APPOINTMENT_REMINDER",
    title: "Appointment Reminder",
    message: "Your appointment is scheduled for 2026-09-04 at 09:00.",
    related_appointment_id: "appointment-1",
  });
  assert.deepEqual(state.appointments[0].reminder_sent_at, NOW);
});

test("second worker run does not duplicate reminder", async () => {
  const { prisma, state } = createPrisma([appointment()]);

  await processAppointmentReminders(NOW, prisma);
  const secondResult = await processAppointmentReminders(NOW, prisma);

  assert.deepEqual(secondResult, { created: 0, failed: 0 });
  assert.equal(state.notifications.length, 1);
});

test("concurrent worker runs create only one reminder", async () => {
  const { prisma, state } = createPrisma([appointment()]);

  await Promise.all([
    processAppointmentReminders(NOW, prisma),
    processAppointmentReminders(NOW, prisma),
  ]);

  assert.equal(state.notifications.length, 1);
});

for (const status of ["CANCELLED", "COMPLETED"]) {
  test(`${status} appointment creates no reminder`, async () => {
    const { prisma, state } = createPrisma([appointment({ status })]);

    const result = await processAppointmentReminders(NOW, prisma);

    assert.deepEqual(result, { created: 0, failed: 0 });
    assert.deepEqual(state.notifications, []);
  });
}

test("past appointment creates no reminder", async () => {
  const { prisma, state } = createPrisma([
    appointment({
      appointment_date: new Date("2026-09-03T00:00:00.000Z"),
      appointment_time: "08:59",
    }),
  ]);

  await processAppointmentReminders(NOW, prisma);

  assert.deepEqual(state.notifications, []);
});

test("appointment outside 24-hour window creates no reminder", async () => {
  const { prisma, state } = createPrisma([
    appointment({ appointment_time: "09:01" }),
  ]);

  await processAppointmentReminders(NOW, prisma);

  assert.deepEqual(state.notifications, []);
});

test("appointment across Pakistan calendar date boundary creates reminder", async () => {
  const now = new Date("2026-09-03T18:30:00.000Z"); // 23:30 Asia/Karachi
  const { prisma, state } = createPrisma([
    appointment({ appointment_time: "00:15" }),
  ]);

  await processAppointmentReminders(now, prisma);

  assert.equal(state.notifications.length, 1);
});

test("invalid appointment time creates no reminder", async () => {
  const { prisma, state } = createPrisma([
    appointment({ appointment_time: "not-a-time" }),
  ]);

  await processAppointmentReminders(NOW, prisma);

  assert.deepEqual(state.notifications, []);
});

test("notification failure rolls back reminder claim", async () => {
  const { prisma, state } = createPrisma([appointment()], {
    failNotificationFor: "appointment-1",
  });

  const result = await processAppointmentReminders(NOW, prisma);

  assert.deepEqual(result, { created: 0, failed: 1 });
  assert.equal(state.appointments[0].reminder_sent_at, null);
  assert.deepEqual(state.notifications, []);
});

test("multiple eligible appointments create independent patient reminders", async () => {
  const { prisma, state } = createPrisma([
    appointment(),
    appointment({
      appointment_id: "appointment-2",
      appointment_time: "08:30",
      patient: { user_id: "patient-user-2" },
    }),
  ]);

  const result = await processAppointmentReminders(NOW, prisma);

  assert.deepEqual(result, { created: 2, failed: 0 });
  assert.deepEqual(
    state.notifications.map(({ user_id, related_appointment_id }) => ({
      user_id,
      related_appointment_id,
    })),
    [
      {
        user_id: "patient-user-1",
        related_appointment_id: "appointment-1",
      },
      {
        user_id: "patient-user-2",
        related_appointment_id: "appointment-2",
      },
    ]
  );
});

test("legacy appointment without reminder field remains eligible", async () => {
  const legacyAppointment = appointment();
  delete legacyAppointment.reminder_sent_at;
  const { prisma, state } = createPrisma([legacyAppointment]);

  await processAppointmentReminders(NOW, prisma);

  assert.equal(state.notifications.length, 1);
});

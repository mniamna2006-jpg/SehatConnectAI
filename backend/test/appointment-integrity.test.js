const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadFreshWithMocks } = require("./helpers/load-with-mocks");
const { createExpressMock, createResponse } = require("./helpers/route-harness");

const routePath = path.resolve(__dirname, "../src/routes/appointment.routes.js");

function loadHandler(prisma) {
  const harness = createExpressMock();
  loadFreshWithMocks(routePath, {
    express: harness.express,
    "../config/prisma": prisma,
    "../services/notification.service": {
      notifyPatientForAppointment: async () => {},
    },
    "../middleware/auth.middleware": {
      authenticateToken: (_req, _res, next) => next(),
      authorizeRoles: () => (_req, _res, next) => next(),
    },
    "../utils/date.helpers": {
      formatTime12h: (value) => value,
      addTime12hFields: (value) => value,
    },
  });
  return harness.findRoute("POST", "/").handlers.at(-1);
}

test("patient cannot book a slot with mismatched department", async () => {
  let transactionCalls = 0;
  const prisma = {
    patient: { findUnique: async () => ({ patient_id: "patient-1" }) },
    timeSlot: {
      findUnique: async () => ({
        slot_id: "slot-1",
        doctor_id: "doctor-1",
        hospital_id: "hospital-1",
        status: "AVAILABLE",
        date: new Date("2026-09-10T00:00:00.000Z"),
        start_time: "09:00",
        doctor: {
          doctor_id: "doctor-1",
          hospital_id: "hospital-1",
          department_id: "department-1",
          is_active: true,
          department: { department_id: "department-1", is_active: true },
          hospital: { hospital_id: "hospital-1", is_active: true },
        },
      }),
    },
    $transaction: async () => {
      transactionCalls += 1;
    },
  };
  const response = createResponse();

  await loadHandler(prisma)(
    {
      body: {
        doctor_id: "doctor-1",
        hospital_id: "hospital-1",
        department_id: "department-2",
        slot_id: "slot-1",
      },
      user: { user_id: "patient-user-1", role: "PATIENT" },
    },
    response
  );

  assert.equal(response.statusCode, 400);
  assert.equal(transactionCalls, 0);
});

test("patient cannot book an unavailable doctor", async () => {
  let transactionCalls = 0;
  const prisma = {
    patient: { findUnique: async () => ({ patient_id: "patient-1" }) },
    timeSlot: {
      findUnique: async () => ({
        slot_id: "slot-1",
        doctor_id: "doctor-1",
        hospital_id: "hospital-1",
        status: "AVAILABLE",
        date: new Date("2026-09-10T00:00:00.000Z"),
        start_time: "09:00",
        doctor: {
          doctor_id: "doctor-1",
          hospital_id: "hospital-1",
          department_id: "department-1",
          is_active: true,
          is_available: false,
          department: {
            department_id: "department-1",
            hospital_id: "hospital-1",
            is_active: true,
          },
          hospital: { hospital_id: "hospital-1", is_active: true },
        },
      }),
    },
    $transaction: async () => {
      transactionCalls += 1;
    },
  };
  const response = createResponse();

  await loadHandler(prisma)(
    {
      body: {
        doctor_id: "doctor-1",
        hospital_id: "hospital-1",
        department_id: "department-1",
        slot_id: "slot-1",
      },
      user: { user_id: "patient-user-1", role: "PATIENT" },
    },
    response
  );

  assert.equal(response.statusCode, 400);
  assert.equal(transactionCalls, 0);
});

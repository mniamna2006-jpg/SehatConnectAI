const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadFreshWithMocks } = require("./helpers/load-with-mocks");

const servicePath = path.resolve(
  __dirname,
  "../src/services/analytics.service.js"
);

function emptyGroupBy() {
  return [];
}

test("analytics patient metrics are scoped to authenticated hospital", async () => {
  const patientQueries = [];
  let currentHospital = "hospital-a";
  const prisma = {
    appointment: { count: async () => 0, groupBy: emptyGroupBy },
    patient: {
      count: async (query) => {
        patientQueries.push(query);
        return query.where.appointments.some.hospital_id === "hospital-a" ? 2 : 7;
      },
    },
    queue: { count: async () => 0, groupBy: emptyGroupBy, findMany: async () => [] },
    hospital: {
      findUnique: async ({ where }) => ({
        hospital_id: where.hospital_id,
        name: where.hospital_id,
        is_active: true,
      }),
    },
    doctor: { count: async () => 0, findMany: async () => [] },
    department: { count: async () => 0, findMany: async () => [] },
  };
  const { getOverview } = loadFreshWithMocks(servicePath, {
    "../config/prisma": prisma,
    "../utils/date.helpers": {
      getPakistanDate: () => new Date("2026-09-03T00:00:00.000Z"),
    },
  });

  const result = await getOverview("hospital-a");
  currentHospital = "hospital-b";
  const otherResult = await getOverview(currentHospital);

  assert.equal(result.patients.total, 2);
  assert.equal(otherResult.patients.total, 7);
  assert.equal(patientQueries.length, 10);
  assert.equal(
    patientQueries.slice(0, 5).every(
      (query) => query.where.appointments.some.hospital_id === "hospital-a"
    ),
    true
  );
  assert.equal(
    patientQueries.slice(5).every(
      (query) => query.where.appointments.some.hospital_id === "hospital-b"
    ),
    true
  );
});

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createAppointmentReminderJob,
} = require("../src/jobs/appointment-reminder.job");

test("appointment reminder job does not overlap executions", async () => {
  let resolveFirstRun;
  let calls = 0;
  const firstRun = new Promise((resolve) => {
    resolveFirstRun = resolve;
  });
  const job = createAppointmentReminderJob({
    processReminders: async () => {
      calls += 1;
      await firstRun;
    },
    logger: { error() {} },
  });

  const running = job.runOnce();
  const skipped = await job.runOnce();
  resolveFirstRun();
  const completed = await running;

  assert.equal(skipped, false);
  assert.equal(completed, true);
  assert.equal(calls, 1);
});

test("appointment reminder job logs safe error and can run again", async () => {
  const logged = [];
  let calls = 0;
  const job = createAppointmentReminderJob({
    processReminders: async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error("DATABASE_SECRET_SENTINEL");
      }
    },
    logger: { error: (...args) => logged.push(args) },
  });

  assert.equal(await job.runOnce(), false);
  assert.equal(await job.runOnce(), true);
  assert.deepEqual(logged, [["Appointment reminder job failed"]]);
  assert.equal(JSON.stringify(logged).includes("DATABASE_SECRET_SENTINEL"), false);
});

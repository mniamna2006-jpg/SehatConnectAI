const {
  processAppointmentReminders,
} = require("../services/appointment-reminder.service");

const JOB_INTERVAL_MS = 15 * 60 * 1000;

function createAppointmentReminderJob({
  processReminders = processAppointmentReminders,
  logger = console,
  intervalMs = JOB_INTERVAL_MS,
} = {}) {
  let isRunning = false;
  let timer = null;

  async function runOnce() {
    if (isRunning) {
      return false;
    }

    isRunning = true;

    try {
      const result = await processReminders(new Date());

      if (result?.failed > 0) {
        logger.error(
          `Appointment reminder job failed for ${result.failed} appointment(s)`
        );
      }

      return true;
    } catch (_error) {
      logger.error("Appointment reminder job failed");
      return false;
    } finally {
      isRunning = false;
    }
  }

  function start() {
    if (timer) {
      return;
    }

    void runOnce();
    timer = setInterval(runOnce, intervalMs);
    timer.unref?.();
  }

  function stop() {
    if (!timer) {
      return;
    }

    clearInterval(timer);
    timer = null;
  }

  return { runOnce, start, stop };
}

module.exports = {
  JOB_INTERVAL_MS,
  createAppointmentReminderJob,
};

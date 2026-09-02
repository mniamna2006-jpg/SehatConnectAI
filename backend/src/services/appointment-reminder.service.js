const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
const ELIGIBLE_STATUSES = ["BOOKED", "CONFIRMED"];
const APPOINTMENT_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const PAKISTAN_UTC_OFFSET = "+05:00";

function formatAppointmentDate(appointmentDate) {
  if (
    !(appointmentDate instanceof Date) ||
    Number.isNaN(appointmentDate.valueOf())
  ) {
    return null;
  }

  return [
    appointmentDate.getUTCFullYear(),
    String(appointmentDate.getUTCMonth() + 1).padStart(2, "0"),
    String(appointmentDate.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function getAppointmentInstant(appointmentDate, appointmentTime) {
  const date = formatAppointmentDate(appointmentDate);

  if (!date || !APPOINTMENT_TIME_PATTERN.test(appointmentTime)) {
    return null;
  }

  const instant = new Date(
    `${date}T${appointmentTime}:00${PAKISTAN_UTC_OFFSET}`
  );
  return Number.isNaN(instant.valueOf()) ? null : instant;
}

function getPakistanCalendarDate(instant) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const year = Number(parts.find((part) => part.type === "year").value);
  const month = Number(parts.find((part) => part.type === "month").value);
  const day = Number(parts.find((part) => part.type === "day").value);

  return new Date(Date.UTC(year, month - 1, day));
}

async function processAppointmentReminders(now = new Date(), database) {
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())) {
    throw new TypeError("now must be a valid Date");
  }

  const db = database || require("../config/prisma");
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);
  const candidates = await db.appointment.findMany({
    where: {
      reminder_sent_at: null,
      status: { in: ELIGIBLE_STATUSES },
      appointment_date: {
        gte: getPakistanCalendarDate(now),
        lte: getPakistanCalendarDate(windowEnd),
      },
    },
    include: {
      patient: {
        select: {
          user_id: true,
        },
      },
    },
    orderBy: [
      { appointment_date: "asc" },
      { appointment_time: "asc" },
    ],
  });

  const summary = { created: 0, failed: 0 };

  for (const appointment of candidates) {
    if (
      appointment.reminder_sent_at != null ||
      !ELIGIBLE_STATUSES.includes(appointment.status) ||
      !appointment.patient?.user_id
    ) {
      continue;
    }

    const appointmentInstant = getAppointmentInstant(
      appointment.appointment_date,
      appointment.appointment_time
    );

    if (
      !appointmentInstant ||
      appointmentInstant <= now ||
      appointmentInstant > windowEnd
    ) {
      continue;
    }

    try {
      const created = await db.$transaction(async (tx) => {
        const claim = await tx.appointment.updateMany({
          where: {
            appointment_id: appointment.appointment_id,
            reminder_sent_at: null,
            status: { in: ELIGIBLE_STATUSES },
          },
          data: {
            reminder_sent_at: now,
          },
        });

        if (claim.count !== 1) {
          return false;
        }

        const appointmentDate = formatAppointmentDate(
          appointment.appointment_date
        );

        await tx.notification.create({
          data: {
            user_id: appointment.patient.user_id,
            type: "APPOINTMENT_REMINDER",
            title: "Appointment Reminder",
            message: `Your appointment is scheduled for ${appointmentDate} at ${appointment.appointment_time}.`,
            related_appointment_id: appointment.appointment_id,
          },
        });

        return true;
      });

      if (created) {
        summary.created += 1;
      }
    } catch (_error) {
      summary.failed += 1;
    }
  }

  return summary;
}

module.exports = {
  REMINDER_WINDOW_MS,
  processAppointmentReminders,
};

const prisma = require("../config/prisma");

/**
 * Create a notification for a user.
 */
async function createNotification({
  user_id,
  type,
  title,
  message,
  related_appointment_id = null,
}) {
  return prisma.notification.create({
    data: {
      user_id,
      type,
      title,
      message,
      related_appointment_id,
    },
  });
}

/**
 * Create a notification for the patient belonging to an appointment.
 */
async function notifyPatientForAppointment({
  appointment_id,
  type,
  title,
  message,
}) {
  const appointment = await prisma.appointment.findUnique({
    where: {
      appointment_id,
    },
    include: {
      patient: true,
    },
  });

  if (!appointment || !appointment.patient) {
    throw new Error("Appointment or patient not found");
  }

  return createNotification({
    user_id: appointment.patient.user_id,
    type,
    title,
    message,
    related_appointment_id: appointment_id,
  });
}

module.exports = {
  createNotification,
  notifyPatientForAppointment,
};

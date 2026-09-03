const prisma = require("../config/prisma");
const { getPakistanDate } = require("../utils/date.helpers");

/**
 * Get the start of the current week (Monday) in PKT as a UTC-midnight Date.
 */
function getWeekStartPKT() {
  const today = getPakistanDate();
  const dayOfWeek = today.getUTCDay(); // 0=Sun … 6=Sat
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days since Monday
  const monday = new Date(today);
  monday.setUTCDate(monday.getUTCDate() - diff);
  return monday;
}

/**
 * Get the start of the current month in PKT as a UTC-midnight Date.
 */
function getMonthStartPKT() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year").value);
  const month = Number(parts.find((p) => p.type === "month").value);

  return new Date(Date.UTC(year, month - 1, 1));
}

/**
 * Resolve the hospital_id for an authenticated ADMIN or STAFF user.
 *
 * Returns { hospital_id } on success or { error: { status, message } } on failure.
 */
async function resolveHospitalId(user) {
  if (user.role === "ADMIN") {
    const admin = await prisma.hospitalAdmin.findUnique({
      where: { user_id: user.user_id },
      select: {
        hospital_id: true,
        hospital: { select: { is_active: true } },
      },
    });

    if (!admin) {
      return { error: { status: 404, message: "Hospital admin profile not found" } };
    }

    if (!admin.hospital.is_active) {
      return { error: { status: 403, message: "Hospital is inactive" } };
    }

    return { hospital_id: admin.hospital_id };
  }

  if (user.role === "STAFF") {
    const staff = await prisma.hospitalStaff.findUnique({
      where: { user_id: user.user_id },
      select: {
        hospital_id: true,
        is_active: true,
        hospital: { select: { is_active: true } },
      },
    });

    if (!staff) {
      return { error: { status: 404, message: "Hospital staff profile not found" } };
    }

    if (!staff.is_active) {
      return { error: { status: 403, message: "Staff account is inactive" } };
    }

    if (!staff.hospital.is_active) {
      return { error: { status: 403, message: "Hospital is inactive" } };
    }

    return { hospital_id: staff.hospital_id };
  }

  return { error: { status: 403, message: "Access denied" } };
}

/**
 * Build the full analytics overview for a given hospital.
 *
 * All appointment/queue/operations data is scoped to the hospital.
 * Patient statistics include patients with appointments at this hospital.
 */
async function getOverview(hospitalId) {
  // PKT date boundaries
  const todayStart = getPakistanDate();
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const weekStart = getWeekStartPKT();
  const monthStart = getMonthStartPKT();

  // ---------------------------------------------------------------------------
  // Run all independent aggregation queries in parallel
  // ---------------------------------------------------------------------------

  const [
    // --- APPOINTMENTS ---
    totalAppointments,
    appointmentStatusGroups,
    todayAppointments,
    weekAppointments,
    monthAppointments,

    // --- PATIENTS (system-wide) ---
    totalPatients,
    activePatients,
    newPatientsToday,
    newPatientsWeek,
    newPatientsMonth,

    // --- QUEUE ---
    totalQueues,
    queueStatusGroups,
    waitTimeRecords,

    // --- OPERATIONS ---
    hospitalRecord,
    totalDoctors,
    activeDoctors,
    totalDepartments,
    activeDepartments,
    appointmentsByDeptGroups,
    appointmentsByDoctorGroups,
    doctorWorkloadGroups,
  ] = await Promise.all([
    // ---- Appointment counts ----

    prisma.appointment.count({
      where: { hospital_id: hospitalId },
    }),

    prisma.appointment.groupBy({
      by: ["status"],
      where: { hospital_id: hospitalId },
      _count: { status: true },
    }),

    prisma.appointment.count({
      where: {
        hospital_id: hospitalId,
        appointment_date: { gte: todayStart, lt: todayEnd },
      },
    }),

    prisma.appointment.count({
      where: {
        hospital_id: hospitalId,
        appointment_date: { gte: weekStart, lt: todayEnd },
      },
    }),

    prisma.appointment.count({
      where: {
        hospital_id: hospitalId,
        appointment_date: { gte: monthStart, lt: todayEnd },
      },
    }),

    // ---- Patient counts (scoped through hospital appointments) ----

    prisma.patient.count({
      where: { appointments: { some: { hospital_id: hospitalId } } },
    }),

    prisma.patient.count({
      where: {
        appointments: { some: { hospital_id: hospitalId } },
        user: { is_active: true },
      },
    }),

    prisma.patient.count({
      where: {
        appointments: { some: { hospital_id: hospitalId } },
        created_at: { gte: todayStart, lt: todayEnd },
      },
    }),

    prisma.patient.count({
      where: {
        appointments: { some: { hospital_id: hospitalId } },
        created_at: { gte: weekStart, lt: todayEnd },
      },
    }),

    prisma.patient.count({
      where: {
        appointments: { some: { hospital_id: hospitalId } },
        created_at: { gte: monthStart, lt: todayEnd },
      },
    }),

    // ---- Queue counts ----

    prisma.queue.count({
      where: { hospital_id: hospitalId },
    }),

    prisma.queue.groupBy({
      by: ["queue_status"],
      where: { hospital_id: hospitalId },
      _count: { queue_status: true },
    }),

    // Fetch records where both timestamps exist to compute average wait
    prisma.queue.findMany({
      where: {
        hospital_id: hospitalId,
        check_in_time: { not: null },
        called_at: { not: null },
      },
      select: { check_in_time: true, called_at: true },
    }),

    // ---- Operational data ----

    prisma.hospital.findUnique({
      where: { hospital_id: hospitalId },
      select: { hospital_id: true, name: true, is_active: true },
    }),

    prisma.doctor.count({ where: { hospital_id: hospitalId } }),

    prisma.doctor.count({ where: { hospital_id: hospitalId, is_active: true } }),

    prisma.department.count({ where: { hospital_id: hospitalId } }),

    prisma.department.count({
      where: { hospital_id: hospitalId, is_active: true },
    }),

    // Appointments grouped by department
    prisma.appointment.groupBy({
      by: ["department_id"],
      where: { hospital_id: hospitalId },
      _count: { department_id: true },
    }),

    // Appointments grouped by doctor
    prisma.appointment.groupBy({
      by: ["doctor_id"],
      where: { hospital_id: hospitalId },
      _count: { doctor_id: true },
    }),

    // Doctor workload: appointments grouped by (doctor_id, status)
    prisma.appointment.groupBy({
      by: ["doctor_id", "status"],
      where: { hospital_id: hospitalId },
      _count: { doctor_id: true },
    }),
  ]);

  // ---------------------------------------------------------------------------
  // Shape results
  // ---------------------------------------------------------------------------

  // Appointment status → flat counts
  const statusCounts = {};
  for (const g of appointmentStatusGroups) {
    statusCounts[g.status] = g._count.status;
  }

  // Queue status → flat counts
  const queueCounts = {};
  for (const g of queueStatusGroups) {
    queueCounts[g.queue_status] = g._count.queue_status;
  }

  // Average wait minutes (check_in → called)
  let average_wait_minutes = null;
  if (waitTimeRecords.length > 0) {
    const totalMs = waitTimeRecords.reduce(
      (sum, r) => sum + (r.called_at.getTime() - r.check_in_time.getTime()),
      0
    );
    average_wait_minutes = Math.round(totalMs / waitTimeRecords.length / 60000);
  }

  // Resolve department names for appointments_by_department
  const deptIds = appointmentsByDeptGroups.map((g) => g.department_id);
  const deptRecords =
    deptIds.length > 0
      ? await prisma.department.findMany({
          where: { department_id: { in: deptIds } },
          select: { department_id: true, name: true },
        })
      : [];
  const deptMap = {};
  for (const d of deptRecords) deptMap[d.department_id] = d.name;

  const appointments_by_department = appointmentsByDeptGroups.map((g) => ({
    department_id: g.department_id,
    department_name: deptMap[g.department_id] || "Unknown",
    total: g._count.department_id,
  }));

  // Resolve doctor names for appointments_by_doctor + doctor_workload
  const doctorIds = appointmentsByDoctorGroups.map((g) => g.doctor_id);
  const doctorRecords =
    doctorIds.length > 0
      ? await prisma.doctor.findMany({
          where: { doctor_id: { in: doctorIds } },
          select: { doctor_id: true, name: true, specialization: true },
        })
      : [];
  const doctorMap = {};
  for (const d of doctorRecords) doctorMap[d.doctor_id] = d;

  const appointments_by_doctor = appointmentsByDoctorGroups.map((g) => ({
    doctor_id: g.doctor_id,
    doctor_name: doctorMap[g.doctor_id]?.name || "Unknown",
    specialization: doctorMap[g.doctor_id]?.specialization || "Unknown",
    total: g._count.doctor_id,
  }));

  // Doctor workload: merge (doctor_id, status) groups into per-doctor summary
  const workloadMap = {};
  for (const g of doctorWorkloadGroups) {
    if (!workloadMap[g.doctor_id]) {
      workloadMap[g.doctor_id] = { total: 0, by_status: {} };
    }
    workloadMap[g.doctor_id].total += g._count.doctor_id;
    workloadMap[g.doctor_id].by_status[g.status] = g._count.doctor_id;
  }

  const doctor_workload = Object.entries(workloadMap).map(
    ([doctorId, data]) => ({
      doctor_id: doctorId,
      doctor_name: doctorMap[doctorId]?.name || "Unknown",
      specialization: doctorMap[doctorId]?.specialization || "Unknown",
      total_appointments: data.total,
      by_status: data.by_status,
    })
  );

  // ---------------------------------------------------------------------------
  // Final response shape
  // ---------------------------------------------------------------------------

  return {
    appointments: {
      total: totalAppointments,
      booked: statusCounts.BOOKED || 0,
      confirmed: statusCounts.CONFIRMED || 0,
      checked_in: statusCounts.CHECKED_IN || 0,
      in_progress: statusCounts.IN_PROGRESS || 0,
      completed: statusCounts.COMPLETED || 0,
      cancelled: statusCounts.CANCELLED || 0,
      no_show: statusCounts.NO_SHOW || 0,
      today: todayAppointments,
      this_week: weekAppointments,
      this_month: monthAppointments,
    },

    patients: {
      total: totalPatients,
      active: activePatients,
      new_today: newPatientsToday,
      new_this_week: newPatientsWeek,
      new_this_month: newPatientsMonth,
    },

    queue: {
      total: totalQueues,
      waiting: queueCounts.WAITING || 0,
      called: queueCounts.CALLED || 0,
      in_progress: queueCounts.IN_PROGRESS || 0,
      completed: queueCounts.COMPLETED || 0,
      skipped: queueCounts.SKIPPED || 0,
      average_wait_minutes,
    },

    operations: {
      hospitals: {
        total: 1,
        active: hospitalRecord?.is_active ? 1 : 0,
      },
      doctors: {
        total: totalDoctors,
        active: activeDoctors,
      },
      departments: {
        total: totalDepartments,
        active: activeDepartments,
      },
      appointments_by_department,
      appointments_by_doctor,
      doctor_workload,
      hospital_workload: {
        hospital_id: hospitalId,
        hospital_name: hospitalRecord?.name || "Unknown",
        total_appointments: totalAppointments,
        total_queues: totalQueues,
        active_doctors: activeDoctors,
        active_departments: activeDepartments,
      },
    },
  };
}

module.exports = { getOverview, resolveHospitalId };

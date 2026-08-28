require("dotenv/config");

const express = require("express");
const cors = require("cors");

const hospitalRoutes = require("./routes/hospital.routes");
const authRoutes = require("./routes/auth.routes");
const departmentRoutes = require("./routes/department.routes");
const doctorRoutes = require("./routes/doctor.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const timeSlotRoutes = require("./routes/timeSlot.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const queueRoutes = require("./routes/queue.routes");
const patientRoutes = require("./routes/patient.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SehatConnectAI backend is running",
  });
});

app.use("/api/hospitals", hospitalRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/time-slots", timeSlotRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/notifications", notificationRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SehatConnectAI backend running on port ${PORT}`);
});
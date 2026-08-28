require("dotenv/config");

const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

async function main() {
  const password_hash = await bcrypt.hash("AdminPassword123", 12);

  const hospital = await prisma.hospital.create({
    data: {
      name: "SehatConnect Test Hospital",
      facility_type: "HOSPITAL",
      description: "Test hospital for SehatConnectAI development",
      phone: "03001234567",
      email: "testhospital@example.com",
      address: "Test Address, Block A",
      city: "Lahore",
      latitude: 31.5204,
      longitude: 74.3587,
    },
  });

  const user = await prisma.user.create({
    data: {
      full_name: "Test Hospital Admin",
      email: "admin@testhospital.com",
      password_hash,
      role: "ADMIN",
      preferred_language: "ENGLISH",
    },
  });

  const admin = await prisma.hospitalAdmin.create({
    data: {
      user_id: user.user_id,
      hospital_id: hospital.hospital_id,
      employee_id: "ADMIN-001",
    },
  });

  console.log("Test hospital created:", hospital.hospital_id);
  console.log("Test admin created:", admin.admin_id);
  console.log("Admin email: admin@testhospital.com");
  console.log("Admin password: AdminPassword123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
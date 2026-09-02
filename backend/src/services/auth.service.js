const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
}

async function registerPatient({
  full_name,
  email,
  phone,
  password,
  preferred_language,
}) {
  if (!full_name || !password) {
    throw new Error("Full name and password are required");
  }

  if (!email && !phone) {
    throw new Error("Email or phone is required");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    },
  });

  if (existingUser) {
    throw new Error("A user with this email or phone already exists");
  }

  const password_hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      full_name,
      email: email || null,
      phone: phone || null,
      password_hash,
      role: "PATIENT",
      preferred_language: preferred_language || "ENGLISH",
    },
  });

  const patient = await prisma.patient.create({
    data: {
      user_id: user.user_id,
    },
  });

  const token = generateToken(user);

  return {
    token,
    user: {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      preferred_language: user.preferred_language,
      patient_id: patient.patient_id,
    },
  };
}

async function login({ email, phone, password }) {
  if ((!email && !phone) || !password) {
    throw new Error("Email/phone and password are required");
  }

  const user = await prisma.user.findFirst({
    where: email ? { email } : { phone },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatches || user.role !== "PATIENT") {
    throw new Error("Invalid credentials");
  }

  if (!user.is_active) {
    throw new Error("User account is inactive");
  }

  await prisma.user.update({
    where: {
      user_id: user.user_id,
    },
    data: {
      last_login: new Date(),
    },
  });

  const token = generateToken(user);

  return {
    token,
    user: {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      preferred_language: user.preferred_language,
    },
  };
}

async function loginHospitalUser({ email, phone, password }) {
  if ((!email && !phone) || !password) {
    throw new Error("Email/phone and password are required");
  }

  const user = await prisma.user.findFirst({
    where: email ? { email } : { phone },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (!user.is_active) {
    throw new Error("User account is inactive");
  }

  // Website authentication is only for ADMIN and STAFF
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    throw new Error("This account cannot access the hospital website");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatches) {
    throw new Error("Invalid credentials");
  }

  let hospitalInfo = null;
  let departmentInfo = null;

  if (user.role === "ADMIN") {
    const admin = await prisma.hospitalAdmin.findUnique({
      where: {
        user_id: user.user_id,
      },
      include: {
        hospital: true,
      },
    });

    if (!admin) {
      throw new Error("Hospital admin profile not found");
    }

    if (!admin.hospital.is_active) {
      throw new Error("Hospital is inactive");
    }

    hospitalInfo = {
      hospital_id: admin.hospital.hospital_id,
      name: admin.hospital.name,
      facility_type: admin.hospital.facility_type,
      city: admin.hospital.city,
    };
  }

  if (user.role === "STAFF") {
    const staff = await prisma.hospitalStaff.findUnique({
      where: {
        user_id: user.user_id,
      },
      include: {
        hospital: true,
        department: true,
      },
    });

    if (!staff) {
      throw new Error("Hospital staff profile not found");
    }

    if (!staff.is_active) {
      throw new Error("Staff account is inactive");
    }

    if (!staff.hospital.is_active) {
      throw new Error("Hospital is inactive");
    }

    hospitalInfo = {
      hospital_id: staff.hospital.hospital_id,
      name: staff.hospital.name,
      facility_type: staff.hospital.facility_type,
      city: staff.hospital.city,
    };

    if (staff.department) {
      departmentInfo = {
        department_id: staff.department.department_id,
        name: staff.department.name,
      };
    }
  }

  await prisma.user.update({
    where: {
      user_id: user.user_id,
    },
    data: {
      last_login: new Date(),
    },
  });

  const token = generateToken(user);

  return {
    token,
    user: {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      hospital: hospitalInfo,
      department: departmentInfo,
    },
  };
}
async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: {
      user_id: userId,
    },
    include: {
      patient: true,
      hospital_admin: {
        include: {
          hospital: true,
        },
      },
      hospital_staff: {
        include: {
          hospital: true,
          department: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.is_active) {
    throw new Error("User account is inactive");
  }

  const result = {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    preferred_language: user.preferred_language,
    location: user.location,
    profile_picture: user.profile_picture,
  };

  if (user.patient) {
    result.patient = {
      patient_id: user.patient.patient_id,
      date_of_birth: user.patient.date_of_birth,
      gender: user.patient.gender,
      address: user.patient.address,
      city: user.patient.city,
      emergency_contact: user.patient.emergency_contact,
    };
  }

  if (user.hospital_admin) {
    result.hospital = {
      hospital_id: user.hospital_admin.hospital.hospital_id,
      name: user.hospital_admin.hospital.name,
      facility_type: user.hospital_admin.hospital.facility_type,
      city: user.hospital_admin.hospital.city,
    };
  }

  if (user.hospital_staff) {
    result.hospital = {
      hospital_id: user.hospital_staff.hospital.hospital_id,
      name: user.hospital_staff.hospital.name,
      facility_type: user.hospital_staff.hospital.facility_type,
      city: user.hospital_staff.hospital.city,
    };

    if (user.hospital_staff.department) {
      result.department = {
        department_id: user.hospital_staff.department.department_id,
        name: user.hospital_staff.department.name,
      };
    }
  }

  return result;
}
module.exports = {
  registerPatient,
  login,
  loginHospitalUser,
  getCurrentUser,
};

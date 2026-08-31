/**
 * [DEV DEMO ADAPTER] Smallest realistic fixture set for exercising the frozen
 * Patient frontend functionality without a real backend. Fictional identities
 * only. Every id is cross-referenced (hospital <-> department <-> doctor <->
 * appointment <-> queue) so the demo data behaves like one consistent dataset.
 */
import type { CurrentUser } from '../../features/auth/model/types';
import type { Hospital, HospitalDetail } from '../../features/hospitals/model/types';
import type { Department } from '../../features/departments/model/types';
import type { Doctor, DoctorDetail, DoctorSchedule } from '../../features/doctors/model/types';
import type { Appointment, QueueEntry } from '../../features/appointments/model/types';
import type { PatientProfile } from '../../features/profile/model/types';
import { DEMO_EMAIL } from './demoMode';

export const DEMO_TOKEN = 'demo-dev-token-not-real';

export const DEMO_USER: CurrentUser = {
  user_id: 'demo-user-1',
  full_name: 'Demo Patient',
  email: DEMO_EMAIL,
  phone: '+923001234567',
  role: 'PATIENT',
  preferred_language: 'ENGLISH',
  patient_id: 'demo-patient-1',
};

export const DEMO_PROFILE: PatientProfile = {
  patient_id: 'demo-patient-1',
  user_id: 'demo-user-1',
  full_name: 'Demo Patient',
  email: DEMO_EMAIL,
  phone: '+923001234567',
  preferred_language: 'ENGLISH',
  date_of_birth: '1994-05-12',
  gender: 'Female',
  address: '12 Model Town',
  city: 'Lahore',
  emergency_contact: '+923007654321',
};

const HOSPITAL_1 = 'demo-hosp-1';
const HOSPITAL_2 = 'demo-hosp-2';
const HOSPITAL_3 = 'demo-hosp-3';
const DEPT_CARDIOLOGY = 'demo-dept-cardiology';
const DEPT_PEDIATRICS = 'demo-dept-pediatrics';
const DEPT_NEUROLOGY = 'demo-dept-neurology';
const DOCTOR_1 = 'demo-doctor-1';
const DOCTOR_2 = 'demo-doctor-2';
const DOCTOR_3 = 'demo-doctor-3';

const DEMO_HOSPITAL_LIST: Hospital[] = [
  {
    hospital_id: HOSPITAL_1,
    name: 'Al-Shifa General Hospital',
    facility_type: 'HOSPITAL',
    description: 'Multi-specialty hospital in the heart of Lahore.',
    phone: '+924211112222',
    email: 'info@alshifa.demo',
    address: '45 Jail Road',
    city: 'Lahore',
    latitude: 31.5497,
    longitude: 74.3436,
  },
  {
    hospital_id: HOSPITAL_2,
    name: 'Marham Medical Center',
    facility_type: 'MEDICAL_CENTER',
    description: 'Family medical center serving Karachi.',
    phone: '+922133334444',
    email: 'contact@marham.demo',
    address: '9 Shahrah-e-Faisal',
    city: 'Karachi',
    latitude: 24.8607,
    longitude: 67.0011,
  },
  {
    hospital_id: HOSPITAL_3,
    name: 'Sehat Valley Clinic',
    facility_type: 'CLINIC',
    description: 'Neighbourhood clinic in Islamabad.',
    phone: '+925155556666',
    email: 'hello@sehatvalley.demo',
    address: '3 Blue Area',
    city: 'Islamabad',
    latitude: 33.7294,
    longitude: 73.0931,
  },
];

const DEMO_DEPARTMENT_LIST: Department[] = [
  { department_id: DEPT_CARDIOLOGY, hospital_id: HOSPITAL_1, name: 'Cardiology', is_active: true },
  { department_id: DEPT_PEDIATRICS, hospital_id: HOSPITAL_2, name: 'Pediatrics', is_active: true },
  { department_id: DEPT_NEUROLOGY, hospital_id: HOSPITAL_3, name: 'Neurology', is_active: true },
];

function schedule(scheduleId: string, doctorId: string, day: DoctorSchedule['day_of_week']): DoctorSchedule {
  return {
    schedule_id: scheduleId,
    doctor_id: doctorId,
    day_of_week: day,
    start_time: '09:00',
    end_time: '17:00',
    start_time_12h: '9:00 AM',
    end_time_12h: '5:00 PM',
    appointment_duration: 30,
    is_active: true,
  };
}

// Doctor is always exactly one hospital + one department (DATA_CONTRACTS.md).
const DEMO_DOCTOR_DETAIL_LIST: DoctorDetail[] = [
  {
    doctor_id: DOCTOR_1,
    hospital_id: HOSPITAL_1,
    department_id: DEPT_CARDIOLOGY,
    name: 'Dr. Ayesha Raza',
    specialization: 'Cardiologist',
    qualification: 'MBBS, FCPS (Cardiology)',
    consultation_fee: 2500,
    is_active: true,
    hospital: { hospital_id: HOSPITAL_1, name: 'Al-Shifa General Hospital' },
    department: { department_id: DEPT_CARDIOLOGY, name: 'Cardiology' },
    schedules: [schedule('demo-sched-1', DOCTOR_1, 'MONDAY')],
  },
  {
    doctor_id: DOCTOR_2,
    hospital_id: HOSPITAL_2,
    department_id: DEPT_PEDIATRICS,
    name: 'Dr. Bilal Ahmed',
    specialization: 'Pediatrician',
    qualification: 'MBBS, DCH',
    consultation_fee: 2000,
    is_active: true,
    hospital: { hospital_id: HOSPITAL_2, name: 'Marham Medical Center' },
    department: { department_id: DEPT_PEDIATRICS, name: 'Pediatrics' },
    schedules: [schedule('demo-sched-2', DOCTOR_2, 'TUESDAY')],
  },
  {
    doctor_id: DOCTOR_3,
    hospital_id: HOSPITAL_3,
    department_id: DEPT_NEUROLOGY,
    name: 'Dr. Sara Malik',
    specialization: 'Neurologist',
    qualification: 'MBBS, FCPS (Neurology)',
    consultation_fee: 3000,
    is_active: true,
    hospital: { hospital_id: HOSPITAL_3, name: 'Sehat Valley Clinic' },
    department: { department_id: DEPT_NEUROLOGY, name: 'Neurology' },
    schedules: [schedule('demo-sched-3', DOCTOR_3, 'WEDNESDAY')],
  },
];

export function demoHospitals(): Hospital[] {
  return DEMO_HOSPITAL_LIST;
}

export function demoHospitalById(id: string): HospitalDetail | undefined {
  const hospital = DEMO_HOSPITAL_LIST.find((h) => h.hospital_id === id);
  if (!hospital) return undefined;
  return {
    ...hospital,
    working_hours: [
      {
        day_of_week: 'MONDAY',
        opening_time: '09:00',
        closing_time: '17:00',
        opening_time_12h: '9:00 AM',
        closing_time_12h: '5:00 PM',
        is_open: true,
      },
    ],
    departments: DEMO_DEPARTMENT_LIST.filter((d) => d.hospital_id === id).map((d) => ({
      department_id: d.department_id,
      name: d.name,
    })),
    doctors: DEMO_DOCTOR_DETAIL_LIST.filter((d) => d.hospital_id === id).map((d) => ({
      doctor_id: d.doctor_id,
      name: d.name,
      specialization: d.specialization,
    })),
  };
}

export function demoDepartments(): Department[] {
  return DEMO_DEPARTMENT_LIST;
}

export function demoDoctors(): DoctorDetail[] {
  return DEMO_DOCTOR_DETAIL_LIST;
}

export function demoDoctorById(id: string): DoctorDetail | undefined {
  return DEMO_DOCTOR_DETAIL_LIST.find((d) => d.doctor_id === id);
}

function toDoctor(detail: DoctorDetail): Doctor {
  const { hospital: _hospital, department: _department, schedules: _schedules, ...doctor } = detail;
  return doctor;
}

export function demoDoctorsByHospital(hospitalId: string): Doctor[] {
  return DEMO_DOCTOR_DETAIL_LIST.filter((d) => d.hospital_id === hospitalId).map(toDoctor);
}

export function demoDoctorsByDepartment(departmentId: string): Doctor[] {
  return DEMO_DOCTOR_DETAIL_LIST.filter((d) => d.department_id === departmentId).map(toDoctor);
}

const APPOINTMENT_UPCOMING = 'demo-appt-upcoming';
const APPOINTMENT_COMPLETED = 'demo-appt-completed';
const APPOINTMENT_CANCELLED = 'demo-appt-cancelled';

export function demoInitialAppointments(): Appointment[] {
  return [
    {
      appointment_id: APPOINTMENT_UPCOMING,
      patient_id: DEMO_PROFILE.patient_id,
      doctor_id: DOCTOR_1,
      hospital_id: HOSPITAL_1,
      department_id: DEPT_CARDIOLOGY,
      slot_id: 'demo-slot-upcoming',
      appointment_date: '2026-09-05',
      appointment_time: '09:00',
      appointment_time_12h: '9:00 AM',
      status: 'BOOKED',
      booking_reference: 'DEMO-BK-0001',
      token_number: 4,
      reason: 'Chest pain follow-up',
      doctor: { name: 'Dr. Ayesha Raza' },
      hospital: { name: 'Al-Shifa General Hospital' },
      department: { name: 'Cardiology' },
    },
    {
      appointment_id: APPOINTMENT_COMPLETED,
      patient_id: DEMO_PROFILE.patient_id,
      doctor_id: DOCTOR_2,
      hospital_id: HOSPITAL_2,
      department_id: DEPT_PEDIATRICS,
      slot_id: 'demo-slot-completed',
      appointment_date: '2026-08-10',
      appointment_time: '10:30',
      appointment_time_12h: '10:30 AM',
      status: 'COMPLETED',
      booking_reference: 'DEMO-BK-0002',
      token_number: 2,
      reason: 'Routine checkup',
      doctor: { name: 'Dr. Bilal Ahmed' },
      hospital: { name: 'Marham Medical Center' },
      department: { name: 'Pediatrics' },
    },
    {
      appointment_id: APPOINTMENT_CANCELLED,
      patient_id: DEMO_PROFILE.patient_id,
      doctor_id: DOCTOR_3,
      hospital_id: HOSPITAL_3,
      department_id: DEPT_NEUROLOGY,
      slot_id: 'demo-slot-cancelled',
      appointment_date: '2026-08-20',
      appointment_time: '14:00',
      appointment_time_12h: '2:00 PM',
      status: 'CANCELLED',
      booking_reference: 'DEMO-BK-0003',
      reason: 'Migraine consultation',
      doctor: { name: 'Dr. Sara Malik' },
      hospital: { name: 'Sehat Valley Clinic' },
      department: { name: 'Neurology' },
    },
  ];
}

export function demoInitialQueue(): QueueEntry[] {
  return [
    {
      queue_id: 'demo-queue-1',
      hospital_id: HOSPITAL_1,
      doctor_id: DOCTOR_1,
      appointment_id: APPOINTMENT_UPCOMING,
      token_number: 4,
      queue_status: 'WAITING',
      estimated_wait_time: 20,
      appointment: { appointment_time: '09:00', appointment_time_12h: '9:00 AM' },
    },
  ];
}

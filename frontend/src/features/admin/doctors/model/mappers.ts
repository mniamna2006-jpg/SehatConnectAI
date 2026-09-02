import type { DoctorFormValues } from './schemas';
import type { AdminDoctor, DoctorCreateInput, DoctorUpdateInput } from './types';

function optionalString(value: string): string | null {
  return value.trim() || null;
}

function consultationFee(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}

function normalizedValues(values: DoctorFormValues): Omit<DoctorCreateInput, 'hospital_id'> {
  return {
    department_id: values.department_id,
    name: values.name.trim(),
    specialization: values.specialization.trim(),
    qualification: optionalString(values.qualification),
    license_number: values.license_number.trim(),
    bio: optionalString(values.bio),
    consultation_fee: consultationFee(values.consultation_fee),
  };
}

export function buildDoctorCreateInput(
  hospitalId: string,
  values: DoctorFormValues
): DoctorCreateInput {
  return { hospital_id: hospitalId, ...normalizedValues(values) };
}

export function buildDoctorUpdate(
  doctor: AdminDoctor,
  values: DoctorFormValues
): DoctorUpdateInput {
  const normalized = normalizedValues(values);
  const patch: DoctorUpdateInput = {};
  const currentFee = doctor.consultation_fee === null ? null : Number(doctor.consultation_fee);

  if (normalized.department_id !== doctor.department_id) patch.department_id = normalized.department_id;
  if (normalized.name !== doctor.name) patch.name = normalized.name;
  if (normalized.specialization !== doctor.specialization) patch.specialization = normalized.specialization;
  if (normalized.qualification !== doctor.qualification) patch.qualification = normalized.qualification;
  if (normalized.license_number !== doctor.license_number) patch.license_number = normalized.license_number;
  if (normalized.bio !== doctor.bio) patch.bio = normalized.bio;
  if (normalized.consultation_fee !== currentFee) patch.consultation_fee = normalized.consultation_fee;

  return patch;
}

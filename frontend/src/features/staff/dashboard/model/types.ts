import type { AppointmentStatus, QueueStatus } from '../../../../shared/types/api';

export interface StaffDashboard {
  hospital: {
    hospital_id: string;
    name: string;
    facility_type: string;
    city: string;
  } | null;
  staff_context: {
    staff_id: string;
    employee_id: string;
    position: string;
    department: { department_id: string; name: string } | null;
  };
  departments: { active: number };
  doctors: { active: number; available_today: number };
  today_appointments: {
    total: number;
    by_status: Partial<Record<AppointmentStatus, number>>;
  };
  today_queue: {
    total: number;
    by_status: Partial<Record<QueueStatus, number>>;
  };
}

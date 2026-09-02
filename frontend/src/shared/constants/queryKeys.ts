export const queryKeys = {
  me: ['auth', 'me'] as const,
  profile: ['profile'] as const,
  hospitals: (params?: Record<string, unknown>) => ['hospitals', params ?? {}] as const,
  hospital: (id: string) => ['hospitals', id] as const,
  doctorsByHospital: (hospitalId: string) => ['doctors', 'hospital', hospitalId] as const,
  doctorsByDepartment: (departmentId: string) => ['doctors', 'department', departmentId] as const,
  doctor: (id: string) => ['doctors', id] as const,
  findDoctors: (query: string) => ['doctors', 'find', query] as const,
  departmentsByHospital: (hospitalId: string) => ['departments', 'hospital', hospitalId] as const,
  findDepartments: (query: string) => ['departments', 'find', query] as const,
  timeSlots: (doctorId: string, date: string) => ['timeSlots', doctorId, date] as const,
  myAppointments: ['appointments', 'my'] as const,
  appointment: (id: string) => ['appointments', id] as const,
  myQueue: ['queue', 'my'] as const,
  notifications: ['notifications', 'my'] as const,
  unreadNotificationCount: ['notifications', 'unread-count'] as const,
  aiHistory: ['ai', 'history'] as const,
  aiConversation: (id: string) => ['ai', 'history', id] as const,

  hospitalMe: ['hospitalAuth', 'me'] as const,

  adminDashboard: ['admin', 'dashboard'] as const,
  adminHospitalProfile: (hospitalId: string) => ['admin', 'hospital', hospitalId] as const,
  adminDepartments: (hospitalId: string) => ['admin', 'departments', hospitalId] as const,
  adminDoctors: (hospitalId: string) => ['admin', 'doctors', hospitalId] as const,
  adminDoctorSchedules: (doctorId: string) => ['admin', 'schedules', doctorId] as const,
  adminStaff: (hospitalId: string) => ['admin', 'staff', hospitalId] as const,
  adminInvitations: (hospitalId: string) => ['admin', 'invitations', hospitalId] as const,
  adminAnalytics: ['admin', 'analytics'] as const,

  staffDashboard: ['staff', 'dashboard'] as const,
  staffTodayAppointments: ['staff', 'appointments', 'today'] as const,
  staffQueue: ['staff', 'queue'] as const,
};

const hospitalQueryRoots = new Set<unknown>(['hospitalAuth', 'admin', 'staff']);

export function isHospitalQueryKey(queryKey: readonly unknown[]): boolean {
  return hospitalQueryRoots.has(queryKey[0]);
}

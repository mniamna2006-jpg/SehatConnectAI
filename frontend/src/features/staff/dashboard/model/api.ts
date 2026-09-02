import { apiRequest } from '../../../../core/api/client';
import type { StaffDashboard } from './types';

export function getStaffDashboard(): Promise<StaffDashboard> {
  return apiRequest<StaffDashboard>('/api/staff/dashboard', { scope: 'hospital' });
}

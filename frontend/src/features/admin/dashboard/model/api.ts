import { apiRequest } from '../../../../core/api/client';
import type { AdminDashboard } from './types';

export function getAdminDashboard(): Promise<AdminDashboard> {
  return apiRequest<AdminDashboard>('/api/admin/dashboard', { scope: 'hospital' });
}

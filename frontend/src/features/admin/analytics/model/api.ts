import { apiRequest } from '../../../../core/api/client';
import type { AdminAnalytics } from './types';

export function getAdminAnalytics(): Promise<AdminAnalytics> {
  return apiRequest<AdminAnalytics>('/api/analytics/overview', { scope: 'hospital' });
}

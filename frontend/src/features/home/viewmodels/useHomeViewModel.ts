import { useAuth } from '../../../providers/AuthProvider';

export function useHomeViewModel() {
  const { user } = useAuth();
  return { user };
}

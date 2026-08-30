import { router } from 'expo-router';
import { useAuth } from '../../../providers/AuthProvider';

export function useHomeViewModel() {
  const { user, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return { user, onLogout };
}

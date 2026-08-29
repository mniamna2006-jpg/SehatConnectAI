import { useLocalSearchParams, Redirect } from 'expo-router';
import { HospitalDetailsView } from '../../../src/features/hospitals/views/HospitalDetailsView';

export default function HospitalDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id || typeof id !== 'string') return <Redirect href="/find-hospital" />;
  return <HospitalDetailsView hospitalId={id} />;
}

import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslations } from '../../../providers/LocaleProvider';
import { DoctorCard } from '../../../shared/components/DoctorCard';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Screen } from '../../../shared/components/Screen';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import type { Doctor } from '../../doctors/model/types';
import { DoctorAvailabilityAlert } from '../../doctors/views/DoctorAvailabilityAlert';
import { useDepartmentDoctorsViewModel } from '../viewmodels/useDepartmentDoctorsViewModel';

export function DepartmentDoctorsView({ departmentId }: { departmentId: string }) {
  const t = useTranslations();
  const { doctors, isLoading, isError, refetch } = useDepartmentDoctorsViewModel(departmentId);
  return (
    <Screen>
      <FlatList
        testID="department-doctors-list"
        data={doctors}
        keyExtractor={(doctor: Doctor) => doctor.doctor_id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader title={t('departments.doctorsTitle')} subtitle="Find the right specialist for your care" />
            {doctors.length > 0 ? <SectionHeader title="Available Doctors" detail={`${doctors.length} found`} /> : null}
          </View>
        }
        renderItem={({ item }: { item: Doctor }) => (
          <DoctorCard
            id={item.doctor_id}
            testID={`department-doctor-${item.doctor_id}`}
            name={item.name}
            specialization={item.specialization}
            isAvailable={item.is_available}
            availabilityAction={<DoctorAvailabilityAlert doctorId={item.doctor_id} isAvailable={item.is_available} />}
            bookingHref={`/appointments?doctorId=${item.doctor_id}&hospitalId=${item.hospital_id}&departmentId=${item.department_id}`}
          />
        )}
        ListEmptyComponent={isLoading ? <LoadingState label="Loading doctors…" /> : isError ? <ErrorState onRetry={() => void refetch()} /> : <EmptyState title="No doctors available" message="Please check again later or browse another department." icon="medkit-outline" />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 36 },
  header: { gap: 16, marginBottom: 18 },
  separator: { height: 14 },
});

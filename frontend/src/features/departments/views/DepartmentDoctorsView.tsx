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
            <PageHeader title={t('departments.doctorsTitle')} subtitle={t('departments.doctorsSubtitle')} />
            {doctors.length > 0 ? <SectionHeader title={t('departments.availableDoctors')} detail={`${doctors.length} ${t('common.found')}`} /> : null}
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
        ListEmptyComponent={isLoading ? <LoadingState label={t('departments.loadingDoctors')} /> : isError ? <ErrorState onRetry={() => void refetch()} /> : <EmptyState title={t('departments.noDoctorsTitle')} message={t('departments.noDoctorsMessage')} icon="medkit-outline" />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 36 },
  header: { gap: 16, marginBottom: 18 },
  separator: { height: 14 },
});

import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../../providers/LocaleProvider';
import { DoctorCard } from '../../../shared/components/DoctorCard';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { LocationPicker } from '../../../shared/components/LocationPicker';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Screen } from '../../../shared/components/Screen';
import { SearchBar } from '../../../shared/components/SearchBar';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { colors, typography } from '../../../shared/theme';
import type { DoctorDetail } from '../model/types';
import { useFindDoctorViewModel } from '../viewmodels/useFindDoctorViewModel';
import { DoctorAvailabilityAlert } from './DoctorAvailabilityAlert';

function DoctorResult({ doctor }: { doctor: DoctorDetail }) {
  const bookingHref = `/appointments?doctorId=${doctor.doctor_id}&hospitalId=${doctor.hospital_id}&departmentId=${doctor.department_id}`;
  return (
    <DoctorCard
      id={doctor.doctor_id}
      testID={`doctor-row-${doctor.doctor_id}`}
      name={doctor.name}
      specialization={doctor.specialization}
      hospital={doctor.hospital.name}
      isAvailable={doctor.is_available}
      availabilityAction={doctor.is_available ? undefined : (
        <DoctorAvailabilityAlert doctorId={doctor.doctor_id} isAvailable={doctor.is_available} />
      )}
      bookingHref={bookingHref}
      schedules={doctor.schedules.map((schedule) => ({
        id: schedule.schedule_id,
        day: schedule.day_of_week,
        start: schedule.start_time,
        end: schedule.end_time,
        start12h: schedule.start_time_12h,
        end12h: schedule.end_time_12h,
      }))}
    />
  );
}

export function FindDoctorView() {
  const t = useTranslations();
  const { doctors, isLoading, isError, refetch, query, setQuery, selector } = useFindDoctorViewModel();
  const hasQuery = query.trim().length > 0;

  return (
    <Screen>
      <FlatList
        testID="find-doctor-list"
        data={doctors}
        keyExtractor={(doctor) => doctor.doctor_id}
        renderItem={({ item }) => <DoctorResult doctor={item} />}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader title={t('doctors.findTitle')} subtitle="Connect with the right clinician for your care" />
            <LocationPicker selector={selector} />
            <View style={styles.searchGroup}>
              <Text style={styles.searchLabel}>Search by name or specialty</Text>
              <SearchBar accessibilityLabel={t('doctors.searchLabel')} placeholder={t('doctors.searchPlaceholder')} value={query} onChangeText={setQuery} />
            </View>
            {doctors.length > 0 ? <SectionHeader title="Doctors" detail={`${doctors.length} found`} /> : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? <LoadingState label="Finding doctors…" />
            : isError ? <ErrorState onRetry={() => void refetch()} />
              : hasQuery ? <EmptyState title="No doctors found" message="Try another name, specialty or location." icon="medkit-outline" />
                : <EmptyState title="Start your search" message="Enter a doctor name or specialty to see available clinicians." icon="search-outline" />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 36 },
  header: { gap: 24, marginBottom: 18 },
  searchGroup: { gap: 9 },
  searchLabel: { ...typography.metadata, color: colors.inkSoft, fontWeight: '700' },
  separator: { height: 14 },
});

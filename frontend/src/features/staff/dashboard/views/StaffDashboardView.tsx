import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../../../providers/LocaleProvider';
import { AppIcon, type AppIconName } from '../../../../shared/components/AppIcon';
import { ErrorState } from '../../../../shared/components/ErrorState';
import { LoadingState } from '../../../../shared/components/LoadingState';
import { PageHeader } from '../../../../shared/components/PageHeader';
import { Screen } from '../../../../shared/components/Screen';
import { colors, radius, shadow, typography } from '../../../../shared/theme';
import { useStaffDashboardViewModel } from '../viewmodels/useStaffDashboardViewModel';

function StatCard({ icon, label, value }: { icon: AppIconName; label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}><AppIcon name={icon} color={colors.primary} size={20} /></View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function StaffDashboardView() {
  const t = useTranslations();
  const { dashboard, isLoading, isError, refetch } = useStaffDashboardViewModel();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader
          showBack={false}
          title={t('staff.dashboard.title')}
          subtitle={dashboard?.hospital?.name ?? t('staff.dashboard.subtitleFallback')}
        />
        {isLoading ? <LoadingState label={t('staff.dashboard.loading')} /> : null}
        {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
        {dashboard ? (
          <>
            <View style={styles.contextCard}>
              <Text style={styles.contextPosition}>{dashboard.staff_context.position}</Text>
              <Text style={styles.contextMeta}>
                {dashboard.staff_context.department?.name ?? t('staff.dashboard.noDepartment')} · {dashboard.staff_context.employee_id}
              </Text>
            </View>
            <View style={styles.grid}>
              <StatCard icon="business-outline" label={t('staff.dashboard.stats.activeDepartments')} value={dashboard.departments.active} />
              <StatCard icon="medkit-outline" label={t('staff.dashboard.stats.activeDoctors')} value={dashboard.doctors.active} />
              <StatCard icon="checkmark-circle-outline" label={t('staff.dashboard.stats.availableToday')} value={dashboard.doctors.available_today} />
              <StatCard icon="calendar-outline" label={t('staff.dashboard.stats.todayAppointments')} value={dashboard.today_appointments.total} />
              <StatCard icon="people-outline" label={t('staff.dashboard.stats.todayQueue')} value={dashboard.today_queue.total} />
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 42, gap: 18 },
  contextCard: { borderRadius: radius.lg, backgroundColor: colors.primarySoft, padding: 18, gap: 4 },
  contextPosition: { ...typography.entityTitle, color: colors.ink },
  contextMeta: { ...typography.metadata, color: colors.inkSoft },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47%',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 8,
    shadowColor: shadow.color,
    shadowOpacity: shadow.opacity,
    shadowRadius: shadow.radius,
    shadowOffset: shadow.offset,
    elevation: shadow.elevation,
  },
  statIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 24, lineHeight: 28, fontWeight: '800', color: colors.ink },
  statLabel: { ...typography.metadata, color: colors.muted },
});

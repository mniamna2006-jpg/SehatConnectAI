import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../../../providers/LocaleProvider';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorState } from '../../../../shared/components/ErrorState';
import { LoadingState } from '../../../../shared/components/LoadingState';
import { PageHeader } from '../../../../shared/components/PageHeader';
import { Screen } from '../../../../shared/components/Screen';
import { SectionHeader } from '../../../../shared/components/SectionHeader';
import { colors, radius, typography } from '../../../../shared/theme';
import type { AdminAnalytics } from '../model/types';
import { useAdminAnalyticsViewModel } from '../viewmodels/useAdminAnalyticsViewModel';

export function AdminAnalyticsView() {
  const t = useTranslations();
  const { analytics, isLoading, isError, error, refetch } = useAdminAnalyticsViewModel();

  if (isLoading) return <Screen><LoadingState label={t('admin.analytics.loading')} /></Screen>;
  if (isError) {
    return (
      <Screen>
        <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={() => void refetch()} />
      </Screen>
    );
  }
  if (!analytics || isAnalyticsEmpty(analytics)) {
    return <Screen><EmptyState title={t('admin.analytics.emptyTitle')} message={t('admin.analytics.empty')} icon="bar-chart-outline" /></Screen>;
  }

  const { appointments, patients, queue, operations } = analytics;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title={t('admin.analytics.title')} subtitle={t('admin.analytics.subtitle')} />

        <MetricSection testID="analytics-appointments" title={t('admin.analytics.sections.appointments')} metrics={[
          [t('admin.analytics.metrics.total'), appointments.total],
          [t('admin.analytics.metrics.today'), appointments.today],
          [t('admin.analytics.metrics.thisWeek'), appointments.this_week],
          [t('admin.analytics.metrics.thisMonth'), appointments.this_month],
          [t('admin.analytics.metrics.booked'), appointments.booked],
          [t('admin.analytics.metrics.confirmed'), appointments.confirmed],
          [t('admin.analytics.metrics.checkedIn'), appointments.checked_in],
          [t('admin.analytics.metrics.inProgress'), appointments.in_progress],
          [t('admin.analytics.metrics.completed'), appointments.completed],
          [t('admin.analytics.metrics.cancelled'), appointments.cancelled],
          [t('admin.analytics.metrics.noShow'), appointments.no_show],
        ]} />

        <MetricSection testID="analytics-patients" title={t('admin.analytics.sections.patients')} metrics={[
          [t('admin.analytics.metrics.total'), patients.total],
          [t('admin.analytics.metrics.active'), patients.active],
          [t('admin.analytics.metrics.newToday'), patients.new_today],
          [t('admin.analytics.metrics.newThisWeek'), patients.new_this_week],
          [t('admin.analytics.metrics.newThisMonth'), patients.new_this_month],
        ]} />

        <MetricSection testID="analytics-queue" title={t('admin.analytics.sections.queue')} metrics={[
          [t('admin.analytics.metrics.total'), queue.total],
          [t('admin.analytics.metrics.waiting'), queue.waiting],
          [t('admin.analytics.metrics.called'), queue.called],
          [t('admin.analytics.metrics.inProgress'), queue.in_progress],
          [t('admin.analytics.metrics.completed'), queue.completed],
          [t('admin.analytics.metrics.skipped'), queue.skipped],
          [t('admin.analytics.metrics.averageWait'), queue.average_wait_minutes === null ? t('common.notProvided') : `${queue.average_wait_minutes} ${t('admin.analytics.minutes')}`],
        ]} />

        <MetricSection testID="analytics-operations" title={t('admin.analytics.sections.operations')} detail={operations.hospital_workload.hospital_name} metrics={[
          [t('admin.analytics.metrics.hospitals'), `${operations.hospitals.active}/${operations.hospitals.total}`],
          [t('admin.analytics.metrics.doctors'), `${operations.doctors.active}/${operations.doctors.total}`],
          [t('admin.analytics.metrics.departments'), `${operations.departments.active}/${operations.departments.total}`],
          [t('admin.analytics.metrics.queues'), operations.hospital_workload.total_queues],
          [t('admin.analytics.sections.appointments'), operations.hospital_workload.total_appointments],
        ]} />

        <BreakdownSection title={t('admin.analytics.sections.departments')} empty={operations.appointments_by_department.length === 0}>
          {operations.appointments_by_department.map((item) => (
            <BreakdownRow key={item.department_id} testID={`department-breakdown-${item.department_id}`} title={item.department_name} value={item.total} />
          ))}
        </BreakdownSection>

        <BreakdownSection title={t('admin.analytics.sections.doctors')} empty={operations.appointments_by_doctor.length === 0}>
          {operations.appointments_by_doctor.map((item) => (
            <BreakdownRow key={item.doctor_id} testID={`doctor-breakdown-${item.doctor_id}`} title={item.doctor_name} subtitle={item.specialization} value={item.total} />
          ))}
        </BreakdownSection>

        <BreakdownSection title={t('admin.analytics.sections.workload')} empty={operations.doctor_workload.length === 0}>
          {operations.doctor_workload.map((item) => (
            <View key={item.doctor_id} testID={`doctor-workload-${item.doctor_id}`} style={styles.workloadRow}>
              <View style={styles.breakdownText}>
                <Text style={styles.breakdownTitle}>{item.doctor_name}</Text>
                <Text style={styles.breakdownSubtitle}>{item.specialization}</Text>
                <Text style={styles.statusText}>
                  {Object.entries(item.by_status)
                    .filter(([, count]) => (count ?? 0) > 0)
                    .map(([status, count]) => `${t(`common.status.${status}`)}: ${count}`)
                    .join(' · ')}
                </Text>
              </View>
              <Text style={styles.breakdownValue}>{item.total_appointments}</Text>
            </View>
          ))}
        </BreakdownSection>
      </ScrollView>
    </Screen>
  );
}

function isAnalyticsEmpty(analytics: AdminAnalytics) {
  return analytics.appointments.total === 0
    && analytics.patients.total === 0
    && analytics.queue.total === 0
    && analytics.operations.doctors.total === 0
    && analytics.operations.departments.total === 0;
}

function MetricSection({ detail, metrics, testID, title }: { detail?: string; metrics: Array<[string, number | string]>; testID: string; title: string }) {
  return (
    <View testID={testID} style={styles.section}>
      <SectionHeader title={title} detail={detail} />
      <View style={styles.metricGrid}>
        {metrics.map(([label, value]) => (
          <View key={label} style={styles.metricItem}>
            <Text style={styles.metricValue}>{value}</Text>
            <Text style={styles.metricLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BreakdownSection({ children, empty, title }: { children: React.ReactNode; empty: boolean; title: string }) {
  const t = useTranslations();
  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      {empty ? <Text style={styles.emptyBreakdown}>{t('admin.analytics.noBreakdown')}</Text> : <View style={styles.breakdownList}>{children}</View>}
    </View>
  );
}

function BreakdownRow({ subtitle, testID, title, value }: { subtitle?: string; testID: string; title: string; value: number }) {
  return (
    <View testID={testID} style={styles.breakdownRow}>
      <View style={styles.breakdownText}>
        <Text style={styles.breakdownTitle}>{title}</Text>
        {subtitle ? <Text style={styles.breakdownSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.breakdownValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 42, gap: 24 },
  section: { gap: 10 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface, overflow: 'hidden' },
  metricItem: { width: '33.33%', minHeight: 70, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  metricValue: { ...typography.entityTitle, color: colors.ink },
  metricLabel: { ...typography.metadata, color: colors.muted, marginTop: 2 },
  breakdownList: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface, overflow: 'hidden' },
  breakdownRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  workloadRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  breakdownText: { flex: 1, gap: 2 },
  breakdownTitle: { ...typography.body, color: colors.ink, fontWeight: '700' },
  breakdownSubtitle: { ...typography.metadata, color: colors.muted },
  breakdownValue: { ...typography.entityTitle, color: colors.primary },
  statusText: { ...typography.metadata, color: colors.inkSoft },
  emptyBreakdown: { ...typography.body, color: colors.muted, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface, padding: 15 },
});

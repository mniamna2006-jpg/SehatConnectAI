import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../../../providers/LocaleProvider';
import { AppIcon, type AppIconName } from '../../../../shared/components/AppIcon';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorState } from '../../../../shared/components/ErrorState';
import { LoadingState } from '../../../../shared/components/LoadingState';
import { PageHeader } from '../../../../shared/components/PageHeader';
import { PressableSurface } from '../../../../shared/components/Buttons';
import { Screen } from '../../../../shared/components/Screen';
import { SectionHeader } from '../../../../shared/components/SectionHeader';
import { colors, radius, typography } from '../../../../shared/theme';
import { useAdminDashboardViewModel } from '../viewmodels/useAdminDashboardViewModel';

const QUICK_LINKS: {
  href: '/admin/analytics' | '/admin/departments' | '/admin/doctors' | '/admin/profile' | '/admin/staff' | '/admin/invitations';
  icon: AppIconName;
  labelKey: string;
}[] = [
  { href: '/admin/departments', icon: 'layers-outline', labelKey: 'admin.dashboard.links.departments' },
  { href: '/admin/doctors', icon: 'medkit-outline', labelKey: 'admin.dashboard.links.doctors' },
  { href: '/admin/staff', icon: 'people-outline', labelKey: 'admin.dashboard.links.staff' },
  { href: '/admin/invitations', icon: 'mail-outline', labelKey: 'admin.dashboard.links.invitations' },
  { href: '/admin/analytics', icon: 'bar-chart-outline', labelKey: 'admin.dashboard.links.analytics' },
  { href: '/admin/profile', icon: 'business-outline', labelKey: 'admin.dashboard.links.profile' },
];

export function AdminDashboardView() {
  const t = useTranslations();
  const { dashboard, isLoading, isError, error, refetch } = useAdminDashboardViewModel();

  if (isLoading) return <Screen><LoadingState label={t('admin.dashboard.loading')} /></Screen>;
  if (isError) return <Screen><ErrorState message={error instanceof Error ? error.message : undefined} onRetry={() => void refetch()} /></Screen>;
  if (!dashboard) return <Screen><EmptyState title={t('common.emptyTitle')} message={t('admin.dashboard.empty')} icon="business-outline" /></Screen>;

  const { hospital, departments, doctors, staff, patients, appointment_counts, today_queue, today_appointments } = dashboard;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title={hospital.name} subtitle={t('admin.dashboard.subtitle')} showBack={false} right={
          <View style={[styles.statusBadge, hospital.is_active ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, hospital.is_active ? styles.statusTextActive : styles.statusTextInactive]}>
              {hospital.is_active ? t('admin.dashboard.hospitalActive') : t('admin.dashboard.hospitalInactive')}
            </Text>
          </View>
        } />

        <View style={styles.hospitalInfo}>
          <InfoItem icon="location-outline" value={hospital.city} />
          <InfoItem icon="business-outline" value={t(`admin.profile.facilityTypes.${hospital.facility_type}`)} />
          {hospital.phone ? <InfoItem icon="call-outline" value={hospital.phone} /> : null}
          {hospital.email ? <InfoItem icon="mail-outline" value={hospital.email} /> : null}
        </View>

        <View style={styles.statGrid}>
          <StatTile testID="stat-departments" icon="layers-outline" label={t('admin.dashboard.stats.departments')} total={departments.total} active={departments.active} />
          <StatTile testID="stat-doctors" icon="medkit-outline" label={t('admin.dashboard.stats.doctors')} total={doctors.total} active={doctors.active} />
          <StatTile testID="stat-staff" icon="people-outline" label={t('admin.dashboard.stats.staff')} total={staff.total} active={staff.active} />
          <StatTile testID="stat-patients" icon="person-outline" label={t('admin.dashboard.stats.patients')} total={patients.total} />
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('admin.dashboard.links.title')} />
          <View style={styles.linkGrid}>
            {QUICK_LINKS.map((link) => (
              <Link key={link.href} href={link.href} asChild>
                <PressableSurface testID={`dashboard-link-${link.href}`} accessibilityRole="button" style={styles.linkTile}>
                  <View style={styles.linkIcon}><AppIcon name={link.icon} color={colors.primary} size={20} /></View>
                  <Text style={styles.linkLabel}>{t(link.labelKey)}</Text>
                </PressableSurface>
              </Link>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('admin.dashboard.appointmentCountsTitle')} detail={`${appointment_counts.total} ${t('admin.dashboard.total')}`} />
          <StatusPillRow counts={appointment_counts.by_status} />
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('admin.dashboard.queueTitle')} detail={`${today_queue.total} ${t('admin.dashboard.total')}`} />
          <StatusPillRow counts={today_queue.by_status} />
        </View>

        <View testID="today-appointments-section" style={styles.section}>
          <SectionHeader title={t('admin.dashboard.todayAppointmentsTitle')} detail={`${today_appointments.length}`} />
          {today_appointments.length === 0 ? (
            <EmptyState title={t('admin.dashboard.noAppointmentsTitle')} message={t('admin.dashboard.noAppointmentsMessage')} icon="calendar-outline" />
          ) : (
            <View style={styles.appointmentList}>
              {today_appointments.map((apt) => (
                <View key={apt.appointment_id} testID={`appointment-row-${apt.appointment_id}`} style={styles.appointmentRow}>
                  <View style={styles.appointmentTime}><Text style={styles.appointmentTimeText}>{apt.appointment_time_12h ?? apt.appointment_time}</Text></View>
                  <View style={styles.appointmentDetails}>
                    <Text style={styles.appointmentPatient}>{apt.patient?.user.full_name ?? t('admin.dashboard.unknownPatient')}</Text>
                    <Text style={styles.appointmentMeta}>{[apt.doctor?.name, apt.department?.name].filter(Boolean).join(' · ')}</Text>
                  </View>
                  <Text style={styles.appointmentStatus}>{t(`common.status.${apt.status}`)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function StatTile({ testID, icon, label, total, active }: { testID: string; icon: AppIconName; label: string; total: number; active?: number }) {
  const t = useTranslations();
  return (
    <View testID={testID} style={styles.statTile}>
      <View style={styles.statIcon}><AppIcon name={icon} color={colors.primary} size={18} /></View>
      <Text style={styles.statTotal}>{total}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {active !== undefined ? <Text style={styles.statActive}>{active} {t('common.active')}</Text> : null}
    </View>
  );
}

function InfoItem({ icon, value }: { icon: AppIconName; value: string }) {
  return (
    <View style={styles.infoItem}>
      <AppIcon name={icon} color={colors.muted} size={16} />
      <Text style={styles.infoText}>{value}</Text>
    </View>
  );
}

function StatusPillRow({ counts }: { counts: Partial<Record<string, number>> }) {
  const t = useTranslations();
  const entries = Object.entries(counts).filter(([, value]) => (value ?? 0) > 0);
  if (entries.length === 0) return <Text style={styles.noStatus}>—</Text>;
  return (
    <View style={styles.pillRow}>
      {entries.map(([status, value]) => (
        <View key={status} style={styles.pill}>
          <Text style={styles.pillText}>{t(`common.status.${status}`)}: {value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 42, gap: 26 },
  statusBadge: { minHeight: 32, borderRadius: radius.pill, paddingHorizontal: 12, justifyContent: 'center' },
  statusActive: { backgroundColor: colors.successSoft },
  statusInactive: { backgroundColor: colors.dangerSoft },
  statusText: { ...typography.metadata, fontWeight: '700' },
  statusTextActive: { color: colors.success },
  statusTextInactive: { color: colors.danger },
  hospitalInfo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { ...typography.metadata, color: colors.muted },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statTile: { width: '48%', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 15, gap: 4 },
  statIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statTotal: { ...typography.screenTitle, color: colors.ink },
  statLabel: { ...typography.metadata, color: colors.muted },
  statActive: { ...typography.metadata, color: colors.success, fontWeight: '700' },
  section: { gap: 12 },
  linkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  linkTile: { flex: 1, minWidth: 140, minHeight: 76, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12, gap: 8, justifyContent: 'center' },
  linkIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { ...typography.metadata, color: colors.ink, fontWeight: '700' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  pillText: { ...typography.metadata, color: colors.inkSoft, fontWeight: '600' },
  noStatus: { ...typography.body, color: colors.faint },
  appointmentList: { gap: 10 },
  appointmentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 13 },
  appointmentTime: { width: 66 },
  appointmentTimeText: { ...typography.metadata, color: colors.primary, fontWeight: '700' },
  appointmentDetails: { flex: 1, gap: 2 },
  appointmentPatient: { ...typography.body, color: colors.ink, fontWeight: '600' },
  appointmentMeta: { ...typography.metadata, color: colors.muted },
  appointmentStatus: { ...typography.metadata, color: colors.inkSoft, fontWeight: '700' },
});

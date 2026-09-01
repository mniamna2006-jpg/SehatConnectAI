import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../../../providers/LocaleProvider';
import { AppButton } from '../../../../shared/components/Buttons';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorState } from '../../../../shared/components/ErrorState';
import { LoadingState } from '../../../../shared/components/LoadingState';
import { PageHeader } from '../../../../shared/components/PageHeader';
import { Screen } from '../../../../shared/components/Screen';
import { colors, radius, shadow, typography } from '../../../../shared/theme';
import { displayTime12h } from '../../../../shared/utils/time';
import type { AppointmentStatus } from '../../../../shared/types/api';
import type { StaffAppointment } from '../model/types';
import { nextStatusOptions, useStaffAppointmentsViewModel } from '../viewmodels/useStaffAppointmentsViewModel';

const ACTION_VARIANT: Partial<Record<AppointmentStatus, 'primary' | 'secondary' | 'danger'>> = {
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
};

export function StaffAppointmentsView() {
  const t = useTranslations();
  const { appointments, isLoading, isError, refetch, actionError, pendingId, updateStatus } =
    useStaffAppointmentsViewModel();

  return (
    <Screen>
      <View style={styles.root}>
        <PageHeader title={t('staff.appointments.title')} subtitle={t('staff.appointments.subtitle')} showBack={false} />
        {actionError ? <Text accessibilityRole="alert" style={styles.actionError}>{actionError}</Text> : null}
        {isLoading ? <LoadingState label={t('staff.appointments.loading')} /> : null}
        {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
        {!isLoading && !isError && appointments.length === 0 ? (
          <EmptyState title={t('staff.appointments.emptyTitle')} message={t('staff.appointments.emptyMessage')} icon="calendar-outline" />
        ) : null}
        {!isLoading && !isError && appointments.length > 0 ? (
          <FlatList
            data={appointments}
            keyExtractor={(item: StaffAppointment) => item.appointment_id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.patientName}>{item.patient?.full_name ?? t('staff.appointments.unknownPatient')}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{t(`staff.appointments.status.${item.status}`)}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  {item.doctor?.name ?? '—'} · {item.department?.name ?? '—'}
                </Text>
                <Text style={styles.meta}>{displayTime12h(item.appointment_time_12h, item.appointment_time)}</Text>
                <View style={styles.actions}>
                  {nextStatusOptions(item.status).map((status) => (
                    <AppButton
                      key={status}
                      testID={`appointment-action-${item.appointment_id}-${status}`}
                      label={t(`staff.appointments.actions.${status}`)}
                      variant={ACTION_VARIANT[status] ?? 'secondary'}
                      loading={pendingId === item.appointment_id}
                      disabled={pendingId !== null && pendingId !== item.appointment_id}
                      onPress={() => updateStatus(item.appointment_id, status)}
                      style={styles.actionButton}
                    />
                  ))}
                </View>
              </View>
            )}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 10, gap: 12 },
  actionError: { ...typography.metadata, color: colors.danger, textAlign: 'center', marginHorizontal: 22 },
  list: { paddingHorizontal: 22, paddingBottom: 42 },
  separator: { height: 14 },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 6,
    shadowColor: shadow.color,
    shadowOpacity: shadow.opacity,
    shadowRadius: shadow.radius,
    shadowOffset: shadow.offset,
    elevation: shadow.elevation,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  patientName: { ...typography.entityTitle, color: colors.ink, flexShrink: 1 },
  statusBadge: { borderRadius: radius.pill, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { ...typography.metadata, color: colors.primary, fontWeight: '700' },
  meta: { ...typography.body, color: colors.muted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  actionButton: { minHeight: 40, paddingHorizontal: 14 },
});

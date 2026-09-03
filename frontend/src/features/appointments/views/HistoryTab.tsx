import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../../providers/LocaleProvider';
import { AppIcon } from '../../../shared/components/AppIcon';
import { Avatar } from '../../../shared/components/Avatar';
import { AppButton } from '../../../shared/components/Buttons';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { colors, radius, typography } from '../../../shared/theme';
import { formatDateLabel } from '../../../shared/utils/formatters';
import { displayTime12h } from '../../../shared/utils/time';
import type { Appointment } from '../model/types';
import { type HistoryFilter, useAppointmentHistoryViewModel } from '../viewmodels/useAppointmentHistoryViewModel';

const FILTER_IDS: HistoryFilter[] = ['upcoming', 'completed', 'cancelled'];

function statusStyles(status: Appointment['status']) {
  if (status === 'COMPLETED') return { wrap: styles.badgeSuccess, text: styles.badgeSuccessText };
  if (status === 'CANCELLED' || status === 'NO_SHOW') return { wrap: styles.badgeDanger, text: styles.badgeDangerText };
  if (status === 'IN_PROGRESS' || status === 'CHECKED_IN') return { wrap: styles.badgeTeal, text: styles.badgeTealText };
  return { wrap: styles.badgeBlue, text: styles.badgeBlueText };
}

export function HistoryTab() {
  const t = useTranslations();
  const vm = useAppointmentHistoryViewModel();
  const filterLabels: Record<HistoryFilter, string> = {
    upcoming: t('appointments.tabs.upcoming'),
    completed: t('appointments.tabs.completed'),
    cancelled: t('appointments.tabs.cancelled'),
  };
  return (
    <FlatList
      data={vm.appointments}
      keyExtractor={(appointment: Appointment) => appointment.appointment_id}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>{t('appointments.history.title')}</Text>
          <Text style={styles.subtitle}>{t('appointments.history.subtitle')}</Text>
          <View accessibilityRole="tablist" style={styles.filters}>
            {FILTER_IDS.map((filterId) => {
              const selected = vm.filter === filterId;
              return <Pressable key={filterId} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => vm.setFilter(filterId)} style={({ pressed }) => [styles.filter, selected && styles.filterSelected, pressed && styles.pressed]}><Text style={[styles.filterText, selected && styles.filterTextSelected]}>{filterLabels[filterId]}</Text></Pressable>;
            })}
          </View>
          {vm.cancelError ? <ErrorState message={vm.cancelError} /> : null}
        </View>
      }
      ListEmptyComponent={vm.isLoading ? <LoadingState label={t('appointments.history.loading')} /> : vm.isError ? <ErrorState onRetry={() => void vm.refetch()} /> : <EmptyState title={t('appointments.history.emptyTitle')} message={t('appointments.history.emptyMessage')} icon="calendar-outline" />}
      renderItem={({ item }: { item: Appointment }) => {
        const canCancel = item.status === 'BOOKED' || item.status === 'CONFIRMED';
        const badge = statusStyles(item.status);
        const doctorName = item.doctor?.name ?? t('common.detailsUnavailable');
        const hospitalName = item.hospital?.name ?? t('common.detailsUnavailable');
        return (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Avatar name={doctorName} size={58} />
              <View style={styles.cardCopy}><Text style={styles.doctorName}>{doctorName}</Text><View style={styles.metaRow}><AppIcon name="business-outline" color={colors.muted} size={15} /><Text style={styles.metaText}>{hospitalName}</Text></View></View>
              <View style={[styles.badge, badge.wrap]}><Text style={[styles.badgeText, badge.text]}>{t(`common.status.${item.status}`)}</Text></View>
            </View>
            <View style={styles.datePanel}>
              <View style={styles.dateItem}><AppIcon name="calendar-outline" color={colors.primary} size={19} /><View><Text style={styles.dateLabel}>{t('appointments.history.date')}</Text><Text style={styles.dateValue}>{formatDateLabel(item.appointment_date)}</Text></View></View>
              <View style={styles.dateDivider} />
              <View style={styles.dateItem}><AppIcon name="time-outline" color={colors.teal} size={19} /><View><Text style={styles.dateLabel}>{t('appointments.history.time')}</Text><Text style={styles.dateValue}>{displayTime12h(item.appointment_time_12h, item.appointment_time)}</Text></View></View>
            </View>
            <View style={styles.cardFooter}>
              <View><Text style={styles.referenceLabel}>{t('appointments.history.bookingReference')}</Text><Text style={styles.referenceValue}>{item.booking_reference}</Text></View>
              {canCancel ? <AppButton label={vm.isCancelling(item.appointment_id) ? t('appointments.history.cancelling') : t('common.cancel')} variant="danger" loading={vm.isCancelling(item.appointment_id)} onPress={() => void vm.onCancel(item.appointment_id)} style={styles.cancelButton} /> : null}
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingBottom: 42 },
  header: { gap: 7, marginBottom: 18 },
  title: { ...typography.sectionTitle, color: colors.ink },
  subtitle: { ...typography.body, color: colors.muted },
  filters: { minHeight: 48, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, padding: 4, flexDirection: 'row', gap: 4, marginTop: 8 },
  filter: { flex: 1, minHeight: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  filterSelected: { backgroundColor: colors.surface },
  filterText: { ...typography.metadata, color: colors.muted, fontWeight: '700' },
  filterTextSelected: { color: colors.ink },
  pressed: { opacity: 0.75 },
  separator: { height: 14 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 17, gap: 15, borderWidth: 1, borderColor: colors.line },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardCopy: { flex: 1 },
  doctorName: { ...typography.entityTitle, color: colors.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  metaText: { ...typography.metadata, color: colors.muted, flex: 1 },
  badge: { minHeight: 28, borderRadius: radius.pill, justifyContent: 'center', paddingHorizontal: 9 },
  badgeText: { fontSize: 10, lineHeight: 14, fontWeight: '800' },
  badgeBlue: { backgroundColor: colors.primarySoft },
  badgeBlueText: { color: colors.primary },
  badgeTeal: { backgroundColor: colors.tealSoft },
  badgeTealText: { color: colors.teal },
  badgeSuccess: { backgroundColor: colors.successSoft },
  badgeSuccessText: { color: colors.success },
  badgeDanger: { backgroundColor: colors.dangerSoft },
  badgeDangerText: { color: colors.danger },
  datePanel: { minHeight: 72, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  dateItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  dateDivider: { width: 1, height: 34, backgroundColor: colors.line, marginHorizontal: 10 },
  dateLabel: { ...typography.metadata, color: colors.muted },
  dateValue: { ...typography.metadata, color: colors.ink, fontWeight: '700', marginTop: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  referenceLabel: { fontSize: 11, lineHeight: 15, color: colors.muted },
  referenceValue: { ...typography.metadata, color: colors.inkSoft, fontWeight: '700', marginTop: 1 },
  cancelButton: { minHeight: 42, minWidth: 102 },
});

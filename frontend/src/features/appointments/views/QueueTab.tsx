import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AppIcon, type AppIconName } from '../../../shared/components/AppIcon';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { colors, radius, shadow, typography } from '../../../shared/theme';
import { displayTime12h } from '../../../shared/utils/time';
import type { QueueEntry } from '../model/types';
import { useQueueViewModel } from '../viewmodels/useQueueViewModel';

function DetailRow({ icon, label, value }: { icon: AppIconName; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}><AppIcon name={icon} color={colors.primary} size={20} /></View>
      <View style={styles.detailCopy}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>
    </View>
  );
}

export function QueueTab() {
  const { queue, isLoading, isError, refetch } = useQueueViewModel();
  if (isLoading) return <LoadingState label="Checking your queue…" />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (queue.length === 0) return <EmptyState title="No active queue" message="Your token will appear here after check-in." icon="people-outline" />;

  return (
    <FlatList
      data={queue}
      keyExtractor={(entry: QueueEntry) => entry.queue_id}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={<View style={styles.header}><Text accessibilityRole="header" style={styles.title}>Queue status</Text><Text style={styles.subtitle}>Follow your active token and estimated wait</Text></View>}
      renderItem={({ item }: { item: QueueEntry }) => (
        <View style={styles.queueCard}>
          <View style={styles.tokenHero}>
            <View style={styles.tokenIcon}><AppIcon name="ticket-outline" color={colors.surface} size={25} /></View>
            <Text style={styles.tokenLabel}>Your Token</Text>
            <Text style={styles.tokenNumber}>{item.token_number}</Text>
            <View style={styles.statusBadge}><View style={styles.statusDot} /><Text style={styles.statusText}>{item.queue_status.replaceAll('_', ' ')}</Text></View>
          </View>
          <View style={styles.detailsPanel}>
            {item.appointment?.doctor?.name ? <DetailRow icon="medkit-outline" label="Doctor" value={item.appointment.doctor.name} /> : null}
            {item.appointment?.hospital?.name ? <DetailRow icon="business-outline" label="Hospital" value={item.appointment.hospital.name} /> : null}
            {item.appointment ? <DetailRow icon="time-outline" label="Appointment time" value={displayTime12h(item.appointment.appointment_time_12h, item.appointment.appointment_time)} /> : null}
            {item.estimated_wait_time !== undefined ? <DetailRow icon="hourglass-outline" label="Estimated wait" value={`${item.estimated_wait_time} minutes`} /> : null}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingBottom: 42 },
  header: { gap: 6, marginBottom: 18 },
  title: { ...typography.sectionTitle, color: colors.ink },
  subtitle: { ...typography.body, color: colors.muted },
  separator: { height: 16 },
  queueCard: { borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden', shadowColor: shadow.color, shadowOpacity: shadow.opacity, shadowRadius: shadow.radius, shadowOffset: shadow.offset, elevation: shadow.elevation },
  tokenHero: { minHeight: 238, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', padding: 24 },
  tokenIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: '#FFFFFF24', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tokenLabel: { ...typography.body, color: '#DCE8FF', fontWeight: '700' },
  tokenNumber: { fontSize: 64, lineHeight: 72, color: colors.surface, fontWeight: '900', letterSpacing: -2, marginVertical: 3 },
  statusBadge: { minHeight: 36, borderRadius: radius.pill, backgroundColor: '#FFFFFFE8', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal },
  statusText: { ...typography.metadata, color: colors.ink, fontWeight: '800' },
  detailsPanel: { paddingHorizontal: 18 },
  detailRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  detailIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  detailCopy: { flex: 1 },
  detailLabel: { ...typography.metadata, color: colors.muted },
  detailValue: { ...typography.body, color: colors.ink, fontWeight: '700', marginTop: 1 },
});

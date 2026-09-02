import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../../../providers/LocaleProvider';
import { AppButton } from '../../../../shared/components/Buttons';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorState } from '../../../../shared/components/ErrorState';
import { LoadingState } from '../../../../shared/components/LoadingState';
import { PageHeader } from '../../../../shared/components/PageHeader';
import { Screen } from '../../../../shared/components/Screen';
import { colors, radius, shadow, typography } from '../../../../shared/theme';
import type { StaffQueueEntry } from '../model/types';
import { nextQueueStatus, useStaffQueueViewModel } from '../viewmodels/useStaffQueueViewModel';

export function StaffQueueView() {
  const t = useTranslations();
  const { queue, isLoading, isError, refetch, actionError, pendingId, advance } = useStaffQueueViewModel();

  return (
    <Screen>
      <View style={styles.root}>
        <PageHeader title={t('staff.queue.title')} subtitle={t('staff.queue.subtitle')} showBack={false} />
        {actionError ? <Text accessibilityRole="alert" style={styles.actionError}>{actionError}</Text> : null}
        {isLoading ? <LoadingState label={t('staff.queue.loading')} /> : null}
        {isError ? <ErrorState onRetry={() => void refetch()} /> : null}
        {!isLoading && !isError && queue.length === 0 ? (
          <EmptyState title={t('staff.queue.emptyTitle')} message={t('staff.queue.emptyMessage')} icon="people-outline" />
        ) : null}
        {!isLoading && !isError && queue.length > 0 ? (
          <FlatList
            data={queue}
            keyExtractor={(item: StaffQueueEntry) => item.queue_id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const next = nextQueueStatus(item.queue_status);
              return (
                <View style={styles.card} testID={`queue-row-${item.queue_id}`}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.token}>#{item.token_number}</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{t(`staff.queue.status.${item.queue_status}`)}</Text>
                    </View>
                  </View>
                  <Text style={styles.patientName}>{item.patient?.full_name ?? t('staff.queue.unknownPatient')}</Text>
                  <Text style={styles.meta}>{item.doctor?.name ?? '—'}</Text>
                  {next ? (
                    <AppButton
                      testID={`queue-action-${item.queue_id}`}
                      label={t(`staff.queue.actions.${next}`)}
                      loading={pendingId === item.queue_id}
                      disabled={pendingId !== null && pendingId !== item.queue_id}
                      onPress={() => advance(item.queue_id, next)}
                      style={styles.actionButton}
                    />
                  ) : null}
                </View>
              );
            }}
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
  token: { ...typography.entityTitle, color: colors.ink },
  statusBadge: { borderRadius: radius.pill, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { ...typography.metadata, color: colors.primary, fontWeight: '700' },
  patientName: { ...typography.body, color: colors.inkSoft, fontWeight: '700' },
  meta: { ...typography.body, color: colors.muted },
  actionButton: { marginTop: 8, minHeight: 40, alignSelf: 'flex-start', paddingHorizontal: 18 },
});

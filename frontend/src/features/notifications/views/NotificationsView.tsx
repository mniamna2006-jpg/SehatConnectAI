import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../../providers/LocaleProvider';
import { AppIcon, type AppIconName } from '../../../shared/components/AppIcon';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Screen } from '../../../shared/components/Screen';
import { colors, radius, typography } from '../../../shared/theme';
import { formatDateTimeLabel } from '../../../shared/utils/formatters';
import type { Notification, NotificationType } from '../model/types';
import { useNotificationsViewModel } from '../viewmodels/useNotificationsViewModel';

const TYPE_ICON: Partial<Record<NotificationType, { icon: AppIconName; iconColor: string; iconBg: object }>> = {
  BOOKING_CONFIRMATION: { icon: 'calendar-outline', iconColor: colors.primary, iconBg: { backgroundColor: colors.primarySoft } },
  APPOINTMENT_REMINDER: { icon: 'alarm-outline', iconColor: colors.primary, iconBg: { backgroundColor: colors.primarySoft } },
  QUEUE_UPDATE: { icon: 'people-outline', iconColor: colors.teal, iconBg: { backgroundColor: colors.tealSoft } },
  DOCTOR_AVAILABILITY: { icon: 'medkit-outline', iconColor: colors.teal, iconBg: { backgroundColor: colors.tealSoft } },
  CANCELLATION: { icon: 'close-circle-outline', iconColor: colors.danger, iconBg: { backgroundColor: colors.dangerSoft } },
};

function iconFor(type: NotificationType) {
  return TYPE_ICON[type] ?? { icon: 'notifications-outline' as AppIconName, iconColor: colors.primary, iconBg: { backgroundColor: colors.primarySoft } };
}

export function NotificationsView() {
  const t = useTranslations();
  const vm = useNotificationsViewModel();

  return (
    <Screen>
      <FlatList
        data={vm.notifications}
        keyExtractor={(item: Notification) => item.notification_id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        refreshing={vm.isLoading}
        onRefresh={() => void vm.refetch()}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <PageHeader
              title={t('notifications.title')}
              subtitle={t('notifications.subtitle')}
              right={
                vm.notifications.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={vm.isMarkingAllRead}
                    hitSlop={8}
                    onPress={() => void vm.onMarkAllRead()}
                    style={({ pressed }) => [styles.markAll, pressed && styles.pressed]}
                  >
                    <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
                  </Pressable>
                ) : undefined
              }
            />
            {vm.hasMutationError ? <ErrorState inline message={t('notifications.mutationError')} /> : null}
          </View>
        }
        ListEmptyComponent={
          vm.isLoading ? (
            <LoadingState />
          ) : vm.isError ? (
            <ErrorState message={t('notifications.errorMessage')} onRetry={() => void vm.refetch()} />
          ) : (
            <EmptyState title={t('notifications.emptyTitle')} message={t('notifications.emptyMessage')} icon="notifications-outline" />
          )
        }
        renderItem={({ item }: { item: Notification }) => {
          const { icon, iconColor, iconBg } = iconFor(item.type);
          const unread = !item.is_read;
          return (
            <Pressable
              accessibilityLabel={unread ? `${item.title}. ${t('notifications.unread')}` : item.title}
              accessibilityRole="button"
              onPress={() => void vm.onPress(item)}
              style={({ pressed }) => [styles.card, unread && styles.cardUnread, pressed && styles.pressed]}
            >
              <View style={[styles.iconBox, iconBg]}>
                <AppIcon name={icon} color={iconColor} size={20} />
              </View>
              <View style={styles.copy}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{item.title}</Text>
                  {unread ? <View accessibilityElementsHidden style={styles.dot} /> : null}
                </View>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.timestamp}>{formatDateTimeLabel(item.created_at)}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 36, gap: 18 },
  headerWrap: { gap: 8 },
  separator: { height: 12 },
  markAll: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 4 },
  markAllText: { ...typography.metadata, color: colors.primaryPressed, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  card: { minHeight: 48, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 15, flexDirection: 'row', gap: 13, borderWidth: 1, borderColor: colors.line },
  cardUnread: { backgroundColor: colors.primarySoft },
  iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { ...typography.entityTitle, color: colors.ink, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  message: { ...typography.body, color: colors.muted, flexWrap: 'wrap' },
  timestamp: { ...typography.metadata, color: colors.muted, marginTop: 2 },
});

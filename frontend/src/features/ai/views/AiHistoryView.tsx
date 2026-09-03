import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslations } from '../../../providers/LocaleProvider';
import { AppIcon } from '../../../shared/components/AppIcon';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Screen } from '../../../shared/components/Screen';
import { colors, radius, typography } from '../../../shared/theme';
import { formatDateTimeLabel } from '../../../shared/utils/formatters';
import type { ConversationSummary } from '../model/types';
import { useAiHistoryViewModel } from '../viewmodels/useAiHistoryViewModel';

export function AiHistoryView() {
  const t = useTranslations();
  const vm = useAiHistoryViewModel();

  const confirmDelete = (conversationId: string) => {
    Alert.alert(t('ai.history.deleteConfirmTitle'), t('ai.history.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('ai.history.delete'), style: 'destructive', onPress: () => void vm.onDelete(conversationId) },
    ]);
  };

  return (
    <Screen>
      <FlatList
        data={vm.conversations}
        keyExtractor={(item: ConversationSummary) => item.conversation_id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        refreshing={vm.isLoading}
        onRefresh={() => void vm.refetch()}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <PageHeader title={t('ai.history.title')} subtitle={t('ai.history.subtitle')} />
            {vm.hasDeleteError ? <ErrorState message={t('ai.history.deleteError')} /> : null}
          </View>
        }
        ListEmptyComponent={
          vm.isLoading ? (
            <LoadingState />
          ) : vm.isError ? (
            <ErrorState message={t('ai.history.errorMessage')} onRetry={() => void vm.refetch()} />
          ) : (
            <EmptyState title={t('ai.history.emptyTitle')} message={t('ai.history.emptyMessage')} icon="chatbubbles-outline" />
          )
        }
        renderItem={({ item }: { item: ConversationSummary }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.title ?? t('ai.chat.title')}
            onPress={() => router.push(`/ai-chat?conversationId=${item.conversation_id}`)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardBody}>
              <Text style={styles.title} numberOfLines={1}>{item.title ?? t('ai.chat.title')}</Text>
              {item.latest_message ? <Text style={styles.preview} numberOfLines={2}>{item.latest_message.message}</Text> : null}
              <Text style={styles.meta}>{formatDateTimeLabel(item.updated_at)} · {item.message_count} {t('ai.history.messages')}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('ai.history.delete')} ${item.title ?? ''}`}
              disabled={vm.isDeleting(item.conversation_id)}
              hitSlop={8}
              onPress={() => confirmDelete(item.conversation_id)}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
            >
              <AppIcon name="trash-outline" color={colors.danger} size={19} />
            </Pressable>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 36, gap: 18 },
  headerWrap: { gap: 8 },
  separator: { height: 12 },
  pressed: { opacity: 0.75 },
  card: { minHeight: 48, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line },
  cardBody: { flex: 1, gap: 3 },
  title: { ...typography.entityTitle, color: colors.ink },
  preview: { ...typography.body, color: colors.muted },
  meta: { ...typography.metadata, color: colors.muted, marginTop: 2 },
  deleteButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});

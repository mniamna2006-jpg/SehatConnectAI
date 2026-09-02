import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslations } from '../../../providers/LocaleProvider';
import { AppIcon } from '../../../shared/components/AppIcon';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { IconButton } from '../../../shared/components/Buttons';
import { LoadingState } from '../../../shared/components/LoadingState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Screen } from '../../../shared/components/Screen';
import { colors, radius, typography } from '../../../shared/theme';
import type { ChatMessage } from '../viewmodels/useAiChatViewModel';
import { useAiChatViewModel } from '../viewmodels/useAiChatViewModel';

interface AiChatViewProps {
  conversationId?: string;
}

export function AiChatView({ conversationId }: AiChatViewProps = {}) {
  const t = useTranslations();
  const vm = useAiChatViewModel(conversationId);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (vm.messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
  }, [vm.messages.length]);

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={12}>
        <PageHeader
          title={t('ai.chat.title')}
          subtitle={t('ai.chat.disclaimer')}
          right={<IconButton icon="time-outline" label={t('ai.chat.historyAction')} onPress={() => router.push('/ai-history')} />}
        />
        <FlatList
          ref={listRef}
          data={vm.messages}
          keyExtractor={(item: ChatMessage) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            conversationId && vm.isHistoryLoading ? (
              <LoadingState />
            ) : conversationId && vm.isHistoryError ? (
              <ErrorState message={t('ai.history.errorMessage')} />
            ) : (
              <EmptyState title={t('ai.chat.emptyTitle')} message={t('ai.chat.emptyMessage')} icon="chatbubbles-outline" />
            )
          }
          renderItem={({ item }: { item: ChatMessage }) => (
            <View style={[styles.bubbleRow, item.sender === 'USER' && styles.bubbleRowUser]}>
              <View style={[styles.bubble, item.sender === 'USER' ? styles.bubbleUser : styles.bubbleAi]}>
                <Text style={item.sender === 'USER' ? styles.bubbleTextUser : styles.bubbleTextAi}>{item.text}</Text>
              </View>
              {item.sender === 'AI' && item.is_emergency ? (
                <View accessibilityRole="alert" style={styles.emergencyBanner}>
                  <AppIcon name="warning-outline" color={colors.danger} size={18} />
                  <Text style={styles.emergencyText}>{t('ai.chat.emergencyWarning')}</Text>
                </View>
              ) : null}
              {item.sender === 'AI' && item.recommendation?.recommended_department ? (
                <View style={styles.recommendationCard}>
                  <Text style={styles.recommendationLabel}>{t('ai.chat.recommendedDepartment')}</Text>
                  <Text style={styles.recommendationTitle}>{item.recommendation.recommended_department.name}</Text>
                  <Text style={styles.recommendationMeta}>
                    {item.recommendation.recommended_department.hospital_name}, {item.recommendation.recommended_department.city}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push(`/department/${item.recommendation!.recommended_department!.department_id}/doctors`)}
                    style={({ pressed }) => [styles.recommendationAction, pressed && styles.pressed]}
                  >
                    <Text style={styles.recommendationActionText}>{t('ai.chat.viewDoctors')}</Text>
                    <AppIcon name="arrow-forward" color={colors.primary} size={16} />
                  </Pressable>
                </View>
              ) : null}
              {item.sender === 'AI' && item.recommendation && item.recommendation.doctors.length > 0 ? (
                <View style={styles.doctorList}>
                  <Text style={styles.recommendationLabel}>{t('ai.chat.recommendedDoctors')}</Text>
                  {item.recommendation.doctors.map((doctor) => (
                    <View key={doctor.doctor_id} style={styles.doctorCard}>
                      <Text style={styles.doctorName}>{doctor.name}</Text>
                      <Text style={styles.doctorMeta}>{doctor.specialization} · {doctor.hospital_name}</Text>
                      <Text style={styles.doctorFee}>{t('ai.chat.consultationFee')}: {doctor.consultation_fee}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        />
        {vm.sendError ? (
          <Text accessibilityRole="alert" style={styles.sendError}>{vm.sendError}</Text>
        ) : null}
        <View style={styles.composer}>
          <TextInput
            accessibilityLabel={t('ai.chat.placeholder')}
            value={vm.input}
            onChangeText={vm.setInput}
            placeholder={t('ai.chat.placeholder')}
            placeholderTextColor={colors.faint}
            editable={!vm.isSending}
            multiline
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('ai.chat.send')}
            disabled={!vm.input.trim() || vm.isSending}
            onPress={() => void vm.onSend()}
            style={({ pressed }) => [styles.sendButton, (!vm.input.trim() || vm.isSending) && styles.sendButtonDisabled, pressed && styles.pressed]}
          >
            <AppIcon name="send" color={colors.surface} size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 16, gap: 14, flexGrow: 1 },
  pressed: { opacity: 0.75 },
  bubbleRow: { gap: 8, alignItems: 'flex-start' },
  bubbleRowUser: { alignItems: 'flex-end' },
  bubble: { maxWidth: '85%', borderRadius: radius.lg, padding: 14 },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleAi: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 4 },
  bubbleTextUser: { ...typography.body, color: colors.surface },
  bubbleTextAi: { ...typography.body, color: colors.ink },
  emergencyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: 12, maxWidth: '90%' },
  emergencyText: { ...typography.metadata, color: colors.danger, flex: 1, flexWrap: 'wrap' },
  recommendationCard: { maxWidth: '90%', backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 14, gap: 4 },
  recommendationLabel: { ...typography.metadata, color: colors.muted, fontWeight: '700' },
  recommendationTitle: { ...typography.entityTitle, color: colors.ink },
  recommendationMeta: { ...typography.metadata, color: colors.muted },
  recommendationAction: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, minHeight: 32 },
  recommendationActionText: { ...typography.metadata, color: colors.primary, fontWeight: '700' },
  doctorList: { maxWidth: '90%', gap: 8 },
  doctorCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, gap: 2 },
  doctorName: { ...typography.entityTitle, color: colors.ink, fontSize: 15 },
  doctorMeta: { ...typography.metadata, color: colors.muted },
  doctorFee: { ...typography.metadata, color: colors.muted },
  sendError: { ...typography.metadata, color: colors.danger, paddingHorizontal: 22, paddingBottom: 6 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 22, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface },
  input: { flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, color: colors.ink, fontSize: 15, backgroundColor: colors.canvas },
  sendButton: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.48 },
});

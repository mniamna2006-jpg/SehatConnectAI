import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../../providers/LocaleProvider';
import { AppIcon } from '../../../shared/components/AppIcon';
import { colors, radius, typography } from '../../../shared/theme';
import { useDoctorAvailabilitySubscription } from '../viewmodels/useDoctorAvailabilitySubscription';

interface DoctorAvailabilityAlertProps {
  doctorId: string;
  isAvailable: boolean;
}

export function DoctorAvailabilityAlert({
  doctorId,
  isAvailable,
}: DoctorAvailabilityAlertProps) {
  const t = useTranslations();
  const viewModel = useDoctorAvailabilitySubscription(doctorId, isAvailable);

  if (!viewModel.canManageAlert) return null;

  if (viewModel.isLoading) {
    return (
      <View style={styles.feedbackRow}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={styles.feedbackText}>{t('doctors.availability.updating')}</Text>
      </View>
    );
  }

  if (viewModel.isError) {
    return (
      <View style={styles.errorRow}>
        <Text accessibilityRole="alert" style={styles.errorText}>
          {t('doctors.availability.updateError')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.retry')}
          hitSlop={8}
          onPress={() => void viewModel.refetch()}
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
        >
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  const actionLabel = viewModel.isUpdating
    ? t('doctors.availability.updating')
    : viewModel.subscribed
      ? t('doctors.availability.turnOffAlert')
      : t('doctors.availability.notifyWhenAvailable');

  return (
    <View style={styles.container}>
      {viewModel.subscribed && !viewModel.isUpdating ? (
        <Text style={styles.activeText}>{t('doctors.availability.alertOn')}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        accessibilityState={{ busy: viewModel.isUpdating, disabled: viewModel.isUpdating }}
        disabled={viewModel.isUpdating}
        onPress={viewModel.toggleAlert}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      >
        {viewModel.isUpdating ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <AppIcon
            name={viewModel.subscribed ? 'notifications-off-outline' : 'notifications-outline'}
            color={colors.primary}
            size={18}
          />
        )}
        <Text style={styles.actionText}>{actionLabel}</Text>
      </Pressable>
      {viewModel.hasMutationError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {t('doctors.availability.updateError')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  activeText: { ...typography.metadata, color: colors.success, fontWeight: '700' },
  action: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: { ...typography.metadata, color: colors.primary, fontWeight: '700', flexShrink: 1 },
  feedbackRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedbackText: { ...typography.metadata, color: colors.muted },
  errorRow: { gap: 8 },
  errorText: { ...typography.metadata, color: colors.danger },
  retryButton: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 8 },
  retryText: { ...typography.metadata, color: colors.primary, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});

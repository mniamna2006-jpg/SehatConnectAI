import { StyleSheet, Text, View } from 'react-native';
import { useTranslations } from '../../providers/LocaleProvider';
import { colors, radius, typography } from '../theme';
import { AppButton } from './Buttons';
import { AppIcon } from './AppIcon';

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const t = useTranslations();
  return (
    <View accessibilityRole="alert" style={styles.wrap}>
      <View style={styles.iconBox}><AppIcon name="alert-circle-outline" color={colors.danger} size={28} /></View>
      <Text style={styles.title}>{t('common.errorTitle')}</Text>
      <Text style={styles.message}>{message ?? t('common.error')}</Text>
      {onRetry ? (
        <AppButton label={t('common.retry')} variant="secondary" onPress={onRetry} style={styles.retry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { minHeight: 220, alignItems: 'center', justifyContent: 'center', padding: 28 },
  iconBox: { width: 60, height: 60, borderRadius: radius.lg, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { ...typography.sectionTitle, color: colors.ink, textAlign: 'center' },
  message: { ...typography.body, color: colors.muted, textAlign: 'center', marginTop: 6 },
  retry: { marginTop: 18, minWidth: 132 },
});

import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../theme';
import { AppButton } from './Buttons';
import { AppIcon } from './AppIcon';

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View accessibilityRole="alert" style={styles.wrap}>
      <View style={styles.iconBox}><AppIcon name="alert-circle-outline" color={colors.danger} size={28} /></View>
      <Text style={styles.title}>We couldn't load this</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <AppButton label="Try again" variant="secondary" onPress={onRetry} style={styles.retry} />
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

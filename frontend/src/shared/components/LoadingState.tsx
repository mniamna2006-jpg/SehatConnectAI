import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../theme';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      <View style={styles.iconBox}><ActivityIndicator color={colors.primary} /></View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { minHeight: 170, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  iconBox: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.body, color: colors.muted, textAlign: 'center' },
});

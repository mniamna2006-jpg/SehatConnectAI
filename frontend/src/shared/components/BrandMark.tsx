import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { AppIcon } from './AppIcon';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.row} accessibilityLabel="SehatConnect">
      <View style={[styles.mark, compact && styles.compactMark]}>
        <AppIcon name="medical" color={colors.surface} size={compact ? 20 : 24} />
      </View>
      <Text style={[styles.wordmark, compact && styles.compactWordmark]}>SehatConnect</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactMark: { width: 38, height: 38, borderRadius: 13 },
  wordmark: { color: colors.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  compactWordmark: { fontSize: 18 },
});

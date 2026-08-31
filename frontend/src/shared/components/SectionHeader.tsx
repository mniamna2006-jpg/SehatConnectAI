import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

export function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  title: { ...typography.sectionTitle, color: colors.ink },
  detail: { ...typography.metadata, color: colors.muted },
});

import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../theme';
import { AppIcon, type AppIconName } from './AppIcon';

export function EmptyState({ message, title = 'Nothing here yet', icon = 'calendar-outline' }: { message: string; title?: string; icon?: AppIconName }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconBox}><AppIcon name={icon} color={colors.teal} size={27} /></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { minHeight: 210, alignItems: 'center', justifyContent: 'center', padding: 28 },
  iconBox: { width: 60, height: 60, borderRadius: radius.lg, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { ...typography.sectionTitle, color: colors.ink, textAlign: 'center' },
  message: { ...typography.body, color: colors.muted, textAlign: 'center', maxWidth: 280, marginTop: 6 },
});

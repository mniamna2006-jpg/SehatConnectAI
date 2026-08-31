import type { TextInputProps } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius } from '../theme';
import { AppIcon } from './AppIcon';

export function SearchBar(props: TextInputProps) {
  return (
    <View style={styles.shell}>
      <AppIcon name="search" color={colors.muted} size={21} />
      <TextInput placeholderTextColor={colors.faint} style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 },
  input: { flex: 1, minHeight: 50, fontSize: 15, color: colors.ink },
});

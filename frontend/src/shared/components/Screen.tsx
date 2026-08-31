import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOptionalLocale } from '../../providers/LocaleProvider';
import { colors } from '../theme';

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const locale = useOptionalLocale();
  return <SafeAreaView style={[styles.root, locale?.isRTL ? styles.rtl : styles.ltr, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  ltr: { direction: 'ltr' },
  rtl: { direction: 'rtl' },
});

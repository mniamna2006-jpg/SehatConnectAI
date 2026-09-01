import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useOptionalLocale, useTranslations } from '../../providers/LocaleProvider';
import { colors, typography } from '../theme';
import { IconButton } from './Buttons';

export function PageHeader({
  title,
  subtitle,
  showBack = true,
  right,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: ReactNode;
}) {
  const isRTL = useOptionalLocale()?.isRTL ?? false;
  const t = useTranslations();
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        {showBack ? <IconButton icon={isRTL ? 'chevron-forward' : 'chevron-back'} label={t('common.goBack')} onPress={() => router.back()} /> : <View style={styles.spacer} />}
        <View style={styles.titleWrap}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        </View>
        {right ?? <View style={styles.spacer} />}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  spacer: { width: 48, height: 48 },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { ...typography.screenTitle, color: colors.ink, textAlign: 'center', letterSpacing: -0.6 },
  subtitle: { ...typography.body, color: colors.muted, textAlign: 'center', paddingHorizontal: 18 },
});

import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useOptionalLocale, useTranslations } from '../../providers/LocaleProvider';
import { colors, typography } from '../theme';
import { AppIcon } from './AppIcon';

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
        {showBack ? (
          <Pressable
            accessibilityLabel={t('common.goBack')}
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <AppIcon name={isRTL ? 'chevron-forward' : 'chevron-back'} color={colors.ink} size={22} />
          </Pressable>
        ) : (
          <View style={styles.spacer} />
        )}
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
  spacer: { width: 44, height: 44 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  backButtonPressed: { backgroundColor: colors.surfaceMuted },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { ...typography.screenTitle, color: colors.ink, textAlign: 'center', letterSpacing: -0.6 },
  subtitle: { ...typography.body, color: colors.muted, textAlign: 'center', paddingHorizontal: 18 },
});

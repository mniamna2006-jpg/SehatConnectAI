import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '../../../shared/components/BrandMark';
import { Screen } from '../../../shared/components/Screen';
import { colors, radius, typography } from '../../../shared/theme';

export function AuthScaffold({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.brandArea}>
            <BrandMark />
            <View style={styles.orbOne} />
            <View style={styles.orbTwo} />
          </View>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.form}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 32 },
  brandArea: { height: 126, borderRadius: radius.lg, backgroundColor: colors.primarySoft, padding: 20, justifyContent: 'center', overflow: 'hidden' },
  orbOne: { position: 'absolute', width: 126, height: 126, borderRadius: 63, backgroundColor: `${colors.primary}12`, right: -34, top: -32 },
  orbTwo: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: `${colors.teal}18`, right: 42, bottom: -30 },
  heading: { marginTop: 28, gap: 8 },
  title: { ...typography.hero, color: colors.ink, letterSpacing: -0.8 },
  subtitle: { ...typography.body, color: colors.muted, maxWidth: 340 },
  form: { marginTop: 24, gap: 17 },
  footer: { marginTop: 24, gap: 10, alignItems: 'center' },
});

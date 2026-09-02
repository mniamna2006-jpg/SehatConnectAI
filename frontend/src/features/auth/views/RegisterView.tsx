import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller } from 'react-hook-form';
import { AppIcon } from '../../../shared/components/AppIcon';
import { AppButton } from '../../../shared/components/Buttons';
import { FormField } from '../../../shared/components/FormField';
import { useTranslations } from '../../../providers/LocaleProvider';
import { colors, radius, typography } from '../../../shared/theme';
import type { PreferredLanguage } from '../../../shared/types/api';
import { useRegisterViewModel } from '../viewmodels/useRegisterViewModel';
import { AuthScaffold } from './AuthScaffold';

function FormSection({ icon, title }: { icon: 'person-outline' | 'call-outline' | 'language-outline'; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionIcon}><AppIcon name={icon} color={colors.primary} size={18} /></View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function RegisterView() {
  const t = useTranslations();
  const { control, errors, onSubmit, isSubmitting, apiError } = useRegisterViewModel();
  const languageOptions: { id: PreferredLanguage; label: string }[] = [
    { id: 'ENGLISH', label: t('auth.register.languageOptions.english') },
    { id: 'URDU', label: t('auth.register.languageOptions.urdu') },
    { id: 'ROMAN_URDU', label: t('auth.register.languageOptions.romanUrdu') },
  ];

  return (
    <AuthScaffold
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <View style={styles.loginRow}>
          <Text style={styles.footerText}>{t('auth.register.footerPrompt')}</Text>
          <Link href="/login" style={styles.link}>{t('auth.register.footerAction')}</Link>
        </View>
      }
    >
      <FormSection icon="person-outline" title={t('auth.register.sections.account')} />
      <Controller control={control} name="full_name" render={({ field }) => (
        <FormField testID="register-full-name" label={t('auth.register.fields.fullName')} icon="person-outline" placeholder={t('auth.register.placeholders.fullName')} value={field.value ?? ''} onChangeText={field.onChange} error={errors.full_name?.message} />
      )} />
      <Controller control={control} name="email" render={({ field }) => (
        <FormField testID="register-email" label={t('auth.register.fields.email')} icon="mail-outline" placeholder="you@example.com" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={field.value ?? ''} onChangeText={field.onChange} error={errors.email?.message} />
      )} />
      <Controller control={control} name="password" render={({ field }) => (
        <FormField testID="register-password" label={t('auth.register.fields.password')} icon="lock-closed-outline" placeholder={t('auth.register.placeholders.password')} autoComplete="new-password" secureTextEntry passwordToggleLabels={{ show: t('auth.password.show'), hide: t('auth.password.hide') }} value={field.value ?? ''} onChangeText={field.onChange} error={errors.password?.message} />
      )} />
      <Controller control={control} name="confirmPassword" render={({ field }) => (
        <FormField testID="register-confirm-password" label={t('auth.register.fields.confirmPassword')} icon="shield-checkmark-outline" placeholder={t('auth.register.placeholders.confirmPassword')} autoComplete="new-password" secureTextEntry passwordToggleLabels={{ show: t('auth.password.show'), hide: t('auth.password.hide') }} value={field.value ?? ''} onChangeText={field.onChange} error={errors.confirmPassword?.message} />
      )} />

      <FormSection icon="call-outline" title={t('auth.register.sections.contact')} />
      <Controller control={control} name="phone" render={({ field }) => (
        <FormField testID="register-phone" label={t('auth.register.fields.phone')} icon="call-outline" placeholder={t('auth.register.placeholders.phone')} autoComplete="tel" keyboardType="phone-pad" value={field.value ?? ''} onChangeText={field.onChange} error={errors.phone?.message} />
      )} />

      <FormSection icon="language-outline" title={t('auth.register.sections.language')} />
      <Controller
        control={control}
        name="preferred_language"
        render={({ field }) => (
          <View accessibilityRole="radiogroup" style={styles.languageGroup}>
            {languageOptions.map((option) => {
              const selected = field.value === option.id;
              return (
                <Pressable
                  key={option.id}
                  testID={`register-language-${option.id}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => field.onChange(option.id)}
                  style={({ pressed }) => [styles.languageOption, selected && styles.languageOptionSelected, pressed && styles.pressed]}
                >
                  <Text style={[styles.languageLabel, selected && styles.languageLabelSelected]}>{option.label}</Text>
                  {selected ? <AppIcon name="checkmark-circle" color={colors.primary} size={19} /> : null}
                </Pressable>
              );
            })}
          </View>
        )}
      />
      {errors.preferred_language ? <Text style={styles.error}>{errors.preferred_language.message}</Text> : null}
      {apiError ? <Text testID="register-error" accessibilityRole="alert" style={styles.error}>{apiError}</Text> : null}
      <AppButton testID="register-submit" label={t('auth.register.submit')} loading={isSubmitting} onPress={onSubmit} />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8 },
  sectionIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...typography.sectionTitle, color: colors.ink },
  languageGroup: { gap: 10 },
  languageOption: { minHeight: 50, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  languageOptionSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  languageLabel: { ...typography.body, color: colors.inkSoft, fontWeight: '600' },
  languageLabelSelected: { color: colors.primary, fontWeight: '700' },
  error: { ...typography.metadata, color: colors.danger },
  pressed: { opacity: 0.78 },
  loginRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5 },
  footerText: { ...typography.body, color: colors.muted },
  link: { ...typography.body, color: colors.primary, fontWeight: '700' },
});

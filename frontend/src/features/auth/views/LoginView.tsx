import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Controller } from 'react-hook-form';
import { AppButton } from '../../../shared/components/Buttons';
import { FormField } from '../../../shared/components/FormField';
import { useTranslations } from '../../../providers/LocaleProvider';
import { colors, typography } from '../../../shared/theme';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';
import { AuthScaffold } from './AuthScaffold';

export function LoginView() {
  const t = useTranslations();
  const { control, errors, onSubmit, isSubmitting, apiError } = useLoginViewModel();

  return (
    <AuthScaffold
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <>
          <View style={styles.createRow}>
            <Text style={styles.footerText}>{t('auth.login.footerPrompt')}</Text>
            <Link href="/register" style={styles.link}>{t('auth.login.footerAction')}</Link>
          </View>
          <Link href="/forgot-password" style={styles.quietLink}>{t('auth.login.forgotPassword')}</Link>
        </>
      }
    >
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <FormField
            testID="login-email"
            label={t('auth.login.fields.email')}
            icon="mail-outline"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <FormField
            testID="login-password"
            label={t('auth.login.fields.password')}
            icon="lock-closed-outline"
            placeholder={t('auth.login.placeholders.password')}
            autoComplete="current-password"
            secureTextEntry
            passwordToggleLabels={{
              show: t('auth.password.show'),
              hide: t('auth.password.hide'),
            }}
            value={field.value ?? ''}
            onChangeText={field.onChange}
            error={errors.password?.message}
          />
        )}
      />
      {apiError ? <Text accessibilityRole="alert" testID="login-error" style={styles.error}>{apiError}</Text> : null}
      <AppButton testID="login-submit" label={t('auth.login.submit')} loading={isSubmitting} onPress={onSubmit} />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  createRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 5 },
  footerText: { ...typography.body, color: colors.muted },
  link: { ...typography.body, color: colors.primary, fontWeight: '700' },
  quietLink: { ...typography.body, color: colors.inkSoft, fontWeight: '600' },
  error: { ...typography.metadata, color: colors.danger, textAlign: 'center' },
});
